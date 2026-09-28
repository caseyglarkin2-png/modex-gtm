/**
 * GAP OS Phase 2 (Seller OS) integrated acceptance, against the SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e \
 *   GAP_OS_ENABLED=true GAP_HYPOTHESIS_ENABLED=true GAP_ROUTING_ENABLED=true \
 *   npx tsx scripts/gap/e2e-phase2.ts
 *
 * Journeys (docs/gap/PHASE_2_SELLER_OS_STATUS.md, Release G):
 *   G1 prepared before Casey arrives: fresh trigger -> background research ->
 *      verified candidate in the evidence inbox -> NO hypothesis, routing,
 *      draft, enrollment or outbound state changed (a table-by-table diff)
 *
 * Rails: scratch database only (exit 2 otherwise); every credential scrubbed;
 * research providers are in-process stubs (no network); every person is a
 * reserved example.com address; every row the run creates is deleted in the
 * finally block. Writes docs/gap/phase2-e2e-latest.md (no secrets).
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { registerSignal } from '../../src/lib/gap/signals/registry';
import { proposeHypothesis } from '../../src/lib/gap/hypothesis/service';
import { runBackgroundResearch } from '../../src/lib/gap/research/background';
import { loadEvidenceInbox } from '../../src/lib/gap/research/inbox';
import type { Candidate } from '../../src/lib/gap/research/providers';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'phase2-e2e-latest.md');
const SCRUBBED_ENV = ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN', 'GAP_GMAIL_SERVICE_ACCOUNT_JSON', 'GAP_GOOGLE_REFRESH_TOKEN', 'GAP_GOOGLE_DWD_SA_JSON', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'] as const;
const ACTOR = 'casey@freightroll.com';

class StepFailure extends Error {
  constructor(public readonly step: string, message: string) {
    super(message);
  }
}
const lines: Array<{ step: string; status: 'PASS' | 'FAIL'; detail: string }> = [];
function pass(step: string, detail: string): void {
  lines.push({ step, status: 'PASS', detail });
  console.log(`PASS ${step}: ${detail}`);
}
function expect(step: string, condition: boolean, detail: string): void {
  if (condition) return;
  lines.push({ step, status: 'FAIL', detail });
  console.log(`FAIL ${step}: ${detail}`);
  throw new StepFailure(step, detail);
}
const describeDatabase = (url: string) => {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return '<unparseable>';
  }
};

/** Row counts of every table a background run must NOT touch. */
async function protectedCounts(prisma: PrismaClient): Promise<Record<string, number>> {
  const [hyp, events, links, decisions, enrollments, emailLogs, drafts, execution, bids, dispositions] = await Promise.all([
    prisma.prospectingHypothesis.count(),
    prisma.hypothesisEvent.count(),
    prisma.hypothesisSignal.count(),
    prisma.routingDecision.count(),
    prisma.sequenceEnrollment.count(),
    prisma.emailLog.count(),
    prisma.draftQueueItem.count(),
    prisma.gapAuditEvent.count({ where: { kind: { startsWith: 'execution.' } } }),
    prisma.buyerInputData.count(),
    prisma.conversationDisposition.count(),
  ]);
  const statuses = await prisma.prospectingHypothesis.groupBy({ by: ['status'], _count: true });
  const out: Record<string, number> = { prospecting_hypotheses: hyp, hypothesis_events: events, hypothesis_signals: links, routing_decisions: decisions, sequence_enrollments: enrollments, email_logs: emailLogs, draft_queue_items: drafts, execution_ledger_rows: execution, buyer_input_data: bids, conversation_dispositions: dispositions };
  for (const s of statuses) out[`hypotheses_${s.status}`] = s._count;
  return out;
}

const DELETE_GUARDS: Array<[string, string]> = [
  ['hypothesis_events', 'gap_append_only_hypothesis_events'],
  ['gap_audit_events', 'gap_append_only_audit_events'],
  ['hypothesis_signals', 'gap_hypothesis_signal_unlink_guard'],
  ['buyer_input_data', 'gap_bid_guard_del'],
];

async function cleanup(prisma: PrismaClient, c: { accountNames: string[]; emails: string[]; triggerHashes: string[]; runStart: Date }): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (await tx.prospectingHypothesis.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((h) => h.id);
    const runIds = (await tx.researchRun.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((r) => r.id);
    const signalIds = (await tx.prospectingSignal.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((s) => s.id);
    for (const [table, trigger] of DELETE_GUARDS) await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    try {
      removed.gap_audit_events = (await tx.gapAuditEvent.deleteMany({ where: { created_at: { gte: c.runStart }, OR: [{ subject_id: { in: [...hypothesisIds, ...runIds, ...signalIds] } }, { kind: 'research.background_run' }] } })).count;
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { id: { in: hypothesisIds } } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      removed.evidence_records = (await tx.evidenceRecord.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      removed.research_runs = (await tx.researchRun.deleteMany({ where: { id: { in: runIds } } })).count;
      removed.pounce_triggers = (await tx.pounceTrigger.deleteMany({ where: { url_hash: { in: c.triggerHashes } } })).count;
      removed.personas = (await tx.persona.deleteMany({ where: { email: { in: c.emails } } })).count;
      removed.accounts = (await tx.account.deleteMany({ where: { name: { in: c.accountNames } } })).count;
    } finally {
      for (const [table, trigger] of DELETE_GUARDS) await tx.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
    }
    return removed;
  });
}

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error(`refusing to run: DATABASE_URL must be the scratch database (got ${describeDatabase(databaseUrl)})`);
    return 2;
  }
  for (const k of SCRUBBED_ENV) delete process.env[k];
  for (const k of ['GAP_AUTO_ENROLL_ENABLED', 'GAP_AUTO_ENROLL_SHADOW', 'GAP_HUBSPOT_MIRROR_ENABLED', 'GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED'] as const) delete process.env[k];
  for (const k of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED'] as const) process.env[k] = 'true';

  const prisma = new PrismaClient();
  const runStart = new Date(Date.now() - 1000);
  const now = new Date();
  const tag = `gapp2-${Date.now()}`;
  const gitSha = (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  })();
  const account = `GAP P2 Pep ${tag.slice(-8)}`;
  const email = (who: string) => `${who}+${tag}@example.com`;
  const people = ['vp1', 'vp2', 'dir'] as const;
  const created = { accountNames: [account], emails: people.map(email), triggerHashes: [] as string[] };
  let failure: StepFailure | null = null;
  const counts: Record<string, string | number> = {};

  try {
    // ---- Seed: an account whose thesis rests on a keyword hit (research work blocking 3 people) and a fresh trigger.
    await prisma.account.create({ data: { rank: 9981, name: account, vertical: 'cpg', tier: 'Tier 1' } });
    const personaIds: number[] = [];
    for (const who of people) {
      const row = await prisma.persona.create({
        data: { persona_id: `${tag}-${who}`, account_name: account, priority: 'P1', name: `${who.toUpperCase()} Tester`, title: who === 'dir' ? 'Director of DC Operations' : 'VP Supply Chain', seniority: who === 'dir' ? 'director' : 'vp', email: email(who), email_valid: true, is_contact_ready: true, do_not_contact: false },
        select: { id: true },
      });
      personaIds.push(row.id);
    }
    const keyword = await registerSignal(prisma, {
      accountName: account,
      personaId: null,
      sourceKind: 'pounce_trigger',
      sourceId: `${tag}-10q`,
      type: 'site_expansion',
      title: `${account} 10-Q mentions: capital expenditure`,
      summary: null,
      sourceType: 'public_primary',
      evidenceUrl: 'https://www.sec.gov/example-10q',
      evidenceText: null,
      externalOk: true,
      observedAt: new Date(now.getTime() - 20 * 86_400_000),
      confidence: 42,
      freshnessExpiresAt: new Date(now.getTime() + 60 * 86_400_000),
      metadata: { e2e: tag },
      registeredBy: ACTOR,
    });
    const hypothesisIds: string[] = [];
    for (const pid of personaIds) {
      const h = await proposeHypothesis(prisma, {
        accountName: account,
        primaryPersonaId: pid,
        persona: 'supply_chain',
        problemFamily: 'hidden_capacity',
        secondaryFamilies: [],
        observation: `${account} 10-Q mentions: capital expenditure [S:${keyword.id}]`,
        problemHypothesis: 'My guess is that arrival variability moves into the yard and costs production capacity.',
        rootCauseHypotheses: ['Arrivals bunch at the gate'],
        impactHypotheses: ['Dock hours lost'],
        whyNow: null,
        falsificationQuestions: ['How are trailers staged when arrivals bunch up?'],
        whatANoMeans: 'Their yard absorbs arrival variability without dwell.',
        contraryEvidence: null,
        predictedBuyerLanguage: null,
        buyingCenter: null,
        confidence: 42,
        signalIds: [keyword.id],
        primarySignalId: keyword.id,
        sourceRef: `${tag}:p${pid}`,
        supersedesId: null,
        metadata: { e2e: tag },
        createdBy: ACTOR,
      } as never);
      expect('seed', (h as { ok: boolean }).ok, `proposeHypothesis -> ${JSON.stringify(h)}`);
      hypothesisIds.push((h as { id: string }).id);
    }
    const url = `https://news.example/${tag}/autonomous-freight`;
    const urlHash = createHash('sha256').update(url).digest('hex');
    created.triggerHashes.push(urlHash);
    await prisma.pounceTrigger.create({ data: { url_hash: urlHash, account_slug: tag, account_name: account.toUpperCase(), title: `${account} expands autonomous freight to a new Texas DC`, url, source: 'news', score: 80, categories: ['AUTONOMY'], published_at: new Date(now.getTime() - 86_400_000) } });
    pass('seed', `${account}: 3 people, 3 draft hypotheses resting on one keyword hit (research work), 1 fresh Pounce trigger (upper-case name, like production)`);

    // ---- G1: prepared before Casey arrives.
    const before = await protectedCounts(prisma);
    const FACT = `${account} will expand its autonomous freight program to a new distribution center in Texas this year.`;
    const verified: Candidate = { provider: 'web', url, title: `${account} expands autonomous freight`, publishedAt: new Date(now.getTime() - 86_400_000), excerpt: FACT, sourceType: 'public_secondary' };
    const bg = await runBackgroundResearch(
      prisma,
      { now, cap: 3 },
      {
        edgar: async () => ({ candidates: [], note: 'scratch: no EDGAR' }),
        web: async (accountName: string) => ({ candidates: accountName === account ? [verified] : [], note: 'scratch stub' }),
        fetchText: async (u: string) => (u === url ? `News. ${FACT} More.` : ''),
      },
    );
    const mine = bg.researched.find((r) => r.accountName === account);
    expect('G1 research', !!mine && mine.outcome === 'evidence_found' && mine.freshFacts === 1, `background run -> ${JSON.stringify(bg)}`);
    expect('G1 research', mine!.reason === 'research_work', `target reason ${mine!.reason} (research work blocking 3 people must outrank the trigger)`);
    const after = await protectedCounts(prisma);
    const changed = Object.keys({ ...before, ...after }).filter((k) => before[k] !== after[k]);
    expect('G1 no state change', changed.length === 0, `protected tables changed: ${changed.map((k) => `${k} ${before[k]} -> ${after[k]}`).join(', ')}`);
    const stillDraft = await prisma.prospectingHypothesis.findMany({ where: { id: { in: hypothesisIds } }, select: { status: true, observation: true } });
    expect('G1 no state change', stillDraft.every((h) => h.status === 'draft' && h.observation?.includes('capital expenditure')), 'a seeded hypothesis changed');
    pass('G1 no state change', `background research ran for ${bg.researched.length} account(s); ${Object.keys(before).length} protected counts identical (hypotheses, events, links, routing decisions, enrollments, email logs, draft queue, execution ledger, BIDs, dispositions); all 3 hypotheses still draft on the keyword hit`);

    const inbox = await loadEvidenceInbox(prisma, now, { accounts: [account] });
    const a = inbox[0];
    expect('G1 inbox', !!a && a.ready.length === 1 && a.ready[0].quote === FACT, `inbox -> ${JSON.stringify(inbox)}`);
    expect('G1 inbox', a.theses.length === 1 && a.theses[0].usableIds.length === 3, `theses -> ${JSON.stringify(a.theses)}`);
    expect('G1 inbox', !!a.lastRun && a.lastRun.background && a.lastRun.outcome === 'evidence_found', `lastRun -> ${JSON.stringify(a.lastRun)}`);
    pass('G1 inbox', `RESEARCH shows ${account}: 1 verified fact ready ("${FACT.slice(0, 60)}..."), why: ${a.ready[0].why} USE would update the one thesis (3 people); nothing was approved`);
    counts.backgroundResearched = bg.researched.length;
    counts.backgroundSkipped = bg.skipped.length;
  } catch (err) {
    if (err instanceof StepFailure) failure = err;
    else {
      failure = new StepFailure('unexpected', err instanceof Error ? err.message : String(err));
      lines.push({ step: 'unexpected', status: 'FAIL', detail: failure.message });
      console.log(`FAIL unexpected: ${failure.message}`);
    }
  } finally {
    try {
      const removed = await cleanup(prisma, { ...created, runStart });
      for (const [k, v] of Object.entries(removed)) counts[`cleanup.${k}`] = v;
      pass('cleanup', `every row the run created was deleted (${JSON.stringify(removed)})`);
    } catch (e) {
      lines.push({ step: 'cleanup', status: 'FAIL', detail: e instanceof Error ? e.message : String(e) });
      failure = failure ?? new StepFailure('cleanup', 'cleanup failed');
    }
    await prisma.$disconnect();
    writeReport({ failure, tag, db: describeDatabase(databaseUrl), gitSha, counts });
  }
  return failure ? 1 : 0;
}

function writeReport(input: { failure: StepFailure | null; tag: string; db: string; gitSha: string; counts: Record<string, string | number> }): void {
  const out = [
    '# GAP OS Phase 2: Seller OS integrated acceptance (latest)',
    '',
    `STATUS: ${input.failure ? `FAIL at ${input.failure.step}` : 'PASS'}`,
    '',
    `<!-- verified:${new Date().toISOString().slice(0, 10)} -->`,
    '',
    'Written by `scripts/gap/e2e-phase2.ts` against the scratch database. Research providers are in-process stubs; reserved example.com people only; nothing can leave the machine.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.db} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    '',
    '## Steps',
    '',
    ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`),
    '',
    '## Counts',
    '',
    ...Object.entries(input.counts).map(([k, v]) => `- ${k}: ${v}`),
    '',
  ];
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
