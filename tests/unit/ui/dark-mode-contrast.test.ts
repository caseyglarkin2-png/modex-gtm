/**
 * WCAG AA contrast gate for the theme tokens in src/app/globals.css.
 *
 * Every text/fill pair the app actually renders off these tokens must clear
 * 4.5:1 (normal-size text) in BOTH the light (:root) and dark (.dark) themes.
 * A token can play two roles: --primary is a button fill under
 * --primary-foreground AND a link colour on --background, so both pairs are
 * pinned. No single colour can serve both roles against white text and a
 * near-black page, which is why the dark theme pairs a bright --primary with a
 * dark --primary-foreground instead of darkening the fill.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(path.resolve(__dirname, '../../../src/app/globals.css'), 'utf8');

function block(selector: string): Record<string, string> {
  const re = new RegExp(`(^|\\n)${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`);
  const m = CSS.match(re);
  if (!m) throw new Error(`globals.css has no ${selector} block`);
  const out: Record<string, string> = {};
  for (const decl of m[2].matchAll(/--([a-z-]+)\s*:\s*([^;]+);/g)) out[decl[1]] = decl[2].trim();
  return out;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`token value ${hex} is not a 6-digit hex colour`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [text token, background token, why it matters] */
const PAIRS: Array<[string, string, string]> = [
  ['foreground', 'background', 'body text'],
  ['muted-foreground', 'background', 'secondary text, captions'],
  ['muted-foreground', 'muted', 'inactive tabs on the TabsList track'],
  ['foreground', 'muted', 'secondary buttons, selected rows'],
  ['primary-foreground', 'primary', 'primary buttons, active tabs, do-this-next'],
  ['primary', 'background', 'links and primary-coloured text'],
  ['destructive-foreground', 'destructive', 'destructive buttons, red count badges'],
  ['destructive', 'background', 'error text'],
  // Semantic aliases (card, popover, secondary, accent-foreground) that now
  // resolve through the @theme block: pinned so a future re-point cannot
  // ship an unreadable pair.
  ['card-foreground', 'card', 'bg-card panels'],
  ['popover-foreground', 'popover', 'popovers and menus'],
  ['secondary-foreground', 'secondary', 'bg-secondary surfaces (sheet close)'],
  ['accent-foreground', 'accent', 'bg-accent hover/selected rows'],
  ['muted-foreground', 'accent', 'dialog close icon on bg-accent'],
];

/** [indicator token, adjacent token, why]: WCAG 1.4.11 non-text, 3:1. */
const NON_TEXT_PAIRS: Array<[string, string, string]> = [
  ['ring', 'background', 'focus ring (ring-ring) against the page and ring-offset-background'],
  ['ring', 'muted', 'focus ring on a muted track (TabsList)'],
  ['input', 'background', 'form-control boundary (border-input) against the page'],
];

/** Follow var(--x) aliases (e.g. --card: var(--background)) within the theme, then light. */
function resolve(tokens: Record<string, string>, name: string, seen: string[] = []): string | undefined {
  const raw = tokens[name] ?? THEMES.light[name];
  if (raw === undefined) return undefined;
  const alias = raw.match(/^var\(--([a-z-]+)\)$/);
  if (!alias) return raw;
  if (seen.includes(alias[1])) throw new Error(`alias cycle: ${[...seen, alias[1]].join(' -> ')}`);
  return resolve(tokens, alias[1], [...seen, name]);
}

const THEMES = { light: block(':root'), dark: block('.dark') };

describe('theme token contrast (WCAG AA 4.5:1)', () => {
  for (const [theme, tokens] of Object.entries(THEMES)) {
    for (const [fg, bg, why] of PAIRS) {
      it(`${theme}: --${fg} on --${bg} (${why})`, () => {
        const fgValue = resolve(tokens, fg);
        const bgValue = resolve(tokens, bg);
        expect(fgValue, `--${fg} is not defined for ${theme}`).toBeDefined();
        expect(bgValue, `--${bg} is not defined for ${theme}`).toBeDefined();
        const ratio = contrast(fgValue!, bgValue!);
        expect(
          ratio,
          `${theme} --${fg} ${fgValue} on --${bg} ${bgValue} is ${ratio.toFixed(2)}:1, below 4.5:1`,
        ).toBeGreaterThanOrEqual(4.5);
      });
    }
    for (const [fg, bg, why] of NON_TEXT_PAIRS) {
      it(`${theme}: --${fg} against --${bg} (${why}) is at least 3:1`, () => {
        const fgValue = resolve(tokens, fg);
        const bgValue = resolve(tokens, bg);
        expect(fgValue, `--${fg} is not defined for ${theme}`).toBeDefined();
        expect(bgValue, `--${bg} is not defined for ${theme}`).toBeDefined();
        const ratio = contrast(fgValue!, bgValue!);
        expect(
          ratio,
          `${theme} --${fg} ${fgValue} against --${bg} ${bgValue} is ${ratio.toFixed(2)}:1, below 3:1`,
        ).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it('the dark: variant follows the next-themes .dark class, not the OS media query', () => {
    // Tailwind v4 defaults dark: to prefers-color-scheme. With a theme toggle
    // that means a user who picks Light on a dark OS gets dark:text-amber-400
    // on white. The custom variant pins dark: to the class next-themes writes.
    expect(CSS).toMatch(/@custom-variant\s+dark\s+\(&:where\(\.dark,\s*\.dark \*\)\);/);
  });
});
