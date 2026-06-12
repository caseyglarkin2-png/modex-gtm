import { describe, it, expect } from 'vitest';
import {
  resolveSinceHours,
  pairContactsToTamCompanies,
} from '@/lib/revops/qualification/incremental';
import type { QualCompany, QualContact } from '@/lib/revops/qualification/types';

const mk = (over: Partial<QualContact>): QualContact => ({
  id: 'x', email: 'a@acme.com', firstname: 'A', lastname: 'B', jobtitle: '', lifecyclestage: 'lead',
  hs_seniority: '', hs_role: '', yardflow_qual_verdict: 'none', intent_score: '', last_intent_at: '',
  last_intent_source: '', hs_sales_email_last_replied: '', hs_email_open: '', hs_email_replied: '',
  engagements_last_meeting_booked: '', ...over,
});
const co = (over: Partial<QualCompany>): QualCompany => ({
  id: 'c', name: 'Co', icpScore: 0, tam: '', tier: '', ...over,
});

describe('resolveSinceHours', () => {
  it('defaults to 26 on null/garbage/zero/negative', () => {
    expect(resolveSinceHours(null)).toBe(26);
    expect(resolveSinceHours('garbage')).toBe(26);
    expect(resolveSinceHours('0')).toBe(26);
    expect(resolveSinceHours('-5')).toBe(26);
  });
  it('accepts a sane value and floors it', () => {
    expect(resolveSinceHours('48')).toBe(48);
    expect(resolveSinceHours('2.9')).toBe(2);
  });
  it('clamps to one week max', () => {
    expect(resolveSinceHours('9999')).toBe(168);
  });
});

describe('pairContactsToTamCompanies', () => {
  const tamCo = co({ id: 'c1', name: 'Acme', tam: 'in', tier: 'A' });
  const outCo = co({ id: 'c2', name: 'NotTam', tam: 'out' });
  const companies = new Map([
    ['c1', tamCo],
    ['c2', outCo],
  ]);

  it('pairs a contact with its TAM company', () => {
    const contact = mk({ id: 'p1' });
    const pairs = pairContactsToTamCompanies([contact], new Map([['p1', ['c1']]]), companies);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].company.id).toBe('c1');
  });
  it('drops contacts at non-TAM companies (no verdict churn outside TAM)', () => {
    const pairs = pairContactsToTamCompanies([mk({ id: 'p1' })], new Map([['p1', ['c2']]]), companies);
    expect(pairs).toHaveLength(0);
  });
  it('drops contacts with no associations or unknown companies', () => {
    const pairs = pairContactsToTamCompanies(
      [mk({ id: 'p1' }), mk({ id: 'p2' })],
      new Map([['p2', ['ghost']]]),
      companies,
    );
    expect(pairs).toHaveLength(0);
  });
  it('keeps multi-company contacts paired to every TAM company (dedupe happens downstream)', () => {
    const tamCo2 = co({ id: 'c3', name: 'Beta', tam: 'in', tier: 'B' });
    const map = new Map([
      ['c1', tamCo],
      ['c3', tamCo2],
    ]);
    const pairs = pairContactsToTamCompanies([mk({ id: 'p1' })], new Map([['p1', ['c1', 'c3']]]), map);
    expect(pairs).toHaveLength(2);
  });
});
