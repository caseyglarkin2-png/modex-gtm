/**
 * Monday readiness dogfood (2026-09-27). SCRATCH DATABASE ONLY.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e npx tsx scripts/gap/dogfood-monday-readiness.ts
 *
 * Proves on real Postgres (real triggers), through the real thesis, machine,
 * research and routing code, the two journeys Casey will walk:
 *
 *   CASE A  VERIFIED THESIS: two drafts on a verified fact are REVIEW work,
 *           APPROVE + USE activates both and routing lands them READY.
 *   CASE B  INSUFFICIENT LEGACY THESIS (the live PepsiCo shape): five rows
 *           APPROVED on a keyword-only observation, nothing in use.
 *             - initial: RESEARCH not REVIEW, next = revise for all five,
 *               the result of a forced Approve + use reads 5 approved, 0 in
 *               use, verified evidence required (the server still refuses)
 *             - A. nothing found: still research, no approval shortcut
 *             - B. a verified fact chosen: five DRAFT revisions supersede the
 *               frozen rows (byte-identical, still approved), the revisions
 *               are REVIEW work, explicit APPROVE + USE activates and routes.
 *
 * `--seed-browser` stops before any decision and leaves the browser states:
 * Case A drafts in REVIEW; Case B five approved keyword-only rows in RESEARCH
 * with a reusable (24h) research run that finds one verified fact; Case C one
 * approved keyword-only row whose research finds nothing. No live provider is
 * called from the browser: FIND VERIFIED EVIDENCE reuses those runs.
 *
 * Suppression is a local stub (every address clear), HubSpot a TAM-in stub,
 * people use reserved example.com addresses. Nothing is drafted or sent; the
 * script asserts that. Rows stay (tag `mr-<ts>`) for the browser walkthrough.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { PrismaClient } from '@prisma/client';
import { proposeHypothesis } from '../../src/lib/gap/hypothesis/service';
import { approveSelectedSiblings, corroborateThesis, loadThesisGroups, splitThesisWork, useEvidenceForThesis } from '../../src/lib/gap/hypothesis/thesis-groups';
import { routeAfterUse } from '../../src/lib/gap/routing/interactive';
import { runRouting, type HubSpotSnapshotProvider } from '../../src/lib/gap/routing/run';
import { createClawdSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { listQueue } from '../../src/lib/gap/routing/queue';
import { sellerLaneOf } from '../../src/lib/gap/routing/card-readiness';
import { registerSignal } from '../../src/lib/gap/signals/registry';
import { VERIFIED_EXCERPT } from '../../src/lib/gap/research/evidence-gate';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const ACTOR = 'casey@freightroll.com';
const tag = `mr-${Date.now()}`;
const SEED = process.argv.includes('--seed-browser');
let accession = 0;
const results: Array<{ step: string; ok: boolean; detail: string }> = [];
function check(step: string, ok: boolean, detail: string) {
  results.push({ step, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${step}: ${detail}`);
}
const tamIn: HubSpotSnapshotProvider = async () => ({ tam: 'in', tamTier: 'A', intentScore: 60, lastIntentAt: new Date(), triggerScore: null, lastTriggerAt: null });

async function main() {
  if (!SCRATCH_URL.test(process.env.DATABASE_URL ?? '')) throw new Error('refusing: DATABASE_URL is not the scratch database');
  delete process.env.HUBSPOT_ACCESS_TOKEN;
  const stub = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let emails: string[] = [];
      try {
        const j = JSON.parse(body || '{}');
        emails = Array.isArray(j.emails) ? j.emails : j.email ? [j.email] : j.to ? [j.to] : [];
      } catch { /* none */ }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, results: emails.map((email) => ({ email, blocked: false })) }));
    });
  });
  await new Promise<void>((r) => stub.listen(0, '127.0.0.1', () => r()));
  process.env.CLAWD_CONTROL_PLANE_URL = `http://127.0.0.1:${(stub.address() as AddressInfo).port}`;
  process.env.CLAWD_CONTROL_PLANE_TOKEN = 'scratch';
  const suppression = createClawdSuppressionReader();
  const route = (people: Array<{ personaId: number; name: string | null }>) =>
    routeAfterUse(prisma, { actor: ACTOR, now: new Date(), people }, { run: (p, o, d) => runRouting(p, o, { ...d, suppression, hubspotSnapshot: tamIn }) });

  const prisma = new PrismaClient();
  const now = new Date();
  // Outbound evidence: email_log rows (every GAP send writes one) and draft/send audit events.
  const outbound = async () => ({
    emailLog: await prisma.emailLog.count(),
    draftOrSendEvents: await prisma.gapAuditEvent.count({ where: { OR: [{ kind: { contains: 'draft' } }, { kind: { contains: 'send' } }] } }),
    enrollments: await prisma.sequenceEnrollment.count(),
  });
  const outboundBefore = await outbound();
  try {
    async function person(account: string, n: number, title: string) {
      return prisma.persona.create({
        data: { persona_id: `${tag}-${account}-${n}`, account_name: account, priority: 'P1', name: `${account.split(' ')[0]} Person${n}`, title, seniority: 'vp', email: `${tag}-${account.replace(/\W+/g, '').toLowerCase()}-${n}@example.com`, email_valid: true, is_contact_ready: true, do_not_contact: false },
        select: { id: true, name: true },
      });
    }
    const verifiedFact = (account: string, key: string, text: string) =>
      registerSignal(prisma, {
        accountName: account, sourceKind: 'evidence_record', sourceId: `${tag}:${key}`, type: 'site_expansion', title: `${account.toUpperCase()} INC 10-Q (filed 2026-07-09)`,
        sourceType: 'public_primary', evidenceUrl: `https://www.sec.gov/Archives/edgar/data/1/${String(1000000000 + (accession += 1))}26/${key}.htm`, evidenceText: text, externalOk: true,
        observedAt: new Date('2026-07-09T00:00:00Z'), confidence: 80, metadata: { verified: VERIFIED_EXCERPT }, registeredBy: ACTOR,
      });
    const narrative = {
      persona: 'supply_chain', problemFamily: 'hidden_capacity',
      problemHypothesis: 'My guess is the network change moves trailer load onto the yards that remain.',
      rootCauseHypotheses: ['Manual gate check-in'], impactHypotheses: ['Detention at the remaining sites'], whyNow: null,
      falsificationQuestions: ['Did trailer volume at the other sites stay flat?'], whatANoMeans: 'The change did not touch the yards.', confidence: 40, createdBy: ACTOR,
    };

    // ---------------- CASE A: verified thesis ----------------
    const acctA = `Verifiedco ${tag}`;
    await prisma.account.create({ data: { rank: 9101, name: acctA, vertical: 'cpg' } });
    const factA = await verifiedFact(acctA, 'a-fact', `${acctA} will close three distribution centers in 2027.`);
    const { citedQuote } = await import('../../src/lib/gap/research/propose');
    const obsA = citedQuote(`${acctA.toUpperCase()} INC 10-Q (filed 2026-07-09)`, `${acctA} will close three distribution centers in 2027.`, factA.id, acctA);
    const peopleA = [await person(acctA, 1, 'VP Supply Chain'), await person(acctA, 2, 'Director Logistics')];
    for (const p of peopleA) {
      const r = await proposeHypothesis(prisma, { ...narrative, accountName: acctA, primaryPersonaId: p.id, observation: obsA, signalIds: [factA.id], primarySignalId: factA.id });
      if (!r.ok) throw new Error(`propose A: ${JSON.stringify(r)}`);
    }
    let groups = await loadThesisGroups(prisma, { account_name: acctA }, { singletons: true });
    let split = splitThesisWork(groups);
    check('A review', split.reviewGroups.length === 1 && split.researchGroups.length === 0 && groups[0].readiness.ready, `verified thesis is REVIEW work: ${JSON.stringify(groups[0]?.readiness)} next=${groups[0]?.members.map((m) => m.next)}`);
    if (!SEED) {
    const useA = await approveSelectedSiblings(prisma, { fingerprint: groups[0].fingerprint, hypothesisIds: groups[0].members.map((m) => m.id), actor: ACTOR, now, use: true });
    const routedA = useA.inUse?.length ? await route(useA.inUse) : null;
    check('A approve + use', useA.ok && useA.summary?.inUse === 2 && useA.summary.newlyApproved === 2, `summary ${JSON.stringify(useA.summary)}`);
    const queueA = (await listQueue(prisma, { limit: 200 })).items.filter((i) => i.account.name === acctA);
    check('A routed READY', routedA?.ok === true && queueA.length === 2 && queueA.every((i) => sellerLaneOf(i) === 'ready'), `routing ${routedA?.ok ? JSON.stringify(routedA.counts) : JSON.stringify(routedA)}; lanes ${queueA.map((i) => sellerLaneOf(i))}`);
    }

    // ---------------- CASE B: insufficient legacy thesis ----------------
    const acctB = `Pepsishape ${tag}`;
    await prisma.account.create({ data: { rank: 9102, name: acctB, vertical: 'cpg' } });
    const kw = await registerSignal(prisma, {
      accountName: acctB, sourceKind: 'pounce_trigger', sourceId: `${tag}:kw`, type: 'other', title: 'PEP 10-Q (2026-07-09) mentions: capital expenditure',
      sourceType: 'public_secondary', evidenceUrl: 'https://www.sec.gov/Archives/edgar/data/77476/000007747626000035/pep.htm', evidenceText: null, externalOk: null,
      observedAt: new Date('2026-07-09T00:00:00Z'), confidence: 30, registeredBy: 'pounce',
    });
    const irrelevant = await verifiedFact(acctB, 'b-irr', 'Restructuring charges were recorded in selling, general and administrative expenses.');
    const kwObs = `PEP 10-Q (2026-07-09) mentions: capital expenditure [S:${kw.id}].`;
    const peopleB = [];
    for (let n = 1; n <= 5; n += 1) peopleB.push(await person(acctB, n, n === 1 ? 'SVP Supply Chain' : 'Director Logistics'));
    const legacyIds: string[] = [];
    for (const p of peopleB) {
      const r = await proposeHypothesis(prisma, { ...narrative, accountName: acctB, primaryPersonaId: p.id, observation: kwObs, signalIds: [kw.id, irrelevant.id], primarySignalId: kw.id });
      if (!r.ok) throw new Error(`propose B: ${JSON.stringify(r)}`);
      legacyIds.push(r.id);
    }
    // Production reached "approved" before the T6 gate existed; the machine refuses it today,
    // so the legacy state is reproduced the only way it can still arise: a direct status write.
    await prisma.prospectingHypothesis.updateMany({ where: { id: { in: legacyIds } }, data: { status: 'approved', reviewed_by: 'casey@freightroll.com', reviewed_at: new Date('2026-09-26T02:47:26Z') } });
    const snapshotOf = async () => JSON.stringify(await prisma.prospectingHypothesis.findMany({ where: { id: { in: legacyIds } }, orderBy: { id: 'asc' }, include: { signals: { orderBy: { signal_id: 'asc' } }, events: { orderBy: { id: 'asc' } } } }));

    groups = await loadThesisGroups(prisma, { account_name: acctB }, { singletons: true });
    split = splitThesisWork(groups);
    const g = groups[0];
    check('B initial', groups.length === 1 && g.members.length === 5 && !g.readiness.ready && g.members.every((m) => m.next === 'revise') && split.reviewGroups.length === 0 && split.researchGroups.length === 1,
      `5 approved, 0 active; readiness ${JSON.stringify(g.readiness)}; RESEARCH not REVIEW`);
    if (SEED) {
      // A reusable run for this thesis that found ONE verified fact (a distinct filing, so it counts as new).
      const found = await verifiedFact(acctB, 'b-fact', `${acctB} will close three distribution centers in 2027.`);
      const hit = { signalId: found.id, excerpt: `${acctB} will close three distribution centers in 2027.`, url: 'https://www.sec.gov/', title: `${acctB.toUpperCase()} INC 10-Q (filed 2026-07-09)`, publishedAt: '2026-07-09T00:00:00.000Z', fresh: true };
      await prisma.researchRun.create({ data: { account_name: acctB, status: 'succeeded', provider_status: { thesisFingerprint: g.fingerprint, result: { runId: `${tag}-b`, outcome: 'evidence_found', facts: [hit], rejected: [], conflicts: [], notes: [] } } } });
      // Case C: one approved keyword-only row whose research finds nothing.
      const acctC = `Holdco ${tag}`;
      await prisma.account.create({ data: { rank: 9103, name: acctC, vertical: 'cpg' } });
      const kwC = await registerSignal(prisma, {
        accountName: acctC, sourceKind: 'pounce_trigger', sourceId: `${tag}:kwc`, type: 'other', title: 'HOLD 10-Q (2026-07-09) mentions: capital expenditure',
        sourceType: 'public_secondary', evidenceUrl: 'https://www.sec.gov/Archives/edgar/data/2/000000000226000001/hold.htm', evidenceText: null, externalOk: null,
        observedAt: new Date('2026-07-09T00:00:00Z'), confidence: 30, registeredBy: 'pounce',
      });
      const pc = await person(acctC, 1, 'VP Operations');
      const rc = await proposeHypothesis(prisma, { ...narrative, accountName: acctC, primaryPersonaId: pc.id, observation: `HOLD 10-Q (2026-07-09) mentions: capital expenditure [S:${kwC.id}].`, signalIds: [kwC.id], primarySignalId: kwC.id });
      if (!rc.ok) throw new Error(`propose C: ${JSON.stringify(rc)}`);
      await prisma.prospectingHypothesis.update({ where: { id: rc.id }, data: { status: 'approved', reviewed_by: 'casey@freightroll.com', reviewed_at: new Date('2026-09-26T02:47:26Z') } });
      const gc = (await loadThesisGroups(prisma, { account_name: acctC }, { singletons: true }))[0];
      await prisma.researchRun.create({ data: { account_name: acctC, status: 'succeeded', provider_status: { thesisFingerprint: gc.fingerprint, result: { runId: `${tag}-c`, outcome: 'no_evidence', facts: [], rejected: [], conflicts: [], notes: ['nothing verified'] } } } });
      check('seed browser', true, `A=${acctA} (review), B=${acctB} (research, a fact to find), C=${acctC} (research, nothing to find)`);
      return;
    }
    const forced = await approveSelectedSiblings(prisma, { fingerprint: g.fingerprint, hypothesisIds: legacyIds, actor: ACTOR, now, use: true });
    check('B old thesis still refuses', !forced.ok && forced.summary?.approved === 5 && forced.summary.inUse === 0 && forced.summary.needsResearch === 5 && forced.summary.reasons.join() === 'evidence_insufficient',
      `a forced Approve + use: ${JSON.stringify(forced.summary)} (reads 5 approved, 0 in use, verified evidence required)`);

    // B-A. Nothing good found: stays research, nothing changes.
    const before = await snapshotOf();
    const none = await corroborateThesis(prisma, { fingerprint: g.fingerprint, actor: ACTOR, now, force: true }, {
      run: async () => ({ runId: `${tag}-none`, outcome: 'no_evidence', facts: [], rejected: [], conflicts: [], notes: ['nothing verified'] }) as never,
    });
    const afterNone = splitThesisWork(await loadThesisGroups(prisma, { account_name: acctB }, { singletons: true }));
    check('B-A nothing found', none.ok && none.outcome === 'no_second_source' && afterNone.researchGroups.length === 1 && afterNone.reviewGroups.length === 0 && (await snapshotOf()) === before,
      `outcome ${none.ok ? none.outcome : none.reason}; still research; rows untouched`);

    // B-B. Verified fact found and chosen: revisions, originals untouched.
    const fact = await verifiedFact(acctB, 'b-fact', `${acctB} will close three distribution centers in 2027.`);
    const revised = await useEvidenceForThesis(prisma, { fingerprint: g.fingerprint, hypothesisIds: legacyIds, signalIds: [fact.id], actor: ACTOR, now });
    const revIds = revised.results.map((r) => r.revisionId).filter((x): x is string => !!x);
    const revRows = await prisma.prospectingHypothesis.findMany({ where: { id: { in: revIds } }, select: { id: true, status: true, supersedes_id: true, observation: true, reviewed_by: true } });
    check('B-B revisions', revised.ok && revIds.length === 5 && revRows.every((r) => r.status === 'draft' && r.reviewed_by === null && legacyIds.includes(r.supersedes_id ?? '') && !r.observation.includes('mentions:') && r.observation.includes(`[S:${fact.id}]`)),
      `5 DRAFT revisions with supersedes_id; observation: ${revRows[0]?.observation}`);
    check('B-B originals untouched', (await snapshotOf()) === before, 'frozen rows, links and events byte-identical (still approved, still the keyword observation)');
    const again = await useEvidenceForThesis(prisma, { fingerprint: g.fingerprint, hypothesisIds: legacyIds, signalIds: [fact.id], actor: ACTOR, now });
    check('B-B idempotent', again.reason === 'group_not_found' && (await prisma.prospectingHypothesis.count({ where: { supersedes_id: { in: legacyIds } } })) === 5, `second click: ${again.reason}; still 5 revisions`);

    groups = await loadThesisGroups(prisma, { account_name: acctB }, { singletons: true });
    split = splitThesisWork(groups);
    check('B-B review', groups.length === 1 && groups[0].members.every((m) => revIds.includes(m.id) && m.next === 'approve_use') && split.reviewGroups.length === 1 && split.researchGroups.length === 0,
      `current work = the 5 revisions only, REVIEW, next=${groups[0]?.members.map((m) => m.next)}`);
    const useB = await approveSelectedSiblings(prisma, { fingerprint: groups[0].fingerprint, hypothesisIds: revIds, actor: ACTOR, now, use: true });
    const routedB = useB.inUse?.length ? await route(useB.inUse) : null;
    const queueB = (await listQueue(prisma, { limit: 200 })).items.filter((i) => i.account.name === acctB);
    check('B-B explicit approve + use routes', useB.ok && useB.summary?.inUse === 5 && routedB?.ok === true && queueB.length > 0 && queueB.every((i) => i.hypothesis?.id ? revIds.includes(i.hypothesis.id) : true),
      `summary ${JSON.stringify(useB.summary)}; routing ${routedB?.ok ? JSON.stringify(routedB.counts) : JSON.stringify(routedB)}; lanes ${queueB.map((i) => sellerLaneOf(i))}`);

    // Nothing left the building.
    const outboundAfter = await outbound();
    check('no outbound', JSON.stringify(outboundAfter) === JSON.stringify(outboundBefore), `before ${JSON.stringify(outboundBefore)} after ${JSON.stringify(outboundAfter)}`);
  } finally {
    await prisma.$disconnect();
    stub.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed (tag ${tag})`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
