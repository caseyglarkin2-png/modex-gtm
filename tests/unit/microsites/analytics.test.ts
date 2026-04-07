import { describe, expect, it } from 'vitest';
import {
  buildMicrositeAnalyticsSummary,
  isHighIntentMicrositeSession,
  scoreHotMicrositeAccount,
  scoreMicrositeSession,
  type MicrositeEngagementAnalyticsInput,
} from '@/lib/microsites/analytics';

function buildSession(overrides: Partial<MicrositeEngagementAnalyticsInput> = {}): MicrositeEngagementAnalyticsInput {
  return {
    account_name: 'Frito-Lay',
    account_slug: 'frito-lay',
    person_name: 'Brian Watson',
    person_slug: 'brian-watson',
    path: '/for/frito-lay/brian-watson',
    sections_viewed: ['hero', 'problem', 'proof', 'cta'],
    cta_ids: [],
    variant_history: ['brian-watson'],
    scroll_depth_pct: 78,
    duration_seconds: 95,
    updated_at: new Date('2026-04-07T10:00:00.000Z'),
    ...overrides,
  };
}

describe('microsite analytics scoring', () => {
  it('scores deep reads as high-intent sessions', () => {
    const session = buildSession();

    expect(scoreMicrositeSession(session)).toBeGreaterThanOrEqual(35);
    expect(isHighIntentMicrositeSession(session)).toBe(true);
  });

  it('increases account score for CTA activity and recency', () => {
    const score = scoreHotMicrositeAccount(
      {
        ctaSessions: 1,
        highIntentSessions: 2,
        avgScrollDepthPct: 81,
        avgDurationSeconds: 120,
        variantCompareSessions: 1,
        lastViewedAt: new Date('2026-04-07T08:00:00.000Z'),
      },
      new Date('2026-04-07T12:00:00.000Z'),
    );

    expect(score).toBeGreaterThanOrEqual(70);
  });
});

describe('buildMicrositeAnalyticsSummary', () => {
  it('aggregates hot accounts and recent sessions', () => {
    const summary = buildMicrositeAnalyticsSummary([
      buildSession({
        cta_ids: ['hero-cta'],
        variant_history: ['brian-watson', 'beth-mars'],
      }),
      buildSession({
        updated_at: new Date('2026-04-06T08:00:00.000Z'),
        path: '/for/frito-lay',
        person_name: null,
        person_slug: null,
        sections_viewed: ['hero', 'problem'],
        scroll_depth_pct: 42,
        duration_seconds: 35,
      }),
      buildSession({
        account_name: 'General Mills',
        account_slug: 'general-mills',
        person_name: null,
        person_slug: null,
        path: '/for/general-mills',
        sections_viewed: ['hero', 'proof', 'cta'],
        scroll_depth_pct: 91,
        duration_seconds: 140,
        updated_at: new Date('2026-04-07T09:00:00.000Z'),
      }),
    ], new Date('2026-04-07T12:00:00.000Z'));

    expect(summary.totalSessions).toBe(3);
    expect(summary.accountsEngaged).toBe(2);
    expect(summary.ctaSessions).toBe(1);
    expect(summary.highIntentSessions).toBe(2);
    expect(summary.hotAccounts[0]?.accountName).toBe('Frito-Lay');
    expect(summary.hotAccounts[0]?.recommendedAction).toContain('Follow up');
    expect(summary.recentSessions[0]?.accountName).toBe('Frito-Lay');
  });

  it('keeps accounts that only appear outside the recent-session slice', () => {
    const sessions = Array.from({ length: 13 }, (_, index) =>
      buildSession({
        account_name: `Account ${index + 1}`,
        account_slug: `account-${index + 1}`,
        path: `/for/account-${index + 1}`,
        person_name: null,
        person_slug: null,
        updated_at: new Date(`2026-04-07T${String(index).padStart(2, '0')}:00:00.000Z`),
        cta_ids: index === 0 ? ['hero-cta'] : [],
      }),
    );

    const summary = buildMicrositeAnalyticsSummary(sessions, new Date('2026-04-07T13:00:00.000Z'));

    expect(summary.accountsEngaged).toBe(13);
    expect(summary.hotAccounts.some((account) => account.accountName === 'Account 1')).toBe(true);
  });
});