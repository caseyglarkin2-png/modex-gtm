import { describe, expect, it } from 'vitest';
import {
  buildCommitteeCoverageBrief,
  buildCoverageGaps,
  buildRecommendedAngle,
  buildSignalRegistry,
  buildSuggestedRecipients,
  buildSuggestedRecipientSets,
  buildTopSignals,
} from '@/lib/agent-actions/account-command-center';
import type { AgentActionResult } from '@/lib/agent-actions/types';

const baseResult: AgentActionResult = {
  action: 'content_context',
  provider: 'local',
  status: 'ok',
  summary: 'Context ready.',
  cards: [
    { title: 'Research Summary', body: 'Americold has a cold-chain network with throughput pressure.', tone: 'success' },
    { title: 'Committee Coverage', body: 'Committee has not been built yet or is unavailable.', tone: 'warning' },
    { title: 'Buyer Map', body: 'No sales-agent decision-maker suggestions yet.', tone: 'warning' },
    { title: 'Pipeline', body: 'Pipeline snapshot available.', tone: 'success' },
    { title: 'Drafting Signals', body: 'Latest generated asset: one_pager', tone: 'default' },
  ],
  data: {
    salesContacts: [{ name: 'Cindy Thomas' }],
    latestEmail: {
      subject: 'Boston Beer intro',
      sent_at: '2026-05-04T10:00:00.000Z',
      reply_count: 0,
    },
    latestAsset: {
      content_type: 'one_pager',
      created_at: '2026-05-04T09:00:00.000Z',
    },
    contactFreshness: {
      latestEnrichedAt: '2026-05-03T00:00:00.000Z',
      mappedContactCount: 2,
      liveContactCount: 3,
    },
  },
  freshness: {
    fetchedAt: new Date().toISOString(),
    stale: false,
    source: 'live',
    status: 'fresh',
    dimensions: {
      summary: {
        key: 'summary',
        label: 'Research summary',
        status: 'fresh',
        stale: false,
        source: 'live',
        fetchedAt: '2026-05-04T12:00:00.000Z',
        updatedAt: '2026-05-04T12:00:00.000Z',
        ageHours: 1,
        note: 'Research summary is current enough to use as-is.',
      },
      signals: {
        key: 'signals',
        label: 'Signals',
        status: 'fresh',
        stale: false,
        source: 'local',
        fetchedAt: '2026-05-04T12:00:00.000Z',
        updatedAt: '2026-05-04T10:00:00.000Z',
        ageHours: 3,
        note: 'Signals are current enough to use as-is.',
      },
      contacts: {
        key: 'contacts',
        label: 'Contacts',
        status: 'aging',
        stale: false,
        source: 'local',
        fetchedAt: '2026-05-04T12:00:00.000Z',
        updatedAt: '2026-05-03T00:00:00.000Z',
        ageHours: 36,
        note: 'Contacts are aging. Refresh soon before broadening the motion.',
      },
      generated_content: {
        key: 'generated_content',
        label: 'Generated content',
        status: 'fresh',
        stale: false,
        source: 'local',
        fetchedAt: '2026-05-04T12:00:00.000Z',
        updatedAt: '2026-05-04T09:00:00.000Z',
        ageHours: 4,
        note: 'Generated content is current enough to use as-is.',
      },
    },
  },
  nextActions: ['Generate a new one-pager with live intel'],
};

describe('account command center helpers', () => {
  it('ranks recipients using readiness and surfaced agent names', () => {
    const recipients = buildSuggestedRecipients([
      {
        id: 1,
        name: 'Cindy Thomas',
        email: 'cindy@example.com',
        title: 'Director, Logistics',
        readiness: { score: 82, tier: 'high', stale: false },
      },
      {
        id: 2,
        name: 'Pat Example',
        email: 'pat@example.com',
        title: 'VP Finance',
        readiness: { score: 82, tier: 'high', stale: false },
      },
    ], baseResult);

    expect(recipients[0].name).toBe('Cindy Thomas');
    expect(recipients[0].reason).toMatch(/surfaced by live agent research/i);
  });

  it('builds agent-suggested recipient sets and recommends the operator lane first', () => {
    const recipients = buildSuggestedRecipients([
      {
        id: 1,
        name: 'Cindy Thomas',
        email: 'cindy@example.com',
        title: 'Director, Logistics',
        readiness: { score: 82, tier: 'high', stale: false },
      },
      {
        id: 2,
        name: 'Pat Example',
        email: 'pat@example.com',
        title: 'VP Supply Chain',
        readiness: { score: 79, tier: 'high', stale: false },
      },
      {
        id: 3,
        name: 'Jordan CI',
        email: 'jordan@example.com',
        title: 'Director, Continuous Improvement',
        readiness: { score: 76, tier: 'medium', stale: false },
      },
    ], baseResult);

    const sets = buildSuggestedRecipientSets(recipients);
    expect(sets.find((set) => set.key === 'operator')?.recommended).toBe(true);
    expect(sets.find((set) => set.key === 'operator')?.recipientIds).toContain(1);
    expect(sets.find((set) => set.key === 'executive')?.recipientIds).toContain(2);
    expect(sets.find((set) => set.key === 'transformation')?.recipientIds).toContain(3);
  });

  it('builds coverage gaps from thin committee and buyer-map state', () => {
    expect(buildCoverageGaps(baseResult)[0]).toMatch(/Committee coverage is still thin/i);
  });

  it('builds a committee brief from current coverage and buyer-map data', () => {
    const recipients = buildSuggestedRecipients([
      {
        id: 1,
        name: 'Cindy Thomas',
        email: 'cindy@example.com',
        title: 'Director, Logistics',
        readiness: { score: 82, tier: 'high', stale: false },
      },
      {
        id: 2,
        name: 'Pat Example',
        email: 'pat@example.com',
        title: 'VP Supply Chain',
        readiness: { score: 79, tier: 'high', stale: false },
      },
    ], baseResult);

    const brief = buildCommitteeCoverageBrief(baseResult, recipients);
    expect(brief.coveredLanes).toContain('operator');
    expect(brief.coveredLanes).toContain('executive');
    expect(brief.missingLanes).toContain('transformation');
  });

  it('pulls top signals and recommended angle from the account result', () => {
    expect(buildTopSignals(baseResult)).toHaveLength(3);
    expect(buildRecommendedAngle(baseResult, 'fallback')).toMatch(/cold-chain network/i);
  });

  it('builds a recency-ranked signal registry with structured metadata', () => {
    const signals = buildSignalRegistry(baseResult);

    expect(signals.length).toBeGreaterThanOrEqual(7);
    expect(signals.some((signal) => signal.title === 'Research Summary' && signal.source === 'local')).toBe(true);
    expect(signals.some((signal) => signal.title === 'Latest Send')).toBe(true);
    expect(signals.some((signal) => signal.title === 'Latest Asset')).toBe(true);
  });

  it('tolerates legacy freshness payloads with missing dimension keys', () => {
    const legacySignals = buildSignalRegistry({
      ...baseResult,
      freshness: {
        fetchedAt: '2026-05-04T12:00:00.000Z',
        stale: false,
        source: 'cache',
        status: 'fresh',
        dimensions: {
          summary: baseResult.freshness.dimensions.summary,
        },
      } as AgentActionResult['freshness'],
    });

    expect(legacySignals.some((signal) => signal.title === 'Research Summary')).toBe(true);
    expect(legacySignals.some((signal) => signal.title === 'Latest Asset')).toBe(true);
  });
});
