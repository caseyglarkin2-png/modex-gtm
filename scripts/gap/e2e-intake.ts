/**
 * GAP Universal Work Intake acceptance (2026-09-28), against the SCRATCH database.
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e npx tsx scripts/gap/e2e-intake.ts
 *
 *   W1 a newsletter source: PREVIEW writes nothing; COMMIT of a pasted
 *      subscriber list keeps what was supplied, stages the new person at a
 *      known account, and creates no Persona and no Account
 *   W2 re-import is idempotent
 *   W3 the database refuses a provenance rewrite (GAP_WORK_MEMBER_FROZEN) and a
 *      state outside the vocabulary (CHECK)
 *   W4 conference mode: the current source takes a person from the phone; the
 *      same person in two sources is two provenance edges on ONE Persona
 *   W5 an account list goes through the same model (no account-list path)
 *
 * Rails: scratch database only (exit 2 otherwise); synthetic example.com
 * people only; everything the run creates is deleted in the finally block.
 * Writes docs/gap/intake-e2e-latest.md (no secrets).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { addPerson, commitIntake, createWorkSource, previewIntake, setCurrentWorkSource } from '../../src/lib/gap/intake/service';
import { loadSource } from '../../src/lib/gap/intake/views';

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
  console.error('e2e-intake refuses to run: DATABASE_URL is not the scratch database (127.0.0.1 .../gap_finish_e2e).');
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
  const tag = `wi${Date.now().toString(36)}`;
  const ACC = `Intakeco ${tag}`;
  const ACTOR = 'e2e-intake@example.com';
  const NOW = new Date();
  const sourceIds: string[] = [];
  let failure: StepFailure | null = null;
  try {
    await prisma.account.create({ data: { rank: 9984, name: ACC, vertical: 'cpg', tier: 'Tier 1' } });
    const known = await prisma.persona.create({ data: { persona_id: `${tag}-known`, account_name: ACC, priority: 'P1', name: 'Known Person', title: 'VP Distribution', email: `known.${tag}@example.com` }, select: { id: true } });
    const personasBefore = await prisma.persona.count();
    const accountsBefore = await prisma.account.count();

    // ---- W1
    const src = await createWorkSource(prisma, { name: `MMYQB subscribers ${tag}`, sourceType: 'newsletter', relationshipContext: 'MMYQB subscriber', actor: ACTOR });
    expect('W1 source', src.ok, JSON.stringify(src));
    const srcId = (src as { id: string }).id;
    sourceIds.push(srcId);
    const paste = ['3 Subscribers', '', 'Known Person  ', '1st degree connection', '1st', '', `VP Distribution at ${ACC}`, '', 'Message', '', 'New Person  ', '2nd degree connection', '2nd', '', `Director of Transportation at ${ACC}`, '', 'Follow', '', 'Slogan Person  ', '1st degree connection', '1st', '', 'Dog Dad | Boat Captain', '', 'Message'].join('\n');
    const membersBefore = await prisma.gapWorkSourceMember.count();
    const pv = await previewIntake(prisma, { text: paste, kind: 'people' });
    expect('W1 preview', pv.counts.rows === 3 && pv.counts.resolved === 1 && pv.counts.new_candidate === 1 && pv.counts.unresolved === 1 && (await prisma.gapWorkSourceMember.count()) === membersBefore, `preview ${JSON.stringify(pv.counts)}`);
    pass('W1 preview', `3 subscribers read (${pv.parse.format}): 1 known, 1 new at a known account, 1 needs identity; nothing written`);
    const c1 = await commitIntake(prisma, { workSourceId: srcId, text: paste, kind: 'people', actor: ACTOR, now: NOW });
    expect('W1 commit', c1.ok && c1.created === 3 && c1.staged === 1, JSON.stringify(c1));
    const rows = await prisma.gapWorkSourceMember.findMany({ where: { work_source_id: srcId } });
    const knownRow = rows.find((r) => r.name === 'Known Person');
    const newRow = rows.find((r) => r.name === 'New Person');
    expect('W1 commit', knownRow?.persona_id === known.id && knownRow.relationship_context === 'MMYQB subscriber' && (knownRow.raw as { degree?: string }).degree === '1st', `known -> ${JSON.stringify(knownRow)}`);
    const cand = newRow?.candidate_id ? await prisma.accountContactCandidate.findUnique({ where: { id: newRow.candidate_id } }) : null;
    expect('W1 commit', !!cand && cand.state === 'staged' && cand.source === 'gap_work_source', `candidate -> ${JSON.stringify(cand)}`);
    expect('W1 commit', (await prisma.persona.count()) === personasBefore && (await prisma.account.count()) === accountsBefore, 'a Persona or Account was created');
    pass('W1 commit', `3 members with what was supplied (degree kept raw), the new person staged as candidate ${cand?.id}; Personas ${personasBefore} and Accounts ${accountsBefore} unchanged`);

    // ---- W2
    const c2 = await commitIntake(prisma, { workSourceId: srcId, text: paste, kind: 'people', actor: ACTOR, now: NOW });
    expect('W2 idempotent', c2.ok && c2.created === 0 && c2.existing === 3 && (await prisma.gapWorkSourceMember.count({ where: { work_source_id: srcId } })) === 3, JSON.stringify(c2));
    pass('W2 idempotent', 'the same paste again: 0 created, 3 already in the source');

    // ---- W3
    let frozen = '';
    try {
      await prisma.gapWorkSourceMember.update({ where: { id: knownRow!.id }, data: { company: 'Somewhere Else' } });
    } catch (e) {
      frozen = e instanceof Error ? e.message : String(e);
    }
    let checked = '';
    try {
      await prisma.gapWorkSourceMember.update({ where: { id: knownRow!.id }, data: { qualification: 'hot_lead' } });
    } catch (e) {
      checked = e instanceof Error ? e.message : String(e);
    }
    expect('W3 database', /GAP_WORK_MEMBER_FROZEN/.test(frozen) && /gap_ck_gap_work_source_members_qualification/.test(checked), `frozen=${frozen.slice(0, 80)} check=${checked.slice(0, 80)}`);
    pass('W3 database', 'rewriting supplied provenance refused (GAP_WORK_MEMBER_FROZEN); an invented qualification refused (CHECK)');

    // ---- W4
    const conf = await createWorkSource(prisma, { name: `Inland26 ${tag}`, sourceType: 'conference', relationshipContext: 'Met at Inland26', actor: ACTOR });
    const confId = (conf as { id: string }).id;
    sourceIds.push(confId);
    await setCurrentWorkSource(prisma, { workSourceId: confId, actor: ACTOR, now: new Date(NOW.getTime() + 1000) });
    const added = await addPerson(prisma, { name: 'Known Person', company: ACC, note: 'Asked about trailer staging at the new DC', actor: ACTOR, now: NOW });
    expect('W4 conference', added.ok && added.workSourceId === confId && added.resolution === 'resolved' && added.buyerWords === true, JSON.stringify(added));
    const edges = await prisma.gapWorkSourceMember.findMany({ where: { persona_id: known.id } });
    const view = await loadSource(prisma, confId);
    expect('W4 conference', edges.length === 2 && new Set(edges.map((e) => e.work_source_id)).size === 2 && view!.members[0].alsoFrom.includes(`MMYQB subscribers ${tag}`), `edges=${edges.length} alsoFrom=${JSON.stringify(view?.members[0].alsoFrom)}`);
    pass('W4 conference', 'a person added on the phone lands in the current conference source; the same Persona now has two provenance edges (MMYQB + Inland26), shown as "also from"; the note offers Buyer Truth Capture');

    // ---- W5
    const list = await createWorkSource(prisma, { name: `Target accounts ${tag}`, sourceType: 'target_list', actor: ACTOR });
    const listId = (list as { id: string }).id;
    sourceIds.push(listId);
    const c5 = await commitIntake(prisma, { workSourceId: listId, text: `Company\n${ACC}\nNowhere Unknown ${tag}`, kind: 'accounts', actor: ACTOR, now: NOW });
    const acctRows = await prisma.gapWorkSourceMember.findMany({ where: { work_source_id: listId }, orderBy: { name: 'asc' } });
    expect('W5 accounts', c5.ok && acctRows.length === 2 && acctRows.some((r) => r.resolution === 'resolved' && r.account_name === ACC) && acctRows.some((r) => r.resolution === 'unresolved' && r.account_name === null) && (await prisma.account.count()) === accountsBefore, JSON.stringify(acctRows.map((r) => [r.company, r.resolution])));
    pass('W5 accounts', 'an account list uses the same source + member model: 1 resolved, 1 unknown (no Account created)');

    // ---- W6 intake never blocks CRM hygiene: a Persona merged away by dedup can still be deleted.
    await prisma.persona.delete({ where: { id: known.id } });
    const orphaned = await prisma.gapWorkSourceMember.findMany({ where: { id: { in: edges.map((e) => e.id) } } });
    expect('W6 dedup', orphaned.length === 2 && orphaned.every((m) => m.persona_id === null && m.name === 'Known Person'), JSON.stringify(orphaned.map((m) => [m.persona_id, m.name])));
    pass('W6 dedup', 'deleting a Persona two sources point at succeeds; the members keep what was supplied and lose only the derived link');
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
          const people = await tx.gapWorkSource.deleteMany({ where: { created_by: ACTOR } });
          const cands = await tx.accountContactCandidate.deleteMany({ where: { account_name: ACC } });
          const personas = await tx.persona.deleteMany({ where: { account_name: ACC } });
          await tx.account.deleteMany({ where: { name: ACC } });
          return { audit: audit.count, members: members.count, sources: sources.count + people.count, candidates: cands.count, personas: personas.count };
        } finally {
          await tx.$executeRawUnsafe('ALTER TABLE gap_audit_events ENABLE TRIGGER gap_append_only_audit_events');
        }
      });
      pass('cleanup', `deleted ${JSON.stringify(removed)} and the account`);
    } catch (e) {
      lines.push({ step: 'cleanup', status: 'FAIL', detail: e instanceof Error ? e.message : String(e) });
      console.log(`FAIL cleanup: ${e instanceof Error ? e.message : String(e)}`);
      failure = failure ?? new StepFailure('cleanup', 'cleanup failed');
    }
    await prisma.$disconnect();
    const out = ['# GAP universal work intake acceptance (latest)', '', `STATUS: ${failure ? `FAIL at ${failure.step}` : 'PASS'}`, '', ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`), ''];
    mkdirSync(path.join('docs', 'gap'), { recursive: true });
    writeFileSync(path.join('docs', 'gap', 'intake-e2e-latest.md'), out.join('\n'));
  }
  return failure ? 1 : 0;
}

main().then((code) => process.exit(code));
