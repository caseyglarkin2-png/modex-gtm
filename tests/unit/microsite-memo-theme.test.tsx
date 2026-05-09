import { describe, expect, it } from 'vitest';
import { getMemoAccent } from '@/components/microsites/memo-theme';

// Polish pass (Sprint M-polish): the per-section colored vertical accent
// rule was dropped (read as Bootstrap blockquote). The accent now shows
// up only as the small "§01" numeral and via the --memo-accent CSS var
// that inline links bind to. The MemoAccent shape lost ruleClass and
// emphasisClass; numeralClass + cssVar are the two surfaces left.

describe('getMemoAccent', () => {
  it('returns the default cyan accent when accentColor is undefined', () => {
    const accent = getMemoAccent();
    expect(accent.numeralClass).toContain('cyan');
    expect((accent.cssVar as Record<string, string>)['--memo-accent']).toBeTruthy();
  });

  it('maps known hex accent colors to a deeper memo-friendly variant', () => {
    expect(getMemoAccent('#059669').numeralClass).toContain('emerald');
    expect(getMemoAccent('#DC2626').numeralClass).toContain('red');
    expect(getMemoAccent('#7C3AED').numeralClass).toContain('violet');
    expect(getMemoAccent('#D97706').numeralClass).toContain('amber');
    expect(getMemoAccent('#2563EB').numeralClass).toContain('blue');
  });

  it('falls back to the default palette for unknown hex values', () => {
    const fallback = getMemoAccent('#FF00FF');
    const defaultAccent = getMemoAccent();
    expect(fallback.numeralClass).toBe(defaultAccent.numeralClass);
  });

  it('exposes a CSS variable the FootnoteMarker can read', () => {
    const accent = getMemoAccent('#059669');
    const vars = accent.cssVar as Record<string, string>;
    expect(vars['--memo-accent']).toMatch(/^#/);
  });
});
