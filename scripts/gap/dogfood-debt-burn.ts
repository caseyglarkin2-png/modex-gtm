/**
 * Debt burn dogfood (2026-09-26). SCRATCH DATABASE ONLY.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e npx tsx scripts/gap/dogfood-debt-burn.ts
 *
 * Proves on real Postgres, through the real routing, queue, hypothesis and
 * research code:
 *   1. APPROVE + USE for one person routes ONLY that person's account.
 *   2. Every other account's current card stays visible.
 *   3. A later targeted run replaces only the routed subject's card.
 *   4. With 26+ accounts in use (the old interactive cap refuses them),
 *      approving one account still works.
 *   5. A research proposal is ONE decision: propose (machine), then
 *      decideResearchProposal approve_and_use runs submit/approve/activate
 *      (hypothesis_events) and routes only that person.
 *   6. A failed account keeps its earlier card; an ended thesis leaves no card.
 *
 * Suppression is a local stub HTTP server (every address clear), HubSpot is a
 * stub TAM-in snapshot, people use reserved example.com addresses. Nothing is
 * drafted, enrolled or sent. Leaves its rows in place for the browser
 * walkthrough (tagged `dbd-<ts>`).
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { PrismaClient } from '@prisma/client';
import { proposeHypothesis, transitionHypothesis } from '../../src/lib/gap/hypothesis/service';
import { advanceHypothesis } from '../../src/lib/gap/hypothesis/thesis-groups';
import { decideResearchProposal } from '../../src/lib/gap/research/decide';
import { proposeFromResearch } from '../../src/lib/gap/research/propose';
import { routeAfterUse } from '../../src/lib/gap/routing/interactive';
import { listQueue } from '../../src/lib/gap/routing/queue';
import { resolveRoutableHypothesisScope, runRouting, type HubSpotSnapshotProvider } from '../../src/lib/gap/routing/run';
import { createClawdSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { sellerLaneOf } from '../../src/lib/gap/routing/card-readiness';
import { registerSignal } from '../../src/lib/gap/signals/registry';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const ACTOR = 'dogfood-debt-burn';
const tag = `dbd-${Date.now()}`;
const results: Array<{ step: string; ok: boolean; detail: string }> = [];

function check(step: string, ok: boolean, detail: string) {
  results.push({ step, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${step}: ${detail}`);
}

const tamIn: HubSpotSnapshotProvider = async () => ({ tam: 'in', tamTier: 'A', intentScore: 60, lastIntentAt: new Date(), triggerScore: null, lastTriggerAt: null });

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(url)) throw new Error('refusing: DATABASE_URL is not the scratch database');
  delete process.env.HUBSPOT_ACCESS_TOKEN;

  // Suppression stub: the real Clawd reader, pointed at a local server that clears every address.
  const stub = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const emails: string[] = (() => {
        try {
          const j = JSON.parse(body || '{}');
          return Array.isArray(j.emails) ? j.emails : j.email ? [j.email] : j.to ? [j.to] : [];
        } catch {
          return [];
        }
      })();
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, results: emails.map((email) => ({ email, blocked: false })) }));
    });
  });
  await new Promise<void>((r) => stub.listen(0, '127.0.0.1', () => r()));
  process.env.CLAWD_CONTROL_PLANE_URL = `http://127.0.0.1:${(stub.address() as AddressInfo).port}`;
  process.env.CLAWD_CONTROL_PLANE_TOKEN = 'scratch';
  const suppression = createClawdSuppressionReader();

  const prisma = new PrismaClient();
  const now = new Date();
  try {
    // Seed: 27 accounts, one person each, each with an ACTIVE thesis; plus one
    // "Pepsi" account with three people: A active, B a draft, C no thesis yet.
    async function person(account: string, n: number, title = 'VP Supply Chain') {
      return prisma.persona.create({
        data: { persona_id: `${tag}-${account}-${n}`, account_name: account, priority: 'P1', name: `${account.split(' ')[1]} Person${n}`, title, seniority: 'vp', email: `${tag}-${account.replace(/\W+/g, '').toLowerCase()}-${n}@example.com`, email_valid: true, is_contact_ready: true, do_not_contact: false },
        select: { id: true, name: true },
      });
    }
    async function thesis(account: string, personaId: number, status: 'draft' | 'active' | 'approved') {
      const fact = await registerSignal(prisma, {
        accountName: account, personaId, sourceKind: 'manual', sourceId: `${tag}:${account}:${personaId}`, type: 'new_site',
        title: `${account} opens a distribution center in Ohio`, sourceType: 'public_primary', evidenceUrl: `https://example.com/${tag}/${personaId}`,
        evidenceText: `${account} opened a new distribution center in Ohio this month.`, externalOk: true, observedAt: now, confidence: 80, registeredBy: ACTOR,
      });
      const p = await proposeHypothesis(prisma, {
        accountName: account, primaryPersonaId: personaId, persona: 'supply_chain', problemFamily: 'hidden_capacity',
        observation: `${account} opened a new distribution center in Ohio [S:${fact.id}].`,
        problemHypothesis: 'My guess is the new site moves trailer load onto the yards that remain.',
        rootCauseHypotheses: ['Manual gate check-in'], impactHypotheses: ['Detention at the remaining sites'], whyNow: 'The site opened this month.',
        falsificationQuestions: ['Did trailer volume at the other sites stay flat?'], whatANoMeans: 'The new site did not touch the yards.', confidence: 60,
        signalIds: [fact.id], primarySignalId: fact.id, createdBy: ACTOR,
      });
      if (!p.ok) throw new Error(`propose ${account}: ${JSON.stringify(p)}`);
      const steps = status === 'active' ? (['submit', 'approve', 'activate'] as const) : status === 'approved' ? (['submit', 'approve'] as const) : ([] as const);
      for (const a of steps) {
        const r = await transitionHypothesis(prisma, p.id, a, { now, actor: ACTOR });
        if (!r.ok) throw new Error(`${a} ${account}: ${JSON.stringify(r)}`);
      }
      return p.id;
    }

    const accounts: string[] = [];
    const firstPerson = new Map<string, number>();
    for (let i = 1; i <= 27; i += 1) {
      const name = `DBD Acct${String(i).padStart(2, '0')} ${tag}`;
      await prisma.account.create({ data: { rank: 9000 + i, name, vertical: 'cpg' } });
      const p = await person(name, 1);
      await thesis(name, p.id, 'active');
      accounts.push(name);
      firstPerson.set(name, p.id);
    }
    const pepsi = `DBD Pepsi ${tag}`;
    await prisma.account.create({ data: { rank: 8999, name: pepsi, vertical: 'cpg' } });
    const A = await person(pepsi, 1);
    const B = await person(pepsi, 2, 'Director Logistics');
    const C = await person(pepsi, 3, 'Director Transportation');
    await thesis(pepsi, A.id, 'active');
    const hB = await thesis(pepsi, B.id, 'draft');
    const scope = await resolveRoutableHypothesisScope(prisma);
    check('4 scale', 'tooLarge' in scope && scope.accountCount >= 28, `the old interactive scope refuses: ${JSON.stringify(scope)}`);

    // Run A: every account (the diagnostic broad pass).
    let t0 = Date.now();
    const runA = await runRouting(prisma, { now, actor: ACTOR, runId: `${tag}-A`, accountNames: [pepsi, ...accounts] }, { suppression, hubspotSnapshot: tamIn });
    const msA = Date.now() - t0;
    const beforeUse = await listQueue(prisma, { limit: 100 });
    const mine = (items: typeof beforeUse.items) => items.filter((i) => i.account.name.endsWith(tag));
    const cardsA = new Map(mine(beforeUse.items).map((i) => [i.persona.id as number, i.id]));
    check('seed', runA.failed.length === 0 && cardsA.size === 29 && !cardsA.has(C.id), `run A ${runA.decisions} decisions over ${runA.accountsScanned} accounts in ${msA}ms; ${cardsA.size} current cards (27 accounts + Pepsi A, B; C has no thesis and is not in Pepsi's top two)`);

    // 1-2-4. APPROVE + USE for B: the legal transitions, then routeAfterUse (production seam; only the HubSpot snapshot is stubbed).
    t0 = Date.now();
    const adv = await advanceHypothesis(prisma, hB, 'draft', { use: true, actor: ACTOR, now, reason: 'dogfood approve + use' });
    const seen: Array<{ accountNames?: string[]; personaIds?: number[] }> = [];
    const routed = await routeAfterUse(prisma, { actor: ACTOR, now, people: [{ personaId: B.id, name: B.name }] }, {
      run: (p, o, d) => {
        seen.push({ accountNames: o.accountNames, personaIds: o.personaIds });
        return runRouting(p, o, { ...d, suppression, hubspotSnapshot: tamIn });
      },
    });
    const msUse = Date.now() - t0;
    const afterUse = await listQueue(prisma, { limit: 100 });
    const cardsU = new Map(mine(afterUse.items).map((i) => [i.persona.id as number, i.id]));
    const newRows = await prisma.routingDecision.findMany({ where: { run_id: routed.ok ? routed.runId : '-' }, select: { account_name: true, persona_id: true } });
    check('1 targeted', adv.ok && adv.to === 'active' && routed.ok && seen.length === 1 && JSON.stringify(seen[0]) === JSON.stringify({ accountNames: [pepsi], personaIds: [B.id] }) && newRows.length === 1 && newRows[0].persona_id === B.id,
      `approve + use B took ${msUse}ms; routed ${JSON.stringify(seen)}; new rows ${JSON.stringify(newRows.map((r) => r.persona_id))}; B landed ${routed.ok ? JSON.stringify(routed.counts) : routed.reason}`);
    const unchanged = [...cardsA].filter(([pid]) => pid !== B.id).every(([pid, id]) => cardsU.get(pid) === id);
    check('2 others stay', unchanged && cardsU.size === 29 && cardsU.get(B.id) !== cardsA.get(B.id), `${cardsU.size} current cards; every card but B's is the run A card: ${unchanged}`);
    check('4 scale', routed.ok, `approve + use with ${'tooLarge' in scope ? scope.accountCount : '?'} accounts in use: ${routed.ok ? 'routed' : routed.reason}`);

    // 3. A later targeted run for A replaces only A's card.
    await runRouting(prisma, { now: new Date(), actor: ACTOR, runId: `${tag}-T`, accountNames: [pepsi], personaIds: [A.id] }, { suppression, hubspotSnapshot: tamIn });
    const afterT = new Map(mine((await listQueue(prisma, { limit: 100 })).items).map((i) => [i.persona.id as number, i.id]));
    const onlyA = [...cardsU].every(([pid, id]) => (pid === A.id ? afterT.get(pid) !== id : afterT.get(pid) === id));
    check('3 later targeted', onlyA && afterT.size === 29, `only A's card changed: ${onlyA}`);

    // 6a. A failed account keeps its earlier card; its neighbour's card is replaced.
    const [acct1, acct2] = accounts;
    const failRun = await runRouting(prisma, { now: new Date(), actor: ACTOR, runId: `${tag}-F`, accountNames: [acct1, acct2] }, {
      suppression,
      hubspotSnapshot: async (name) => {
        if (name === acct2) throw Object.assign(new Error('hubspot 502'), { fatal: true });
        return tamIn(name, null);
      },
      assemble: async (p, args, opts) => {
        if (args.accountName === acct2) throw new Error('clawd 503');
        const { assembleForAccount } = await import('../../src/lib/gap/routing/inputs');
        return assembleForAccount(p, args, opts);
      },
    });
    const afterF = new Map(mine((await listQueue(prisma, { limit: 100 })).items).map((i) => [i.persona.id as number, i.id]));
    const p1 = firstPerson.get(acct1)!;
    const p2 = firstPerson.get(acct2)!;
    check('6 failure isolated', JSON.stringify(failRun.failed) === JSON.stringify([{ accountName: acct2, reason: 'clawd 503' }]) && afterF.get(p2) === afterT.get(p2) && afterF.get(p1) !== afterT.get(p1),
      `report.failed ${JSON.stringify(failRun.failed)}; ${acct2.split(' ')[1]} kept its card, ${acct1.split(' ')[1]} got a new one`);

    // 6b. An ended thesis leaves no card (and never falls back to an older one).
    const acct3 = accounts[2];
    const h3 = await prisma.prospectingHypothesis.findFirst({ where: { account_name: acct3 }, select: { id: true } });
    const ended = await transitionHypothesis(prisma, h3!.id, 'close_unresolved', { now: new Date(), actor: ACTOR, reason: 'dogfood: thesis ended' });
    const afterE = mine((await listQueue(prisma, { limit: 100 })).items);
    check('6 ended thesis', ended.ok && !afterE.some((i) => i.account.name === acct3), `close_unresolved -> ${ended.ok ? ended.to : JSON.stringify(ended)}; ${acct3.split(' ')[1]} has no current card`);

    // 5. Research proposal for C: one decision.
    const run = await prisma.researchRun.create({ data: { account_name: pepsi, persona_id: C.id, status: 'succeeded', provider_status: { outcome: 'evidence_found', problemFamily: 'hidden_capacity' } }, select: { id: true } });
    const ev = await prisma.evidenceRecord.create({
      data: { research_run_id: run.id, account_name: pepsi, persona_id: C.id, claim: `${pepsi} is consolidating two DCs into one.`, claim_hash: `${tag}-h`, source_url: 'https://example.com/10q', source_title: `${pepsi} 10-Q`, source_type: 'public_primary', provider: 'edgar', observed_at: now, deterministic_key: `${tag}-k` },
      select: { id: true },
    });
    await registerSignal(prisma, {
      accountName: pepsi, personaId: C.id, sourceKind: 'evidence_record', sourceId: ev.id, type: 'site_expansion', title: `${pepsi} 10-Q`,
      sourceType: 'public_primary', evidenceUrl: 'https://example.com/10q', evidenceText: `${pepsi} is consolidating two DCs into one.`, externalOk: true,
      observedAt: now, confidence: 80, freshnessExpiresAt: new Date(now.getTime() + 30 * 86_400_000), registeredBy: ACTOR,
    });
    const proposal = await proposeFromResearch(prisma, { researchRunId: run.id, actor: ACTOR, now });
    const decided = proposal.ok
      ? await decideResearchProposal(prisma, { researchRunId: run.id, hypothesisIds: proposal.hypothesisIds, decision: 'approve_and_use', actor: ACTOR, now }, {
          routeAfterUse: (p, input) => routeAfterUse(p, input, { run: (pp, o, d) => runRouting(pp, o, { ...d, suppression, hubspotSnapshot: tamIn }) }),
        })
      : null;
    const events = proposal.ok ? await prisma.hypothesisEvent.findMany({ where: { hypothesis_id: proposal.hypothesisId }, orderBy: { created_at: 'asc' }, select: { action: true, to_status: true } }) : [];
    const cCard = mine((await listQueue(prisma, { limit: 100 })).items).find((i) => i.persona.id === C.id);
    check('5 one decision', proposal.ok && decided !== null && 'results' in decided && decided.ok && events.map((e) => e.to_status).join('>') === 'draft>review_required>approved>active' && cCard?.hypothesis?.id === proposal.hypothesisId,
      `proposal ${proposal.ok ? proposal.hypothesisId : JSON.stringify(proposal)} narrative ${proposal.ok ? `"${proposal.narrative.problemHypothesis.slice(0, 50)}..."` : '-'}; events ${events.map((e) => `${e.action}:${e.to_status}`).join(', ')}; C card ${cCard?.ruleId} lane ${cCard ? sellerLaneOf(cCard) : '-'}`);

    const lanes: Record<string, number> = {};
    for (const i of mine((await listQueue(prisma, { limit: 100 })).items)) lanes[sellerLaneOf(i)] = (lanes[sellerLaneOf(i)] ?? 0) + 1;
    console.log(JSON.stringify({ tag, lanes, msRunA: msA, msApproveUseOne: msUse }));
  } finally {
    await prisma.$disconnect();
    stub.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(failed.length ? `FAILED ${failed.length}` : `ALL ${results.length} PASS`);
  process.exitCode = failed.length ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
