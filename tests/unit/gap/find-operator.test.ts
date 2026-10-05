/**
 * FIND OPERATOR (owner resolution, 2026-10-05): research stages only new, source-backed DIRECT operators as
 * candidates; a known person is never re-staged; a row on record is never overwritten; nothing becomes a Persona.
 */
import { describe, expect, it, vi } from 'vitest';
import { findOperator } from '@/lib/gap/people/find-operator';
import type { ResearchedContact } from '@/lib/discovery/research';

const NOW = new Date('2026-10-05T16:00:00Z');
const person = (name: string, title: string, over: Partial<ResearchedContact> = {}): ResearchedContact => ({ name, firstName: name.split(' ')[0], lastName: name.split(' ')[1] ?? '', title, scope: 'corporate', slot: 'DIRECT_OPERATOR', lane: 'PRIMARY_OPERATOR', sourceUrl: 'https://www.heb.com/leadership', ...over });

function db(existing: string[] = []) {
  const created: any[] = [];
  const prisma = {
    accountContactCandidate: {
      findUnique: vi.fn(async ({ where }: any) => (existing.includes(where.account_name_candidate_key.candidate_key) ? { id: 1, state: 'deferred' } : null)),
      create: vi.fn(async ({ data }: any) => { created.push(data); return { id: 100 + created.length }; }),
    },
    persona: { create: vi.fn(async () => { throw new Error('never a persona'); }) },
  };
  return { prisma, created };
}

describe('findOperator', () => {
  it('stages new source-backed direct operators as unrecommended candidates; known people and other slots are not staged', async () => {
    const { prisma, created } = db();
    const research = vi.fn(async () => [person('Jose Huerta', 'Director of Transportation'), person('New Person', 'Director of Transportation'), person('Spon Sor', 'VP Supply Chain', { slot: 'EXECUTIVE_SPONSOR', lane: 'ADJACENT_OPERATOR' }), person('No Source', 'Director of Logistics', { sourceUrl: undefined })]);
    const r = await findOperator(prisma, { accountName: 'H-E-B', known: ['Jose Huerta'], actor: 'casey', now: NOW }, { research });
    expect(research).toHaveBeenCalledWith('H-E-B');
    expect(r.staged.map((s) => s.name)).toEqual(['New Person']);
    expect(created[0]).toMatchObject({ account_name: 'H-E-B', full_name: 'New Person', state: 'staged', recommended: false, source: 'web_research', source_action: 'owner_resolution_find_operator', email: null });
    expect(r.note).toMatch(/1 direct-operator candidate staged for your review/);
    expect(prisma.persona.create).not.toHaveBeenCalled();
  });
  it('a row already on record is reported, never overwritten; no finds is said plainly', async () => {
    const { prisma, created } = db(['new person::director of transportation']);
    const r = await findOperator(prisma, { accountName: 'H-E-B', known: [], actor: 'casey', now: NOW }, { research: async () => [person('New Person', 'Director of Transportation')] });
    expect(r.staged).toEqual([]);
    expect(r.alreadyOnRecord).toEqual(['New Person (deferred)']);
    expect(created).toEqual([]);
    const none = await findOperator(prisma, { accountName: 'H-E-B', known: [], actor: 'casey', now: NOW }, { research: async () => [] });
    expect(none.note).toMatch(/found nobody source-backed/);
  });
});
