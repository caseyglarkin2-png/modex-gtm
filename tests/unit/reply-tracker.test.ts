/**
 * Reply Tracker — unit tests for pure data-transform logic.
 *
 * Tests focus on:
 *   - computeDaysSince
 *   - computeNeedsFollowUp
 *   - deriveSuggestedNextStep
 *   - getNamedAccountActivity graceful degradation (HubSpot mocked)
 *
 * HubSpot calls are mocked via vi.mock — no real API calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeDaysSince,
  computeNeedsFollowUp,
  deriveSuggestedNextStep,
} from '@/lib/reply-tracker';

// ── Mock HubSpot client ───────────────────────────────────────────────────────

const mockOutboundSearch = vi.fn();
const mockInboundSearch = vi.fn();

vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: vi.fn(() => true),
  getHubSpotClient: vi.fn(() => ({
    crm: {
      objects: {
        emails: {
          searchApi: {
            doSearch: vi.fn(({ filterGroups }: { filterGroups: { filters: { propertyName: string }[] }[] }) => {
              // Route to correct mock based on which property is being filtered
              const props = filterGroups.flatMap((g: { filters: { propertyName: string }[] }) => g.filters.map((f: { propertyName: string }) => f.propertyName));
              if (props.includes('hs_email_to_email')) return mockOutboundSearch();
              return mockInboundSearch();
            }),
          },
        },
      },
    },
  })),
  withHubSpotRetry: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

// ── Mock account data so tests don't depend on all 40 account files ───────────

vi.mock('@/lib/microsites/accounts', () => ({
  getAllAccountMicrositeData: vi.fn(() => [
    {
      slug: 'test-account',
      accountName: 'Test Account',
      people: [
        {
          personaId: 'P-001',
          name: 'Jane Doe',
          title: 'VP Supply Chain',
          email: 'jane.doe@testaccount.com',
        },
      ],
      personVariants: [],
      proofBlocks: [],
      sections: [],
      network: { facilityCount: '5', facilityTypes: [], geographicSpread: '', dailyTrailerMoves: '' },
      freight: { primaryModes: [], avgLoadsPerDay: '' },
      signals: {},
      vertical: 'cpg',
      tier: 'Tier 1',
      band: 'A',
      priorityScore: 90,
      pageTitle: 'Test Account',
      metaDescription: '',
    },
  ]),
}));

// ── Pure function tests ───────────────────────────────────────────────────────

describe('computeDaysSince', () => {
  it('returns null for null input', () => {
    expect(computeDaysSince(null)).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(computeDaysSince('not-a-date')).toBeNull();
  });

  it('computes correct days for a known timestamp', () => {
    const now = new Date('2026-05-10T12:00:00Z');
    const twelveAgo = '2026-04-28T12:00:00Z'; // 12 days ago
    expect(computeDaysSince(twelveAgo, now)).toBe(12);
  });

  it('returns 0 for a timestamp from today', () => {
    const now = new Date('2026-05-10T12:00:00Z');
    expect(computeDaysSince('2026-05-10T10:00:00Z', now)).toBe(0);
  });
});

describe('computeNeedsFollowUp', () => {
  it('returns false when never emailed', () => {
    expect(computeNeedsFollowUp({ lastEmailSentAt: null, replied: false, daysSinceLastActivity: null })).toBe(false);
  });

  it('returns false when contact has replied', () => {
    expect(computeNeedsFollowUp({ lastEmailSentAt: '2026-04-28T12:00:00Z', replied: true, daysSinceLastActivity: 12 })).toBe(false);
  });

  it('returns true when sent ≥10 days ago and no reply', () => {
    expect(computeNeedsFollowUp({ lastEmailSentAt: '2026-04-28T12:00:00Z', replied: false, daysSinceLastActivity: 12 })).toBe(true);
  });

  it('returns true exactly at 10 days', () => {
    expect(computeNeedsFollowUp({ lastEmailSentAt: '2026-04-30T12:00:00Z', replied: false, daysSinceLastActivity: 10 })).toBe(true);
  });

  it('returns false when sent <10 days ago', () => {
    expect(computeNeedsFollowUp({ lastEmailSentAt: '2026-05-06T12:00:00Z', replied: false, daysSinceLastActivity: 4 })).toBe(false);
  });
});

describe('deriveSuggestedNextStep', () => {
  it('returns "send cold v1" when never emailed', () => {
    expect(deriveSuggestedNextStep({ lastEmailSentAt: null, opened: false, replied: false, daysSinceLastActivity: null })).toBe('send cold v1');
  });

  it('returns "warm — schedule call" when contact has replied', () => {
    expect(deriveSuggestedNextStep({ lastEmailSentAt: '2026-05-08T12:00:00Z', opened: true, replied: true, daysSinceLastActivity: 2 })).toBe('warm — schedule call');
  });

  it('returns "send follow-up 2" when sent ≥10 days ago, no reply', () => {
    expect(deriveSuggestedNextStep({ lastEmailSentAt: '2026-04-28T12:00:00Z', opened: false, replied: false, daysSinceLastActivity: 12 })).toBe('send follow-up 2');
  });

  it('returns "follow up soon" when sent recently and opened but no reply', () => {
    expect(deriveSuggestedNextStep({ lastEmailSentAt: '2026-05-07T12:00:00Z', opened: true, replied: false, daysSinceLastActivity: 3 })).toBe('follow up soon');
  });

  it('returns "monitor" when sent recently, not opened, no reply', () => {
    expect(deriveSuggestedNextStep({ lastEmailSentAt: '2026-05-08T12:00:00Z', opened: false, replied: false, daysSinceLastActivity: 2 })).toBe('monitor');
  });
});

// ── Integration-style tests (HubSpot mocked) ─────────────────────────────────

describe('getNamedAccountActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cold contact: sent 12 days ago, no open, no reply → needsFollowUp=true, next="send follow-up 2"', async () => {
    const sent12DaysAgo = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString();
    mockOutboundSearch.mockResolvedValue({
      results: [
        {
          id: 'email-001',
          properties: {
            hs_timestamp: sent12DaysAgo,
            hs_email_subject: 'Quick question about yard throughput',
            hs_email_status: 'SENT',
            hs_email_direction: 'FORWARDED_EMAIL',
            hs_email_to_email: 'jane.doe@testaccount.com',
          },
        },
      ],
    });
    mockInboundSearch.mockResolvedValue({ results: [] });

    const { getNamedAccountActivity } = await import('@/lib/reply-tracker');
    const rows = await getNamedAccountActivity();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.needsFollowUp).toBe(true);
    expect(row.suggestedNextStep).toBe('send follow-up 2');
    expect(row.replied).toBe(false);
    expect(row.opened).toBe(false);
    expect(row.daysSinceLastActivity).toBeGreaterThanOrEqual(12);
    expect(row.error).toBeNull();
  });

  it('warm contact: replied 2 days ago → needsFollowUp=false, next="warm — schedule call"', async () => {
    const sent5DaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    mockOutboundSearch.mockResolvedValue({
      results: [
        {
          id: 'email-002',
          properties: {
            hs_timestamp: sent5DaysAgo,
            hs_email_subject: 'Following up on MODEX',
            hs_email_status: 'OPENED',
            hs_email_direction: 'FORWARDED_EMAIL',
            hs_email_to_email: 'jane.doe@testaccount.com',
          },
        },
      ],
    });
    mockInboundSearch.mockResolvedValue({
      results: [
        {
          id: 'reply-001',
          properties: {
            hs_timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            hs_email_direction: 'INCOMING_EMAIL',
            hs_email_from_email: 'jane.doe@testaccount.com',
          },
        },
      ],
    });

    const { getNamedAccountActivity } = await import('@/lib/reply-tracker');
    const rows = await getNamedAccountActivity();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.replied).toBe(true);
    expect(row.needsFollowUp).toBe(false);
    expect(row.suggestedNextStep).toBe('warm — schedule call');
    expect(row.error).toBeNull();
  });

  it('never emailed → needsFollowUp=false, next="send cold v1"', async () => {
    mockOutboundSearch.mockResolvedValue({ results: [] });
    mockInboundSearch.mockResolvedValue({ results: [] });

    const { getNamedAccountActivity } = await import('@/lib/reply-tracker');
    const rows = await getNamedAccountActivity();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.lastEmailSentAt).toBeNull();
    expect(row.needsFollowUp).toBe(false);
    expect(row.suggestedNextStep).toBe('send cold v1');
    expect(row.error).toBeNull();
  });

  it('HubSpot 401 → returns rows with error, does not throw', async () => {
    const authError = new Error('unauthorized') as Error & { code: number };
    authError.code = 401;
    mockOutboundSearch.mockRejectedValue(authError);

    const { getNamedAccountActivity } = await import('@/lib/reply-tracker');
    await expect(getNamedAccountActivity()).resolves.not.toThrow();

    const rows = await getNamedAccountActivity();
    expect(rows).toHaveLength(1);
    expect(rows[0].error).toMatch(/401|disconnected/i);
    expect(rows[0].needsFollowUp).toBe(false);
  });
});
