/**
 * Universal work intake: parsing what Casey actually supplies (2026-09-28).
 * One parser for CSV, TSV/pasted tables, newline lists and a LinkedIn-style
 * "Name / Headline" paste. It keeps exactly what was supplied (the raw row)
 * and never fabricates a field: a headline without a company yields no
 * company.
 */
import { describe, expect, it } from 'vitest';
import { parseIntake } from '@/lib/gap/intake/parse';

describe('tables: CSV and pasted TSV with a header row', () => {
  it('maps common columns (name, first/last, title, company, email, linkedin, domain, notes) and keeps the raw row', () => {
    const csv = 'First Name,Last Name,Job Title,Company,Email,LinkedIn URL,Website,Notes\nAngi,Acosta,VP Distribution,"Acme Foods, Inc.",angi@acme.com,https://www.linkedin.com/in/angi,acme.com,"met at Inland26"';
    const r = parseIntake(csv, 'people');
    expect(r.format).toBe('csv');
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ kind: 'person', name: 'Angi Acosta', title: 'VP Distribution', company: 'Acme Foods, Inc.', email: 'angi@acme.com', linkedinUrl: 'https://www.linkedin.com/in/angi', companyDomain: 'acme.com', note: 'met at Inland26' });
    expect(r.rows[0].raw).toMatchObject({ 'First Name': 'Angi', Company: 'Acme Foods, Inc.' });
    expect(r.unmappedColumns).toEqual([]);
  });

  it('a pasted spreadsheet (tabs) works the same; unknown columns are kept raw and reported', () => {
    const tsv = 'Name\tTitle\tCompany\tBadge ID\nBart Smith\tDirector, Transportation\tGlobex\tB-1182';
    const r = parseIntake(tsv, 'people');
    expect(r.format).toBe('tsv');
    expect(r.rows[0]).toMatchObject({ name: 'Bart Smith', title: 'Director, Transportation', company: 'Globex' });
    expect(r.rows[0].sourceId).toBeUndefined(); // a badge id is not a CRM id: kept raw, never promoted
    expect(r.rows[0].raw['Badge ID']).toBe('B-1182');
    expect(r.unmappedColumns).toEqual(['Badge ID']);
  });

  it('an account table maps company and domain', () => {
    const r = parseIntake('Company,Domain\nKroger,kroger.com\nGeneral Mills,generalmills.com', 'accounts');
    expect(r.rows.map((x) => [x.kind, x.company, x.companyDomain])).toEqual([['account', 'Kroger', 'kroger.com'], ['account', 'General Mills', 'generalmills.com']]);
  });

  it('blank rows and exact duplicate rows are dropped, and counted', () => {
    const r = parseIntake('Name,Company\nA B,Acme\n\nA B,Acme\n', 'people');
    expect(r.rows).toHaveLength(1);
    expect(r.skipped).toEqual({ blank: 1, duplicate: 1 });
  });
});

describe('newline lists', () => {
  it('accounts: one company per line (a trailing domain in parentheses is kept)', () => {
    const r = parseIntake('Kroger\nGeneral Mills (generalmills.com)\n  \nUNFI', 'accounts');
    expect(r.format).toBe('lines');
    expect(r.rows.map((x) => [x.company, x.companyDomain ?? null])).toEqual([['Kroger', null], ['General Mills', 'generalmills.com'], ['UNFI', null]]);
  });

  it('people: "Name, Title, Company", "Name - Title at Company", "Name <email>"', () => {
    const r = parseIntake('Angi Acosta, VP Distribution, Acme Foods\nBart Smith - Director of Transportation at Globex\nCasey Q <casey.q@example.com>', 'people');
    expect(r.rows[0]).toMatchObject({ name: 'Angi Acosta', title: 'VP Distribution', company: 'Acme Foods' });
    expect(r.rows[1]).toMatchObject({ name: 'Bart Smith', title: 'Director of Transportation', company: 'Globex' });
    expect(r.rows[2]).toMatchObject({ name: 'Casey Q', email: 'casey.q@example.com' });
    expect(r.rows[2].company).toBeUndefined(); // never fabricated
  });
});

describe('a one-column list with a header line', () => {
  it('"Company" on the first line is the header, not a company', () => {
    expect(parseIntake('Company\nKroger\nUNFI', 'accounts').rows.map((r) => r.company)).toEqual(['Kroger', 'UNFI']);
    expect(parseIntake('Kroger\nUNFI', 'accounts').rows.map((r) => r.company)).toEqual(['Kroger', 'UNFI']);
  });
});

describe('a LinkedIn-style list paste (name line, then headline line)', () => {
  it('pairs a name with its headline; "Title at Company" yields both; a headline with no company yields only the headline as title', () => {
    const paste = [
      'Angi Acosta',
      '· 2nd',
      'VP Distribution at Acme Foods',
      'Bart Smith',
      '· 3rd+',
      'Supply chain leader | Speaker | Dad',
      'Dana Lee',
      '· 1st',
      'Director of Transportation @ Globex',
      'Lone Name Without A Degree Line',
    ].join('\n');
    const r = parseIntake(paste, 'people');
    expect(r.format).toBe('name_headline');
    expect(r.rows.map((x) => [x.name, x.title ?? null, x.company ?? null])).toEqual([
      ['Angi Acosta', 'VP Distribution', 'Acme Foods'],
      ['Bart Smith', 'Supply chain leader | Speaker | Dad', null],
      ['Dana Lee', 'Director of Transportation', 'Globex'],
    ]);
    expect(r.skipped.unparsed).toBe(1); // a line the list could not place is counted, never guessed
  });
});

describe('the LinkedIn newsletter subscriber dialog, copied as-is (synthetic names, the real shape)', () => {
  it('drops the count header, degree lines and action buttons; keeps the degree as a source attribute', () => {
    const paste = [
      '391 Subscribers', '',
      'Pat Example  ', '1st degree connection', '1st', '', 'CEO at GTI', '', 'Message', '',
      'Sam Sample  ', '2nd degree connection', '2nd', '', 'Human Resources Professional & Author | MBA', '', 'Follow', '',
      'Lee Placeholder, MBA  ', '3rd degree connection', '3rd', '', 'Director of Distribution at Acme Foods, Inc.', '', 'Connect',
    ].join('\n');
    const r = parseIntake(paste, 'people');
    expect(r.format).toBe('name_headline');
    expect(r.rows.map((x) => [x.name, x.title ?? null, x.company ?? null, x.raw.degree ?? null])).toEqual([
      ['Pat Example', 'CEO', 'GTI', '1st'],
      ['Sam Sample', 'Human Resources Professional & Author | MBA', null, '2nd'],
      ['Lee Placeholder, MBA', 'Director of Distribution', 'Acme Foods, Inc.', '3rd'],
    ]);
  });
});

describe('limits', () => {
  it('refuses more than the row limit with a clear reason instead of truncating silently', () => {
    const big = ['Name,Company', ...Array.from({ length: 2001 }, (_, i) => `P${i} X,Co${i}`)].join('\n');
    const r = parseIntake(big, 'people');
    expect(r.error).toBe('too_many_rows:2001>2000');
    expect(r.rows).toEqual([]);
  });
});
