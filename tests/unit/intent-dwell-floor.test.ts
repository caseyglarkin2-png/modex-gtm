import { describe, expect, it } from 'vitest';
import { decideIntentNotification } from '@/lib/microsites/intent-notifications';

const base = {
  existing: null,
  snapshot: { lastCtaId: 'microsite-run-roi', metadata: { trafficQuality: 'human' } } as never,
};

function session(durationSeconds: number) {
  return {
    path: '/demo/acme',
    duration_seconds: durationSeconds,
    scroll_depth_pct: 80,
    sections_viewed: ['a', 'b', 'c'],
    cta_ids: [],
    variant_history: [],
  } as never;
}

describe('intent ping dwell floor', () => {
  it('suppresses a CTA ping on a bounce-length session but STILL stamps CRM intent', () => {
    const d = decideIntentNotification({ ...base, mergedSession: session(7) });
    expect(d.notify).toBe(false);
    expect(d.stamp).toBe(true);
    expect(d.reason).toBe('below-dwell-floor');
  });

  it('lets a CTA ping through once dwell is real', () => {
    const d = decideIntentNotification({ ...base, mergedSession: session(120) });
    expect(d.notify).toBe(true);
    expect(d.stamp).toBe(true);
    expect(d.reason).toContain('cta:');
  });

  it('never stamps non-human traffic', () => {
    const d = decideIntentNotification({
      existing: null,
      snapshot: { lastCtaId: 'x', metadata: { trafficQuality: 'bot' } } as never,
      mergedSession: session(300),
    });
    expect(d.notify).toBe(false);
    expect(d.stamp).toBe(false);
  });

  it('no signal at all means no stamp', () => {
    const d = decideIntentNotification({
      existing: null,
      snapshot: { lastCtaId: null, metadata: { trafficQuality: 'human' } } as never,
      mergedSession: {
        path: '/demo/acme', duration_seconds: 20, scroll_depth_pct: 5,
        sections_viewed: [], cta_ids: [], variant_history: [],
      } as never,
    });
    expect(d.stamp).toBe(false);
    expect(d.reason).toBe('below-threshold');
  });
});
