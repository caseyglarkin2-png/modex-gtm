import { describe, expect, it } from 'vitest';
import {
  buildMicrositeCtaActivity,
  buildMicrositeEngagementUpdate,
  mergeStringMaps,
  mergeUniqueValues,
  shouldLogMicrositeCtaActivity,
} from '@/lib/microsites/engagement';
import { micrositeTrackingSnapshotSchema } from '@/lib/microsites/tracking';

describe('microsite engagement merge helpers', () => {
  it('merges unique values while preserving first-seen order', () => {
    expect(mergeUniqueValues(['hero', 'proof'], ['proof', 'cta'])).toEqual(['hero', 'proof', 'cta']);
  });

  it('merges metadata maps with incoming values winning', () => {
    expect(mergeStringMaps({ source: 'email', medium: 'resend' }, { medium: 'gmail', campaign: 'touch-3' })).toEqual({
      source: 'email',
      medium: 'gmail',
      campaign: 'touch-3',
    });
  });

  it('builds an engagement update from existing data and a new snapshot', () => {
    const snapshot = micrositeTrackingSnapshotSchema.parse({
      sessionId: 'session-123',
      accountSlug: 'frito-lay',
      accountName: 'Frito-Lay',
      path: '/for/frito-lay',
      sectionsViewed: ['proof', 'cta'],
      ctaIds: ['hero-cta'],
      variantHistory: ['brian-watson'],
      scrollDepthPct: 86,
      durationSeconds: 90,
      variantSlug: 'brian-watson',
      lastCtaId: 'hero-cta',
    });

    const merged = buildMicrositeEngagementUpdate(
      {
        sections_viewed: ['hero'],
        cta_ids: ['header-booking'],
        variant_history: [],
        scroll_depth_pct: 40,
        duration_seconds: 30,
        metadata: { source: 'email' },
      },
      snapshot,
    );

    expect(merged.sections_viewed).toEqual(['hero', 'proof', 'cta']);
    expect(merged.cta_ids).toEqual(['header-booking', 'hero-cta']);
    expect(merged.variant_history).toEqual(['brian-watson']);
    expect(merged.scroll_depth_pct).toBe(86);
    expect(merged.duration_seconds).toBe(90);
    expect(merged.last_cta_id).toBe('hero-cta');
  });

  it('logs CTA activity only when a CTA id is newly observed', () => {
    const snapshot = micrositeTrackingSnapshotSchema.parse({
      sessionId: 'session-123',
      accountSlug: 'frito-lay',
      accountName: 'Frito-Lay',
      personSlug: 'brian-watson',
      personName: 'Brian Watson',
      path: '/for/frito-lay/brian-watson',
      sectionsViewed: ['hero', 'proof'],
      ctaIds: ['header-booking'],
      variantHistory: ['brian-watson'],
      scrollDepthPct: 84,
      durationSeconds: 92,
      lastCtaId: 'header-booking',
    });

    expect(shouldLogMicrositeCtaActivity(null, snapshot)).toBe(true);
    expect(shouldLogMicrositeCtaActivity({ cta_ids: ['header-booking'] }, snapshot)).toBe(false);
  });

  it('builds an operator-friendly activity row from a CTA click', () => {
    const snapshot = micrositeTrackingSnapshotSchema.parse({
      sessionId: 'session-123',
      accountSlug: 'frito-lay',
      accountName: 'Frito-Lay',
      personSlug: 'brian-watson',
      personName: 'Brian Watson',
      path: '/for/frito-lay/brian-watson',
      sectionsViewed: ['hero', 'proof'],
      ctaIds: ['header-booking'],
      variantHistory: ['brian-watson'],
      scrollDepthPct: 84,
      durationSeconds: 92,
      lastCtaId: 'header-booking',
    });

    const activity = buildMicrositeCtaActivity(snapshot, new Date('2026-04-07T12:00:00.000Z'));

    expect(activity.activity_type).toBe('Microsite CTA Click');
    expect(activity.persona).toBe('Brian Watson');
    expect(activity.next_step).toContain('24 hours');
    expect(activity.notes).toContain('header-booking');
  });
});