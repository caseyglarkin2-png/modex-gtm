import { describe, expect, it } from 'vitest';
import { buildOutreach, personaScope } from '@/lib/discovery/outreach';
import type { CuratedRow } from '@/lib/discovery/types';

const p = {
  name: 'PepsiCo Mt Creek',
  cityState: 'Dallas, TX',
  nearestPrimoDistance: 0.7,
  corridor: 'Dallas, TX',
} as unknown as CuratedRow;

describe('personaScope', () => {
  it('maps operations-flavored titles to yard ops (ops wins)', () => {
    expect(personaScope('Yard Operations Manager')).toBe('yard ops');
    expect(personaScope('Plant Manager')).toBe('yard ops');
  });

  it('maps network-flavored titles to network', () => {
    expect(personaScope('Director of Transportation')).toBe('network');
    expect(personaScope('VP Supply Chain')).toBe('network');
  });

  it('returns null for unrelated titles and undefined', () => {
    expect(personaScope('Chief Marketing Officer')).toBeNull();
    expect(personaScope(undefined)).toBeNull();
  });
});

describe('buildOutreach persona-aware CTA', () => {
  it('defaults to "for your team" with no title', () => {
    expect(buildOutreach(p, 'Sam').body).toContain('for your team');
  });

  it('uses "for your network" for a transportation title', () => {
    const body = buildOutreach(p, 'Sam', 'Director of Transportation').body;
    expect(body).toContain('for your network');
    expect(body).not.toContain('for your team');
  });

  it('uses "for your yard ops" for an operations title', () => {
    expect(buildOutreach(p, 'Sam', 'Yard Operations Manager').body).toContain('for your yard ops');
  });

  it('falls back to "for your team" for a null-scope title', () => {
    expect(buildOutreach(p, 'Sam', 'Chief Marketing Officer').body).toContain('for your team');
  });

  it('introduces no em or en dashes', () => {
    const body = buildOutreach(p, 'Sam', 'Director of Transportation').body;
    expect(body).not.toContain('—');
    expect(body).not.toContain('–');
  });
});
