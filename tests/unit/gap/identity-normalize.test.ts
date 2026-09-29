import { describe, expect, it } from 'vitest';
import { normalizeCompanyName } from '@/lib/gap/identity/normalize';

describe('normalizeCompanyName', () => {
  it('resolves the headline identity-gap case: a trailing legal suffix with punctuation', () => {
    expect(normalizeCompanyName('Niagara Bottling, Llc')).toBe(normalizeCompanyName('Niagara Bottling'));
    expect(normalizeCompanyName('Niagara Bottling, Llc')).toBe('niagara bottling');
  });

  it('strips common legal-entity suffixes regardless of case and punctuation', () => {
    expect(normalizeCompanyName('Acme Inc.')).toBe('acme');
    expect(normalizeCompanyName('Acme, Inc')).toBe('acme');
    expect(normalizeCompanyName('ACME CORP')).toBe('acme');
    expect(normalizeCompanyName('Acme Corporation')).toBe('acme');
    expect(normalizeCompanyName('Acme Ltd.')).toBe('acme');
    expect(normalizeCompanyName('Acme Limited')).toBe('acme');
    expect(normalizeCompanyName('Acme Co.')).toBe('acme');
    expect(normalizeCompanyName('Acme Company')).toBe('acme');
    expect(normalizeCompanyName('Acme LLC')).toBe('acme');
  });

  it('strips a leading "The" and collapses whitespace/punctuation', () => {
    expect(normalizeCompanyName('The   Acme   Company')).toBe('acme');
    expect(normalizeCompanyName("O'Malley's Freight, Inc.")).toBe('omalleys freight'); // an apostrophe stays inside its word (2026-09-29)
  });

  it('folds an ampersand to "and"', () => {
    expect(normalizeCompanyName('Procter & Gamble')).toBe('procter and gamble');
  });

  it('never strips down to an empty string, even for a name that is only a suffix token', () => {
    expect(normalizeCompanyName('Inc')).toBe('inc');
    expect(normalizeCompanyName('The Co')).toBe('co');
  });

  it('strips multiple trailing suffix tokens', () => {
    expect(normalizeCompanyName('Acme Holdings Corp Inc')).toBe('acme holdings');
  });

  it('is a pure function: same input always yields the same output, no I/O', () => {
    const a = normalizeCompanyName('Niagara Bottling, Llc');
    const b = normalizeCompanyName('Niagara Bottling, Llc');
    expect(a).toBe(b);
  });

  it('folds accents instead of dropping the letter (B4): Nestlé is Nestle, not "nestl"', () => {
    expect(normalizeCompanyName('Nestlé USA')).toBe('nestle usa');
    expect(normalizeCompanyName('Nestlé USA')).toBe(normalizeCompanyName('Nestle USA'));
    expect(normalizeCompanyName('Café Três Corações')).toBe('cafe tres coracoes');
    expect(normalizeCompanyName('Ferrero Rocher S.p.A.')).toBe('ferrero rocher s p a');
  });

  it('treats an apostrophe as part of the word (Kelloggs), straight or curly', () => {
    expect(normalizeCompanyName("Kellogg's")).toBe('kelloggs');
    expect(normalizeCompanyName('Kellogg’s')).toBe('kelloggs');
  });
});
