/**
 * Outbound yardflow.ai link hygiene (GSC audit 2026-08-17).
 *
 * Two defects this locks down, both found live on 2026-08-17:
 *
 *  1. Non-slash yardflow.ai links. yardflow.ai is `trailingSlash: true`, so the
 *     slashed URL is canonical, but `skipTrailingSlashRedirect` means the
 *     non-slash form serves a 200 DUPLICATE rather than 308ing. A link to
 *     `/roi?source=x` therefore lands a prospect (and Googlebot, via the demo
 *     gallery) on an alternate of the canonical. modex CLAUDE.md already
 *     mandates the trailing slash for microsite canonical/OG URLs; this extends
 *     the same rule to every outbound link we author.
 *
 *  2. Links to paths that do not exist. The monday-bump email footer shipped
 *     `https://yardflow.ai/overview`, a hard 404, in a prospect-facing send.
 *
 * Pure source scan: deterministic, no network, CI-safe. The known-path list is
 * deliberately a denylist of retired/never-existed paths rather than an
 * allowlist of live ones, so adding a page to yardflow.ai never fails this.
 */
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

/** Prospect-facing surfaces that author outbound yardflow.ai links. */
const SURFACES = [
  'src/app/api/email/monday-bump/route.ts',
  'src/app/demo/compare/page.tsx',
  'src/components/demo/gallery.tsx',
  'src/components/demo/demo-chrome.tsx',
  'src/components/demo/network-simulator.tsx',
  'src/components/demo/driver-journey-replay.tsx',
  'src/components/demo/roi-cta-button.tsx',
  'src/components/demo/roi-handoff-close.tsx',
];

/** Paths that are known-dead on yardflow.ai. `/overview` never existed. */
const DEAD_PATHS = ['/overview', '/paper', '/economics-methodology'];

/**
 * Matches an href to a yardflow.ai path, either absolute or via the
 * MICROSITE_BASE template. Captures the path up to the query/hash/quote.
 */
const HREF_RE =
  /(?:https:\/\/yardflow\.ai|\$\{MICROSITE_BASE\})(\/[A-Za-z0-9\-_/${}().]*)/g;

function linksIn(rel: string): { path: string; raw: string }[] {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  const out: { path: string; raw: string }[] = [];
  for (const m of src.matchAll(HREF_RE)) out.push({ path: m[1], raw: m[0] });
  return out;
}

describe('outbound yardflow.ai link hygiene', () => {
  for (const surface of SURFACES) {
    describe(surface, () => {
      it('links only to paths that exist', () => {
        for (const { path: p } of linksIn(surface)) {
          const bare = p.replace(/\/$/, '');
          expect(DEAD_PATHS, `${surface} links to dead path ${p}`).not.toContain(bare);
        }
      });

      it('ends every path link with a trailing slash', () => {
        for (const { path: p, raw } of linksIn(surface)) {
          // The bare apex (no path) is exempt; only real paths need the slash.
          if (p === '/' || p === '') continue;
          expect(
            p.endsWith('/'),
            `${surface}: ${raw} must end in "/" (non-slash serves a 200 duplicate of the canonical)`
          ).toBe(true);
        }
      });
    });
  }

  it('scans surfaces that actually contain links (guards a silent no-op)', () => {
    const total = SURFACES.reduce((n, s) => n + linksIn(s).length, 0);
    expect(total).toBeGreaterThan(8);
  });
});
