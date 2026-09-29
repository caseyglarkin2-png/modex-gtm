/**
 * Release A read-only review (2026-09-28): the intake defects it found, pinned.
 * Frozen provenance makes a misparse permanent, so the parser must never shift,
 * invent or collapse.
 */
import { describe, expect, it } from 'vitest';
import { parseIntake, splitHeadline } from '@/lib/gap/intake/parse';
import { memberKey, personKey, resolveIntakeRow, type IntakeContext } from '@/lib/gap/intake/resolve';

const people = (lines: string[]) => parseIntake(lines.join('\n'), 'people').rows.map((r) => [r.name ?? null, r.title ?? null, r.company ?? null]);

describe('P1-2 the LinkedIn list is anchored on the degree line, never paired by position', () => {
  it('a doubled name line does not shift the next person', () => {
    expect(people(['Jane Doe', 'Jane Doe', '· 2nd', 'VP Supply Chain at Acme Foods', 'Connect', 'Bob Roe', '· 1st', 'Director of Transportation at Globex', 'Message'])).toEqual([
      ['Jane Doe', 'VP Supply Chain', 'Acme Foods'],
      ['Bob Roe', 'Director of Transportation', 'Globex'],
    ]);
  });
  it('a status line and a person with no headline do not shift anyone', () => {
    expect(people(['Jane Doe', 'Status is reachable', '· 2nd', 'Connect', 'Bob Roe', '· 1st', 'CEO at GTI', 'Message'])).toEqual([
      ['Jane Doe', null, null],
      ['Bob Roe', 'CEO', 'GTI'],
    ]);
  });
  it('a "•" bullet degree is recognized (never a person named "• 2nd")', () => {
    const r = parseIntake(['Jane Doe', '• 2nd', 'VP Ops at Acme Foods', 'Connect', 'Bob Roe', '• 3rd+', 'Owner', 'Follow'].join('\n'), 'people');
    expect(r.format).toBe('name_headline');
    expect(r.rows.map((x) => x.name)).toEqual(['Jane Doe', 'Bob Roe']);
  });
});

describe('P1-3 a headline never invents an employer', () => {
  it('a former role, an open-to-work line or a lowercase phrase is not a company', () => {
    expect(splitHeadline('Ex-VP Ops at Target | Advisor')).toEqual({ title: 'Ex-VP Ops at Target | Advisor' });
    expect(splitHeadline('Former Director at Kroger')).toEqual({ title: 'Former Director at Kroger' });
    expect(splitHeadline('Retired from Tyson')).toEqual({ title: 'Retired from Tyson' });
    expect(splitHeadline('Looking at new opportunities')).toEqual({ title: 'Looking at new opportunities' });
    expect(splitHeadline('Open to work at any 3PL')).toEqual({ title: 'Open to work at any 3PL' });
    expect(splitHeadline('Dreamer at heart')).toEqual({ title: 'Dreamer at heart' });
    expect(splitHeadline('VP Distribution at Acme Foods')).toEqual({ title: 'VP Distribution', company: 'Acme Foods' });
  });
});

describe('P1-4 a line list never turns credentials or "Last, First" into a company', () => {
  it('credentials stay in the name; a two-word "Doe, Jane" is a name as supplied', () => {
    expect(people(['Lee Placeholder, MBA', 'Doe, Jane', 'Angi Acosta, Acme Foods'])).toEqual([
      ['Lee Placeholder, MBA', null, null],
      ['Doe, Jane', null, null],
      ['Angi Acosta', null, 'Acme Foods'],
    ]);
  });
});

describe('P1-5 different people never collapse to one member', () => {
  const key = (name: string, over: Record<string, string> = {}) => memberKey({ kind: 'person', name, raw: {}, ...over });
  it('same name + company with different titles are different members', () => {
    expect(key('John Smith', { company: 'Acme', title: 'Director' })).not.toBe(key('John Smith', { company: 'Acme', title: 'Manager' }));
  });
  it('"Doe, Jane" and "Doe, John" are different people; a credential is not part of the identity', () => {
    expect(key('Doe, Jane', { company: 'Acme' })).not.toBe(key('Doe, John', { company: 'Acme' }));
    expect(personKey('Lee Placeholder, MBA')).toBe(personKey('Lee Placeholder'));
  });
  it('non-Latin names keep their letters (never an empty key)', () => {
    expect(personKey('李明')).toBe('李明');
    expect(key('李明', { company: 'Acme' })).not.toBe(key('王芳', { company: 'Acme' }));
  });
  it('duplicates dropped inside one paste are counted, never silent', () => {
    const r = parseIntake('Name,Company\nA B,Acme\nA B,Acme', 'people');
    expect(r.skipped.duplicate).toBe(1);
  });
});

describe('P2 identity and columns', () => {
  const ctx: IntakeContext = {
    identity: { accountsByHubspotCompanyId: new Map(), verifiedDomainToAccounts: new Map(), aliasToAccounts: new Map(), accountNames: ['Acme Foods'] },
    personas: [{ id: 1, name: 'Angi Acosta', account_name: 'Acme Foods', email: 'angi@acmefoods.com', linkedin_url: null }],
  };
  it('an email match with a stated company GAP does not know is AMBIGUOUS (the person may have moved)', () => {
    const r = resolveIntakeRow(ctx, { kind: 'person', name: 'Angi Acosta', email: 'angi@acmefoods.com', company: 'Brand New Startup', raw: {} });
    expect(r.resolution).toBe('ambiguous');
    expect(r.candidates.map((c) => c.accountName)).toEqual(['Acme Foods', 'Brand New Startup (not in GAP)']);
  });
  it('HubSpot export columns map (Company Domain Name, Website URL, Organization Name)', () => {
    const r = parseIntake('First Name,Last Name,Organization Name,Company Domain Name,Record ID\nAngi,Acosta,Acme Foods,acmefoods.com,501', 'people');
    expect(r.rows[0]).toMatchObject({ name: 'Angi Acosta', company: 'Acme Foods', companyDomain: 'acmefoods.com', sourceId: '501' });
    expect(parseIntake('Website URL\nhttps://acmefoods.com', 'accounts').rows[0]).toMatchObject({ companyDomain: 'acmefoods.com' });
  });
  it('a header with no recognized column is refused in preview, never imported as a row', () => {
    expect(parseIntake('Foo\tBar\n1\t2', 'people').error).toBe('unrecognized_columns:Foo,Bar');
  });
});
