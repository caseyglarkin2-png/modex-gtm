import { describe, expect, it } from 'vitest';
import { summarizeIntelChange } from '@/components/agent-actions/agent-intel-strip';
import type { AgentActionResult } from '@/lib/agent-actions/types';

function buildResult(overrides?: Partial<AgentActionResult>): AgentActionResult {
  return {
    action: 'content_context',
    provider: 'modex',
    status: 'ok',
    summary: 'Baseline summary.',
    cards: [
      { title: 'Research Summary', body: 'Baseline summary.', tone: 'success' },
      { title: 'Contact Coverage', body: '1 mapped contact · 2 live external contacts', tone: 'default' },
      { title: 'Committee Coverage', body: 'Committee has not been built yet.', tone: 'warning' },
      { title: 'Buyer Map', body: 'Primary contact is the operator lead.', tone: 'default' },
    ],
    data: {
      salesContacts: [{ name: 'Alex' }, { name: 'Jamie' }],
    },
    freshness: {
      fetchedAt: new Date().toISOString(),
      stale: false,
      source: 'live',
    },
    nextActions: ['Generate the first one-pager.'],
    ...overrides,
  };
}

describe('summarizeIntelChange', () => {
  it('returns specific changes instead of a generic delta message', () => {
    const previous = buildResult();
    const next = buildResult({
      summary: 'Updated summary.',
      cards: [
        { title: 'Research Summary', body: 'Updated summary.', tone: 'success' },
        { title: 'Contact Coverage', body: '1 mapped contact · 5 live external contacts', tone: 'default' },
        { title: 'Committee Coverage', body: 'Committee has not been built yet.', tone: 'warning' },
        { title: 'Buyer Map', body: 'Primary contact is the operator lead.', tone: 'default' },
      ],
      data: {
        salesContacts: [{ name: 'Alex' }, { name: 'Jamie' }, { name: 'Casey' }, { name: 'Morgan' }, { name: 'Taylor' }],
      },
      nextActions: ['Use the recommended asset.'],
    });

    expect(summarizeIntelChange(previous, next)).toMatch(/Changed since last refresh:/);
    expect(summarizeIntelChange(previous, next)).toMatch(/research summary updated/i);
    expect(summarizeIntelChange(previous, next)).toMatch(/contact coverage changed|contact coverage expanded/i);
  });

  it('returns empty when nothing material changed', () => {
    const previous = buildResult();
    const next = buildResult();
    expect(summarizeIntelChange(previous, next)).toBe('');
  });
});
