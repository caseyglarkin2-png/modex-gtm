import { describe, expect, it } from 'vitest';
import {
  dedupeTrackingSnapshot,
  micrositeTrackEventSchema,
  micrositeTrackingSnapshotSchema,
} from '@/lib/microsites/tracking';

describe('microsite tracking contracts', () => {
  it('accepts a valid tracking event payload', () => {
    const result = micrositeTrackEventSchema.safeParse({
      sessionId: 'session-123',
      accountSlug: 'frito-lay',
      accountName: 'Frito-Lay',
      path: '/for/frito-lay',
      eventType: 'section_view',
      sectionId: 'proof',
      scrollDepthPct: 67,
      durationSeconds: 35,
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid scroll depth', () => {
    const result = micrositeTrackEventSchema.safeParse({
      sessionId: 'session-123',
      accountSlug: 'frito-lay',
      accountName: 'Frito-Lay',
      path: '/for/frito-lay',
      eventType: 'section_view',
      scrollDepthPct: 130,
    });

    expect(result.success).toBe(false);
  });

  it('creates a stable dedupe key for tracking snapshots', () => {
    const snapshot = micrositeTrackingSnapshotSchema.parse({
      sessionId: 'session-123',
      accountSlug: 'frito-lay',
      accountName: 'Frito-Lay',
      personSlug: 'brian-watson',
      personName: 'Brian Watson',
      path: '/for/frito-lay/brian-watson',
      sectionsViewed: ['proof', 'hero'],
      scrollDepthPct: 82,
      durationSeconds: 90,
      variantSlug: 'brian-watson',
    });

    const first = dedupeTrackingSnapshot(snapshot);
    const second = dedupeTrackingSnapshot({
      ...snapshot,
      sectionsViewed: ['hero', 'proof'],
    });

    expect(first).toBe(second);
  });
});