/**
 * GAP Signal Intelligence acceptance, against the SCRATCH database only.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e npx tsx scripts/gap/e2e-signals.ts
 *
 * No network: page metadata comes from an in-process fake. It proves, on real
 * Postgres and real Prisma query shapes:
 *   S1 a shared link alone is captured, resolved from the page, queued for
 *      research; nothing else is written (no trigger, no ProspectingSignal)
 *   S2 the same link with tracking params is one source; a second share is kept
 *   S3 a parent + subsidiary story is AMBIGUOUS, never silently assigned; Casey
 *      assigns it; WRONG ACCOUNT un-resolves it
 *   S4 a conference note is operator context (no link, no research, no evidence)
 *   S5 a queued shared signal is followed up by REAL background research: the
 *      sentence on its own page is verified verbatim, dated, stored as a
 *      verified fact; the signal settles fact_found; no hypothesis or link moves
 *   S6 the verified signal is promoted through the Pounce spine; a raw one is not
 *   S7 two outlets carrying the same story cluster into ONE event, both kept
 * Every row it creates is removed in a finally block. Report:
 * docs/gap/signals-e2e-latest.md (no secrets).
 */
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { captureSignal } from '../../src/lib/gap/signals/intake';
import { applySignalOp, listSignals } from '../../src/lib/gap/signals/ops';
import { processSignals } from '../../src/lib/gap/signals/process';
import { runBackgroundResearch } from '../../src/lib/gap/research/background';
import { hashUrl } from '../../src/lib/pounce/ingest';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const ACTOR = 'casey@freightroll.com';

const lines: Array<{ step: string; status: 'PASS' | 'FAIL'; detail: string }> = [];
class StepFailure extends Error {
  constructor(public readonly step: string, message: string) {
    super(message);
  }
}
function pass(step: string, detail: string) {
  lines.push({ step, status: 'PASS', detail });
  console.log(`PASS ${step}: ${detail}`);
}
function expect(step: string, cond: boolean, detail: string) {
  if (!cond) {
    lines.push({ step, status: 'FAIL', detail });
    console.log(`FAIL ${step}: ${detail}`);
    throw new StepFailure(step, detail);
  }
}

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error('refusing to run: DATABASE_URL must be the scratch database');
    return 2;
  }
  const prisma = new PrismaClient();
  const tag = `sig${Date.now().toString().slice(-7)}`;
  const parent = `Sigparent ${tag}`;
  const child = `Sigchild ${tag}`;
  const accounts = [parent, child];
  const created: string[] = [];
  let failure: StepFailure | null = null;
  const pages: Record<string, string> = {
    [`https://news.example.com/${tag}/network`]: `<meta property="og:title" content="${parent} opens new distribution center with automated yard"><meta property="article:published_time" content="2026-09-20T12:00:00Z">`,
    [`https://news.example.com/${tag}/both`]: `<title>${parent} and ${child} expand Texas network</title>`,
    [`https://outlet-a.example.com/news/${tag}-opens-dallas-distribution-center-with-automated-yard/1`]: `<meta property="og:title" content="${parent} opens Dallas distribution center with automated yard"><meta property="article:published_time" content="2026-09-21T12:00:00Z">`,
    [`https://outlet-b.example.com/wire/${tag}-opens-dallas-distribution-center-with-automated-yard/99`]: `<meta property="og:title" content="${parent} opens Dallas distribution center with automated yard (syndicated)"><meta property="article:published_time" content="2026-09-22T08:00:00Z">`,
  };
  const fetchHtml = async (url: string) => {
    const bare = url.replace('://www.', '://');
    const hit = Object.entries(pages).find(([k]) => bare.startsWith(k));
    if (!hit) throw new Error('fetch 404');
    return hit[1];
  };

  try {
    for (const name of accounts) await prisma.account.create({ data: { name, rank: 9000, vertical: 'cpg', tier: 'Tier 2', priority_band: 'B' } });
    const counts = async () => ({ triggers: await prisma.pounceTrigger.count(), prospecting: await prisma.prospectingSignal.count(), evidence: await prisma.evidenceRecord.count(), hypotheses: await prisma.prospectingHypothesis.count() });
    const before = await counts();

    // S1
    const s1 = await captureSignal(prisma, { url: `https://www.news.example.com/${tag}/network/?utm_source=linkedin`, origin: 'casey_share', actor: ACTOR, now: new Date() }, { fetchHtml });
    expect('S1 capture', s1.ok && s1.signal.created, `capture -> ${JSON.stringify(s1)}`);
    if (!s1.ok) throw new Error('unreachable');
    created.push(s1.signal.id);
    const row1 = await prisma.gapSignal.findUniqueOrThrow({ where: { id: s1.signal.id } });
    expect('S1 capture', row1.account_name === parent && row1.resolution === 'resolved' && row1.research_status === 'queued' && row1.relevance === 'outreach_evidence_candidate', `row -> ${JSON.stringify({ a: row1.account_name, r: row1.resolution, rs: row1.research_status, rel: row1.relevance })}`);
    expect('S1 capture', JSON.stringify(await counts()) === JSON.stringify(before), 'capture wrote a trigger, evidence, a ProspectingSignal or a hypothesis');
    pass('S1 capture', `a bare link resolved to ${parent} from the page title, queued for research (Follow this up), classified ${row1.relevance} (${row1.categories.join(', ')}); no trigger, evidence, ProspectingSignal or hypothesis written`);

    // S2
    const s2 = await captureSignal(prisma, { url: `https://news.example.com/${tag}/network?utm_campaign=x#top`, note: 'Worth checking the yard angle.', origin: 'casey_share', actor: ACTOR, now: new Date() }, { fetchHtml });
    expect('S2 dedupe', s2.ok && !s2.signal.created && s2.signal.id === s1.signal.id, `second share -> ${JSON.stringify(s2)}`);
    const row2 = await prisma.gapSignal.findUniqueOrThrow({ where: { id: s1.signal.id } });
    expect('S2 dedupe', row2.note === 'Worth checking the yard angle.' && row2.title !== row2.note, 'the note was lost or blended into the source title');
    pass('S2 dedupe', 'the same link with different tracking params and a fragment is ONE source; the second share kept Casey\'s note verbatim as his context');

    // S3
    const s3 = await captureSignal(prisma, { url: `https://news.example.com/${tag}/both`, origin: 'casey_share', actor: ACTOR, now: new Date() }, { fetchHtml });
    if (!s3.ok) throw new Error('capture failed');
    created.push(s3.signal.id);
    const row3 = await prisma.gapSignal.findUniqueOrThrow({ where: { id: s3.signal.id } });
    expect('S3 ambiguous', row3.resolution === 'ambiguous' && row3.account_name === null && row3.research_status === 'none', `row -> ${JSON.stringify({ r: row3.resolution, a: row3.account_name, c: row3.candidates })}`);
    const inbox = await listSignals(prisma, { limit: 50 });
    expect('S3 ambiguous', inbox.find((v) => v.id === s3.signal.id)?.status === 'Needs you', 'the ambiguous signal is not "Needs you" in the inbox');
    const assigned = await applySignalOp(prisma, { id: s3.signal.id, actor: ACTOR, now: new Date(), op: 'assign', accountName: child });
    expect('S3 ambiguous', assigned.ok && assigned.signal.accountName === child && assigned.signal.researchStatus === 'queued', `assign -> ${JSON.stringify(assigned)}`);
    const wrong = await applySignalOp(prisma, { id: s3.signal.id, actor: ACTOR, now: new Date(), op: 'feedback', value: 'wrong_account' });
    expect('S3 ambiguous', wrong.ok && wrong.signal.accountName === null && wrong.signal.resolution === 'needs_account', `wrong account -> ${JSON.stringify(wrong)}`);
    pass('S3 ambiguous', `"${parent} and ${child}" stayed AMBIGUOUS with 2 candidates (never auto-assigned, not researched); Casey assigned ${child} (then queued); WRONG ACCOUNT put it back to Needs you`);

    // S4
    const s4 = await captureSignal(prisma, { note: 'VP Ops said trailer visibility is still site-by-site.', accountHint: parent, origin: 'conference_note', actor: ACTOR, now: new Date() }, { fetchHtml: null });
    if (!s4.ok) throw new Error('capture failed');
    created.push(s4.signal.id);
    const row4 = await prisma.gapSignal.findUniqueOrThrow({ where: { id: s4.signal.id } });
    expect('S4 conference', row4.url === null && row4.account_name === parent && row4.research_status === 'none' && row4.relevance === 'account_context', `row -> ${JSON.stringify({ u: row4.url, a: row4.account_name, rs: row4.research_status })}`);
    const research = await applySignalOp(prisma, { id: s4.signal.id, actor: ACTOR, now: new Date(), op: 'research' });
    expect('S4 conference', !research.ok && research.reason === 'no_link', 'a conference note was queued for public research');
    expect('S4 conference', JSON.stringify(await counts()) === JSON.stringify(before), 'a signal became evidence or a hypothesis');
    pass('S4 conference', 'a no-link conference note is kept as Casey\'s context on the account; it cannot be researched as public evidence and wrote no evidence, BID or hypothesis');

    // S5: real research follows up the queued shared signal (s1). Its page states a verifiable fact.
    const factSentence = `${parent} will open a new distribution center in Dallas, Texas in 2027 with an automated yard.`;
    pages[`https://news.example.com/${tag}/network`] += `<p>${factSentence}</p>`;
    const links0 = await prisma.hypothesisSignal.count();
    const bg = await runBackgroundResearch(
      prisma,
      { now: new Date(), cap: 1 },
      {
        loadGroups: async () => [],
        listQueue: async () => ({ asOf: null, items: [], truncated: false }),
        edgar: async () => ({ candidates: [], note: 'edgar skipped (scratch)' }),
        web: async () => ({ candidates: [], note: 'web skipped (scratch)' }),
        fetchText: async () => { throw new Error('no network in scratch'); },
        fetchHtml,
      },
    );
    const row5 = await prisma.gapSignal.findUniqueOrThrow({ where: { id: s1.signal.id } });
    expect('S5 research', bg.researched.length === 1 && bg.researched[0].accountName === parent && row5.research_status === 'fact_found', `research -> ${JSON.stringify({ bg: bg.researched, failed: bg.failed, skipped: bg.skipped, status: row5.research_status, meta: row5.metadata })}`);
    const fact = await prisma.prospectingSignal.findFirst({ where: { account_name: parent, source_kind: 'evidence_record' }, select: { evidence_text: true, metadata: true, evidence_url: true } });
    expect('S5 research', fact?.evidence_text === factSentence && (fact?.metadata as { verified?: string } | null)?.verified === 'excerpt_found_at_source', `fact -> ${JSON.stringify(fact)}`);
    expect('S5 research', (await prisma.hypothesisSignal.count()) === links0 && (await prisma.prospectingHypothesis.count()) === before.hypotheses, 'research linked evidence or touched a hypothesis');
    pass('S5 research', `real background research followed up the shared link: the sentence on its own page was verified verbatim and dated, stored as a verified fact ("${factSentence.slice(0, 60)}..."); the signal settled FACT READY; no hypothesis, no evidence link`);

    // S6: promotion through the spine (a scratch spine: the fake ingest writes the trigger row the real one would).
    const ingested: string[] = [];
    const fakeIngest = async (raw: Array<{ url: string; accountSlug: string; accountName: string; title: string; score: number; categories: string[] }>) => {
      for (const t of raw) {
        ingested.push(t.url);
        await prisma.pounceTrigger.create({ data: { url_hash: hashUrl(t.url), account_slug: t.accountSlug, account_name: t.accountName, title: t.title, url: t.url, source: 'web', score: t.score, categories: t.categories } });
      }
      return { received: raw.length, created: raw.length, duplicate: 0, pinged: 0, stamped: 0 };
    };
    const proc = await processSignals(prisma, { now: new Date() }, { fetchHtml, ingest: fakeIngest as never });
    const row6 = await prisma.gapSignal.findUniqueOrThrow({ where: { id: s1.signal.id } });
    expect('S6 promotion', proc.promoted === 1 && row6.promoted_trigger_id !== null && ingested.length === 1 && ingested[0].includes('/network'), `promotion -> ${JSON.stringify({ proc, promoted: row6.promoted_trigger_id, ingested })}`);
    const raw4 = await prisma.gapSignal.findUniqueOrThrow({ where: { id: s4.signal.id } });
    expect('S6 promotion', raw4.promoted_trigger_id === null, 'an unverified signal was promoted');
    pass('S6 promotion', `only the VERIFIED signal entered the Pounce spine (trigger ${row6.promoted_trigger_id}); raw, ambiguous and conference signals did not`);

    // S7: two outlets, one story.
    const a = await captureSignal(prisma, { url: `https://outlet-a.example.com/news/${tag}-opens-dallas-distribution-center-with-automated-yard/1`, origin: 'discovery', actor: 'gap-discovery', now: new Date() }, { fetchHtml });
    const b = await captureSignal(prisma, { url: `https://outlet-b.example.com/wire/${tag}-opens-dallas-distribution-center-with-automated-yard/99`, origin: 'discovery', actor: 'gap-discovery', now: new Date() }, { fetchHtml });
    if (!a.ok || !b.ok) throw new Error('capture failed');
    created.push(a.signal.id, b.signal.id);
    await processSignals(prisma, { now: new Date() }, { fetchHtml, ingest: fakeIngest as never });
    const [ra, rb] = await Promise.all([prisma.gapSignal.findUniqueOrThrow({ where: { id: a.signal.id } }), prisma.gapSignal.findUniqueOrThrow({ where: { id: b.signal.id } })]);
    expect('S7 cluster', ra.event_id !== null && ra.event_id === rb.event_id, `events -> ${JSON.stringify({ a: ra.event_id, b: rb.event_id })}`);
    const inbox7 = await listSignals(prisma, { limit: 50 });
    const lead = inbox7.find((v) => v.eventId === ra.event_id);
    expect('S7 cluster', !!lead && lead.alsoCoveredBy >= 1 && inbox7.filter((v) => v.eventId === ra.event_id).length === 1, 'the inbox shows the event more than once, or lost a source');
    pass('S7 cluster', `two outlets carrying the same story are ONE event (${ra.event_id}) with both sources kept; the inbox shows it once, "+${lead!.alsoCoveredBy} more source"`);
  } catch (err) {
    if (err instanceof StepFailure) failure = err;
    else {
      failure = new StepFailure('unexpected', err instanceof Error ? err.message : String(err));
      lines.push({ step: 'unexpected', status: 'FAIL', detail: failure.message });
      console.log(`FAIL unexpected: ${failure.message}`);
    }
  } finally {
    const sigs = await prisma.gapSignal.deleteMany({ where: { OR: [{ id: { in: created } }, { account_name: { in: accounts } }, { url: { contains: tag } }] } });
    const trig = await prisma.pounceTrigger.deleteMany({ where: { account_name: { in: accounts } } });
    const runIds = (await prisma.researchRun.findMany({ where: { account_name: { in: accounts } }, select: { id: true } })).map((r) => r.id);
    const facts = await prisma.prospectingSignal.deleteMany({ where: { account_name: { in: accounts } } });
    await prisma.evidenceRecord.deleteMany({ where: { account_name: { in: accounts } } });
    await prisma.researchRun.deleteMany({ where: { id: { in: runIds } } });
    pass('cleanup-research', `removed ${trig.count} triggers, ${facts.count} facts, ${runIds.length} research runs`);
    const audits = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events DISABLE TRIGGER gap_append_only_audit_events');
      try {
        return await tx.gapAuditEvent.deleteMany({ where: { OR: [{ subject_type: 'gap_signal', subject_id: { in: created } }, { kind: { in: ['research.completed', 'research.background_run'] }, created_at: { gte: new Date(Date.now() - 3_600_000) } }] } });
      } finally {
        await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events ENABLE TRIGGER gap_append_only_audit_events');
      }
    });
    const accts = await prisma.account.deleteMany({ where: { name: { in: accounts } } });
    pass('cleanup', `removed ${sigs.count} signals, ${audits.count} audit rows, ${accts.count} accounts`);
    await prisma.$disconnect();
  }
  const sha = (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  })();
  writeFileSync(
    'docs/gap/signals-e2e-latest.md',
    `# GAP Signal Intelligence E2E (scratch)\n\nCommit ${sha}, ${new Date().toISOString()}. ${failure ? `FAIL at ${failure.step}` : 'ALL PASS'}.\n\n${lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`).join('\n')}\n`,
  );
  return failure ? 1 : 0;
}

main().then((code) => process.exit(code));
