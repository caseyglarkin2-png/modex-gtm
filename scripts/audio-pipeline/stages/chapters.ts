import { z } from 'zod';
import type { AudioChapter } from '@/components/microsites/memo-audio-brief';

const chapterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  start: z.number().int().nonnegative(),
});
const chaptersSchema = z.array(chapterSchema).min(1).max(8);

export interface ParseOptions {
  /** mp3 duration in seconds — used to validate that no chapter starts past the end. */
  duration: number;
}

export interface FallbackOptions {
  duration: number;
  /** Optional section headings to label the splits with. Length should be 5. */
  headings?: string[];
}

export interface ChapterPromptInput {
  duration: number;
  /** The Gemini deep-research report (markdown). */
  report: string;
}

/**
 * Parse the JSON Gemini emits in response to the segmentation prompt.
 * Returns the validated AudioChapter[] or null if anything is off — caller
 * falls back to even-splits and flags the gap in the PR.
 */
export function parseChaptersFromGemini(raw: string, opts: ParseOptions): AudioChapter[] | null {
  const stripped = stripCodeFence(raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }
  const validated = chaptersSchema.safeParse(parsed);
  if (!validated.success) return null;
  const chapters = validated.data;
  if (chapters[0].start !== 0) return null;
  if (chapters.some((c) => c.start > opts.duration)) return null;
  // Ensure starts are monotonically increasing.
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].start <= chapters[i - 1].start) return null;
  }
  return chapters;
}

/**
 * Even-length 5-chapter fallback. Used when Gemini's segmentation output
 * fails validation. Caller should flag the fallback in the PR description.
 */
export function fallbackEvenSplits(opts: FallbackOptions): AudioChapter[] {
  const slices = 5;
  const step = Math.floor(opts.duration / slices);
  return Array.from({ length: slices }, (_, i) => ({
    id: `chapter-${i + 1}`,
    label: opts.headings?.[i] ?? `Chapter ${i + 1}`,
    start: i * step,
  }));
}

export function buildChapterPrompt(input: ChapterPromptInput): string {
  return [
    'Below is a deep-research report and the duration in seconds of a podcast version of that report.',
    '',
    `Podcast duration: ${input.duration} seconds.`,
    '',
    "Propose 5 chapter boundaries that match the report's narrative arc. Output JSON only — no prose, no code-fence wrappers — with the shape:",
    '',
    '[{"id": "kebab-case-slug", "label": "Human readable", "start": <integer seconds>}]',
    '',
    'The first chapter must start at 0. Starts must be strictly increasing. No start may exceed the duration.',
    '',
    '## Report',
    '',
    input.report,
  ].join('\n');
}

function stripCodeFence(s: string): string {
  return s
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '');
}
