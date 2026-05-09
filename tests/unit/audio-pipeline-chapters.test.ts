import { describe, expect, it } from 'vitest';
import {
  parseChaptersFromGemini,
  fallbackEvenSplits,
  buildChapterPrompt,
} from '@/scripts/audio-pipeline/stages/chapters';

describe('parseChaptersFromGemini', () => {
  it('parses a clean JSON array into AudioChapter[]', () => {
    const out = parseChaptersFromGemini(
      JSON.stringify([
        { id: 'thesis', label: 'The thesis', start: 0 },
        { id: 'beats', label: 'Cold-chain beats', start: 60 },
      ]),
      { duration: 432 },
    );
    expect(out).toHaveLength(2);
    expect(out![0]).toEqual({ id: 'thesis', label: 'The thesis', start: 0 });
  });

  it('strips a leading code-fence wrapper from the model output', () => {
    const wrapped = '```json\n[{"id":"a","label":"A","start":0}]\n```';
    const out = parseChaptersFromGemini(wrapped, { duration: 100 });
    expect(out).toHaveLength(1);
    expect(out![0].id).toBe('a');
  });

  it('returns null when the JSON is malformed', () => {
    expect(parseChaptersFromGemini('not json at all', { duration: 100 })).toBeNull();
  });

  it('returns null when the first chapter does not start at 0', () => {
    const out = parseChaptersFromGemini(
      JSON.stringify([{ id: 'x', label: 'X', start: 30 }]),
      { duration: 100 },
    );
    expect(out).toBeNull();
  });

  it('returns null when a chapter start exceeds duration', () => {
    const out = parseChaptersFromGemini(
      JSON.stringify([
        { id: 'a', label: 'A', start: 0 },
        { id: 'b', label: 'B', start: 9999 },
      ]),
      { duration: 100 },
    );
    expect(out).toBeNull();
  });
});

describe('fallbackEvenSplits', () => {
  it('produces 5 evenly-spaced chapters covering the full duration', () => {
    const out = fallbackEvenSplits({ duration: 500 });
    expect(out).toHaveLength(5);
    expect(out[0].start).toBe(0);
    expect(out[4].start).toBe(400);
  });

  it('uses generic chapter labels (1–5) when no headings are provided', () => {
    const out = fallbackEvenSplits({ duration: 300 });
    expect(out[0].label).toMatch(/chapter 1/i);
  });

  it('uses provided headings as chapter labels when supplied', () => {
    const out = fallbackEvenSplits({
      duration: 300,
      headings: ['Thesis', 'Beats', 'Network', 'Lessons', 'Tomorrow'],
    });
    expect(out.map((c) => c.label)).toEqual(['Thesis', 'Beats', 'Network', 'Lessons', 'Tomorrow']);
  });
});

describe('buildChapterPrompt', () => {
  it('asks for JSON-only output with the duration embedded', () => {
    const p = buildChapterPrompt({ duration: 432, report: 'A report.' });
    expect(p).toContain('432');
    expect(p.toLowerCase()).toContain('json only');
    expect(p).toContain('A report.');
  });
});
