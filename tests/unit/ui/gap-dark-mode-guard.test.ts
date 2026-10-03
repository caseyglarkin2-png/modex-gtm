/**
 * Static guard: GAP seller surfaces must not ship light-only colour utilities.
 *
 * Two failure shapes, both checked per source line (keep a colour and its
 * dark: partner on the same line, in the same className string):
 *  1. A light background (bg-white, bg-gray-50, bg-<hue>-50 / -100) with no
 *     dark:bg- partner: a white card on the dark page, text inherits the light
 *     foreground and disappears.
 *  2. A dark hue text (text-<hue>-600..900) with no dark:text- partner: e.g.
 *     text-amber-700 on the #0a0a0a page is 3.9:1, below AA, and amber/red/green
 *     are how the seller tells caution, error and verified apart.
 * Tokenised colours (var(--...)) and translucent tints (bg-amber-500/10) are
 * theme-safe and pass.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');
const SURFACES = ['src/components/gap', 'src/app/gap', 'src/app/queue'];

const HUES = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone';
const LIGHT_BG = new RegExp(`(?:^|[\\s'"\`{])(bg-white|bg-(?:${HUES})-(?:50|100))(?:/\\d+)?(?=[\\s'"\`}]|$)`);
const DARK_TEXT = new RegExp(`(?:^|[\\s'"\`{])(text-(?:${HUES})-(?:600|700|800|900))(?=[\\s'"\`}]|$)`);

function walk(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  return readdirSync(abs).flatMap((name) => {
    const rel = path.join(dir, name);
    if (statSync(path.join(ROOT, rel)).isDirectory()) return walk(rel);
    return name.endsWith('.tsx') ? [rel] : [];
  });
}

function findLightOnly(source: string): string[] {
  const hits: string[] = [];
  source.split('\n').forEach((line, i) => {
    const bg = line.match(LIGHT_BG);
    if (bg && !/dark:bg-/.test(line)) hits.push(`${i + 1}: ${bg[1]} without dark:bg-`);
    const text = line.match(DARK_TEXT);
    if (text && !/dark:text-/.test(line)) hits.push(`${i + 1}: ${text[1]} without dark:text-`);
  });
  return hits;
}

describe('GAP dark-mode guard', () => {
  it('detects both failure shapes (self-test)', () => {
    expect(findLightOnly('<div className="rounded bg-white p-2">')).toEqual(['1: bg-white without dark:bg-']);
    expect(findLightOnly("caution: 'text-amber-700',")).toEqual(['1: text-amber-700 without dark:text-']);
    expect(findLightOnly('<p className="bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">')).toEqual([]);
    expect(findLightOnly('<p className="bg-amber-500/10 text-[var(--muted-foreground)]">')).toEqual([]);
  });

  const files = SURFACES.flatMap(walk);
  it('scans a real set of surface files', () => {
    expect(files.length).toBeGreaterThan(40);
  });

  for (const file of files) {
    it(`${file.replace(/\\/g, '/')} has no light-only colour utilities`, () => {
      expect(findLightOnly(readFileSync(path.join(ROOT, file), 'utf8'))).toEqual([]);
    });
  }
});
