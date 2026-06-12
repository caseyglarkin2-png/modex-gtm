import { describe, expect, it } from 'vitest';
import { decideIntentNotification } from '@/lib/microsites/intent-notifications';

const base = {
  existing: null,
  snapshot: { lastCtaId: 'microsite-run-roi', metadata: { trafficQuality: 'human' } } as never,
};

function session(durationSeconds: number) {
  return { duration_seconds: durationSeconds, scroll_depth: 80, sections_viewed: ['a', 'b', 'c'] } as never;
}

describe('intent ping dwell floor', () => {
  it('suppresses a CTA ping on a bounce-length session', () => {
    const d = decideIntentNotification({ ...base, mergedSession: session(7) });
    expect(d.notify).toBe(false);
    expect(d.reason).toBe('below-dwell-floor');
  });

  it('lets a CTA ping through once dwell is real', () => {
    const d = decideIntentNotification({ ...base, mergedSession: session(120) });
    expect(d.notify).toBe(true);
    expect(d.reason).toContain('cta:');
  });
});
