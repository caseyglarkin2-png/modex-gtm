import { describe, it, expect } from 'vitest';
import { TICKER_TO_SLUG, slugForTicker, looksLikeTicker } from '../../src/lib/pounce/ticker';
import { getAccountMicrositeData } from '../../src/lib/microsites/accounts';

// ---------------------------------------------------------------------------
// EDGAR-sourced triggers arrive carrying a TICKER, not a company name:
// { accountSlug: 'ko', accountName: 'KO' }. A backfill of the live table on
// 2026-07-30 found 27 of 32 rows in that state - KO, FDX, PEP, KR, GIS, CAG,
// JBHT, KNX - all Tier A accounts, several with live spear pages.
//
// A ticker resolves nothing: no registry entry (so no spear link), no
// searchCompanyByName hit (so no company id, no Note, no trigger_score), and
// therefore no account heat and no committee promotion. Every one of those
// triggers was inert end to end.
// ---------------------------------------------------------------------------

describe('ticker map integrity', () => {
  // The important one. A mapping that points at a slug the registry does not
  // have would file a trigger against nothing; a mapping that points at the
  // WRONG slug would file it against a competitor and link their spear page.
  // Both fail here rather than in production.
  it('every mapped slug exists in the microsite registry', () => {
    const broken = Object.entries(TICKER_TO_SLUG)
      .filter(([, slug]) => !getAccountMicrositeData(slug))
      .map(([ticker, slug]) => `${ticker} -> ${slug}`);
    expect(broken).toEqual([]);
  });

  it('maps no ticker twice to different accounts, and no account twice', () => {
    const slugs = Object.values(TICKER_TO_SLUG);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every key is ticker-shaped and upper-case', () => {
    for (const ticker of Object.keys(TICKER_TO_SLUG)) {
      expect(looksLikeTicker(ticker)).toBe(true);
      expect(ticker).toBe(ticker.toUpperCase());
    }
  });
});

describe('slugForTicker', () => {
  it('resolves the tickers actually seen in the live table', () => {
    // The exact rows the backfill could not resolve.
    expect(slugForTicker('KO')).toBe('coca-cola');
    expect(slugForTicker('FDX')).toBe('fedex');
    expect(slugForTicker('PEP')).toBe('pepsico');
    expect(slugForTicker('KR')).toBe('kroger');
    expect(slugForTicker('GIS')).toBe('general-mills');
  });

  it('is case-insensitive, because producers disagree on case', () => {
    // accountSlug arrives lower-cased, accountName upper.
    expect(slugForTicker('ko')).toBe('coca-cola');
    expect(slugForTicker('Ko')).toBe('coca-cola');
  });

  // The dangerous direction. A false positive silently reassigns a trigger to
  // the wrong account, which is worse than leaving it unresolved.
  it('never fires on a real company name', () => {
    for (const name of [
      'Kroger',
      'The Coca-Cola Company',
      'FedEx',
      'AB InBev',
      'Kraft Heinz',
      '3M',
      'H-E-B',
      'JM Smucker',
    ]) {
      expect(slugForTicker(name)).toBeNull();
    }
  });

  it('returns null for a ticker we have no account for', () => {
    // CAG, JBHT and KNX are real tickers with no registry account. They must
    // fall through to the existing HubSpot-search fallback, not guess.
    for (const t of ['CAG', 'JBHT', 'KNX', 'ZZZZ']) {
      expect(slugForTicker(t)).toBeNull();
    }
  });

  it('handles empty and whitespace input', () => {
    expect(slugForTicker('')).toBeNull();
    expect(slugForTicker('   ')).toBeNull();
    expect(slugForTicker(undefined as unknown as string)).toBeNull();
  });
});
