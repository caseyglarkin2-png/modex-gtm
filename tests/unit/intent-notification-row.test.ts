import { describe, expect, it } from 'vitest';
import { buildIntentNotificationData } from '@/lib/microsites/intent-notifications';
import type { MicrositeTrackingSnapshot } from '@/lib/microsites/tracking';
import type { MicrositeEngagementAnalyticsInput } from '@/lib/microsites/analytics';

const snapshot = {
  sessionId: 'sess-1',
  accountSlug: 'kraft-heinz',
  accountName: 'Kraft Heinz',
  personName: 'Flavio Torres',
  path: '/for/kraft-heinz',
} as MicrositeTrackingSnapshot;

const mergedSession = {
  account_name: 'Kraft Heinz',
  account_slug: 'kraft-heinz',
  person_name: 'Flavio Torres',
  person_slug: null,
  path: '/for/kraft-heinz',
  sections_viewed: ['hero', 'roi', 'proof'],
  cta_ids: ['book-audit'],
  variant_history: [],
  scroll_depth_pct: 88,
  duration_seconds: 142,
  updated_at: new Date(),
  metadata: { audioProgressPct: '60' },
} as MicrositeEngagementAnalyticsInput;

describe('buildIntentNotificationData', () => {
  it('maps a CTA-triggered intent to a hot_engagement Notification row', () => {
    const row = buildIntentNotificationData(snapshot, mergedSession, 'cta:book-audit');

    expect(row.type).toBe('hot_engagement');
    expect(row.account_name).toBe('Kraft Heinz');
    expect(row.read).toBe(false);
    expect(row.subject).toBe('Flavio Torres — clicked book-audit');
    expect(row.preview).toContain('2m22s on page');
    expect(row.preview).toContain('88% scroll');
    expect(row.preview).toContain('3 sections');
    expect(row.preview).toContain('audio 60%');
    expect(row.preview).toContain('CTA: book-audit');
    expect(row.source_id).toBe('microsite-intent:sess-1:/for/kraft-heinz');
  });

  it('maps a high-intent read to a hot_engagement row with a fallback viewer name', () => {
    const row = buildIntentNotificationData(
      { ...snapshot, personName: undefined } as MicrositeTrackingSnapshot,
      mergedSession,
      'high-intent',
    );

    expect(row.subject).toBe('An unknown viewer — hit a high-intent read');
    expect(row.type).toBe('hot_engagement');
  });
});
