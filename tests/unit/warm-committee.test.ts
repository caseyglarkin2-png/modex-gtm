import { describe, it, expect } from 'vitest';
import {
  selectWarmCommitteeTargets,
  isSendableCommitteeContact,
  buildWarmDraftBatchPayload,
} from '@/lib/discovery/warm-committee';
import type { QualCompany, QualContact } from '@/lib/revops/qualification/types';

const NOW = Date.parse('2026-07-22T12:00:00Z');
const RECENT = new Date(NOW - 2 * 86_400_000).toISOString(); // 2 days ago (fresh)
const STALE = new Date(NOW - 60 * 86_400_000).toISOString(); // 60 days ago (not fresh)

function company(over: Partial<QualCompany> = {}): QualCompany {
  return { id: 'c1', name: 'Kroger', icpScore: 80, tam: 'in', tier: 'A', intentScore: 85, lastIntentAt: RECENT, lastIntentSource: '/demo/kroger', ...over };
}
function contact(over: Partial<QualContact> = {}): QualContact {
  return {
    id: 't1', email: 'jane.doe@kroger.com', firstname: 'Jane', lastname: 'Doe',
    jobtitle: 'Director of Transportation', lifecyclestage: 'lead', hs_seniority: 'director',
    hs_role: '', yardflow_qual_verdict: '', intent_score: '0', last_intent_at: '', last_intent_source: '',
    hs_sales_email_last_replied: '', hs_email_open: '0', hs_email_replied: '0', engagements_last_meeting_booked: '',
    ...over,
  };
}

describe('warm-committee selection', () => {
  it('selects a warm account and its role-gated committee, drops cold accounts', () => {
    const warm = company({ id: 'c1', name: 'Kroger' });
    const cold = company({ id: 'c2', name: 'ColdCo', intentScore: 10, triggerScore: 0 });
    const targets = selectWarmCommitteeTargets({
      companies: [warm, cold],
      contactsByCompanyId: {
        c1: [contact({ id: 't1', email: 'jane@kroger.com' })],
        c2: [contact({ id: 't2', email: 'joe@coldco.com' })],
      },
      nowMs: NOW,
    });
    expect(targets.map((t) => t.account)).toEqual(['Kroger']);
    expect(targets[0].contacts.map((c) => c.email)).toEqual(['jane@kroger.com']);
    expect(targets[0].lastIntentSource).toBe('/demo/kroger');
  });

  it('drops a warm account whose intent is stale (recency gate)', () => {
    const stale = company({ intentScore: 85, lastIntentAt: STALE, triggerScore: 0 });
    const targets = selectWarmCommitteeTargets({ companies: [stale], contactsByCompanyId: { c1: [contact()] }, nowMs: NOW });
    expect(targets).toEqual([]);
  });

  it('keeps a warm-by-trigger account even when intent is stale', () => {
    const trig = company({ intentScore: 10, lastIntentAt: STALE, triggerScore: 75 });
    const targets = selectWarmCommitteeTargets({ companies: [trig], contactsByCompanyId: { c1: [contact()] }, nowMs: NOW });
    expect(targets).toHaveLength(1);
  });

  it('excludes non-committee contacts (no role gate)', () => {
    const t = selectWarmCommitteeTargets({
      companies: [company()],
      contactsByCompanyId: { c1: [contact({ id: 't1', jobtitle: 'Accountant', hs_seniority: '', hs_role: '' })] },
      nowMs: NOW,
    });
    expect(t).toEqual([]); // account had no sendable committee
  });

  it('excludes role/shared mailboxes, internal domains, and empty emails even for a committee title', () => {
    const t = selectWarmCommitteeTargets({
      companies: [company()],
      contactsByCompanyId: {
        c1: [
          contact({ id: 'a', email: 'info@kroger.com' }),          // role mailbox
          contact({ id: 'b', email: 'ops@freightroll.com' }),      // internal domain
          contact({ id: 'c', email: '' }),                          // no email
          contact({ id: 'd', email: 'real.person@kroger.com' }),    // keep
        ],
      },
      nowMs: NOW,
    });
    expect(t[0].contacts.map((c) => c.email)).toEqual(['real.person@kroger.com']);
  });

  it('excludes suppressed (recently-contacted) emails, case-insensitively', () => {
    const t = selectWarmCommitteeTargets({
      companies: [company()],
      contactsByCompanyId: {
        c1: [contact({ id: 'a', email: 'Seen@kroger.com' }), contact({ id: 'b', email: 'fresh@kroger.com' })],
      },
      suppressedEmails: new Set(['seen@kroger.com']),
      nowMs: NOW,
    });
    expect(t[0].contacts.map((c) => c.email)).toEqual(['fresh@kroger.com']);
  });

  it('caps the committee to the top seniors per account', () => {
    const contacts = [
      contact({ id: 'x', email: 'x@kroger.com', hs_seniority: '', hs_role: '', jobtitle: 'Logistics Analyst' }), // rank 5
      contact({ id: 'e', email: 'e@kroger.com', hs_seniority: 'executive', jobtitle: 'COO' }),                   // rank 0
      contact({ id: 'd', email: 'd@kroger.com', hs_seniority: 'director', jobtitle: 'Director SC' }),            // rank 2
    ];
    const t = selectWarmCommitteeTargets({ companies: [company()], contactsByCompanyId: { c1: contacts }, nowMs: NOW, perAccountCap: 2 });
    expect(t[0].contacts.map((c) => c.contactId)).toEqual(['e', 'd']); // top two seniors, analyst trimmed
  });

  it('isSendableCommitteeContact enforces role gate + real mailbox', () => {
    const empty = new Set<string>();
    expect(isSendableCommitteeContact(contact({ email: 'jane@kroger.com' }), empty)).toBe(true);
    expect(isSendableCommitteeContact(contact({ jobtitle: 'Barista', hs_seniority: '', hs_role: '' }), empty)).toBe(false);
    expect(isSendableCommitteeContact(contact({ email: 'sales@kroger.com' }), empty)).toBe(false);
  });

  it('buildWarmDraftBatchPayload stamps the warm-committee source', () => {
    const payload = buildWarmDraftBatchPayload([], 'casey@freightroll.com');
    expect(payload).toEqual({ owner: 'casey@freightroll.com', requestedBy: 'casey@freightroll.com', source: 'warm-committee', targets: [] });
  });
});
