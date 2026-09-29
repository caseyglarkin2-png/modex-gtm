/**
 * Release K: CORPORATE FAMILY. PepsiCo and Frito-Lay are related, never merged: separate intelligence, separate
 * buyer truth. But a cold motion on one looks at the other: a live deal, a conversation, a first touch in motion,
 * an untriaged reply or a live enrollment there is RELATED ACCOUNT ACTIVITY and holds, until Casey records an
 * audited separate buying motion (which expires and covers only the accounts it names).
 */
import { describe, expect, it } from 'vitest';
import { loadCorporateFamily, loadRelatedActivity, loadSeparateMotion, recordSeparateMotion, relatedHold, sameCompany } from '@/lib/gap/family/family';

const NOW = new Date('2026-09-29T12:00:00Z');
type Acct = { name: string; parent_brand: string | null; hubspot_company_id: string | null };
function fake(accounts: Acct[]) {
  const audits: Array<Record<string, unknown>> = [];
  return {
    audits,
    account: {
      findUnique: async ({ where }: { where: { name: string } }) => accounts.find((a) => a.name === where.name) ?? null,
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        if ('parent_brand' in where) return accounts.filter((a) => a.parent_brand);
        if ('name' in where) return accounts.filter((a) => a.name.toLowerCase().startsWith(String((where.name as { startsWith: string }).startsWith).toLowerCase()));
        if ('hubspot_company_id' in where) return accounts.filter((a) => a.hubspot_company_id && ((where.hubspot_company_id as { in: string[] }).in).includes(a.hubspot_company_id));
        return [];
      },
    },
    gapAuditEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => (audits.push({ ...data, created_at: NOW }), data),
      findFirst: async ({ where }: { where: { kind: string; subject_id: string } }) => [...audits].reverse().find((a) => a.kind === where.kind && a.subject_id === where.subject_id) ?? null,
    },
    conversationDisposition: { findMany: async () => [] },
    routingDecision: { findMany: async () => [] },
    gapAuditEventList: [],
    sequenceEnrollment: { findMany: async () => [] },
    persona: { findMany: async () => [] },
  };
}
const book: Acct[] = [
  { name: 'PepsiCo', parent_brand: null, hubspot_company_id: '111' },
  { name: 'Frito-Lay', parent_brand: 'PepsiCo', hubspot_company_id: null },
  { name: 'Quaker Foods', parent_brand: 'PepsiCo', hubspot_company_id: null },
  { name: 'Kenco Logistics Services', parent_brand: 'Kenco', hubspot_company_id: null },
  { name: 'Gatorade', parent_brand: null, hubspot_company_id: '222' },
];

describe('the family is derived, never a merge', () => {
  it('Frito-Lay: parent PepsiCo, sibling Quaker Foods; PepsiCo: two subsidiaries', async () => {
    const f = await loadCorporateFamily(fake(book), 'Frito-Lay');
    expect(f.parentName).toBe('PepsiCo');
    expect(f.members).toEqual([{ accountName: 'PepsiCo', relation: 'parent', source: 'parent_brand' }, { accountName: 'Quaker Foods', relation: 'sibling', source: 'parent_brand' }]);
    expect((await loadCorporateFamily(fake(book), 'PepsiCo')).members.map((m) => [m.accountName, m.relation])).toEqual([['Frito-Lay', 'subsidiary'], ['Quaker Foods', 'subsidiary']]);
  });
  it('a spelling of the same company is identity, not family', async () => {
    expect(sameCompany('Kenco Logistics Services', 'Kenco')).toBe(true);
    expect(sameCompany('JM Smucker', 'The J.M. Smucker Company')).toBe(true);
    expect(sameCompany('Frito-Lay', 'PepsiCo')).toBe(false);
    // review K: a different company that starts with the parent's name is family, not identity
    expect(sameCompany('Coca-Cola Bottling Co', 'Coca-Cola')).toBe(false);
    expect(sameCompany('Nestle Purina', 'Nestle')).toBe(false);
    expect(sameCompany('Kraft Heinz', 'Kraft')).toBe(false);
    expect((await loadCorporateFamily(fake(book), 'Kenco Logistics Services')).members).toEqual([]);
  });
  it('a parent recorded with a legal suffix still finds the parent account (normalized)', async () => {
    const f = await loadCorporateFamily(fake([...book, { name: 'Tostitos Co', parent_brand: 'PepsiCo, Inc.', hubspot_company_id: null }]), 'Tostitos Co');
    expect(f.members.find((m) => m.relation === 'parent')?.accountName).toBe('PepsiCo');
  });
  it('HubSpot unreadable is said (the action-time hold fails closed)', async () => {
    const f = await loadCorporateFamily(fake(book), 'Gatorade', { hubspot: async () => 'unreadable' });
    expect(f.hubspotUnreadable).toBe(true);
  });
  it('a HubSpot parent company link adds the relation', async () => {
    const f = await loadCorporateFamily(fake(book), 'Gatorade', { hubspot: async () => ({ parentId: '111', childIds: [] }) });
    expect(f.members).toEqual([{ accountName: 'PepsiCo', relation: 'parent', source: 'hubspot' }]);
  });
});

describe('related account activity holds a cold motion', () => {
  const family = { accountName: 'Frito-Lay', parentName: 'PepsiCo', members: [{ accountName: 'PepsiCo', relation: 'parent' as const, source: 'parent_brand' as const }] };
  it('an active PepsiCo opportunity is RELATED ACCOUNT ACTIVITY on Frito-Lay, in words', async () => {
    const activity = await loadRelatedActivity(fake(book), family, NOW, { opportunity: async () => ({ status: 'ACTIVE', deals: [{ name: 'YardFlow - PepsiCo', stage: 'discovery' }] }) });
    const h = relatedHold(family, activity, null);
    expect(h?.detail).toBe('Related account activity. Frito-Lay is part of PepsiCo in GAP. PepsiCo (its parent): active opportunity: YardFlow - PepsiCo (discovery). Confirm this is a separate buying motion before any cold outreach.');
  });
  it('a related deal state that cannot be read holds too (fail closed)', async () => {
    const activity = await loadRelatedActivity(fake(book), family, NOW, { opportunity: async () => ({ status: 'UNKNOWN' }) });
    expect(relatedHold(family, activity, null)).toMatchObject({ unknown: true, accounts: ['PepsiCo'] });
  });
  it('nothing live in the family: no hold', async () => {
    const activity = await loadRelatedActivity(fake(book), family, NOW, { opportunity: async () => ({ status: 'CLEAR' }) });
    expect(relatedHold(family, activity, null)).toBeNull();
  });
});

describe('separate buying motion: audited, expiring, scoped', () => {
  it('needs a reason; covers only the named related accounts; expires', async () => {
    const p = fake(book);
    expect(await recordSeparateMotion(p, { accountName: 'Frito-Lay', relatedAccounts: ['PepsiCo'], reason: '', actor: 'casey@freightroll.com', now: NOW })).toMatchObject({ ok: false, reason: 'reason_required' });
    const r = await recordSeparateMotion(p, { accountName: 'Frito-Lay', relatedAccounts: ['PepsiCo'], reason: 'Frito-Lay DC ops buys on its own; confirmed with the PepsiCo AE.', actor: 'casey@freightroll.com', now: NOW, days: 30 });
    expect(r).toMatchObject({ ok: true, expiresAt: '2026-10-29T12:00:00.000Z' });
    expect(p.audits[0]).toMatchObject({ kind: 'account.separate_motion', actor: 'casey@freightroll.com', subject_id: 'Frito-Lay' });
    const s = await loadSeparateMotion(p, 'Frito-Lay', NOW);
    const family = { accountName: 'Frito-Lay', parentName: 'PepsiCo', members: [{ accountName: 'PepsiCo', relation: 'parent' as const, source: 'parent_brand' as const }, { accountName: 'Quaker Foods', relation: 'sibling' as const, source: 'parent_brand' as const }] };
    const activity = [{ accountName: 'PepsiCo', relation: 'parent' as const, activity: ['active opportunity'], unknown: false }, { accountName: 'Quaker Foods', relation: 'sibling' as const, activity: ['a buyer conversation'], unknown: false }];
    expect(relatedHold(family, activity, s)?.accounts).toEqual(['Quaker Foods']);
    expect(await loadSeparateMotion(p, 'Frito-Lay', new Date('2026-11-30T00:00:00Z'))).toBeNull();
  });
});
