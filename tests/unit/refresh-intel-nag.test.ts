import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STALE_DAYS, shouldNag } from '@/lib/intel/refresh-nag';

const DAY = 86_400_000;
const NOW = Date.parse('2026-09-26T13:00:00.000Z');
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

describe('shouldNag (refresh-intel cron policy)', () => {
  it('stays quiet while the bundles are fresh', () => {
    expect(shouldNag(STALE_DAYS - 1, null, NOW)).toEqual({ nag: false, reason: 'fresh' });
  });

  it('nags once when stale and never nagged', () => {
    expect(shouldNag(STALE_DAYS, null, NOW)).toEqual({ nag: true, reason: 'first-nag' });
  });

  it('does not repeat inside the quiet window', () => {
    expect(shouldNag(20, { nagAgeDays: 15, nagAt: ago(7) }, NOW)).toEqual({ nag: false, reason: 'already-nagged-7d-ago' });
  });

  it('repeats after 28 quiet days', () => {
    expect(shouldNag(45, { nagAgeDays: 17, nagAt: ago(28) }, NOW)).toEqual({ nag: true, reason: 'quiet-for-28d' });
  });

  it('repeats early when the bundles aged 30+ more days since the nag', () => {
    expect(shouldNag(50, { nagAgeDays: 20, nagAt: ago(3) }, NOW)).toEqual({ nag: true, reason: 'worsened-by-30d' });
  });

  it('an unreadable nag timestamp nags rather than staying silent forever', () => {
    expect(shouldNag(20, { nagAgeDays: 15, nagAt: 'not a date' }, NOW)).toEqual({ nag: true, reason: 'unreadable-timestamp' });
  });

  it('the route module exports only route handlers and config (next build rejects other exports)', () => {
    const src = readFileSync(path.join(process.cwd(), 'src', 'app', 'api', 'cron', 'refresh-intel', 'route.ts'), 'utf8');
    const exported = [...src.matchAll(/^export\s+(?:async\s+)?(?:function|const)\s+(\w+)/gm)].map((m) => m[1]);
    expect(exported.sort()).toEqual(['GET', 'dynamic']);
  });
});
