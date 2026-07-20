import { describe, it, expect, vi, afterEach } from 'vitest';
import { ACCOUNT_DOMAINS, domainForAccountSlug } from '@/lib/microsites/account-domains';
import { resolveCompanyForIntent } from '@/lib/microsites/hubspot-intent';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import type { HubSpotCompany } from '@/lib/hubspot/companies';

// The S1 amplifier: domain-first company resolution for intent stamping.
// Exact-name matching left ~7 companies ever stamped; these tests lock the
// chain (domain -> name fallback -> observable miss) and the map's integrity,
// because a wrong domain here poisons account intent at the source.

const co = (id: string): HubSpotCompany =>
  ({ id, name: 'X', domain: 'x.com', yardflow_tam: 'in' }) as HubSpotCompany;

afterEach(() => vi.restoreAllMocks());

describe('resolveCompanyForIntent', () => {
  it('resolves by DOMAIN first for a mapped slug and never falls to name', async () => {
    const byDomain = vi.fn(async () => co('123'));
    const byName = vi.fn(async () => co('999'));
    const hit = await resolveCompanyForIntent(
      { accountSlug: 'pepsico', accountName: 'PepsiCo' }, { byDomain, byName });
    expect(hit?.id).toBe('123');
    expect(byDomain).toHaveBeenCalledWith('pepsico.com');
    expect(byName).not.toHaveBeenCalled();
  });

  it('falls back to exact-name when the slug is unmapped', async () => {
    const byDomain = vi.fn(async () => co('123'));
    const byName = vi.fn(async () => co('456'));
    const hit = await resolveCompanyForIntent(
      { accountSlug: 'jm-smucker', accountName: 'J.M. Smucker' }, { byDomain, byName });
    expect(hit?.id).toBe('456');
    expect(byDomain).not.toHaveBeenCalled();
  });

  it('falls back to name when the mapped domain has gone stale in HubSpot', async () => {
    const byDomain = vi.fn(async () => null);
    const byName = vi.fn(async () => co('456'));
    const hit = await resolveCompanyForIntent(
      { accountSlug: 'pepsico', accountName: 'PepsiCo' }, { byDomain, byName });
    expect(hit?.id).toBe('456');
    expect(byDomain).toHaveBeenCalled();
  });

  it('logs an OBSERVABLE miss (the old silent no-op) and returns null', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hit = await resolveCompanyForIntent(
      { accountSlug: 'nowhere-co', accountName: 'Nowhere Co' },
      { byDomain: vi.fn(async () => null), byName: vi.fn(async () => null) });
    expect(hit).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('nowhere-co');
  });

  it('uses the registry accountName (not the snapshot display name) for the name fallback', async () => {
    // The registry maps slug -> canonical accountName; a native /for page may
    // send a display-style name. The fallback must prefer the registry's.
    const registry = getAccountMicrositeData('dannon');
    const byName = vi.fn(async () => null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await resolveCompanyForIntent(
      { accountSlug: 'dannon', accountName: 'Danone North America LLC (display)' },
      { byDomain: vi.fn(async () => null), byName });
    if (registry) expect(byName).toHaveBeenCalledWith(registry.accountName);
  });
});

describe('ACCOUNT_DOMAINS integrity', () => {
  const entries = Object.entries(ACCOUNT_DOMAINS);

  it('has broad coverage of the registry (>= 50 mapped accounts)', () => {
    expect(entries.length).toBeGreaterThanOrEqual(50);
  });

  it('every domain is a bare lowercase hostname', () => {
    for (const [slug, domain] of entries) {
      expect(domain, slug).toMatch(/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/);
      expect(domain, slug).not.toMatch(/^www\.|https?:|\s/);
      expect(domain, slug).toBe(domain.toLowerCase());
    }
  });

  it('every mapped slug exists in the microsite registry', () => {
    for (const [slug] of entries) {
      expect(getAccountMicrositeData(slug), `unknown registry slug: ${slug}`).toBeTruthy();
    }
  });

  it('domainForAccountSlug returns null for unmapped slugs', () => {
    expect(domainForAccountSlug('jm-smucker')).toBeNull();
    expect(domainForAccountSlug('pepsico')).toBe('pepsico.com');
  });
});
