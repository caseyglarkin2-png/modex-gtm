import { describe, expect, it } from 'vitest';

import {
  extractCitationIds,
  stripCitations,
  validateObservation,
} from '@/lib/gap/hypothesis/observation';

describe('validateObservation', () => {
  it('accepts a fully cited observation and returns cited ids in first-appearance order without duplicates', () => {
    const text =
      'They opened a second DC in Ohio [S:sig_b]. Job posts mention gate staffing [S:sig_a] [S:sig_b]. Trailer counts doubled [S:sig_c].';
    expect(validateObservation(text, ['sig_a', 'sig_b', 'sig_c'])).toEqual({
      ok: true,
      sentences: 3,
      citedIds: ['sig_b', 'sig_a', 'sig_c'],
    });
  });

  it('refuses an empty observation', () => {
    expect(validateObservation('   \n  ', ['sig_a'])).toEqual({
      ok: false,
      reason: 'empty_observation',
    });
  });

  it('refuses an uncited sentence and reports its zero-based index', () => {
    const text = 'They opened a second DC [S:sig_a]. Gate staffing is thin. Trailers doubled [S:sig_a].';
    expect(validateObservation(text, ['sig_a'])).toEqual({
      ok: false,
      reason: 'uncited_sentence',
      sentenceIndex: 1,
    });
  });

  it('refuses a citation whose id is not linked and names the id', () => {
    const text = 'They opened a second DC [S:sig_a]. Gate staffing is thin [S:ghost].';
    expect(validateObservation(text, ['sig_a'])).toEqual({
      ok: false,
      reason: 'unlinked_citation',
      signalId: 'ghost',
    });
  });

  it('reports the first unlinked id in reading order', () => {
    const text = 'One [S:sig_a] [S:first_bad]. Two [S:second_bad].';
    expect(validateObservation(text, ['sig_a'])).toEqual({
      ok: false,
      reason: 'unlinked_citation',
      signalId: 'first_bad',
    });
  });

  it('does not count a sentence that is only a citation token', () => {
    const text = 'They opened a second DC. [S:sig_a]';
    // "[S:sig_a]" alone is not a sentence, so the first sentence is uncited.
    expect(validateObservation(text, ['sig_a'])).toEqual({
      ok: false,
      reason: 'uncited_sentence',
      sentenceIndex: 0,
    });
  });

  it('does not count punctuation-only fragments as sentences', () => {
    const text = 'They opened a second DC [S:sig_a]. ... !';
    expect(validateObservation(text, ['sig_a'])).toEqual({
      ok: true,
      sentences: 1,
      citedIds: ['sig_a'],
    });
  });

  it('splits on newlines as well as terminal punctuation', () => {
    const text = 'Line one has a cite [S:sig_a]\nLine two has none\nLine three [S:sig_b]';
    expect(validateObservation(text, ['sig_a', 'sig_b'])).toEqual({
      ok: false,
      reason: 'uncited_sentence',
      sentenceIndex: 1,
    });
  });

  it('treats ! and ? as sentence terminators', () => {
    const text = 'Really [S:sig_a]? Yes [S:sig_a]! Fine [S:sig_a].';
    expect(validateObservation(text, ['sig_a'])).toEqual({
      ok: true,
      sentences: 3,
      citedIds: ['sig_a'],
    });
  });

  it('does not split on a period without trailing whitespace', () => {
    const text = 'Volume grew 3.5x last year [S:sig_a].';
    expect(validateObservation(text, ['sig_a'])).toEqual({
      ok: true,
      sentences: 1,
      citedIds: ['sig_a'],
    });
  });
});

describe('extractCitationIds', () => {
  it('returns distinct ids in order of first appearance', () => {
    expect(extractCitationIds('a [S:x-1] b [S:y_2] c [S:x-1]')).toEqual(['x-1', 'y_2']);
  });

  it('ignores malformed tokens', () => {
    expect(extractCitationIds('[S:] [S:has space] [T:x] [S:ok]')).toEqual(['ok']);
  });
});

describe('stripCitations', () => {
  it('removes tokens and collapses the double spaces they leave', () => {
    expect(stripCitations('They opened [S:sig_a] a DC [S:sig_b].')).toBe('They opened a DC.');
  });

  it('trims a trailing token cleanly', () => {
    expect(stripCitations('Trailers doubled [S:sig_c]')).toBe('Trailers doubled');
  });
});
