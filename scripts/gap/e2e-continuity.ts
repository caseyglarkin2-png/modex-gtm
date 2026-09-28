/**
 * GAP evidence continuity acceptance (2026-09-28), against the SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e npx tsx scripts/gap/e2e-continuity.ts
 *
 *   C1 June primary + August corroboration, through the real research path:
 *      a continuation row carrying the primary sentence, URL and June date
 *      with the corroborated clock; the original row unchanged; the Evidence
 *      Inbox shows ONE fact with PRIMARY SOURCE and CURRENTNESS CONFIRMED
 *   C2 no trigger: research never creates a Pounce trigger
 *   C3 history is frozen: rewriting the original fact is refused by the real
 *      GAP_SIGNAL_FROZEN trigger (continuity only ever adds rows or metadata)
 *   C4 superseded: a newer "ended" report marks the fact and its continuation
 *      ended (metadata only); the inbox shows nothing ready for it
 *
 * Rails: scratch database only (exit 2 otherwise); research providers are
 * in-process stubs (no network); every row the run creates is deleted in the
 * finally block. Writes docs/gap/continuity-e2e-latest.md (no secrets).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { runEvidenceResearch } from '../../src/lib/gap/research/run';
import { loadEvidenceInbox } from '../../src/lib/gap/research/inbox';
import { outreachFactRefusal } from '../../src/lib/gap/research/evidence-gate';
import type { Candidate } from '../../src/lib/gap/research/providers';

const databaseUrl = process.env.DATABASE_URL ?? '';
const scratch = (() => {
  try {
    const u = new URL(databaseUrl);
    return (u.hostname === '127.0.0.1' || u.hostname === 'localhost') && u.pathname === '/gap_finish_e2e';
  } catch {
    return false;
  }
})();
if (!scratch) {
  console.error('e2e-continuity refuses to run: DATABASE_URL is not the scratch database (127.0.0.1 .../gap_finish_e2e).');
  process.exit(2);
}

const lines: Array<{ step: string; status: 'PASS' | 'FAIL'; detail: string }> = [];
class StepFailure extends Error {
  constructor(public readonly step: string, message: string) {
    super(message);
  }
}
const pass = (step: string, detail: string) => {
  lines.push({ step, status: 'PASS', detail });
  console.log(`PASS ${step}: ${detail}`);
};
const expect = (step: string, ok: boolean, detail: string) => {
  if (ok) return;
  lines.push({ step, status: 'FAIL', detail });
  console.log(`FAIL ${step}: ${detail}`);
  throw new StepFailure(step, detail);
};

async function main(): Promise<number> {
  const prisma = new PrismaClient();
  const tag = `cont${Date.now().toString(36)}`;
  const ACC = `Contco${tag.slice(-5)}`;
  const PRIMARY_URL = `https://www.${ACC.toLowerCase()}.com/newsroom/gatik`;
  const FW_AUG = 'https://www.freightwaves.com/news/e2e-gatik-series-d';
  const END_URL = 'https://news.example/e2e-gatik-ends';
  const PRIMARY = `June 8, 2026 ${ACC} and Gatik announced a multi-year strategic partnership to bring autonomous freight into ${ACC}'s North America supply chain.`;
  const AUG = `Gatik moves freight for ${ACC} across roughly 250 retail locations in Texas, Arizona and Arkansas.`;
  const ENDED = `${ACC} ended its autonomous freight deployment with Gatik in Texas, Arizona and Arkansas.`;
  const pages: Record<string, string> = { [PRIMARY_URL]: `Newsroom ${PRIMARY}`, [FW_AUG]: `FreightWaves ${AUG}`, [END_URL]: `News ${ENDED}` };
  const cand = (url: string, excerpt: string, at: string, sourceType: Candidate['sourceType']): Candidate => ({ provider: 'signal', url, title: `${ACC} and Gatik`, publishedAt: new Date(at), excerpt, sourceType });
  const deps = (c: Candidate[]) => ({ edgar: async () => ({ candidates: [], note: 'off' }), web: async () => ({ candidates: [], note: 'off' }), fetchText: async (u: string) => pages[u] ?? '', extra: async () => ({ candidates: c, note: 'e2e pages' }) });
  const input = (now: Date) => ({ accountName: ACC, personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: 'e2e-continuity', now, seekCurrentness: false });
  const NOW = new Date('2026-09-28T15:00:00Z');
  let failure: StepFailure | null = null;
  const triggersBefore = await prisma.pounceTrigger.count();
  try {
    await prisma.account.create({ data: { rank: 9983, name: ACC, vertical: 'cpg', tier: 'Tier 1' } });

    // ---- C1
    const r1 = await runEvidenceResearch(prisma, input(NOW), deps([cand(PRIMARY_URL, PRIMARY, '2026-06-08', 'public_primary'), cand(FW_AUG, AUG, '2026-08-25T17:56:46Z', 'public_secondary')]));
    const rows = await prisma.prospectingSignal.findMany({ where: { account_name: ACC, source_kind: 'evidence_record' } });
    const cont = rows.filter((s) => s.source_id.startsWith('continuity:'));
    const orig = rows.find((s) => s.evidence_url === PRIMARY_URL && !s.source_id.startsWith('continuity:'));
    expect('C1 continuation', cont.length === 1 && !!orig, `continuations=${cont.length} original=${!!orig}`);
    const c = cont[0];
    expect('C1 continuation', c.evidence_text === PRIMARY && c.observed_at.toISOString().startsWith('2026-06-08') && !!c.freshness_expires_at && c.freshness_expires_at > new Date('2026-12-01'), `row ${JSON.stringify({ at: c.observed_at, exp: c.freshness_expires_at })}`);
    expect('C1 continuation', orig!.freshness_expires_at!.toISOString().startsWith('2026-10-06'), `original clock ${orig!.freshness_expires_at?.toISOString()}`);
    expect('C1 continuation', outreachFactRefusal(c as never, ACC) === null, `gate -> ${outreachFactRefusal(c as never, ACC)}`);
    pass('C1 continuation', `June primary + August corroboration: continuation ${c.id} keeps the June 8 date and primary URL, current until ${c.freshness_expires_at!.toISOString().slice(0, 10)} (the original stays at 2026-10-06); corroborated=${r1.continuity?.corroborated.length}`);
    const [box] = (await loadEvidenceInbox(prisma, NOW, { accounts: [ACC] })).filter((a) => a.accountName === ACC);
    expect('C1 inbox', !!box && box.ready.length === 1 && box.ready[0].signalId === c.id, `ready -> ${JSON.stringify(box?.ready.map((f) => f.signalId))}`);
    expect('C1 inbox', box.ready[0].chain.kind === 'primary' && box.ready[0].chain.currentness?.url === FW_AUG && box.bestSignalId === c.id, `chain -> ${JSON.stringify(box.ready[0].chain)}`);
    pass('C1 inbox', `ONE fact: PRIMARY SOURCE ${box.ready[0].chain.source.label} · ${box.ready[0].chain.source.date.slice(0, 10)} / CURRENTNESS CONFIRMED ${box.ready[0].chain.currentness!.label} · ${box.ready[0].chain.currentness!.date.slice(0, 10)}; best fact; next: "${box.next}"`);

    // ---- C2
    expect('C2 no trigger', (await prisma.pounceTrigger.count()) === triggersBefore, 'a trigger was created');
    pass('C2 no trigger', 'research over a June story created no Pounce trigger (trigger freshness untouched)');

    // ---- C3
    let refused = '';
    try {
      await prisma.prospectingSignal.update({ where: { id: orig!.id }, data: { evidence_text: 'rewritten' } });
    } catch (e) {
      refused = e instanceof Error ? e.message : String(e);
    }
    expect('C3 frozen', /GAP_SIGNAL_FROZEN/.test(refused), `update -> ${refused.slice(0, 120) || 'accepted'}`);
    pass('C3 frozen', 'rewriting the original fact is refused by GAP_SIGNAL_FROZEN; continuity only adds rows and metadata');

    // ---- C4
    const r2 = await runEvidenceResearch(prisma, input(new Date('2026-09-29T15:00:00Z')), deps([cand(END_URL, ENDED, '2026-09-20', 'public_secondary')]));
    const after = await prisma.prospectingSignal.findMany({ where: { id: { in: [orig!.id, c.id] } } });
    const kinds = after.map((s) => ((s.metadata as { continuity?: { kind?: string } } | null)?.continuity?.kind ?? null));
    expect('C4 superseded', kinds.every((k) => k === 'ended') && after.every((s) => outreachFactRefusal(s as never, ACC) === 'superseded'), `kinds -> ${JSON.stringify(kinds)}`);
    const [box2] = (await loadEvidenceInbox(prisma, new Date('2026-09-29T15:00:00Z'), { accounts: [ACC] })).filter((a) => a.accountName === ACC);
    expect('C4 superseded', !box2 || !box2.ready.some((f) => f.quote === PRIMARY), `ready -> ${JSON.stringify(box2?.ready.map((f) => f.quote))}`);
    pass('C4 superseded', `a newer report that the program ended marks the fact and its continuation ended (metadata only; superseded=${r2.continuity?.superseded.length}); the gate refuses both; nothing ready for it`);
  } catch (err) {
    failure = err instanceof StepFailure ? err : new StepFailure('unexpected', err instanceof Error ? err.message : String(err));
    if (!(err instanceof StepFailure)) console.log(`FAIL unexpected: ${failure.message}`);
  } finally {
    try {
      // Scratch only: the audit table is append-only by trigger; the other E2Es lift it inside the cleanup transaction the same way.
      const { sig, ev, runs, audit } = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events DISABLE TRIGGER gap_append_only_audit_events');
        try {
          const audit = await tx.gapAuditEvent.deleteMany({ where: { actor: 'e2e-continuity' } });
          const sig = await tx.prospectingSignal.deleteMany({ where: { account_name: ACC } });
          const ev = await tx.evidenceRecord.deleteMany({ where: { account_name: ACC } });
          const runs = await tx.researchRun.deleteMany({ where: { account_name: ACC } });
          await tx.account.deleteMany({ where: { name: ACC } });
          return { sig, ev, runs, audit };
        } finally {
          await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events ENABLE TRIGGER gap_append_only_audit_events');
        }
      });
      pass('cleanup', `deleted ${sig.count} signals, ${ev.count} evidence records, ${runs.count} runs, ${audit.count} audit rows, the account`);
    } catch (e) {
      lines.push({ step: 'cleanup', status: 'FAIL', detail: e instanceof Error ? e.message : String(e) });
      console.log(`FAIL cleanup: ${e instanceof Error ? e.message : String(e)}`);
      failure = failure ?? new StepFailure('cleanup', 'cleanup failed');
    }
    await prisma.$disconnect();
    const out = ['# GAP evidence continuity acceptance (latest)', '', `STATUS: ${failure ? `FAIL at ${failure.step}` : 'PASS'}`, '', ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`), ''];
    mkdirSync(path.join('docs', 'gap'), { recursive: true });
    writeFileSync(path.join('docs', 'gap', 'continuity-e2e-latest.md'), out.join('\n'));
  }
  return failure ? 1 : 0;
}

main().then((code) => process.exit(code));
