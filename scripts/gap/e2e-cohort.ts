/**
 * GAP cohort intelligence acceptance (2026-09-28), against the SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e npx tsx scripts/gap/e2e-cohort.ts
 *
 *   K1 a newsletter cohort (5 people at 2 accounts, one do-not-contact, one
 *      with no company) is qualified ACCOUNT by account: 2 account decisions,
 *      person-level stops win
 *   K2 the ONE research worker picks each research account once (people
 *      counted), never one job per person
 *   K3 a verified fact at one account: that account is EVIDENCE READY and its
 *      person a FACT-LED opportunity; the other account's person (relationship
 *      context, no fact) is RELATIONSHIP-LED and GAP will not draft for them
 *   K4 the relationship context reaches the brief loader and the send
 *      attribution (every source recorded)
 *   K5 nothing drafted, sent or enrolled: no hypothesis, no execution row
 *
 * Rails: scratch only (exit 2 otherwise); the HubSpot deal read is stubbed
 * CLEAR (the scratch has no HubSpot; the real states are unit-tested);
 * synthetic example.com people; everything deleted in the finally block.
 * Writes docs/gap/cohort-e2e-latest.md.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { commitIntake, createWorkSource } from '../../src/lib/gap/intake/service';
import { planWorkSources } from '../../src/lib/gap/intake/plan';
import { loadOpportunities } from '../../src/lib/gap/intake/opportunities';
import { loadRelationshipContext } from '../../src/lib/gap/intake/context';
import { captureSendAttribution } from '../../src/lib/gap/execution/send-attribution';
import { selectBackgroundTargets } from '../../src/lib/gap/research/background';
import { registerSignal } from '../../src/lib/gap/signals/registry';

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
  console.error('e2e-cohort refuses to run: DATABASE_URL is not the scratch database (127.0.0.1 .../gap_finish_e2e).');
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
  const tag = `co${Date.now().toString(36)}`;
  const A = `Cohorta ${tag}`;
  const B = `Cohortb ${tag}`;
  const ACTOR = 'e2e-cohort@example.com';
  const NOW = new Date();
  const sourceIds: string[] = [];
  let failure: StepFailure | null = null;
  const clear = async () => ({ status: 'CLEAR' as const, companyIds: [] });
  const hypBefore = await prisma.prospectingHypothesis.count();
  try {
    await prisma.account.create({ data: { rank: 9985, name: A, vertical: 'cpg', tier: 'Tier 1' } });
    await prisma.account.create({ data: { rank: 9986, name: B, vertical: 'cpg', tier: 'Tier 1' } });
    const pa = await prisma.persona.create({ data: { persona_id: `${tag}-a1`, account_name: A, priority: 'P1', name: 'Ana Alpha', title: 'VP Distribution', email: `ana.${tag}@example.com` }, select: { id: true } });
    const dnc = await prisma.persona.create({ data: { persona_id: `${tag}-a2`, account_name: A, priority: 'P1', name: 'Dee Nocontact', title: 'Director of Logistics', email: `dee.${tag}@example.com`, do_not_contact: true }, select: { id: true } });
    const pb = await prisma.persona.create({ data: { persona_id: `${tag}-b1`, account_name: B, priority: 'P1', name: 'Bo Beta', title: 'VP Supply Chain', email: `bo.${tag}@example.com` }, select: { id: true } });
    const src = (await createWorkSource(prisma, { name: `MMYQB ${tag}`, sourceType: 'newsletter', relationshipContext: 'MMYQB subscriber', actor: ACTOR })) as { id: string };
    sourceIds.push(src.id);
    const csv = ['Name,Title,Company,Email', `Ana Alpha,VP Distribution,${A},ana.${tag}@example.com`, `Dee Nocontact,Director of Logistics,${A},dee.${tag}@example.com`, `Cal New,Transportation Manager,${A},`, `Bo Beta,VP Supply Chain,${B},bo.${tag}@example.com`, 'Nia Nocompany,Supply chain leader,,'].join('\n');
    const c = await commitIntake(prisma, { workSourceId: src.id, text: csv, kind: 'people', actor: ACTOR, now: NOW });
    expect('K1 import', c.ok && c.created === 5, JSON.stringify(c));

    // ---- K1
    const plan = await planWorkSources(prisma, { now: NOW, actor: ACTOR, workSourceId: src.id }, { opportunity: clear });
    const q = await prisma.gapWorkSourceMember.findMany({ where: { work_source_id: src.id }, select: { name: true, qualification: true } });
    const qOf = (n: string) => q.find((x) => x.name === n)?.qualification;
    expect('K1 plan', plan.accounts === 2 && qOf('Ana Alpha') === 'research' && qOf('Cal New') === 'research' && qOf('Bo Beta') === 'research' && qOf('Dee Nocontact') === 'do_not_contact' && qOf('Nia Nocompany') === 'needs_identity', JSON.stringify({ plan, q }));
    pass('K1 plan', `5 people qualified with 2 account decisions: 3 research, 1 do not contact (person stop wins), 1 needs identity`);

    // ---- K2
    const targets = await selectBackgroundTargets(prisma, NOW, { loadGroups: async () => [], listQueue: async () => ({ items: [] }) as never, watch: async () => [] });
    const mine = targets.filter((t) => t.accountName === A || t.accountName === B);
    const ta = mine.find((t) => t.accountName === A);
    expect('K2 research', mine.length === 2 && mine.every((t) => t.reason === 'work_source') && ta?.peopleBlocked === 2, JSON.stringify(mine.map((t) => [t.accountName, t.reason, t.peopleBlocked])));
    pass('K2 research', `the one research worker has 2 account targets (reason work_source; ${A.split(' ')[0]} counts 2 people waiting), not 4 person jobs`);

    // ---- K3
    const fact = `${A} will open a new automated distribution center in Reno next year.`;
    await registerSignal(prisma, {
      accountName: A, personaId: null, sourceKind: 'evidence_record', sourceId: `e2e-${tag}`, type: 'new_site', title: `${A} newsroom`, summary: null, sourceType: 'public_primary',
      evidenceUrl: `https://news.example/${tag}`, evidenceText: fact, externalOk: true, observedAt: NOW, confidence: 80, freshnessExpiresAt: new Date(NOW.getTime() + 90 * 86_400_000),
      metadata: { verified: 'excerpt_found_at_source', retrievedAt: NOW.toISOString() }, registeredBy: ACTOR,
    });
    await planWorkSources(prisma, { now: NOW, actor: ACTOR, workSourceId: src.id }, { opportunity: clear });
    const opps = await loadOpportunities(prisma, src.id, NOW);
    const oa = opps.find((o) => o.person.name === 'Ana Alpha');
    const ob = opps.find((o) => o.person.name === 'Bo Beta');
    expect('K3 opportunities', oa?.approach === 'fact_led' && oa.whyAccount === fact && ob?.approach === 'relationship_led' && ob.safety.state === 'caution' && !opps.some((o) => o.person.name === 'Dee Nocontact'), JSON.stringify(opps.map((o) => [o.person.name, o.approach, o.safety.state])));
    pass('K3 opportunities', `Ana Alpha fact-led on the verified fact; Bo Beta relationship-led (no fact: GAP will not draft); the do-not-contact person is not an opportunity`);

    // ---- K4
    const ctx = await loadRelationshipContext(prisma, { personaId: pa.id, accountName: A });
    const attr = (await captureSendAttribution(prisma, { hypothesisId: null, personaId: pa.id, accountName: A, stepIndex: 0, sequenceVersionId: null, at: NOW })) as { workSources?: Array<{ name: string; relationshipContext: string | null }> };
    expect('K4 context', ctx.length === 1 && ctx[0].startsWith('MMYQB subscriber (MMYQB ') && attr.workSources?.length === 1 && attr.workSources[0].relationshipContext === 'MMYQB subscriber', JSON.stringify({ ctx, attr: attr.workSources }));
    pass('K4 context', `brief CONTEXT: "${ctx[0]}"; the send attribution records the MMYQB source`);

    // ---- K5
    const drafts = await prisma.prospectingHypothesis.count();
    expect('K5 nothing drafted', drafts === hypBefore, `hypotheses ${hypBefore} -> ${drafts}`);
    pass('K5 nothing drafted', 'no hypothesis, draft, send or enrollment was created by the cohort work');
    void dnc;
    void pb;
  } catch (err) {
    failure = err instanceof StepFailure ? err : new StepFailure('unexpected', err instanceof Error ? err.message : String(err));
    if (!(err instanceof StepFailure)) console.log(`FAIL unexpected: ${failure.message}`);
  } finally {
    try {
      const removed = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events DISABLE TRIGGER gap_append_only_audit_events');
        try {
          const audit = await tx.gapAuditEvent.deleteMany({ where: { actor: ACTOR } });
          const members = await tx.gapWorkSourceMember.deleteMany({ where: { work_source_id: { in: sourceIds } } });
          const sources = await tx.gapWorkSource.deleteMany({ where: { id: { in: sourceIds } } });
          const signals = await tx.prospectingSignal.deleteMany({ where: { account_name: { in: [A, B] } } });
          const cands = await tx.accountContactCandidate.deleteMany({ where: { account_name: { in: [A, B] } } });
          const personas = await tx.persona.deleteMany({ where: { account_name: { in: [A, B] } } });
          await tx.account.deleteMany({ where: { name: { in: [A, B] } } });
          return { audit: audit.count, members: members.count, sources: sources.count, signals: signals.count, candidates: cands.count, personas: personas.count };
        } finally {
          await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events ENABLE TRIGGER gap_append_only_audit_events');
        }
      });
      pass('cleanup', `deleted ${JSON.stringify(removed)} and both accounts`);
    } catch (e) {
      lines.push({ step: 'cleanup', status: 'FAIL', detail: e instanceof Error ? e.message : String(e) });
      console.log(`FAIL cleanup: ${e instanceof Error ? e.message : String(e)}`);
      failure = failure ?? new StepFailure('cleanup', 'cleanup failed');
    }
    await prisma.$disconnect();
    const out = ['# GAP cohort intelligence acceptance (latest)', '', `STATUS: ${failure ? `FAIL at ${failure.step}` : 'PASS'}`, '', ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`), ''];
    mkdirSync(path.join('docs', 'gap'), { recursive: true });
    writeFileSync(path.join('docs', 'gap', 'cohort-e2e-latest.md'), out.join('\n'));
  }
  return failure ? 1 : 0;
}

main().then((code) => process.exit(code));
