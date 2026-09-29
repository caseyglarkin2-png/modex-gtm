/**
 * Universal work intake: conservative identity (2026-09-28). A supplied row is
 * RESOLVED to one existing Persona / Account, a NEW CANDIDATE (known account,
 * new person: staged, never a Persona), AMBIGUOUS (never merged) or
 * UNRESOLVED (GAP never creates an Account). Reuses gap/identity resolveIdentity.
 */
import { describe, expect, it } from 'vitest';
import { resolveIntakeRow, memberKey, type IntakeContext } from '@/lib/gap/intake/resolve';
import type { IntakeRow } from '@/lib/gap/intake/parse';

const identity = {
  accountsByHubspotCompanyId: new Map<string, string>(),
  verifiedDomainToAccounts: new Map<string, string[]>([['acmefoods.com', ['Acme Foods']], ['globex.com', ['Globex']]]),
  aliasToAccounts: new Map<string, string[]>([['acme', ['Acme Foods']]]),
  accountNames: ['Acme Foods', 'Globex', 'Initech', 'Initech Holdings'],
};
const personas = [
  { id: 1, name: 'Angi Acosta', account_name: 'Acme Foods', email: 'angi@acmefoods.com', linkedin_url: 'https://www.linkedin.com/in/angi-acosta/' },
  { id: 2, name: 'Bart Smith', account_name: 'Globex', email: null, linkedin_url: null },
  { id: 3, name: 'Chris Twin', account_name: 'Globex', email: null, linkedin_url: null },
  { id: 4, name: 'Chris Twin', account_name: 'Globex', email: 'c2@globex.com', linkedin_url: null },
];
const ctx: IntakeContext = { identity, personas };
const person = (over: Partial<IntakeRow>): IntakeRow => ({ kind: 'person', raw: {}, ...over });

describe('people', () => {
  it('email match: RESOLVED to that Persona', () => {
    expect(resolveIntakeRow(ctx, person({ name: 'A. Acosta', email: 'ANGI@acmefoods.com' }))).toMatchObject({ resolution: 'resolved', basis: 'email', personaId: 1, accountName: 'Acme Foods' });
  });

  it('LinkedIn profile match (any URL form of the same slug): RESOLVED', () => {
    expect(resolveIntakeRow(ctx, person({ name: 'Angi A', linkedinUrl: 'http://linkedin.com/in/Angi-Acosta' }))).toMatchObject({ resolution: 'resolved', basis: 'linkedin', personaId: 1 });
  });

  it('company resolves and exactly one Persona there has the name (credentials ignored): RESOLVED', () => {
    expect(resolveIntakeRow(ctx, person({ name: 'Bart Smith, MBA', company: 'Globex' }))).toMatchObject({ resolution: 'resolved', basis: 'name_at_account', personaId: 2, accountName: 'Globex' });
  });

  it('company resolves, person unknown there: NEW CANDIDATE (staged, not a Persona)', () => {
    const r = resolveIntakeRow(ctx, person({ name: 'Dana Lee', title: 'VP Distribution', company: 'Acme' }));
    expect(r).toMatchObject({ resolution: 'new_candidate', accountName: 'Acme Foods', basis: 'company:alias' });
    expect(r.personaId).toBeNull();
  });

  it('two Personas with that name at the account: AMBIGUOUS, never merged', () => {
    const r = resolveIntakeRow(ctx, person({ name: 'Chris Twin', company: 'Globex' }));
    expect(r).toMatchObject({ resolution: 'ambiguous', accountName: 'Globex', personaId: null });
    expect(r.candidates.map((c) => c.personaId).sort()).toEqual([3, 4]);
  });

  it('the company NAME inside what was written resolves ("Globex - Dad of 3" is Globex)', () => {
    expect(resolveIntakeRow(ctx, person({ name: 'Dan New', company: 'Globex - Dad of 3' }))).toMatchObject({ resolution: 'new_candidate', accountName: 'Globex' });
  });

  it('a company GAP does not know: UNRESOLVED (no Account is created)', () => {
    expect(resolveIntakeRow(ctx, person({ name: 'Eve Unknown', company: 'Brown Dog Carriers' }))).toMatchObject({ resolution: 'unresolved', basis: 'company_not_in_gap', accountName: null });
  });

  it('no company at all: UNRESOLVED needing identity', () => {
    expect(resolveIntakeRow(ctx, person({ name: 'Fran Slogan', title: 'Dog Dad | Boat Captain' }))).toMatchObject({ resolution: 'unresolved', basis: 'no_company' });
  });

  it('an ambiguous company: AMBIGUOUS', () => {
    const amb = { ...identity, accountNames: [...identity.accountNames, 'Umbrella East', 'Umbrella West'], aliasToAccounts: new Map([['umbrella', ['Umbrella East', 'Umbrella West']]]) };
    expect(resolveIntakeRow({ identity: amb, personas }, person({ name: 'Gil', company: 'Umbrella' }))).toMatchObject({ resolution: 'ambiguous', basis: 'company_ambiguous', accountName: null });
  });

  it('email says one account, the stated company another: AMBIGUOUS (the person may have moved), both recorded', () => {
    const r = resolveIntakeRow(ctx, person({ name: 'Angi Acosta', email: 'angi@acmefoods.com', company: 'Globex' }));
    expect(r.resolution).toBe('ambiguous');
    expect(r.basis).toBe('email_company_conflict');
    expect(r.candidates).toEqual([{ personaId: 1, accountName: 'Acme Foods', why: 'email' }, { personaId: null, accountName: 'Globex', why: 'stated company' }]);
  });

  it('a corporate email domain finds the account when no company is given; a free-mail domain never does', () => {
    expect(resolveIntakeRow(ctx, person({ name: 'Hal New', email: 'hal@globex.com' }))).toMatchObject({ resolution: 'new_candidate', accountName: 'Globex', basis: 'company:domain' });
    expect(resolveIntakeRow(ctx, person({ name: 'Ivy New', email: 'ivy@gmail.com' }))).toMatchObject({ resolution: 'unresolved', basis: 'no_company' });
    // even when a bad canonical row claims a free-mail domain, a personal address never names an employer
    const polluted = { ...identity, verifiedDomainToAccounts: new Map([...identity.verifiedDomainToAccounts, ['gmail.com', ['Globex']]]) };
    expect(resolveIntakeRow({ identity: polluted, personas }, person({ name: 'Ivy New', email: 'ivy@gmail.com' }))).toMatchObject({ resolution: 'unresolved', accountName: null });
  });
});

describe('accounts', () => {
  it('a known company or domain: RESOLVED; unknown: UNRESOLVED', () => {
    expect(resolveIntakeRow(ctx, { kind: 'account', company: 'Globex', raw: {} })).toMatchObject({ resolution: 'resolved', accountName: 'Globex' });
    expect(resolveIntakeRow(ctx, { kind: 'account', companyDomain: 'acmefoods.com', raw: {} })).toMatchObject({ resolution: 'resolved', accountName: 'Acme Foods', basis: 'company:domain' });
    expect(resolveIntakeRow(ctx, { kind: 'account', company: 'Nowhere Co', raw: {} })).toMatchObject({ resolution: 'unresolved', accountName: null });
  });
});

describe('member keys (one row per person per source; re-imports never duplicate)', () => {
  it('email first, then LinkedIn slug, then name + company (or headline)', () => {
    expect(memberKey(person({ name: 'X', email: 'A@B.com', linkedinUrl: 'https://linkedin.com/in/x' }))).toBe('email:a@b.com');
    expect(memberKey(person({ name: 'X', linkedinUrl: 'https://www.linkedin.com/in/Some-One/' }))).toBe('linkedin:some-one');
    expect(memberKey(person({ name: 'Pat Example', company: 'GTI' }))).toBe('name:pat example|gti');
    expect(memberKey(person({ name: 'Pat Example', title: 'Dog Dad' }))).toBe('name:pat example|dog dad');
    expect(memberKey({ kind: 'account', company: 'Acme Foods, Inc.', raw: {} })).toBe('account:acme foods');
    expect(memberKey({ kind: 'account', companyDomain: 'WWW.Acme.com', raw: {} })).toBe('domain:acme.com');
  });
});
