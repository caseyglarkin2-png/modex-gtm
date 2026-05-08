/**
 * Memo template accent — reduces the per-account theme.accentColor (which the
 * dark MicrositeShell turned into a full theme override with backgrounds,
 * panels, glows, shadows) into the few low-budget moments where color earns
 * its place on the page:
 *
 *   1. The numbered section markers (§01, §02, …) rendered next to each H2
 *   2. The superscript footnote markers
 *   3. Inline links inside body copy (via the --memo-accent CSS variable)
 *
 * Everything else is greyscale on cream. That's deliberate — the trust
 * signal is the writing + sourcing, not visual flair.
 *
 * The earlier version of this module also exposed a `ruleClass` for a
 * 4px-saturated vertical accent rule per section. That was too loud and
 * read as Bootstrap blockquote. We dropped it — the section frame now
 * uses a 1px slate hairline and the brand color shows up only in the
 * numeral.
 */

import type { CSSProperties } from 'react';

export interface MemoAccent {
  /** Inline-style CSS variable wiring; pass to MemoShell's outer wrapper. */
  cssVar: CSSProperties;
  /** Tailwind class for the numbered section marker (§01) and inline emphasis. */
  numeralClass: string;
}

interface MemoPaletteEntry {
  numeral: string;    // text-cyan-700 — section numeral + footnote markers
  hex: string;        // raw color piped to --memo-accent for inline links
}

const PALETTE: Record<string, MemoPaletteEntry> = {
  '#06B6D4': { numeral: 'text-cyan-700', hex: '#0E7490' },
  '#059669': { numeral: 'text-emerald-700', hex: '#047857' },
  '#DC2626': { numeral: 'text-red-700', hex: '#B91C1C' },
  '#7C3AED': { numeral: 'text-violet-700', hex: '#6D28D9' },
  '#D97706': { numeral: 'text-amber-700', hex: '#B45309' },
  '#2563EB': { numeral: 'text-blue-700', hex: '#1D4ED8' },
};

const DEFAULT_PALETTE: MemoPaletteEntry = PALETTE['#06B6D4'];

export function getMemoAccent(accentColor?: string): MemoAccent {
  const palette = (accentColor && PALETTE[accentColor]) || DEFAULT_PALETTE;
  return {
    cssVar: { '--memo-accent': palette.hex } as CSSProperties,
    numeralClass: palette.numeral,
  };
}
