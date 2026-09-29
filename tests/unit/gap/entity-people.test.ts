/**
 * Release B3: an AMBIGUOUS person is Casey's call, in four answers:
 *   THIS IS EXISTING PERSON      the member points at that Persona (no merge, no new Persona)
 *   NEW PERSON AT THIS ACCOUNT   a staged AccountContactCandidate (promotion stays the human step)
 *   WRONG COMPANY                unplaced, and the planner never puts them back
 *   LEAVE UNRESOLVED             recorded; stops asking
 * GAP never auto-merges a person, and a Casey decision is never overwritten by a re-import or the planner.
 */
import { describe, expect, it } from 'vitest';
import { resolvePersonMember } from '@/lib/gap/entity/people';
import { isIdentityImprovement } from '@/lib/gap/intake/service';

type Rec = Record<string, unknown>;
const NOW = new Date('2026-09-29T15:00:00.000Z');
function fake(member: Rec) {
  const m = { id: 'm1', kind: 'person', name: 'Dana Ops', title: 'VP Distribution', company: 'Harbor Foods', email: null, linkedin_url: null, company_domain: null, raw: {}, work_source_id: 's1', resolution: 'ambiguous', resolution_basis: 'name_multiple', resolution_candidates: [{ personaId: 7, accountName: 'Harbor Foods', why: 'same name' }, { personaId: 8, accountName: 'Harbor Foods', why: 'same name' }], account_name: 'Harbor Foods', persona_id: null, candidate_id: null, status: 'active', ...member };
  const audits: Rec[] = [];
  const staged: Rec[] = [];
  const p = {
    m,
    audits,
    staged,
    gapWorkSourceMember: {
      findUnique: async () => m,
      update: async ({ data }: { data: Rec }) => Object.assign(m, data),
    },
    persona: { findUnique: async ({ where }: { where: { id: number } }) => (where.id === 7 || where.id === 9 ? { id: where.id, account_name: where.id === 9 ? 'Other Co' : 'Harbor Foods', name: 'Dana Ops' } : null) },
    account: { findUnique: async ({ where }: { where: { name: string } }) => (['Harbor Foods', 'Harbor Foods Group'].includes(where.name) ? { name: where.name } : null) },
    gapWorkSource: { findUnique: async () => ({ id: 's1', source_type: 'newsletter' }) },
    deferred: [] as Rec[],
    accountContactCandidate: {
      upsert: async ({ create }: { create: Rec }) => (staged.push(create), { id: 55 }),
      update: async ({ where, data }: { where: { id: number }; data: Rec }) => (p.deferred.push({ id: where.id, state: data.state }), {}),
    },
    gapAuditEvent: { create: async ({ data }: { data: Rec }) => (audits.push(data), data) },
  };
  return p;
}
const actor = 'casey@freightroll.com';

describe('resolving an ambiguous person', () => {
  it('THIS IS EXISTING PERSON points the member at that Persona and says Casey decided', async () => {
    const p = fake({});
    expect(await resolvePersonMember(p, { memberId: 'm1', choice: 'existing', personaId: 7, actor, now: NOW })).toMatchObject({ ok: true });
    expect(p.m).toMatchObject({ resolution: 'resolved', persona_id: 7, account_name: 'Harbor Foods', resolution_basis: 'casey_existing_person' });
    expect(p.audits[0]).toMatchObject({ kind: 'work_source.person_resolved', actor });
  });

  it('refuses a Persona GAP did not offer (never an arbitrary id), and a member that is not ambiguous', async () => {
    expect(await resolvePersonMember(fake({}), { memberId: 'm1', choice: 'existing', personaId: 9, actor, now: NOW })).toMatchObject({ ok: false, reason: 'persona_not_offered' });
    expect(await resolvePersonMember(fake({ resolution: 'resolved' }), { memberId: 'm1', choice: 'leave', actor, now: NOW })).toMatchObject({ ok: false, reason: 'not_ambiguous' });
  });

  it('WRONG COMPANY defers a candidate staged at that account, so it can never be promoted there', async () => {
    const p = fake({ candidate_id: 55 });
    await resolvePersonMember(p, { memberId: 'm1', choice: 'wrong_company', actor, now: NOW });
    expect(p.deferred).toEqual([{ id: 55, state: 'deferred' }]);
  });

  it('NEW PERSON AT THIS ACCOUNT stages a candidate (never a Persona) at an account that exists', async () => {
    const p = fake({});
    expect(await resolvePersonMember(p, { memberId: 'm1', choice: 'new_at_account', accountName: 'Nowhere Inc', actor, now: NOW })).toMatchObject({ ok: false, reason: 'account_not_found' });
    expect(await resolvePersonMember(p, { memberId: 'm1', choice: 'new_at_account', accountName: 'Harbor Foods Group', actor, now: NOW })).toMatchObject({ ok: true });
    expect(p.staged[0]).toMatchObject({ account_name: 'Harbor Foods Group', full_name: 'Dana Ops', state: 'staged' });
    expect(p.m).toMatchObject({ resolution: 'new_candidate', account_name: 'Harbor Foods Group', candidate_id: 55, persona_id: null, resolution_basis: 'casey_new_person' });
  });

  it('WRONG COMPANY unplaces the person; LEAVE UNRESOLVED keeps the ambiguity and stops asking', async () => {
    const p = fake({});
    await resolvePersonMember(p, { memberId: 'm1', choice: 'wrong_company', actor, now: NOW });
    expect(p.m).toMatchObject({ resolution: 'unresolved', account_name: null, persona_id: null, resolution_basis: 'casey_wrong_company' });
    const q = fake({});
    await resolvePersonMember(q, { memberId: 'm1', choice: 'leave', actor, now: NOW });
    expect(q.m).toMatchObject({ resolution: 'ambiguous', resolution_basis: 'casey_left_unresolved' });
  });

  it('only a person member can be resolved this way', async () => {
    expect(await resolvePersonMember(fake({ kind: 'account' }), { memberId: 'm1', choice: 'leave', actor, now: NOW })).toMatchObject({ ok: false, reason: 'not_a_person' });
  });
});

describe('a Casey decision is never overwritten', () => {
  it('re-resolution never moves a member Casey placed or unplaced', () => {
    expect(isIdentityImprovement({ resolution: 'unresolved', account_name: null, resolution_basis: 'casey_wrong_company' }, { resolution: 'resolved', accountName: 'Harbor Foods' })).toBe(false);
    expect(isIdentityImprovement({ resolution: 'unresolved', account_name: null, resolution_basis: 'company_not_in_gap' }, { resolution: 'resolved', accountName: 'Harbor Foods' })).toBe(true);
  });
});
