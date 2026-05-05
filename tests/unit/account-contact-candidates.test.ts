import { describe, expect, it } from 'vitest';
import { normalizeDiscoveredContactCandidates } from '@/lib/account-contact-candidates';
import type { AgentActionResult } from '@/lib/agent-actions/types';

const result: AgentActionResult = {
  action: 'company_contacts',
  provider: 'sales_agent',
  status: 'ok',
  summary: 'Found contacts.',
  cards: [],
  data: {
    contacts: [
      { name: 'Pat Brewer', email: 'pat@bostonbeer.com', title: 'Director of Logistics', id: 'contact-1' },
      { name: 'Broken Email', email: 'not-an-email', title: 'Operations Manager', id: 'contact-2' },
    ],
    salesContacts: [
      { name: 'Pat Brewer', email: 'pat@bostonbeer.com', title: 'Director of Logistics', id: 'dup-1' },
    ],
    salesAgent: {
      decisionMakers: {
        decision_makers: [
          { name: 'Phil Savastano', email: 'phil@bostonbeer.com', title: 'Chief Supply Chain Officer', id: 'dm-1' },
        ],
      },
    },
  },
  freshness: {
    fetchedAt: '2026-05-05T00:00:00.000Z',
    stale: false,
    source: 'live',
    status: 'fresh',
    dimensions: {
      summary: { key: 'summary', label: 'Research summary', status: 'fresh', stale: false, source: 'live', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
      signals: { key: 'signals', label: 'Signals', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
      contacts: { key: 'contacts', label: 'Contacts', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
      generated_content: { key: 'generated_content', label: 'Generated content', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-05T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z', ageHours: 0, note: '' },
    },
  },
  nextActions: [],
};

describe('account contact candidates', () => {
  it('normalizes and deduplicates discovered contacts with readiness metadata', () => {
    const candidates = normalizeDiscoveredContactCandidates('Boston Beer Company', result);

    expect(candidates).toHaveLength(3);
    expect(candidates[0]).toMatchObject({
      fullName: 'Pat Brewer',
      email: 'pat@bostonbeer.com',
      emailValid: true,
      recommended: true,
    });
    expect(candidates.some((candidate) => candidate.fullName === 'Broken Email' && candidate.emailValid === false)).toBe(true);
    expect(candidates.some((candidate) => candidate.fullName === 'Phil Savastano')).toBe(true);
  });
});
