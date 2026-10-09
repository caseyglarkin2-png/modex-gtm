// @vitest-environment node
/**
 * C57 pass 2, finding 2 (C06): a persona-placed person at an account with two open deals is scoped to the deal the CRM
 * associates them with (the persona's contact id against the deals' contact ids first, then the contact lookup only
 * when more than one deal remains); the other deal's next step never rides the task. The one-deal case is unchanged
 * and the lookup is not called when it is not needed.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyDecision } from '@/lib/gap/work/decide';
import type { InDealsSummary } from '@/lib/gap/deals/in-deals';

const NOW = new Date('2026-10-09T15:00:00Z');
const ALEX = 'a.diaz@meridianfoods.example';
const summary = (): InDealsSummary => ({
  status: 'complete', count: 1, openDeals: 2, unresolved: [], checkedAt: NOW.toISOString(),
  accounts: [{ accountName: 'Meridian Foods', alsoRecordedAs: [], dealContacts: 1, people: [], known: 1, deals: [
    { id: '10', name: 'YardFlow - Meridian Dallas', stage: 'decisionmakerboughtin', lastActivityAt: null, closeDate: null, nextStep: 'IT review of the Dallas pilot', contactIds: ['c-alex'] },
    { id: '11', name: 'YardFlow - Meridian Atlanta', stage: 'qualifiedtobuy', lastActivityAt: null, closeDate: null, nextStep: 'Site walk in Atlanta', contactIds: [] },
  ] }],
} as unknown as InDealsSummary);

const world = (over: Record<string, unknown> = {}) => ledgerDb({
  accounts: ['Meridian Foods'],
  personas: [{ id: 1, email: ALEX, name: 'Alex Diaz', title: 'Director, Transportation', account_name: 'Meridian Foods', do_not_contact: false, hubspot_contact_id: 'c-alex', ...over }],
  inbound: [{ id: 'm-alex', thread_id: 't-alex', from_email: ALEX, from_name: 'Alex Diaz', subject: 'Re: Dallas', body_text: 'The Dallas yard pilot is approved on our side; what do you need from IT?', received_at: new Date('2026-09-25T14:00:00Z'), source: 'gmail', thread: { account_name: 'Meridian Foods' } }],
}, NOW);

const taskDeals = async (db: ReturnType<typeof world>, r: Awaited<ReturnType<typeof applyDecision>>) => {
  if (!r.ok || !r.angleTaskId) throw new Error('no task');
  const row = await db.client().gapAuditEvent.findFirst({ where: { subject_type: 'agent_task', subject_id: r.angleTaskId }, orderBy: { created_at: 'asc' } });
  return ((row?.payload as { input?: { deals?: Array<{ id: string }> } }).input?.deals ?? []).map((d) => d.id);
};

describe('C57 pass 2, finding 2: the deal scope of a persona-placed person', () => {
  it('two open deals, the persona carries the contact id: the task carries the Dallas deal only, and the contact lookup is not called', async () => {
    const db = world();
    const lookup = vi.fn(async () => ({ contactId: 'c-alex', email: ALEX, companyIds: [], dealIds: ['10'], name: 'Alex Diaz', title: null }));
    const r = await applyDecision(db.client(), { key: `person:${ALEX}`, decision: 'pursue', actor: 'casey', now: NOW, via: 'app' }, { contactLookup: lookup, identity: null, inDeals: async () => summary() });
    expect(await taskDeals(db, r)).toEqual(['10']);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('two open deals, no contact id on the persona: the contact lookup runs once and scopes to the deal the CRM associates; without a reader both deals ride and the scope is said unsettled by the angle', async () => {
    const db = world({ hubspot_contact_id: null });
    const lookup = vi.fn(async () => ({ contactId: 'c-alex', email: ALEX, companyIds: [], dealIds: ['10'], name: 'Alex Diaz', title: null }));
    const r = await applyDecision(db.client(), { key: `person:${ALEX}`, decision: 'pursue', actor: 'casey', now: NOW, via: 'app' }, { contactLookup: lookup, identity: null, inDeals: async () => summary() });
    expect(await taskDeals(db, r)).toEqual(['10']);
    expect(lookup).toHaveBeenCalledTimes(1);
    const db2 = world({ hubspot_contact_id: null });
    const r2 = await applyDecision(db2.client(), { key: `person:${ALEX}`, decision: 'pursue', actor: 'casey', now: NOW, via: 'app' }, { identity: null, inDeals: async () => summary() });
    expect(await taskDeals(db2, r2)).toEqual(['10', '11']);
  });
});
