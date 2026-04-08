/**
 * Microsite Theme Provider
 *
 * Sets CSS custom properties for account-specific accent colors.
 * Components in sections.tsx consume these via Tailwind arbitrary values
 * or inline styles using var(--ms-accent).
 *
 * Color mappings are kept as Tailwind class lookups (not dynamic classes)
 * to ensure they survive PurgeCSS in production builds.
 */

import type { CSSProperties } from 'react';

// ── Accent Color Palette ──────────────────────────────────────────────
// Maps hex accent colors to Tailwind class sets.
// All classes referenced here MUST be statically analyzable.

interface AccentClasses {
  text: string;         // text-cyan-400, text-emerald-400, etc.
  textLight: string;    // text-cyan-300
  textMuted: string;    // text-cyan-200
  bg: string;           // bg-cyan-500
  bgHover: string;      // hover:bg-cyan-400
  bgSubtle: string;     // bg-cyan-950/10
  bgBadge: string;      // bg-cyan-950/50
  border: string;       // border-cyan-900/30
  borderAccent: string; // border-l-cyan-400 or border-cyan-400/60
  label: string;        // uppercase label text color
  ring: string;         // ring-cyan-500/70
}

const PALETTE: Record<string, AccentClasses> = {
  // Default cyan (legacy)
  '#06B6D4': {
    text: 'text-cyan-400', textLight: 'text-cyan-300', textMuted: 'text-cyan-200',
    bg: 'bg-cyan-500', bgHover: 'hover:bg-cyan-400',
    bgSubtle: 'bg-cyan-950/10', bgBadge: 'bg-cyan-950/50',
    border: 'border-cyan-900/30', borderAccent: 'border-l-cyan-400/60',
    label: 'text-cyan-400', ring: 'ring-cyan-500/70',
  },
  // Emerald / green (Dannon fresh dairy, Home Depot)
  '#059669': {
    text: 'text-emerald-400', textLight: 'text-emerald-300', textMuted: 'text-emerald-200',
    bg: 'bg-emerald-500', bgHover: 'hover:bg-emerald-400',
    bgSubtle: 'bg-emerald-950/10', bgBadge: 'bg-emerald-950/50',
    border: 'border-emerald-900/30', borderAccent: 'border-l-emerald-400/60',
    label: 'text-emerald-400', ring: 'ring-emerald-500/70',
  },
  // Red (Hormel protein/meat)
  '#DC2626': {
    text: 'text-red-400', textLight: 'text-red-300', textMuted: 'text-red-200',
    bg: 'bg-red-500', bgHover: 'hover:bg-red-400',
    bgSubtle: 'bg-red-950/10', bgBadge: 'bg-red-950/50',
    border: 'border-red-900/30', borderAccent: 'border-l-red-400/60',
    label: 'text-red-400', ring: 'ring-red-500/70',
  },
  // Purple/violet (JM Smucker diversified portfolio)
  '#7C3AED': {
    text: 'text-violet-400', textLight: 'text-violet-300', textMuted: 'text-violet-200',
    bg: 'bg-violet-500', bgHover: 'hover:bg-violet-400',
    bgSubtle: 'bg-violet-950/10', bgBadge: 'bg-violet-950/50',
    border: 'border-violet-900/30', borderAccent: 'border-l-violet-400/60',
    label: 'text-violet-400', ring: 'ring-violet-500/70',
  },
  // Amber/gold (John Deere equipment/industrial)
  '#D97706': {
    text: 'text-amber-400', textLight: 'text-amber-300', textMuted: 'text-amber-200',
    bg: 'bg-amber-500', bgHover: 'hover:bg-amber-400',
    bgSubtle: 'bg-amber-950/10', bgBadge: 'bg-amber-950/50',
    border: 'border-amber-900/30', borderAccent: 'border-l-amber-400/60',
    label: 'text-amber-400', ring: 'ring-amber-500/70',
  },
  // Blue (default fallback for non-showcase)
  '#2563EB': {
    text: 'text-blue-400', textLight: 'text-blue-300', textMuted: 'text-blue-200',
    bg: 'bg-blue-500', bgHover: 'hover:bg-blue-400',
    bgSubtle: 'bg-blue-950/10', bgBadge: 'bg-blue-950/50',
    border: 'border-blue-900/30', borderAccent: 'border-l-blue-400/60',
    label: 'text-blue-400', ring: 'ring-blue-500/70',
  },
};

// Default accent (cyan)
const DEFAULT_ACCENT: AccentClasses = PALETTE['#06B6D4'];

type FlagshipVarName =
  | '--fw-accent-glow'
  | '--fw-font-body'
  | '--fw-font-display'
  | '--fw-font-label'
  | '--fw-hairline'
  | '--fw-motion-base'
  | '--fw-motion-ease'
  | '--fw-motion-fast'
  | '--fw-motion-slow'
  | '--fw-panel-bg'
  | '--fw-panel-bg-strong'
  | '--fw-panel-border'
  | '--fw-panel-border-strong'
  | '--fw-panel-muted-bg'
  | '--fw-panel-radius'
  | '--fw-panel-radius-large'
  | '--fw-panel-shadow'
  | '--fw-panel-shadow-strong'
  | '--fw-radius-pill'
  | '--fw-shell-bg'
  | '--fw-shell-grid'
  | '--fw-shell-spotlight'
  | '--fw-shell-spotlight-strong'
  | '--fw-space-hero'
  | '--fw-space-section'
  | '--fw-space-section-compact'
  | '--fw-space-stack';

type FlagshipThemeStyle = CSSProperties & Record<FlagshipVarName, string>;

// Shared flagship layout tokens for Sprint 7B and beyond.
export const FLAGSHIP_FRAME_CLASS = 'mx-auto max-w-[104rem] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14';
export const FLAGSHIP_SECTION_FRAME_CLASS = 'mx-auto max-w-5xl xl:max-w-[84rem] 2xl:max-w-[90rem]';
export const FLAGSHIP_SECTION_GUTTER_CLASS = 'px-4 sm:px-6 lg:px-8 xl:px-10';
export const FLAGSHIP_COPY_CLASS = 'max-w-5xl xl:max-w-[66rem]';

// Dedicated flagship design tokens. These stay namespaced under --fw-* so
// the old shell globals remain untouched while Sprint W1 builds a premium layer.
export const FLAGSHIP_THEME_CLASS = '[font-family:var(--fw-font-body)]';
export const FLAGSHIP_LABEL_CLASS = 'text-[10px] uppercase tracking-[0.3em] [font-family:var(--fw-font-label)]';
export const FLAGSHIP_EYEBROW_CLASS = 'text-[11px] font-semibold uppercase tracking-[0.28em] [font-family:var(--fw-font-label)]';
export const FLAGSHIP_DISPLAY_CLASS = '[font-family:var(--fw-font-display)] tracking-[-0.045em]';
export const FLAGSHIP_SECTION_TITLE_CLASS = 'text-2xl font-semibold text-white md:text-[2rem] [font-family:var(--fw-font-display)] tracking-[-0.035em]';
export const FLAGSHIP_PANEL_CLASS = 'border [border-color:var(--fw-panel-border)] [background:var(--fw-panel-bg)] [box-shadow:var(--fw-panel-shadow)] backdrop-blur-xl';
export const FLAGSHIP_PANEL_MUTED_CLASS = 'border [border-color:var(--fw-panel-border)] [background:var(--fw-panel-muted-bg)] [box-shadow:var(--fw-panel-shadow)] backdrop-blur-xl';
export const FLAGSHIP_HERO_PANEL_CLASS = 'border [border-color:var(--fw-panel-border-strong)] [background:var(--fw-panel-bg-strong)] [box-shadow:var(--fw-panel-shadow-strong)] backdrop-blur-xl';
export const FLAGSHIP_BADGE_CLASS = 'inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300';
export const FLAGSHIP_ACTION_CLASS = 'transition-[transform,background-color,border-color,box-shadow,color] [transition-duration:var(--fw-motion-base)] [transition-timing-function:var(--fw-motion-ease)] hover:-translate-y-0.5';
export const FLAGSHIP_SECTION_SPACE_CLASS = 'py-[var(--fw-space-section-compact)] xl:py-[var(--fw-space-section)]';

export function getFlagshipThemeStyle(accentColor?: string): CSSProperties {
  const borderTint = accentColor ? `${accentColor}42` : 'rgba(148, 163, 184, 0.24)';
  const accentGlow = accentColor ? `${accentColor}26` : 'rgba(34, 211, 238, 0.16)';
  const accentGlowStrong = accentColor ? `${accentColor}40` : 'rgba(34, 211, 238, 0.24)';

  return {
    '--fw-accent-glow': accentGlow,
    '--fw-font-body': '"Avenir Next", "Segoe UI Variable", "Segoe UI", sans-serif',
    '--fw-font-display': '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
    '--fw-font-label': '"Avenir Next Condensed", "Arial Narrow", "Segoe UI", sans-serif',
    '--fw-hairline': 'rgba(255,255,255,0.1)',
    '--fw-motion-base': '320ms',
    '--fw-motion-ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
    '--fw-motion-fast': '180ms',
    '--fw-motion-slow': '460ms',
    '--fw-panel-bg': 'linear-gradient(160deg, rgba(10, 15, 29, 0.82), rgba(9, 13, 25, 0.62))',
    '--fw-panel-bg-strong': 'radial-gradient(circle at top left, rgba(255,255,255,0.1), transparent 38%), linear-gradient(155deg, rgba(7, 11, 23, 0.96), rgba(14, 21, 38, 0.9))',
    '--fw-panel-border': borderTint,
    '--fw-panel-border-strong': 'rgba(255,255,255,0.2)',
    '--fw-panel-muted-bg': 'linear-gradient(160deg, rgba(11, 16, 31, 0.72), rgba(8, 13, 24, 0.58))',
    '--fw-panel-radius': '1.75rem',
    '--fw-panel-radius-large': '2.5rem',
    '--fw-panel-shadow': '0 24px 80px -50px rgba(2, 6, 23, 0.92)',
    '--fw-panel-shadow-strong': '0 45px 140px -72px rgba(2, 6, 23, 0.98)',
    '--fw-radius-pill': '999px',
    '--fw-shell-bg': 'linear-gradient(180deg, rgba(6, 10, 23, 0.98) 0%, rgba(5, 9, 20, 0.97) 24%, rgba(2, 6, 18, 1) 100%)',
    '--fw-shell-grid': 'rgba(148, 163, 184, 0.08)',
    '--fw-shell-spotlight': accentGlow,
    '--fw-shell-spotlight-strong': accentGlowStrong,
    '--fw-space-hero': 'clamp(4.5rem, 8vw, 7rem)',
    '--fw-space-section': 'clamp(4rem, 5vw, 5.5rem)',
    '--fw-space-section-compact': 'clamp(3.25rem, 4vw, 4.4rem)',
    '--fw-space-stack': 'clamp(1.25rem, 2vw, 1.75rem)',
  } as FlagshipThemeStyle;
}

export function getAccentClasses(accentColor?: string): AccentClasses {
  if (!accentColor) return DEFAULT_ACCENT;
  return PALETTE[accentColor] || DEFAULT_ACCENT;
}

export type { AccentClasses };
