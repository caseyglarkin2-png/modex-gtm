import { describe, expect, it } from 'vitest';

import {
  bodyParagraphs,
  firstBodySentence,
  hasMarker,
  hasSecondPerson,
  isGreetingLine,
  isQuestion,
  isSignatureStart,
  splitParagraphs,
  splitSentences,
  stripGreetingAndSignature,
  stripMarkers,
  wordCount,
} from '@/lib/gap/compiler/text';

const BODY = [
  'Hi Kara,',
  '',
  'Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Trailer counts doubled [S:sig_2].',
  '',
  'My guess is the gate is the bottleneck. Is that close?',
  '',
  'Casey Larkin',
  'YardFlow by FreightRoll',
].join('\n');

describe('stripMarkers', () => {
  it('removes [[SRC:id]] and [S:id] markers and collapses the whitespace they leave', () => {
    expect(stripMarkers('Counts doubled [[SRC:ev_1]] [S:sig-2].')).toBe('Counts doubled.');
    expect(stripMarkers('Plain text.')).toBe('Plain text.');
  });

  it('hasMarker detects either marker form', () => {
    expect(hasMarker('x [[SRC:a]]')).toBe(true);
    expect(hasMarker('x [S:a]')).toBe(true);
    expect(hasMarker('x [SRC:a]')).toBe(false);
  });
});

describe('splitParagraphs / splitSentences', () => {
  it('splits paragraphs on blank lines and trims them', () => {
    expect(splitParagraphs('a\n\n\nb\r\n\r\nc  ')).toEqual(['a', 'b', 'c']);
  });

  it('splits sentences on . ! ? followed by whitespace, plus newlines, dropping marker-only fragments', () => {
    expect(splitSentences('One thing. Two things! Three? [[SRC:x]]\nFour')).toEqual([
      'One thing.',
      'Two things!',
      'Three?',
      'Four',
    ]);
  });

  it('does not split on a decimal point or a dollar figure', () => {
    expect(splitSentences('Dwell fell 3.5 hours to $1.2M. Done.')).toEqual([
      'Dwell fell 3.5 hours to $1.2M.',
      'Done.',
    ]);
  });
});

describe('greeting and signature', () => {
  it('recognises greeting lines', () => {
    expect(isGreetingLine('Hi Kara,')).toBe(true);
    expect(isGreetingLine('Kara,')).toBe(true);
    expect(isGreetingLine('Hello Kara Smith')).toBe(true);
    expect(isGreetingLine('Your Ohio DC posted roles.')).toBe(false);
    expect(isGreetingLine('Kara, the gate is slow')).toBe(false);
  });

  it('recognises the signature start', () => {
    expect(isSignatureStart('Casey Larkin')).toBe(true);
    expect(isSignatureStart('Casey Larkin, YardFlow by FreightRoll')).toBe(true);
    expect(isSignatureStart('Casey')).toBe(true);
    expect(isSignatureStart('Casey Larkin measured it at Primo.')).toBe(false);
  });

  it('stripGreetingAndSignature drops the greeting line and the trailing signature block', () => {
    expect(stripGreetingAndSignature(BODY)).toBe(
      'Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Trailer counts doubled [S:sig_2].\n\nMy guess is the gate is the bottleneck. Is that close?',
    );
  });

  it('bodyParagraphs excludes greeting and signature', () => {
    expect(bodyParagraphs(BODY)).toEqual([
      'Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Trailer counts doubled [S:sig_2].',
      'My guess is the gate is the bottleneck. Is that close?',
    ]);
  });
});

describe('wordCount', () => {
  it('counts words excluding markers, the greeting line and the signature block', () => {
    // 9 + 3 + 8 + 3 = 23 words
    expect(wordCount(BODY)).toBe(23);
  });

  it('is zero for an empty or signature-only body', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount('Casey Larkin\nYardFlow by FreightRoll')).toBe(0);
  });
});

describe('isQuestion / hasSecondPerson / firstBodySentence', () => {
  it('isQuestion is true only for a sentence ending in ?', () => {
    expect(isQuestion('Is that close? ')).toBe(true);
    expect(isQuestion('That is close.')).toBe(false);
  });

  it('hasSecondPerson detects you, your and contractions but not ordinary words', () => {
    expect(hasSecondPerson('Your yards are full.')).toBe(true);
    expect(hasSecondPerson("You'd recover the slot.")).toBe(true);
    expect(hasSecondPerson("you'll see it")).toBe(true);
    expect(hasSecondPerson('Primo measured 48 to 24 minutes.')).toBe(false);
    expect(hasSecondPerson('The youth program and the yourt shop.')).toBe(false);
  });

  it('firstBodySentence skips the greeting line', () => {
    expect(firstBodySentence(BODY)).toBe(
      'Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]].',
    );
    expect(firstBodySentence('Kara,\nYardFlow helps yards. More.')).toBe('YardFlow helps yards.');
    expect(firstBodySentence('')).toBe('');
  });
});
