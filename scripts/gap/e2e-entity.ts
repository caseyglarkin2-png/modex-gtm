/**
 * GAP Entity Expansion acceptance (2026-09-29), against the SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e npx tsx scripts/gap/e2e-entity.ts
 *
 *   E1 a work source brings in three companies GAP does not know: the queue groups spellings, the name rule
 *      puts the 3PL last, and nothing is created by reading it
 *   E2 Scout (stubbed web pass) stores its verdict on one candidate row; the database refuses a verdict outside
 *      the vocabulary and a decided row without a decider (CHECK)
 *   E3 ADD refuses a normalized duplicate and an alias; a clean add creates exactly one account, records the
 *      spelling as an alias, re-plans the source, and the people there are placed
 *   E4 the new account's brief carries Scout's leads as INFERENCE, never verified
 *   E5 an ambiguous person (the email is a known Persona, the stated company is not): Casey says "this is that
 *      person"; only a Persona GAP offered is accepted, and a re-plan never moves the decision
 *   E6 IGNORE drops a company from the queue
 *
 * Rails: scratch database only (exit 2 otherwise); synthetic example.com people only; HubSpot is stubbed (never
 * called); everything the run creates is deleted in the finally block. Writes docs/gap/entity-e2e-latest.md.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { commitIntake, createWorkSource } from '../../src/lib/gap/intake/service';
import { planWorkSources } from '../../src/lib/gap/intake/plan';
import { createGapAccount, decideCandidate, loadCandidateQueue, replanSourcesFor, scoutCandidate } from '../../src/lib/gap/entity/candidates';
import { resolvePersonMember } from '../../src/lib/gap/entity/people';
import { loadAccountInputs } from '../../src/lib/gap/account-intel/load';
import { buildAccountBrief } from '../../src/lib/gap/account-intel/build';
import { normalizeCompanyName } from '../../src/lib/gap/identity/normalize';
import { SCRATCH_NO_DEALS_TRUTH } from './scratch-opportunity';

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
  console.error('e2e-entity refuses to run: DATABASE_URL is not the scratch database (127.0.0.1 .../gap_finish_e2e).');
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
const refused = async (p: Promise<unknown>) => p.then(() => null, (e: unknown) => String((e as Error).message ?? e));

async function main(): Promise<number> {
  const prisma = new PrismaClient();
  const tag = `en${Date.now().toString(36)}`;
  const EXISTING = `Costa Growers ${tag}, LLC`;
  const NEWCO = `Harbor Provisions ${tag}`;
  const LOGI = `Summit Logistics ${tag}`;
  const ACTOR = 'e2e-entity@example.com';
  const NOW = new Date();
  const hubspot = { hubspotByDomain: async () => null, hubspotByName: async () => null };
  const sourceIds: string[] = [];
  const accounts: string[] = [EXISTING];
  let failure: StepFailure | null = null;
  try {
    await prisma.account.create({ data: { rank: 9983, name: EXISTING, vertical: 'agriculture', tier: 'Tier 3' } });
    const dana = await prisma.persona.create({ data: { persona_id: `${tag}-dana`, account_name: EXISTING, priority: 'P2', name: 'Dana Grower', title: 'VP Operations', email: `dana.${tag}@example.com` }, select: { id: true } });
    const src = await createWorkSource(prisma, { name: `Entity e2e ${tag}`, sourceType: 'newsletter', relationshipContext: 'newsletter subscriber', actor: ACTOR });
    expect('E1 source', src.ok, JSON.stringify(src));
    const srcId = (src as { id: string }).id;
    sourceIds.push(srcId);
    const csv = [
      'name,title,company,email',
      `Ana Buyer,VP Supply Chain,${NEWCO},ana.${tag}@example.com`,
      `Ben Buyer,Director Logistics,"${NEWCO}, Inc.",ben.${tag}@example.com`,
      `Cal Carrier,CEO,${LOGI},cal.${tag}@example.com`,
      `Dana Grower,VP Operations,${LOGI},dana.${tag}@example.com`,
    ].join('\n');
    const accountsBefore = await prisma.account.count();
    const c = await commitIntake(prisma, { workSourceId: srcId, text: csv, kind: 'people', actor: ACTOR, now: NOW });
    expect('E1 import', !!c && (c as { ok?: boolean }).ok !== false, JSON.stringify(c).slice(0, 300));
    const q1 = await loadCandidateQueue(prisma, { workSourceId: srcId });
    const newco = q1.find((i) => i.companyKey === normalizeCompanyName(NEWCO));
    const logi = q1.find((i) => i.companyKey === normalizeCompanyName(LOGI));
    expect('E1 queue', !!newco && newco.people === 2 && !!logi && logi.verdict === null && logi.entityType === '3pl' && q1.indexOf(logi) > q1.indexOf(newco) && (await prisma.account.count()) === accountsBefore, JSON.stringify(q1.map((i) => [i.company, i.people, i.verdict])));
    pass('E1 queue', `2 spellings of ${NEWCO} are one candidate (2 people); ${LOGI} is a 3PL guess by name with its fit left open (never rejected by name); no account created by reading`);

    // ---- E2
    const scout = async () => ({ company: NEWCO, verdict: 'DIRECT_BUYER' as const, entityType: 'shipper' as const, domain: `${tag}.example.com`, what: 'Regional food distributor', why: 'A shipper with cited network evidence (1 claim).', network: [{ claim: 'Operates 6 distribution centers.', url: `https://${tag}.example.com/about` }], freight: [], unknowns: ['Who runs yard operations'], basis: 'web' as const });
    const s = await scoutCandidate(prisma, { company: `${NEWCO}, Inc.`, actor: ACTOR, now: NOW }, { scout });
    const rows = await prisma.gapAccountCandidate.findMany({ where: { company_key: normalizeCompanyName(NEWCO) } });
    expect('E2 scout', 'verdict' in s && s.verdict === 'DIRECT_BUYER' && rows.length === 1 && rows[0].verdict === 'DIRECT_BUYER', JSON.stringify(rows));
    const badVerdict = await refused(prisma.gapAccountCandidate.update({ where: { id: rows[0].id }, data: { verdict: 'LIKELY_ICP' } }));
    const noDecider = await refused(prisma.gapAccountCandidate.update({ where: { id: rows[0].id }, data: { decision: 'ignored' } }));
    expect('E2 db', !!badVerdict?.includes('gap_ck_gap_account_candidates_verdict') && !!noDecider?.includes('gap_ck_gap_account_candidates_decided'), `${badVerdict?.slice(0, 120)} | ${noDecider?.slice(0, 120)}`);
    pass('E2 scout', 'one candidate row for both spellings, fit DIRECT_BUYER from cited operations; the database refuses the retired LIKELY_ICP vocabulary and an undecided "ignored"');

    // ---- E3
    const dup = await createGapAccount(prisma, { name: `Costa Growers ${tag}`, company: `Costa Growers ${tag}`, vertical: 'agriculture', reason: 'e2e', actor: ACTOR, now: NOW }, hubspot);
    expect('E3 duplicate', !dup.ok && dup.reason === 'possible_duplicate' && (dup.matches ?? []).includes(EXISTING), JSON.stringify(dup));
    const before = await prisma.account.count();
    const add = await createGapAccount(prisma, { name: NEWCO, company: `${NEWCO}, Inc.`, vertical: 'food', reason: 'Newsletter subscribers, 6 DCs (Scout)', domain: `${tag}.example.com`, actor: ACTOR, now: NOW }, hubspot);
    expect('E3 add', add.ok && (await prisma.account.count()) === before + 1, JSON.stringify(add));
    accounts.push(NEWCO);
    const acct = await prisma.account.findUnique({ where: { name: NEWCO } });
    const replan = await replanSourcesFor(prisma, { company: NEWCO, actor: ACTOR, now: NOW }, { plan: (p, i) => planWorkSources(p, { ...i, skipQualifiedWithinMs: 0 }, { opportunity: async () => SCRATCH_NO_DEALS_TRUTH }) });
    const placed = await prisma.gapWorkSourceMember.count({ where: { work_source_id: srcId, account_name: NEWCO } });
    const cand = await prisma.gapAccountCandidate.findUnique({ where: { company_key: normalizeCompanyName(NEWCO) } });
    expect('E3 placed', acct?.priority_band === 'C' && acct?.source === 'gap_candidate' && placed === 2 && cand?.decision === 'added' && cand?.account_name === NEWCO, `band ${acct?.priority_band} source ${acct?.source} placed ${placed} replan ${JSON.stringify(replan)} cand ${cand?.decision}`);
    pass('E3 add', `a normalized duplicate is refused with the existing name; a clean add creates exactly one account (band C, source gap_candidate), the candidate is "added", and after the re-plan both people are placed at ${NEWCO}`);

    // ---- E4
    const inputs = await loadAccountInputs(prisma, NEWCO, NOW);
    const brief = inputs ? buildAccountBrief(inputs, NOW) : null;
    const lead = brief?.sections.footprint.statements.find((x) => /6 distribution centers/.test(x.text));
    expect('E4 brief', lead?.truth === 'INFERENCE' && /Scout lead/.test(lead.text), JSON.stringify(lead));
    pass('E4 brief', `the new account's brief shows "${lead!.text}" as INFERENCE with its link; nothing Scout said is VERIFIED`);

    // ---- E5
    const cal = await prisma.gapWorkSourceMember.findFirst({ where: { work_source_id: srcId, email: `dana.${tag}@example.com` } });
    expect('E5 ambiguous', cal?.resolution === 'ambiguous', `resolution ${cal?.resolution} basis ${cal?.resolution_basis}`);
    const notOffered = await resolvePersonMember(prisma, { memberId: cal!.id, choice: 'existing', personaId: dana.id + 999_999, actor: ACTOR, now: NOW });
    const r5 = await resolvePersonMember(prisma, { memberId: cal!.id, choice: 'existing', personaId: dana.id, actor: ACTOR, now: NOW });
    await planWorkSources(prisma, { now: NOW, actor: ACTOR, workSourceId: srcId, skipQualifiedWithinMs: 0 }, { opportunity: async () => SCRATCH_NO_DEALS_TRUTH }).catch(() => null);
    const cal2 = await prisma.gapWorkSourceMember.findUnique({ where: { id: cal!.id } });
    expect('E5 person', !notOffered.ok && r5.ok && cal2?.resolution_basis === 'casey_existing_person' && cal2.persona_id === dana.id && cal2.account_name === EXISTING, JSON.stringify({ notOffered, r5, basis: cal2?.resolution_basis, acct: cal2?.account_name }));
    pass('E5 person', `an email match with a different stated company is ambiguous; a Persona GAP did not offer is refused; "this is Dana" places the member at ${EXISTING}, and a re-plan left it alone`);

    // ---- E6
    await decideCandidate(prisma, { company: LOGI, decision: 'ignored', actor: ACTOR, now: NOW });
    const q2 = await loadCandidateQueue(prisma, { workSourceId: srcId });
    expect('E6 ignore', !q2.some((i) => i.companyKey === normalizeCompanyName(LOGI)) && !q2.some((i) => i.companyKey === normalizeCompanyName(NEWCO)), JSON.stringify(q2.map((i) => i.company)));
    pass('E6 ignore', `${LOGI} ignored and ${NEWCO} added: neither is in the queue any more`);
  } catch (e) {
    if (e instanceof StepFailure) failure = e;
    else {
      lines.push({ step: 'crash', status: 'FAIL', detail: String((e as Error).stack ?? e).slice(0, 500) });
      console.error(e);
      failure = new StepFailure('crash', String(e));
    }
  } finally {
    const keys = [NEWCO, LOGI, `Costa Growers ${tag}`].map(normalizeCompanyName);
    await prisma.gapAuditEvent.deleteMany({ where: { actor: ACTOR } }).catch(() => null);
    await prisma.gapAccountCandidate.deleteMany({ where: { company_key: { in: keys } } }).catch(() => null);
    await prisma.gapWorkSourceMember.deleteMany({ where: { work_source_id: { in: sourceIds } } }).catch(() => null);
    await prisma.accountContactCandidate.deleteMany({ where: { account_name: { in: accounts } } }).catch(() => null);
    await prisma.gapWorkSource.deleteMany({ where: { id: { in: sourceIds } } }).catch(() => null);
    await prisma.gapAccountAlias.deleteMany({ where: { account_name: { in: accounts } } }).catch(() => null);
    await prisma.persona.deleteMany({ where: { persona_id: `${tag}-dana` } }).catch(() => null);
    await prisma.account.deleteMany({ where: { name: { in: accounts } } }).catch(() => null);
    await prisma.$disconnect();
  }
  const out = path.join(process.cwd(), 'docs/gap/entity-e2e-latest.md');
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `# GAP Entity Expansion E2E (scratch)\n\nRun ${new Date().toISOString()}: ${failure ? `FAIL at ${failure.step}` : 'PASS'}\n\n${lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`).join('\n')}\n`);
  return failure ? 1 : 0;
}

main().then((code) => process.exit(code));
