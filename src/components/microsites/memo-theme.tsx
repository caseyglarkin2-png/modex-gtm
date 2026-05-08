/**
 * Memo template accent — reduces the per-account theme.accentColor (which the
 * dark MicrositeShell turned into a full theme override with backgrounds,
 * panels, glows, shadows) into a single accent line + footnote-marker color.
 *
 * The memo template is light, narrow-column, document-feel. Color shows up
 * exactly twice on the page:
 *   1. A vertical accent rule at the start of each section
 *   2. The superscript footnote markers
 *
 * Everything else is greyscale on white. That's deliberate — the trust
 * signal is the writing + sourcing, not visual flair.
 *
 * The accent palette mirrors the existing dark theme palette (same hex →
 * same brand color family) so the per-account theme.accentColor field still
 * does the right thing without requiring per-account migration.
 */

import type { CSSProperties } from 'react';

export interface MemoAccent {
  /** Inline-style CSS variable wiring; pass to MemoShell's outer wrapper. */
  cssVar: CSSProperties;
  /** Tailwind class on the section accent rule. */
  ruleClass: string;
  /** Tailwind class on the footnote-marker `<sup>` text color. */
  markerClass: string;
  /** Tailwind class on body-copy emphasis (inline links, key terms). */
  emphasisClass: string;
}

interface MemoPaletteEntry {
  rule: string;       // border-cyan-700 — vertical accent rule per section
  marker: string;     // text-cyan-700 — footnote markers
  emphasis: string;   // text-cyan-700 hover:text-cyan-800 — inline emphasis
  hex: string;        // raw color for the CSS var consumer
}

const PALETTE: Record<string, MemoPaletteEntry> = {
  '#06B6D4': {
    rule: 'border-cyan-700',
    marker: 'text-cyan-700',
    emphasis: 'text-cyan-700 hover:text-cyan-800',
    hex: '#0E7490',
  },
  '#059669': {
    rule: 'border-emerald-700',
    marker: 'text-emerald-700',
    emphasis: 'text-emerald-700 hover:text-emerald-800',
    hex: '#047857',
  },
  '#DC2626': {
    rule: 'border-red-700',
    marker: 'text-red-700',
    emphasis: 'text-red-700 hover:text-red-800',
    hex: '#B91C1C',
  },
  '#7C3AED': {
    rule: 'border-violet-700',
    marker: 'text-violet-700',
    emphasis: 'text-violet-700 hover:text-violet-800',
    hex: '#6D28D9',
  },
  '#D97706': {
    rule: 'border-amber-700',
    marker: 'text-amber-700',
    emphasis: 'text-amber-700 hover:text-amber-800',
    hex: '#B45309',
  },
  '#2563EB': {
    rule: 'border-blue-700',
    marker: 'text-blue-700',
    emphasis: 'text-blue-700 hover:text-blue-800',
    hex: '#1D4ED8',
  },
};

const DEFAULT_PALETTE: MemoPaletteEntry = PALETTE['#06B6D4'];

export function getMemoAccent(accentColor?: string): MemoAccent {
  const palette = (accentColor && PALETTE[accentColor]) || DEFAULT_PALETTE;
  return {
    cssVar: { '--memo-accent': palette.hex } as CSSProperties,
    ruleClass: palette.rule,
    markerClass: palette.marker,
    emphasisClass: palette.emphasis,
  };
}
