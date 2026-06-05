import { describe, expect, it } from 'vitest';
import { dominantDomain, dedupeContacts, type ProspectContact } from '@/lib/discovery/contacts';

describe('dominantDomain', () => {
  it('returns the most common corporate domain, ignoring free providers', () => {
    expect(
      dominantDomain([
        'a@jbhunt.com',
        'b@jbhunt.com',
        'c@gmail.com',
        'd@jbhunt.com',
        'e@yahoo.com',
      ]),
    ).toBe('jbhunt.com');
  });

  it('returns null when there are only free / no usable emails', () => {
    expect(dominantDomain(['x@gmail.com', 'y@hotmail.com'])).toBeNull();
    expect(dominantDomain([])).toBeNull();
  });
});

function mk(p: Partial<ProspectContact>): ProspectContact {
  return { name: 'X', email: null, confidence: 'none', source: 'added', ...p };
}

describe('dedupeContacts', () => {
  it('collapses the same person and prefers a real email over an inferred one', () => {
    const out = dedupeContacts([
      mk({ name: 'Jane Doe', email: 'guess@acme.com', confidence: 'medium', source: 'added' }),
      mk({ name: 'jane  doe', email: 'jane.doe@acme.com', confidence: 'known', source: 'records' }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].email).toBe('jane.doe@acme.com');
    expect(out[0].confidence).toBe('known');
  });

  it('keeps distinct people', () => {
    const out = dedupeContacts([mk({ name: 'Jane Doe' }), mk({ name: 'John Roe' })]);
    expect(out).toHaveLength(2);
  });
});
