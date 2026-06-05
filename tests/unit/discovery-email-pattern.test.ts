import { describe, expect, it } from 'vitest';
import {
  normalizeNamePart,
  applyPattern,
  detectPattern,
  inferEmail,
  type EmailPattern,
} from '@/lib/discovery/email-pattern';

describe('normalizeNamePart', () => {
  it('lowercases, de-accents, strips punctuation/spaces', () => {
    expect(normalizeNamePart('José')).toBe('jose');
    expect(normalizeNamePart("O'Brien")).toBe('obrien');
    expect(normalizeNamePart('Mary-Jane')).toBe('maryjane');
    expect(normalizeNamePart('van der Berg')).toBe('vanderberg');
  });
});

describe('applyPattern', () => {
  const cases: [EmailPattern, string][] = [
    ['first.last', 'john.smith@acme.com'],
    ['firstlast', 'johnsmith@acme.com'],
    ['flast', 'jsmith@acme.com'],
    ['f.last', 'j.smith@acme.com'],
    ['first_last', 'john_smith@acme.com'],
    ['first', 'john@acme.com'],
    ['last.first', 'smith.john@acme.com'],
    ['lastfirst', 'smithjohn@acme.com'],
    ['firstl', 'johns@acme.com'],
  ];
  it.each(cases)('builds %s', (pattern, expected) => {
    expect(applyPattern('John', 'Smith', 'acme.com', pattern)).toBe(expected);
  });
});

describe('detectPattern', () => {
  it('finds the dominant pattern from consistent samples', () => {
    const d = detectPattern([
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@acme.com' },
      { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@acme.com' },
      { firstName: 'Amy', lastName: 'Lee', email: 'amy.lee@acme.com' },
    ]);
    expect(d?.pattern).toBe('first.last');
    expect(d?.matchRate).toBe(1);
    expect(d?.n).toBe(3);
  });

  it('picks the majority pattern when samples are mixed', () => {
    const d = detectPattern([
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@acme.com' },
      { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@acme.com' },
      { firstName: 'Amy', lastName: 'Lee', email: 'amy.lee@acme.com' },
      { firstName: 'Bob', lastName: 'Fox', email: 'bfox@acme.com' },
    ]);
    expect(d?.pattern).toBe('first.last');
    expect(d?.matchRate).toBeCloseTo(0.75, 2);
  });

  it('returns null with no usable samples', () => {
    expect(detectPattern([])).toBeNull();
    expect(detectPattern([{ firstName: '', lastName: '', email: 'x@acme.com' }])).toBeNull();
  });
});

describe('inferEmail', () => {
  const samples = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@acme.com' },
    { firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@acme.com' },
  ];

  it('is high-confidence with >=2 consistent corpus samples', () => {
    const r = inferEmail('Casey', 'Larkin', 'acme.com', { samples });
    expect(r.email).toBe('casey.larkin@acme.com');
    expect(r.confidence).toBe('high');
  });

  it('is medium with a researched stored pattern and no corpus', () => {
    const r = inferEmail('Casey', 'Larkin', 'acme.com', { storedPattern: 'flast' });
    expect(r.email).toBe('clarkin@acme.com');
    expect(r.confidence).toBe('medium');
  });

  it('is low with a single corpus sample', () => {
    const r = inferEmail('Casey', 'Larkin', 'acme.com', {
      samples: [{ firstName: 'John', lastName: 'Smith', email: 'jsmith@acme.com' }],
    });
    expect(r.email).toBe('clarkin@acme.com');
    expect(r.confidence).toBe('low');
  });

  it('returns no email when there is no basis at all', () => {
    const r = inferEmail('Casey', 'Larkin', 'acme.com', {});
    expect(r.email).toBeNull();
    expect(r.confidence).toBe('none');
  });
});
