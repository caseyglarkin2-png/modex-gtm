import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Regression guards for the additive /demo GTM rebuild fix set:
 *   1. coca-cola narrative no longer ships the retired word "throughput"; the
 *      voice gate scans account narrative source, not only JSON packs.
 *   2. /demo book CTAs fire booking_link_click and close on an on-page #book panel.
 *   3. /demo/compare mounts the tracker + PostHog beacon and a booking close.
 *   4. the public streetview proxy is rate-limited.
 */

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('voice gate: throughput ban', () => {
  it('coca-cola account narrative contains no "throughput"', () => {
    const src = read('src/lib/microsites/accounts/coca-cola.ts');
    expect(src).not.toMatch(/\bthroughput/i);
  });

  it('no account narrative source ships the word "throughput"', () => {
    const dir = path.join(root, 'src/lib/microsites/accounts');
    const offenders = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'schema.ts')
      .filter((f) => /\bthroughput/i.test(fs.readFileSync(path.join(dir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('check-pack-voice bans throughput and scans the account narrative dir', () => {
    const gate = read('scripts/check-pack-voice.mjs');
    expect(gate).toMatch(/\/\\bthroughput\/i/); // the /\bthroughput/i pattern literal
    expect(gate).toContain('ACCOUNT_DIR');
    expect(gate).toContain('microsites');
    expect(gate).toContain('accounts');
  });

  it('the throughput pattern catches the banned word but allows the approved metric words', () => {
    const THROUGHPUT = /\bthroughput/i;
    expect(THROUGHPUT.test('is throughputting out')).toBe(true);
    expect(THROUGHPUT.test('adds production capacity')).toBe(false);
    expect(THROUGHPUT.test('adds volume-out-the-door capacity')).toBe(false);
  });
});

describe('demo booking close + booking_link_click', () => {
  const surface = read('src/components/demo/demo-surface.tsx');

  it('renders the on-page ForBookingPanel close', () => {
    expect(surface).toContain("import { ForBookingPanel } from './for-booking-panel'");
    expect(surface).toContain('<ForBookingPanel');
  });

  it('defaults the book href to the on-page #book anchor, not /contact', () => {
    expect(surface).toContain("'#book'");
    expect(surface).not.toContain('yardflow.ai/contact/?intent=audit');
    // meetings-slug external path is preserved as an override
    expect(surface).toContain('meetings.hubspot.com/');
    expect(surface).toContain('bookIsExternal');
  });

  it('fires booking_link_click from all three demo book anchors', () => {
    const matches = surface.match(/trackEvent\('booking_link_click'/g) ?? [];
    expect(matches.length).toBe(3);
    expect(surface).toContain("location: fromGallery ? 'gallery-pack-book-audit' : 'demo-book-audit'");
    expect(surface).toContain("location: 'microsite-sticky-book-audit'");
    expect(surface).toContain("location: 'demo-reply-start-conversation'");
  });

  it('the ForBookingPanel exposes the #book anchor and fires booking events', () => {
    const panel = read('src/components/demo/for-booking-panel.tsx');
    expect(panel).toContain('id="book"');
    expect(panel).toContain("trackEvent('booking_link_click'");
    expect(panel).not.toMatch(/\bthroughput/i);
    expect(panel).not.toMatch(/[—–]/); // no em or en dash in the close copy
  });
});

describe('demo/compare instrumentation + close', () => {
  const compare = read('src/app/demo/compare/page.tsx');

  it('mounts the microsite tracker and PostHog beacon (surface=compare)', () => {
    expect(compare).toContain('<MicrositeTracker');
    expect(compare).toContain('accountSlug="compare"');
    expect(compare).toContain('<MicrositePostHogBeacon slug="compare" surface="compare" />');
  });

  it('mounts a booking close', () => {
    expect(compare).toContain('<ForBookingPanel slug="compare" />');
  });
});

describe('streetview proxy rate limit', () => {
  const route = read('src/app/api/demo/streetview/route.ts');

  it('imports and applies the shared rate limiter keyed by ip before the upstream fetch', () => {
    expect(route).toContain("import { rateLimit } from '@/lib/rate-limit'");
    expect(route).toContain('rateLimit(`streetview:${ip}`)');
    const rlIdx = route.indexOf('rateLimit(`streetview');
    const fetchIdx = route.indexOf('await fetch(url');
    expect(rlIdx).toBeGreaterThan(-1);
    expect(fetchIdx).toBeGreaterThan(rlIdx);
  });
});