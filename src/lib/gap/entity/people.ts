/**
 * ENTITY EXPANSION B3: an AMBIGUOUS person is Casey's call.
 *   existing        THIS IS EXISTING PERSON: the member points at that Persona (never a merge, never a new Persona)
 *   new_at_account  NEW PERSON AT THIS ACCOUNT: a staged AccountContactCandidate; promotion stays the human step
 *   wrong_company   WRONG COMPANY: unplaced
 *   leave           LEAVE UNRESOLVED: the ambiguity stays, GAP stops asking
 * Every answer is marked `casey_*` so a re-import or the planner never overwrites it (isIdentityImprovement).
 */
import { memberKey } from '../intake/resolve';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type PersonChoice = 'existing' | 'new_at_account' | 'wrong_company' | 'leave';

export async function resolvePersonMember(
  prisma: PrismaLike,
  input: { memberId: string; choice: PersonChoice; personaId?: number; accountName?: string; actor: string; now: Date },
): Promise<{ ok: true; resolution: string; accountName: string | null } | { ok: false; reason: string }> {
  const m = await prisma.gapWorkSourceMember.findUnique({ where: { id: input.memberId } });
  if (!m) return { ok: false, reason: 'member_not_found' };
  if (m.kind !== 'person') return { ok: false, reason: 'not_a_person' };
  let data: Record<string, unknown>;
  if (input.choice === 'existing') {
    const persona = typeof input.personaId === 'number' ? await prisma.persona.findUnique({ where: { id: input.personaId }, select: { id: true, account_name: true, name: true } }) : null;
    if (!persona) return { ok: false, reason: 'persona_not_found' };
    data = { resolution: 'resolved', resolution_basis: 'casey_existing_person', persona_id: persona.id, account_name: persona.account_name };
  } else if (input.choice === 'new_at_account') {
    const account = input.accountName ? await prisma.account.findUnique({ where: { name: input.accountName } }) : null;
    if (!account) return { ok: false, reason: 'account_not_found' };
    if (!m.name) return { ok: false, reason: 'name_required' };
    const { stageCandidate } = await import('../intake/service');
    const src = await prisma.gapWorkSource.findUnique({ where: { id: m.work_source_id }, select: { id: true, source_type: true } });
    const row = { kind: 'person' as const, raw: (m.raw && typeof m.raw === 'object' ? m.raw : {}) as Record<string, string>, name: m.name, ...(m.title ? { title: m.title } : {}), ...(m.company ? { company: m.company } : {}), ...(m.email ? { email: m.email } : {}), ...(m.linkedin_url ? { linkedinUrl: m.linkedin_url } : {}), ...(m.company_domain ? { companyDomain: m.company_domain } : {}) };
    const candidateId = await stageCandidate(prisma, { row, key: memberKey(row), resolved: { resolution: 'new_candidate', basis: 'casey_new_person', accountName: account.name, personaId: null, candidates: [] } }, { id: m.work_source_id, source_type: src?.source_type ?? 'other' });
    data = { resolution: 'new_candidate', resolution_basis: 'casey_new_person', persona_id: null, account_name: account.name, candidate_id: candidateId };
  } else if (input.choice === 'wrong_company') {
    data = { resolution: 'unresolved', resolution_basis: 'casey_wrong_company', persona_id: null, account_name: null };
  } else if (input.choice === 'leave') {
    data = { resolution_basis: 'casey_left_unresolved' };
  } else return { ok: false, reason: 'invalid_choice' };
  await prisma.gapWorkSourceMember.update({ where: { id: m.id }, data });
  await prisma.gapAuditEvent.create({ data: { kind: 'work_source.person_resolved', actor: input.actor, subject_type: 'work_source_member', subject_id: m.id, payload: { choice: input.choice, personaId: input.personaId ?? null, accountName: (data.account_name as string | null | undefined) ?? m.account_name ?? null, before: { resolution: m.resolution, basis: m.resolution_basis, accountName: m.account_name } } } });
  return { ok: true, resolution: (data.resolution as string) ?? m.resolution, accountName: (data.account_name as string | null | undefined) === undefined ? m.account_name : (data.account_name as string | null) };
}
