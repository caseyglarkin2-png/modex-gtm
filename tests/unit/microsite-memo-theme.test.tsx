import { describe, expect, it } from 'vitest';
import { getMemoAccent } from '@/components/microsites/memo-theme';

describe('getMemoAccent', () => {
  it('returns the default cyan accent when accentColor is undefined', () => {
    const accent = getMemoAccent();
    expect(accent.ruleClass).toContain('cyan');
    expect(accent.markerClass).toContain('cyan');
    expect((accent.cssVar as Record<string, string>)['--memo-accent']).toBeTruthy();
  });

  it('maps known hex accent colors to a deeper memo-friendly variant', () => {
    expect(getMemoAccent('#059669').ruleClass).toContain('emerald');
    expect(getMemoAccent('#DC2626').ruleClass).toContain('red');
    expect(getMemoAccent('#7C3AED').ruleClass).toContain('violet');
    expect(getMemoAccent('#D97706').ruleClass).toContain('amber');
    expect(getMemoAccent('#2563EB').ruleClass).toContain('blue');
  });

  it('falls back to the default palette for unknown hex values', () => {
    const fallback = getMemoAccent('#FF00FF');
    const defaultAccent = getMemoAccent();
    expect(fallback.ruleClass).toBe(defaultAccent.ruleClass);
  });

  it('exposes a CSS variable the FootnoteMarker can read', () => {
    const accent = getMemoAccent('#059669');
    const vars = accent.cssVar as Record<string, string>;
    expect(vars['--memo-accent']).toMatch(/^#/);
  });
});
