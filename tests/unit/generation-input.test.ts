import { describe, expect, it } from 'vitest';
import { buildGenerationInputContract } from '@/lib/agent-actions/generation-input';
import type { AgentActionResult } from '@/lib/agent-actions/types';

const baseResult: AgentActionResult = {
  action: 'content_context',
  provider: 'clawd',
  status: 'ok',
  summary: 'Americold has cold-chain throughput pressure and weak committee coverage.',
  cards: [
    { title: 'Research Summary', body: 'Cold-chain network complexity is creating throughput pressure.', tone: 'success' },
    { title: 'Committee Coverage', body: 'Committee has not been built yet or is unavailable.', tone: 'warning' },
    { title: 'Buyer Map', body: 'No sales-agent decision-maker suggestions yet.', tone: 'warning' },
    { title: 'Pipeline', body: 'Pipeline snapshot available.', tone: 'success' },
    { title: 'Drafting Signals', body: 'Latest generated asset: one_pager', tone: 'default' },
  ],
  data: {
    salesContacts: [{ name: 'Cindy Thomas' }, { name: 'Kaushik Sarda' }],
  },
  freshness: {
    fetchedAt: '2026-05-04T00:00:00.000Z',
    stale: false,
    source: 'live',
    status: 'fresh',
    dimensions: {
      summary: { key: 'summary', label: 'Research summary', status: 'fresh', stale: false, source: 'live', fetchedAt: '2026-05-04T00:00:00.000Z', updatedAt: '2026-05-04T00:00:00.000Z', ageHours: 0, note: '' },
      signals: { key: 'signals', label: 'Signals', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-04T00:00:00.000Z', updatedAt: '2026-05-04T00:00:00.000Z', ageHours: 0, note: '' },
      contacts: { key: 'contacts', label: 'Contacts', status: 'aging', stale: false, source: 'local', fetchedAt: '2026-05-04T00:00:00.000Z', updatedAt: '2026-05-03T00:00:00.000Z', ageHours: 24, note: '' },
      generated_content: { key: 'generated_content', label: 'Generated content', status: 'fresh', stale: false, source: 'local', fetchedAt: '2026-05-04T00:00:00.000Z', updatedAt: '2026-05-04T00:00:00.000Z', ageHours: 0, note: '' },
    },
  },
  nextActions: ['Generate a new one-pager with live intel'],
};

describe('generation input contract', () => {
  it('normalizes brokered content context into generation-ready fields', () => {
    const contract = buildGenerationInputContract(baseResult, 'scorecard_reply');

    expect(contract?.account_brief).toMatch(/Americold/);
    expect(contract?.signals).toHaveLength(3);
    expect(contract?.recommended_contacts).toContain('Cindy Thomas');
    expect(contract?.committee_gaps[0]).toMatch(/Committee coverage is still thin/i);
    expect(contract?.cta_mode).toBe('scorecard_reply');
    expect(contract?.freshness.source).toBe('live');
  });
});
