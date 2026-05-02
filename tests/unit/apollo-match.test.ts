import { describe, expect, it } from 'vitest';
import { matchApolloPerson } from '@/lib/enrichment/apollo-match';

describe('apollo match', () => {
  it('prefers exact email matches', () => {
    const result = matchApolloPerson(
      {
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Rivera',
        company: 'Example Co',
        title: 'VP Ops',
      },
      [
        {
          id: 'p1',
          first_name: 'Alex',
          last_name: 'Rivera',
          email: 'alex@example.com',
          title: 'VP Ops',
          organization: { name: 'Example Co', website_url: 'https://example.com' },
        },
      ],
    );
    expect(result.reason).toBe('email');
    expect(result.score).toBe(100);
    expect(result.person?.id).toBe('p1');
  });

  it('falls back to domain+name and returns none below threshold', () => {
    const strong = matchApolloPerson(
      {
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Rivera',
        company: 'Example Co',
        title: 'VP Ops',
      },
      [
        {
          id: 'p2',
          first_name: 'Alex',
          last_name: 'Rivera',
          email: 'alex@other.com',
          title: 'Operations Leader',
          organization: { name: 'Example Co', website_url: 'https://example.com' },
        },
      ],
    );
    expect(strong.person?.id).toBe('p2');

    const weak = matchApolloPerson(
      {
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Rivera',
        company: 'Example Co',
        title: 'VP Ops',
      },
      [
        {
          id: 'p3',
          first_name: 'Sam',
          last_name: 'Jones',
          email: 'sam@other.com',
          title: 'Analyst',
          organization: { name: 'Other Inc', website_url: 'https://other.com' },
        },
      ],
    );
    expect(weak.reason).toBe('none');
    expect(weak.person).toBeNull();
  });
});
