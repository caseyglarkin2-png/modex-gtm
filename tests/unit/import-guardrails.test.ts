import { describe, expect, it } from 'vitest';
import {
  isNewAccountSendEligible,
  likelySameCompanyName,
  normalizeCompanyDomain,
} from '@/lib/accounts/import-guardrails';

describe('import guardrails', () => {
  it('normalizes domains consistently', () => {
    expect(normalizeCompanyDomain('https://www.Acme.com/path')).toBe('acme.com');
    expect(normalizeCompanyDomain('ACME.COM')).toBe('acme.com');
  });

  it('detects likely same company names', () => {
    expect(likelySameCompanyName('Acme, Inc.', 'Acme Inc')).toBe(true);
    expect(likelySameCompanyName('Acme Corporation', 'Beta LLC')).toBe(false);
  });

  it('holds new account contacts below send threshold', () => {
    expect(isNewAccountSendEligible(79)).toBe(false);
    expect(isNewAccountSendEligible(80)).toBe(true);
  });
});
