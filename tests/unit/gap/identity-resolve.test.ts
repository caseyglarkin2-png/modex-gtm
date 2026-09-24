import { describe, expect, it } from 'vitest';
import { resolveIdentity, type IdentityContext } from '@/lib/gap/identity/resolve';

function ctx(overrides: Partial<IdentityContext> = {}): IdentityContext {
  return {
    accountsByHubspotCompanyId: new Map(),
    verifiedDomainToAccounts: new Map(),
    aliasToAccounts: new Map(),
    accountNames: [],
    ...overrides,
  };
}

describe('resolveIdentity', () => {
  it('refuses no_input when nothing is given', () => {
    const r = resolveIdentity(ctx(), {});
    expect(r).toEqual({ ok: false, reason: 'no_input' });
  });

  it('refuses unresolved_company for a genuinely unknown company', () => {
    const r = resolveIdentity(ctx({ accountNames: ['Acme'] }), { rawName: 'Nobody Ever Heard Of This Co' });
    expect(r).toEqual({ ok: false, reason: 'unresolved_company' });
  });

  it('the headline identity-gap acceptance case: "Niagara Bottling, Llc" resolves to "Niagara Bottling" via the normalized fallback tier', () => {
    const r = resolveIdentity(ctx({ accountNames: ['Niagara Bottling', 'Some Other Co'] }), {
      rawName: 'Niagara Bottling, Llc',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.accountName).toBe('Niagara Bottling');
    expect(r.via).toBe('normalized');
  });

  it('an exact name match is full confidence within the normalized tier', () => {
    const r = resolveIdentity(ctx({ accountNames: ['Acme'] }), { rawName: 'Acme' });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.via).toBe('normalized');
    expect(r.confidence).toBe(100);
  });

  it('refuses ambiguous_identity when two accounts normalize to the same key and neither is an exact match', () => {
    const r = resolveIdentity(ctx({ accountNames: ['Acme Inc', 'Acme LLC'] }), { rawName: 'Acme Corp' });
    expect(r).toEqual({ ok: false, reason: 'ambiguous_identity' });
  });

  // ---------------------------------------------------------------------
  // Precedence: hubspot_company_id > domain > alias > normalized name.
  // ---------------------------------------------------------------------

  it('tier A: an associated HubSpot company id resolves outright, ignoring a conflicting name', () => {
    const r = resolveIdentity(
      ctx({
        accountsByHubspotCompanyId: new Map([['hs_1', 'Niagara Bottling']]),
        accountNames: ['Niagara Bottling', 'Someone Else'],
      }),
      { hubspotCompanyId: 'hs_1', rawName: 'Someone Else' },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.accountName).toBe('Niagara Bottling');
    expect(r.via).toBe('hubspot_company_id');
    expect(r.confidence).toBe(100);
  });

  it('tier A conflict with a name-derived candidate is auditable: company id wins, conflict is reported', () => {
    const r = resolveIdentity(
      ctx({
        accountsByHubspotCompanyId: new Map([['hs_1', 'Niagara Bottling']]),
        accountNames: ['Niagara Bottling', 'Someone Else'],
      }),
      { hubspotCompanyId: 'hs_1', rawName: 'Someone Else' },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.conflict).toEqual({ via: 'normalized', accountName: 'Someone Else' });
  });

  it('tier B: a verified domain resolves when no HubSpot company id is given', () => {
    const r = resolveIdentity(
      ctx({
        verifiedDomainToAccounts: new Map([['niagarawater.com', ['Niagara Bottling']]]),
        accountNames: ['Niagara Bottling'],
      }),
      { domain: 'niagarawater.com' },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.accountName).toBe('Niagara Bottling');
    expect(r.via).toBe('domain');
  });

  it('domain beats a conflicting name-derived candidate, and the conflict is reported', () => {
    const r = resolveIdentity(
      ctx({
        verifiedDomainToAccounts: new Map([['niagarawater.com', ['Niagara Bottling']]]),
        accountNames: ['Niagara Bottling', 'Wrong Guess'],
      }),
      { domain: 'niagarawater.com', rawName: 'Wrong Guess' },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.accountName).toBe('Niagara Bottling');
    expect(r.via).toBe('domain');
    expect(r.conflict).toEqual({ via: 'normalized', accountName: 'Wrong Guess' });
  });

  it('domain normalization strips a leading www.', () => {
    const r = resolveIdentity(
      ctx({ verifiedDomainToAccounts: new Map([['acme.com', ['Acme']]]), accountNames: ['Acme'] }),
      { domain: 'www.Acme.com' },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.accountName).toBe('Acme');
  });

  it('a domain that maps to more than one account is ambiguous at that tier and falls through', () => {
    const r = resolveIdentity(
      ctx({
        verifiedDomainToAccounts: new Map([['shared.com', ['Account One', 'Account Two']]]),
        accountNames: ['Account One', 'Account Two'],
      }),
      { domain: 'shared.com' },
    );
    expect(r).toEqual({ ok: false, reason: 'ambiguous_identity' });
  });

  it('tier C: an explicit registered alias resolves when no company id or domain is given', () => {
    // The alias key is stored ALREADY normalized (same normalizeCompanyName
    // the resolver applies to the input), so "niagara bottling" here, not a
    // hand-typed "llc"-suffixed variant that normalizeCompanyName would
    // never actually produce as a lookup key.
    const r = resolveIdentity(
      ctx({
        aliasToAccounts: new Map([['niagara bottling', ['Niagara Bottling']]]),
        accountNames: ['Niagara Bottling'],
      }),
      { rawName: 'Niagara Bottling, LLC' },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    expect(r.via).toBe('alias');
  });

  it('alias beats the normalized-name fallback when they would otherwise disagree', () => {
    const r = resolveIdentity(
      ctx({
        aliasToAccounts: new Map([['acme freight group', ['Acme Freight']]]),
        accountNames: ['Acme Freight', 'Acme Freight Group'],
      }),
      { rawName: 'Acme Freight Group' },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('unreachable');
    // rawName is an exact match for "Acme Freight Group" too, but the
    // explicit alias mapping is a higher tier and wins.
    expect(r.accountName).toBe('Acme Freight');
    expect(r.via).toBe('alias');
    expect(r.conflict).toEqual({ via: 'normalized', accountName: 'Acme Freight Group' });
  });
});
