/**
 * The evidence rule. These tests exist because the rule decides what we are
 * willing to put in front of a buyer as fact, and it was previously written
 * inline in one script and re-implemented from memory in two other places.
 */
import { describe, it, expect } from 'vitest';
import {
  evidenceFailure,
  isDurableIndependent,
  isSelfCitation,
  isSearchQuery,
  isSelfIssuedApi,
  isShipEligible,
} from '../../scripts/yard-audit/evidence';

const good = { url: 'https://www.reuters.com/business/some-plant-story', date: '2025-06-01' };

describe('citation classification', () => {
  it('recognises our own domains as self-citation', () => {
    expect(isSelfCitation('https://yardflow.ai/for/tyson-foods')).toBe(true);
    expect(isSelfCitation('https://www.yardflow.ai/demo/ford/')).toBe(true);
    expect(isSelfCitation('https://freightroll.com/about')).toBe(true);
    // Not ours, despite containing the string.
    expect(isSelfCitation('https://notyardflow.aiport.com/x')).toBe(false);
    expect(isSelfCitation('https://example.com/?ref=yardflow.ai')).toBe(false);
  });

  it('recognises endpoints our own agent issued', () => {
    expect(isSelfIssuedApi('https://places.googleapis.com/v1/places:searchNearby?location=1,2')).toBe(true);
    expect(isSelfIssuedApi('https://maps.googleapis.com/maps/api/geocode/json?address=x')).toBe(true);
    expect(isSelfIssuedApi('https://example.com/data?api_key=abc')).toBe(true);
    expect(isSelfIssuedApi('https://example.com/x?key=AIzaSyFake')).toBe(true);
    // A Google MAPS PERMALINK is a durable thing a reader can open — not an API call.
    expect(isSelfIssuedApi('https://www.google.com/maps/@36.19,-94.12,3a,75y/data=!3m1!1e3')).toBe(false);
  });

  it('treats a search-results page as a query, not a document', () => {
    expect(isSearchQuery('https://html.duckduckgo.com/html/?q=%22tyson%22+indianapolis')).toBe(true);
    expect(isSearchQuery('https://www.google.com/search?q=tyson+plant')).toBe(true);
    expect(isSearchQuery('https://www.bing.com/search?q=x')).toBe(true);
    // A Maps permalink resolves to a fixed place and camera — not a search.
    expect(isSearchQuery('https://www.google.com/maps/@36.18898,-94.12498,3a,75y/data=!3m1!1e3')).toBe(false);
    expect(isSearchQuery('https://www.reuters.com/business/story-slug')).toBe(false);
  });

  it('durable means a reader can open it AND it is dated', () => {
    expect(isDurableIndependent(good)).toBe(true);
    expect(isDurableIndependent({ url: good.url })).toBe(false); // no date
    expect(isDurableIndependent({ date: '2025-01' })).toBe(false); // no url
    expect(isDurableIndependent({ url: 'https://yardflow.ai/for/x', date: '2025-01' })).toBe(false);
    expect(
      isDurableIndependent({ url: 'https://places.googleapis.com/v1/places:x', date: '2025-01' }),
    ).toBe(false);
  });
});

describe('evidenceFailure', () => {
  const base = { verdict: 'confirmed', citations: [good], checkedDivestiture: true };

  it('passes a fully evidenced record', () => {
    expect(evidenceFailure('ford', base)).toBeNull();
    expect(isShipEligible('ford', base)).toBe(true);
  });

  it('names each failure precisely', () => {
    expect(evidenceFailure('ford', undefined)).toBe('no-verification-block');
    expect(evidenceFailure('ford', {})).toBe('no-verdict');
    expect(evidenceFailure('ford', { ...base, verdict: 'rejected' })).toBe('rejected');
    expect(evidenceFailure('ford', { ...base, citations: [] })).toBe('no-citations');
    expect(evidenceFailure('ford', { ...base, citations: [{ url: good.url }] })).toBe(
      'citation-missing-url-or-date',
    );
    expect(evidenceFailure('ford', { ...base, checkedDivestiture: false })).toBe('divestiture-unchecked');
  });

  it('closes the self-validating loophole', () => {
    // A record cited entirely to our own page, or entirely to lookups we made.
    expect(
      evidenceFailure('tyson-foods', {
        ...base,
        citations: [{ url: 'https://yardflow.ai/for/tyson-foods', date: '2026-07-30' }],
      }),
    ).toBe('no-durable-independent-citation');
    expect(
      evidenceFailure('tyson-foods', {
        ...base,
        citations: [{ url: 'https://places.googleapis.com/v1/places:searchNearby?x=1', date: '2026-07-30' }],
      }),
    ).toBe('no-durable-independent-citation');
  });

  it('rejects a record whose only non-self source is a search query', () => {
    expect(
      evidenceFailure('tyson-foods', {
        verdict: 'confirmed',
        checkedDivestiture: true,
        citations: [{ url: 'https://html.duckduckgo.com/html/?q=warehouse', date: '2026-07-30' }],
      }),
    ).toBe('no-durable-independent-citation');
  });

  it('accepts a weak citation alongside a durable one — one real source is enough', () => {
    expect(
      evidenceFailure('tyson-foods', {
        ...base,
        citations: [{ url: 'https://yardflow.ai/for/x', date: '2026-01' }, good],
      }),
    ).toBeNull();
  });

  it('requires the bankruptcy-era check only for restructured companies', () => {
    expect(evidenceFailure('general-motors', base)).toBe('bankruptcy-era-unchecked');
    expect(evidenceFailure('general-motors', { ...base, checkedBankruptcyEra: true })).toBeNull();
    expect(evidenceFailure('ford', base)).toBeNull();
  });

  it('reports the FIRST failure, so a rejected site is never reported as uncited', () => {
    expect(evidenceFailure('ford', { verdict: 'rejected' })).toBe('rejected');
  });
});
