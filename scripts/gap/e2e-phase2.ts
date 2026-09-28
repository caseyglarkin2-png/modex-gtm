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
 *   G2 PepsiCo-like: insufficient thesis -> Casey USES the inbox fact ->
 *      truthful revised narrative -> REVIEW -> APPROVE + USE -> routing ->
 *      account motion: exactly ONE email READY; a second first touch refused
 *   G3 account reply: primary contacted (in-process fake Gmail) -> a
 *      colleague replies -> the whole account email motion pauses -> nobody
 *      else can get a cold email -> the reply is in triage as an ACCOUNT-LEVEL
 *      reply with its own sender -> a human disposition clears the pause
 *   G4 conference capture: a pasted note -> candidate BIDs with verbatim
 *      quotes -> confirm two, reject one -> only the two are buyer truth
 *   G5 in deals: the account gets an open HubSpot deal -> every card routes
 *      to the deal (no cold action, a send is refused) -> In Deals lists it
 *      -> the Deal Brief shows only confirmed truth, the unknowns, and
 *      Casey's learning objective
 *   G6 action pack: the READY person's six-line brief (KNOW verified, THINK
 *      inference, WHY YOU Casey's angle, HISTORY current, WRONG IF) -> the send
 *      preview runs every gate -> STOP before any send
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
import { approveSelectedSiblings, loadThesisGroups, splitThesisWork, useEvidenceForThesis } from '../../src/lib/gap/hypothesis/thesis-groups';
import { createFamily } from '../../src/lib/gap/sequence/family';
import { createVersion } from '../../src/lib/gap/sequence/version';
import { seedFamilyByKey } from '../../src/lib/gap/sequences/families';
import { runRouting, type HubSpotSnapshotProvider } from '../../src/lib/gap/routing/run';
import { staticSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { listAllCurrent } from '../../src/lib/gap/routing/queue';
import { loadCockpitMotions, laneWithMotion } from '../../src/lib/gap/motion/cockpit';
import { sendSellerEmail, type SellerSendDeps } from '../../src/lib/gap/execution/seller-send';
import type { SellerDraftDeps } from '../../src/lib/gap/execution/seller-draft';
import { computeNextTouch } from '../../src/lib/gap/execution/next-touch';
import type { ExecutionReceipt } from '../../src/lib/gap/execution/contract';
import type { CriticClient } from '../../src/lib/gap/critic-client';
import { SCRATCH_NO_DEALS, SCRATCH_NO_DEALS_TRUTH } from './scratch-opportunity';
import { listReplies } from '../../src/lib/gap/replies/list';
import { accountRepliedRecently } from '../../src/lib/gap/replies/account-reply';
import { recordDisposition } from '../../src/lib/gap/disposition/service';
import { createCapture, decideCandidate } from '../../src/lib/gap/capture/store';
import { quoteInSource } from '../../src/lib/gap/capture/extract';
import { buildBrief, loadBriefHistory } from '../../src/lib/gap/execution/six-line-brief';
import { setAngle } from '../../src/lib/gap/motion/persona-angle';
import { getHypothesis } from '../../src/lib/gap/hypothesis/service';
import { DIRECT_SENT } from '../../src/lib/gap/execution/draft-ledger';
import { heldDealAccounts, loadInDeals } from '../../src/lib/gap/deals/in-deals';
import { loadDealBrief, setLearningObjective } from '../../src/lib/gap/deals/deal-brief';
import type { OpportunityTruth } from '../../src/lib/gap/opportunity/active-opportunity';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'phase2-e2e-latest.md');
const SCRUBBED_ENV = ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN', 'GAP_GMAIL_SERVICE_ACCOUNT_JSON', 'GAP_GOOGLE_REFRESH_TOKEN', 'GAP_GOOGLE_DWD_SA_JSON', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'] as const;
const ACTOR = 'casey@freightroll.com';
const MAILBOX = 'casey@yardflow.ai';

// ---------------------------------------------------------------------------
// In-process fakes: the only "network" this run has
// ---------------------------------------------------------------------------

const outbox: Array<{ kind: 'direct' | 'draft'; to: string; subject: string }> = [];
const criticPass: CriticClient = { score: async () => ({ ok: true, verdict: 'pass', score: 100, findings: [] }) } as unknown as CriticClient;
const gapSender = () => ({ userEmail: MAILBOX, serviceAccountJson: '{}' }) as never;
function sellerDeps(tag: string, threadFor: (to: string) => string): SellerSendDeps {
  let n = 0;
  const deps: SellerSendDeps & SellerDraftDeps = {
    critic: criticPass,
    gapSender,
    senderAddress: () => MAILBOX,
    signature: async () => null,
    activeOpportunity: SCRATCH_NO_DEALS,
    mailboxSentTo: async () => [],
    unsubscribeUrl: (e: string) => `https://modex-gtm.vercel.app/unsubscribe/?email=${encodeURIComponent(e)}&token=e2e`,
    getMessageHeaders: async () => null,
    nextTouch: (p, d, now) => computeNextTouch(p, d, now, { gapSender, getThread: async () => [] }),
    gmail: {
      createGmailDraft: (async () => {
        throw new Error('no drafts in this run');
      }) as never,
      sendGmailDraft: (async () => {
        throw new Error('sendGmailDraft must never be called');
      }) as never,
      sendViaGmail: (async () => {
        throw new Error('sendViaGmail must never be called (the direct adapter is faked)');
      }) as never,
    },
    directAdapter: (async (intent: { now: Date }, wire: { to: string; subject: string }) => {
      n += 1;
      outbox.push({ kind: 'direct', to: wire.to, subject: wire.subject });
      return { engine: 'gmail_direct', status: 'sent', engineId: `${tag}-sent-${n}`, threadId: threadFor(wire.to), createdAt: intent.now, sentAt: intent.now } as ExecutionReceipt;
    }) as never,
  };
  return deps;
}

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

async function cleanup(prisma: PrismaClient, c: { accountNames: string[]; emails: string[]; triggerHashes: string[]; runStart: Date; familyIds: string[]; threadIds: string[]; runIds: string[]; captureIds: string[] }): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (await tx.prospectingHypothesis.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((h) => h.id);
    const runIds = (await tx.researchRun.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((r) => r.id);
    const signalIds = (await tx.prospectingSignal.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((s) => s.id);
    for (const [table, trigger] of DELETE_GUARDS) await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    try {
      const decisionIds = (await tx.routingDecision.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((d) => d.id);
      const dispositionIds = (await tx.conversationDisposition.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((d) => d.id);
      removed.gap_audit_events = (await tx.gapAuditEvent.deleteMany({ where: { created_at: { gte: c.runStart }, OR: [{ subject_id: { in: [...hypothesisIds, ...runIds, ...signalIds, ...decisionIds, ...dispositionIds, ...c.accountNames, ...c.emails, ...c.runIds, ...c.captureIds] } }, { kind: 'research.background_run' }] } })).count;
      removed.buyer_input_data = (await tx.buyerInputData.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      removed.conversation_dispositions = (await tx.conversationDisposition.deleteMany({ where: { id: { in: dispositionIds } } })).count;
      removed.notifications = (await tx.notification.deleteMany({ where: { persona_email: { in: c.emails } } })).count;
      removed.inbound_messages = (await tx.inboundMessage.deleteMany({ where: { OR: [{ from_email: { in: c.emails } }, { thread_id: { in: c.threadIds } }] } })).count;
      removed.email_threads = (await tx.emailThread.deleteMany({ where: { id: { in: c.threadIds } } })).count;
      removed.email_logs = (await tx.emailLog.deleteMany({ where: { to_email: { in: c.emails } } })).count;
      removed.gap_compiles = (await tx.gapCompile.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.routing_decisions = (await tx.routingDecision.deleteMany({ where: { id: { in: decisionIds } } })).count;
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { id: { in: hypothesisIds } } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      removed.evidence_records = (await tx.evidenceRecord.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      removed.research_runs = (await tx.researchRun.deleteMany({ where: { id: { in: runIds } } })).count;
      removed.pounce_triggers = (await tx.pounceTrigger.deleteMany({ where: { url_hash: { in: c.triggerHashes } } })).count;
      if (c.familyIds.length) {
        await tx.$executeRawUnsafe('ALTER TABLE sequence_versions DISABLE TRIGGER gap_version_guard_del');
        try {
          removed.sequence_versions = (await tx.sequenceVersion.deleteMany({ where: { family_id: { in: c.familyIds } } })).count;
        } finally {
          await tx.$executeRawUnsafe('ALTER TABLE sequence_versions ENABLE TRIGGER gap_version_guard_del');
        }
        removed.sequence_families = (await tx.sequenceFamily.deleteMany({ where: { id: { in: c.familyIds } } })).count;
      }
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
  for (const k of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED', 'GAP_REPLY_CLASSIFICATION_ENABLED'] as const) process.env[k] = 'true';
  // A scratch-only signing secret so the (faked) sends carry a real one-click unsubscribe link.
  process.env.UNSUBSCRIBE_SECRET = 'gap-phase2-scratch-only';

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
  const colleague = email('assistant');
  const created = { accountNames: [account], emails: [...people.map(email), colleague], triggerHashes: [] as string[], familyIds: [] as string[], threadIds: [] as string[], runIds: [] as string[], captureIds: [] as string[] };
  const threadFor = (to: string) => {
    const t = `${tag}-thr-${to.split('+')[0]}`;
    if (!created.threadIds.includes(t)) created.threadIds.push(t);
    return t;
  };
  let failure: StepFailure | null = null;
  const counts: Record<string, string | number> = {};

  try {
    // ---- Seed: an account whose thesis rests on a keyword hit (research work blocking 3 people) and a fresh trigger.
    await prisma.account.create({ data: { rank: 9981, name: account, vertical: 'cpg', tier: 'Tier 1' } });
    const personaIds: number[] = [];
    for (const who of people) {
      const row = await prisma.persona.create({
        data: { persona_id: `${tag}-${who}`, account_name: account, priority: 'P1', name: `${who.toUpperCase()} Tester`, title: who === 'dir' ? 'Director of DC Operations' : who === 'vp1' ? 'VP Supply Chain' : 'SVP Operations', seniority: who === 'dir' ? 'director' : 'vp', email: email(who), email_valid: true, is_contact_ready: true, do_not_contact: false, hubspot_contact_id: `${tag}-${who}` },
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

    // ---- G2: PepsiCo-like. Casey USES the fact, reviews, APPROVE + USE; account motion makes ONE email READY.
    const seed = seedFamilyByKey('hidden_capacity')!;
    const family = await createFamily(prisma, { name: `GAP P2 Hidden Capacity ${tag}`, engine: 'modex_draft_queue', program: 'gap-phase2', accountName: account, problemFamily: seed.problemFamily, persona: seed.persona, createdBy: ACTOR });
    expect('G2 seed family', family.ok, `createFamily -> ${JSON.stringify(family)}`);
    if (!family.ok) throw new Error('unreachable');
    created.familyIds.push(family.id);
    const version = await createVersion(prisma, family.id, seed.steps, { createdBy: ACTOR, changeNote: 'phase2 acceptance' });
    expect('G2 seed family', version.ok, `createVersion -> ${JSON.stringify(version)}`);
    const factId = a.ready[0].signalId;
    const used = await useEvidenceForThesis(prisma, { fingerprint: a.theses[0].fingerprint, hypothesisIds: a.theses[0].usableIds, signalIds: [factId], primarySignalId: factId, actor: ACTOR, now });
    expect('G2 use', used.ok && used.results.every((r) => r.ok), `use_evidence -> ${JSON.stringify(used)}`);
    const rebuilt = await prisma.prospectingHypothesis.findMany({ where: { id: { in: hypothesisIds } }, select: { status: true, observation: true } });
    expect('G2 use', rebuilt.every((h) => h.status === 'draft' && (h.observation ?? '').includes(`[S:${factId}]`) && !(h.observation ?? '').includes('capital expenditure')), `observations -> ${JSON.stringify(rebuilt)}`);
    pass('G2 use', `USE rebuilt all 3 draft observations from the ONE verified fact (keyword hit gone); still draft, nothing approved: "${(rebuilt[0].observation ?? '').slice(0, 90)}..."`);

    const groups = await loadThesisGroups(prisma, { account_name: account }, { singletons: true, now });
    const split = splitThesisWork(groups);
    expect('G2 review', split.reviewGroups.length === 1 && split.reviewGroups[0].members.length === 3, `review split -> ${JSON.stringify(split.reviewGroups.map((g) => g.members.map((m) => m.next)))} research ${split.researchGroups.length}`);
    pass('G2 review', 'the thesis moved from RESEARCH to REVIEW: one decision covering 3 people');

    const approved = await approveSelectedSiblings(prisma, { fingerprint: split.reviewGroups[0].fingerprint, hypothesisIds: split.reviewGroups[0].members.map((m) => m.id), use: true, actor: ACTOR, now });
    expect('G2 approve + use', approved.ok && (approved.inUse ?? []).length === 3, `approve -> ${JSON.stringify(approved)}`);
    pass('G2 approve + use', `Casey approved + used the thesis: ${approved.summary ? JSON.stringify(approved.summary) : '3 in use'}`);

    const snapshot: HubSpotSnapshotProvider = async () => ({ tam: 'in', tamTier: 'A', contacts: Object.fromEntries(people.map((w) => [`${tag}-${w}`, { qualVerdict: 'qualified' }])), opportunity: SCRATCH_NO_DEALS_TRUTH });
    const runId = `${tag}-run-1`;
    created.runIds.push(runId);
    await runRouting(prisma, { now, runId, accountNames: [account], personaIds: personaIds, actor: ACTOR }, { suppression: staticSuppressionReader('clear'), hubspotSnapshot: snapshot, top100: null });
    const queue = await listAllCurrent(prisma);
    const mine2 = queue.items.filter((i) => i.account.name === account);
    const emailCards = mine2.filter((i) => i.action === 'enroll_gap_sequence' || i.action === 'one_off_email');
    const motion = await loadCockpitMotions(prisma, queue.items, now);
    const held = new Set(motion.heldCardIds);
    const readyEmail = mine2.filter((i) => laneWithMotion(i, held) === 'ready' && (i.action === 'enroll_gap_sequence' || i.action === 'one_off_email'));
    expect('G2 one email READY', emailCards.length >= 2, `routing produced ${emailCards.length} email cards (${JSON.stringify(mine2.map((i) => [i.persona.title, i.action, i.ruleId]))}); need 2+ to prove the motion`);
    expect('G2 one email READY', readyEmail.length === 1, `READY email cards at the account: ${readyEmail.length}`);
    const m = motion.motions.find((x) => x.accountName === account)!;
    expect('G2 one email READY', !!m && m.state === 'ready' && m.primary?.cardId === readyEmail[0].id && !!m.next, `motion -> ${JSON.stringify(m)}`);
    pass('G2 one email READY', `${emailCards.length} people route to email; exactly ONE is READY (primary ${m.primary!.name}: ${m.primary!.factors.join(', ')}); NEXT ${m.next!.name} unlocks ${m.next!.unlock}`);

    const deps = sellerDeps(tag, threadFor);
    const send = async (decisionId: string) => {
      const preview = await sendSellerEmail(prisma, { decisionId, actor: ACTOR, now }, deps);
      if (!preview.ok || !('preview' in preview)) return preview;
      return sendSellerEmail(prisma, { decisionId, actor: ACTOR, now, confirm: { contentHash: preview.preview.contentHash, recipient: preview.preview.to } }, deps);
    };
    // ---- G6: the READY person's action pack leads with the six-line brief; preview reachable; STOP before sending.
    const primaryPid = readyEmail[0].persona.id as number;
    created.captureIds.push(String(primaryPid)); // the angle's audit rows are keyed on the persona id
    await setAngle(prisma, { personaId: primaryPid, text: 'Owns the Texas DC network where autonomous linehaul terminates.', source: 'human', actor: ACTOR });
    const briefHyp = await getHypothesis(prisma, readyEmail[0].hypothesis!.id);
    const briefHistory = await loadBriefHistory(prisma, { accountName: account, personaId: primaryPid, email: readyEmail[0].persona.email, sent: [], now }, { opportunity: async () => SCRATCH_NO_DEALS_TRUTH });
    const angleRows = await prisma.gapAuditEvent.findMany({ where: { kind: 'persona.angle', subject_id: String(primaryPid) }, orderBy: { created_at: 'desc' }, take: 1, select: { payload: true } });
    const brief = buildBrief({ hypothesis: briefHyp, firstName: 'VP1', angle: String((angleRows[0]?.payload as { text?: string } | undefined)?.text ?? '') || null, suggestedAngle: null, history: briefHistory });
    expect('G6 brief', brief.know.fact !== null && brief.know.fact.quote === FACT, `KNOW -> ${JSON.stringify(brief.know)}`);
    expect('G6 brief', !!brief.think && !!brief.learn && !!brief.wrongIf, `THINK/LEARN/WRONG IF -> ${JSON.stringify({ think: brief.think, learn: brief.learn, wrongIf: brief.wrongIf })}`);
    expect('G6 brief', brief.whyYou?.owned === true && brief.whyYou.text.startsWith('Owns the Texas DC network'), `WHY YOU -> ${JSON.stringify(brief.whyYou)}`);
    expect('G6 brief', brief.history.some((l) => l === 'HubSpot opportunity CLEAR, checked moments ago') && brief.history[0] === 'No GAP touches to VP1 yet', `HISTORY -> ${JSON.stringify(brief.history)}`);
    const sentBefore = await prisma.gapAuditEvent.count({ where: { kind: DIRECT_SENT } });
    const preview = await sendSellerEmail(prisma, { decisionId: readyEmail[0].id, actor: ACTOR, now }, sellerDeps(tag, threadFor));
    expect('G6 preview', preview.ok && 'preview' in preview, `preview -> ${JSON.stringify(preview)}`);
    expect('G6 preview', (await prisma.gapAuditEvent.count({ where: { kind: DIRECT_SENT } })) === sentBefore && outbox.length === 0, 'the preview sent something');
    pass('G6 brief', `KNOW "${FACT.slice(0, 50)}..." (verified) · THINK labelled inference · LEARN "${brief.learn}" · WHY YOU Casey's angle · HISTORY ${brief.history.join(' | ')} · WRONG IF "${brief.wrongIf}"`);
    pass('G6 preview', 'the send preview ran every gate and returned the final email; nothing was sent (STOP before confirm)');

    const primarySend = await send(readyEmail[0].id);
    expect('G2 second motion refused', primarySend.ok && 'sent' in primarySend, `primary send -> ${JSON.stringify(primarySend)}`);
    const secondCard = emailCards.find((i) => i.id !== readyEmail[0].id)!;
    const second = await sendSellerEmail(prisma, { decisionId: secondCard.id, actor: ACTOR, now }, deps);
    expect('G2 second motion refused', !second.ok && second.reason === 'account_motion_active', `second person's first touch -> ${JSON.stringify(second)}`);
    pass('G2 second motion refused', `the primary's first touch went to the in-process fake Gmail; a first touch to ${secondCard.persona.displayName} is refused: account_motion_active (${(second as { detail?: string }).detail})`);
    counts.fakeSends = outbox.length;

    // ---- G3: a colleague replies; the whole account email motion pauses until a human triages it.
    const threadId = threadFor(colleague);
    await prisma.emailThread.create({ data: { id: threadId, account_name: account, persona_email: colleague, subject: 'Re: yards' } });
    await prisma.inboundMessage.create({ data: { id: `${tag}-in-1`, thread_id: threadId, from_email: colleague, from_name: 'Assistant', subject: 'Re: autonomous freight and the yard', body_text: 'Forwarding to our DC team. Who should they talk to?', snippet: 'Forwarding to our DC team.', received_at: new Date(now.getTime() + 60_000), source: 'gmail' } });
    const later = new Date(now.getTime() + 120_000);
    const q2 = await listAllCurrent(prisma);
    const motion2 = await loadCockpitMotions(prisma, q2.items, later);
    const m2 = motion2.motions.find((x) => x.accountName === account);
    const readyAfter = q2.items.filter((i) => i.account.name === account && laneWithMotion(i, new Set(motion2.heldCardIds)) === 'ready' && (i.action === 'enroll_gap_sequence' || i.action === 'one_off_email'));
    expect('G3 pause', readyAfter.length === 0, `READY email cards after the colleague reply: ${readyAfter.length} (motion ${JSON.stringify(m2)})`);
    const blocked = await sendSellerEmail(prisma, { decisionId: secondCard.id, actor: ACTOR, now: later }, deps);
    expect('G3 pause', !blocked.ok && blocked.reason === 'account_replied', `another first touch after the reply -> ${JSON.stringify(blocked)}`);
    const follow = await computeNextTouch(prisma, readyEmail[0].id, new Date(later.getTime() + 30 * 86_400_000), { gapSender, getThread: async () => [] });
    expect('G3 pause', follow.state === 'stopped', `primary's next touch -> ${JSON.stringify(follow)}`);
    pass('G3 pause', `a colleague (${colleague}) replied: no email card at the account is READY; a first touch to anyone else is refused (account_replied); the primary's follow-ups stop (${(follow as { detail?: string }).detail}); a human disposition is required to clear the hold`);

    const triage = await listReplies(prisma, { state: 'undispositioned', limit: 50 });
    const colleagueItem = triage.items.find((i) => i.id === `${tag}-in-1`);
    expect('G3 triage', !!colleagueItem && colleagueItem.accountLevel === true && colleagueItem.contactEmail === colleague && colleagueItem.personaId === null && colleagueItem.accountName === account, `triage item -> ${JSON.stringify(colleagueItem)}`);
    pass('G3 triage', `the colleague reply is in REPLIES labelled ACCOUNT-LEVEL / COLLEAGUE, sender ${colleague}, no persona: its words are never assigned to the person GAP emailed`);
    const dispo = await recordDisposition(prisma, {
      hypothesisId: colleagueItem!.hypothesisId,
      personaId: null,
      contactEmail: colleague,
      channel: 'email',
      responseClass: 'referral',
      referral: { name: 'DC team' },
      source: { kind: 'inbound_message', id: colleagueItem!.id },
      actor: ACTOR,
      actorKind: 'human',
      now: new Date(later.getTime() + 60_000),
    });
    expect('G3 triage', dispo.ok, `disposition -> ${JSON.stringify(dispo)}`);
    const holdAfter = await accountRepliedRecently(prisma, email('vp2'), new Date(later.getTime() + 120_000));
    expect('G3 triage', holdAfter === null, `hold after the human disposition -> ${JSON.stringify(holdAfter)}`);
    pass('G3 triage', 'Casey dispositioned it (referral); the account hold cleared on his human decision, nothing inferred');

    // ---- G4: conference capture (the note is pasted/dictated on a phone).
    const note = [
      'Casey: How are trailers found at your Texas DC?',
      'Priya (VP1): Right now we walk the yard with a clipboard to find trailers.',
      'Priya: We lose about 3 hours per shift hunting for trailers.',
      'Priya: The detention charges from carriers are killing us.',
      'Priya: Ideally we want the yard to tell the dock what is next.',
    ].join('\n');
    const bidsBefore = await prisma.buyerInputData.count({ where: { account_name: account } });
    const cap = await createCapture(prisma, { accountName: account, personaId: personaIds[0], context: 'conference', rawText: note, actor: ACTOR, now: new Date(later.getTime() + 180_000) });
    expect('G4 capture', cap.ok && cap.capture.candidates.length >= 3, `capture -> ${JSON.stringify(cap)}`);
    if (!cap.ok) throw new Error('unreachable');
    created.captureIds.push(cap.capture.id);
    expect('G4 capture', cap.capture.candidates.every((c) => quoteInSource(c.quote, note) && !/^Casey/.test(c.quote)), 'a candidate quote is not verbatim, or a seller line was proposed');
    expect('G4 capture', (await prisma.buyerInputData.count({ where: { account_name: account } })) === bidsBefore, 'candidates became BIDs before any confirmation');
    pass('G4 capture', `saved the conference note; ${cap.capture.candidates.length} candidates, every quote verbatim, none from the seller, zero BIDs before confirmation`);
    const [c1, c2, c3] = cap.capture.candidates;
    const conf1 = await decideCandidate(prisma, { captureId: cap.capture.id, candidateId: c1.id, decision: 'confirm', hypothesisId: hypothesisIds[0], actor: ACTOR, now: new Date(later.getTime() + 200_000) });
    const conf2 = await decideCandidate(prisma, { captureId: cap.capture.id, candidateId: c2.id, decision: 'confirm', type: 'impact', hypothesisId: hypothesisIds[0], actor: ACTOR, now: new Date(later.getTime() + 210_000) });
    const rej = await decideCandidate(prisma, { captureId: cap.capture.id, candidateId: c3.id, decision: 'reject', actor: ACTOR, now: new Date(later.getTime() + 220_000) });
    expect('G4 confirm', conf1.ok && conf2.ok && rej.ok, `decisions -> ${JSON.stringify({ conf1, conf2, rej })}`);
    const bids = await prisma.buyerInputData.findMany({ where: { account_name: account }, select: { raw_buyer_language: true, human_confirmed: true, type: true, source: true, captured_by: true } });
    expect('G4 confirm', bids.length === bidsBefore + 2, `BIDs at the account: ${bids.length} (expected ${bidsBefore + 2})`);
    expect('G4 confirm', bids.every((b) => b.human_confirmed && b.captured_by === ACTOR && b.source === 'meeting'), `BID rows -> ${JSON.stringify(bids)}`);
    expect('G4 confirm', bids.map((b) => b.raw_buyer_language).sort().join('|') === [c1.quote, c2.quote].sort().join('|'), 'confirmed BIDs do not carry the exact quotes');
    expect('G4 confirm', !bids.some((b) => b.raw_buyer_language === c3.quote), 'the rejected candidate became a BID');
    pass('G4 confirm', `confirmed 2 (one relabelled impact), rejected 1: exactly 2 human-confirmed BIDs with the exact quotes (source meeting, captured by ${ACTOR}); the rejected one is not buyer truth`);
    counts.bidsConfirmed = 2;

    // ---- G5: the account now has an open HubSpot deal (Kroger-like). No cold action; In Deals + Deal Brief instead.
    const dealTruth: OpportunityTruth = {
      status: 'ACTIVE',
      companyIds: ['c-scratch'],
      deals: [{ id: 'd-scratch', name: `YardFlow - ${account}`, stage: 'appointmentscheduled', pipeline: 'default', companyIds: ['c-scratch'], contactIds: ['k-1', 'k-2'], lastActivityAt: now.toISOString() }],
    };
    const dealRunId = `${tag}-run-deal`;
    created.runIds.push(dealRunId);
    const dealSnapshot: HubSpotSnapshotProvider = async () => ({ tam: 'in', tamTier: 'A', contacts: Object.fromEntries(people.map((w) => [`${tag}-${w}`, { qualVerdict: 'qualified' }])), opportunity: dealTruth });
    const dealNow = new Date(later.getTime() + 300_000);
    await runRouting(prisma, { now: dealNow, runId: dealRunId, accountNames: [account], personaIds, actor: ACTOR }, { suppression: staticSuppressionReader('clear'), hubspotSnapshot: dealSnapshot, top100: null });
    const q5 = await listAllCurrent(prisma);
    const cards5 = q5.items.filter((i) => i.account.name === account);
    const coldActions = new Set(['enroll_gap_sequence', 'one_off_email', 'call_now', 'linkedin_touch']);
    expect('G5 no cold action', cards5.length > 0 && cards5.every((i) => i.ruleId === 'active_opportunity' && !coldActions.has(i.action)), `cards -> ${JSON.stringify(cards5.map((i) => [i.persona.title, i.action, i.ruleId]))}`);
    const motion5 = await loadCockpitMotions(prisma, q5.items, dealNow);
    expect('G5 no cold action', !cards5.some((i) => laneWithMotion(i, new Set(motion5.heldCardIds)) === 'ready'), 'a card at an account in a deal is READY');
    const dealSend = await sendSellerEmail(prisma, { decisionId: cards5[0].id, actor: ACTOR, now: dealNow }, { ...sellerDeps(tag, threadFor), activeOpportunity: async () => dealTruth } as never);
    expect('G5 no cold action', !dealSend.ok, `a first touch at an account in a deal was allowed -> ${JSON.stringify(dealSend)}`);
    pass('G5 no cold action', `${cards5.length} cards all route to ${cards5[0].action} (active_opportunity); none READY; a send attempt is refused (${(dealSend as { reason?: string }).reason})`);

    expect('G5 In Deals', heldDealAccounts(q5.items).includes(account), 'the In Deals tile does not count the account');
    const inDeals = await loadInDeals(prisma, [account], { resolve: async () => dealTruth });
    const row = inDeals.inDeals.find((a) => a.accountName === account);
    expect('G5 In Deals', !!row && row.deals[0].stage === 'Appointment scheduled' && row.dealContacts === 2 && row.known === 2 && row.people.length >= 3, `In Deals -> ${JSON.stringify(inDeals)}`);
    pass('G5 In Deals', `${account} is counted on the In Deals tile and listed live: "${row!.deals[0].name}" · ${row!.deals[0].stage} · ${row!.people.length} people GAP holds · ${row!.dealContacts} on the deal · ${row!.known} of 6 known`);

    const obj = await setLearningObjective(prisma, { accountName: account, text: 'Who owns the yard budget at the Texas DC?', actor: ACTOR });
    expect('G5 brief', obj.ok, `objective -> ${JSON.stringify(obj)}`);
    const dealBrief = await loadDealBrief(prisma, account, { now: dealNow, dealContacts: row!.dealContacts, conflicts: async () => [] });
    const briefQuotes = Object.values(dealBrief.sections).flat().map((e) => e.quote).sort();
    expect('G5 brief', briefQuotes.join('|') === [c1.quote, c2.quote].sort().join('|'), `brief quotes -> ${JSON.stringify(briefQuotes)}`);
    expect('G5 brief', !briefQuotes.includes(c3.quote), 'the rejected candidate appears in the Deal Brief');
    expect('G5 brief', dealBrief.unknowns.length === 4 && dealBrief.known === 2, `unknowns -> ${JSON.stringify(dealBrief.unknowns)}`);
    expect('G5 brief', dealBrief.objective.owned === true && dealBrief.objective.text === 'Who owns the yard budget at the Texas DC?', `objective -> ${JSON.stringify(dealBrief.objective)}`);
    pass('G5 brief', `Deal Brief shows only the 2 confirmed quotes (the rejected one absent), ${dealBrief.known} of 6 known, UNKNOWN: ${dealBrief.unknowns.join(', ')}; objective set by Casey: "${dealBrief.objective.text}"; nothing written to HubSpot`);
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
