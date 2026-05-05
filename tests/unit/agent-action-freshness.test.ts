import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAgentActionFreshness,
  buildFreshnessDimension,
  normalizeAgentActionFreshness,
  resolveFreshnessState,
  summarizeFreshness,
  type FreshnessDimension,
} from '@/lib/agent-actions/freshness';

describe('agent action freshness helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-05T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('derives fresh, aging, stale, and never-refreshed states from timestamps', () => {
    expect(resolveFreshnessState('2026-05-05T06:00:00.000Z')).toBe('fresh');
    expect(resolveFreshnessState('2026-05-04T00:00:00.000Z')).toBe('aging');
    expect(resolveFreshnessState('2026-04-30T00:00:00.000Z')).toBe('stale');
    expect(resolveFreshnessState(null)).toBe('never_refreshed');
  });

  it('builds an overall freshness summary from dimension freshness', () => {
    const freshness = buildAgentActionFreshness({
      fetchedAt: '2026-05-05T11:00:00.000Z',
      source: 'live',
      dimensions: {
        summary: buildFreshnessDimension({
          key: 'summary',
          label: 'Research summary',
          updatedAt: '2026-05-05T11:00:00.000Z',
          fetchedAt: '2026-05-05T11:00:00.000Z',
          source: 'live',
        }),
        signals: buildFreshnessDimension({
          key: 'signals',
          label: 'Signals',
          updatedAt: '2026-05-04T03:00:00.000Z',
          fetchedAt: '2026-05-05T11:00:00.000Z',
          source: 'local',
        }),
        contacts: buildFreshnessDimension({
          key: 'contacts',
          label: 'Contacts',
          updatedAt: '2026-04-29T03:00:00.000Z',
          fetchedAt: '2026-05-05T11:00:00.000Z',
          source: 'local',
        }),
        generated_content: buildFreshnessDimension({
          key: 'generated_content',
          label: 'Generated content',
          updatedAt: null,
          fetchedAt: '2026-05-05T11:00:00.000Z',
          source: 'local',
        }),
      },
    });

    expect(freshness.status).toBe('stale');
    expect(freshness.stale).toBe(true);
    expect(summarizeFreshness(freshness)).toEqual({
      status: 'stale',
      label: 'Stale',
      guidance: 'Refresh before generating or sending new outreach.',
    });
  });

  it('normalizes legacy freshness payloads that are missing dimensions', () => {
    const freshness = normalizeAgentActionFreshness({
      fetchedAt: '2026-05-05T11:00:00.000Z',
      source: 'cache',
      dimensions: {
        summary: {
          key: 'summary',
          label: 'Research summary',
          status: 'fresh',
          stale: false,
          source: 'cache',
          fetchedAt: '2026-05-05T11:00:00.000Z',
          updatedAt: '2026-05-05T10:00:00.000Z',
          ageHours: 1,
          note: '',
        },
      } as Partial<Record<'summary' | 'signals' | 'contacts' | 'generated_content', FreshnessDimension>>,
    });

    expect(freshness.source).toBe('cache');
    expect(freshness.dimensions.summary.status).toBe('fresh');
    expect(freshness.dimensions.signals.status).toBe('never_refreshed');
    expect(freshness.dimensions.contacts.status).toBe('never_refreshed');
    expect(freshness.dimensions.generated_content.status).toBe('never_refreshed');
  });
});
