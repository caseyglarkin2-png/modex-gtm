/**
 * THE DRIVE PARSERS (the Google Workspace and Gemini extension, Priority 3, 2026-10-10). Pure, deterministic, no model.
 *
 * The Drive client hands these readers EXTRACTED TEXT (a Doc, Sheet or Slides exported by the API as text/plain,
 * text/csv or markdown; a DOCX, XLSX or PPTX cut to text by the client's zip reader; a Markdown or text file as it
 * is) and the readers cut it along the document's own structure into passages, each labelled by what it is:
 *   - source: the document's own words (a dossier, an article, a memo)
 *   - gemini_interpretation: what Gemini wrote about a meeting (its notes, summary, decisions, suggested next steps),
 *     labelled as generated and kept apart from what people said
 *   - transcript: a line someone said, attributed to the speaker when the line names one (never dropped, but bounded
 *     to the useful lines, so a forty-minute call is not one record)
 *   - table: a sheet's rows with their header
 *   - slide: one slide, numbered
 * A document that yields no text (an image-only deck or PDF, an empty file, fewer than MIN_READABLE_CHARS characters
 * that are not whitespace) is `readable: false` with the reason; the sync records it as unreadable and NO record is
 * made from it. Nothing here resolves an account, rewrites a sentence, or follows an instruction found in a file.
 */
import { dateFromWords } from './report-parsers';

export type PassageKind = 'source' | 'gemini_interpretation' | 'transcript' | 'table' | 'slide';
export interface DrivePassage {
  heading: string | null;
  text: string;
  kind: PassageKind;
  /** A transcript line's speaker, when the line names one. */
  speaker?: string | null;
}
export type DriveFormat = 'gemini_notes' | 'document' | 'sheet' | 'slides' | 'text';
export interface DriveParse {
  format: DriveFormat;
  passages: DrivePassage[];
  links: string[];
  /** Every YYYY-MM-DD the text states, in order of appearance, deduplicated. */
  dates: string[];
  readable: boolean;
  unreadableReason: string | null;
  /** The document's own title when it states one (a Gemini note's meeting title, a markdown H1). */
  title: string | null;
  /** The meeting date a Gemini note states (its dateline), apart from any other date in the text. */
  meetingDate: string | null;
  /** The attendees a Gemini note names (emails), as written. */
  attendees: string[];
  /** Transcript lines kept of the lines present (a Gemini note), so the cut is said. */
  transcript: { kept: number; total: number } | null;
}

/** Fewer characters than this (whitespace apart) is no document: an image-only export, an empty file. */
export const MIN_READABLE_CHARS = 40;
/** The transcript lines a Gemini note keeps: the substantive ones, in order, bounded. */
export const TRANSCRIPT_LINE_MIN_CHARS = 30;
export const TRANSCRIPT_LINES_MAX = 12;
export const TRANSCRIPT_CHARS_MAX = 4_000;
/** A sheet's rows kept per table passage. */
export const SHEET_ROWS_MAX = 60;

const GOOGLE_SHEET = 'application/vnd.google-apps.spreadsheet';
const GOOGLE_SLIDES = 'application/vnd.google-apps.presentation';
const SHEET_MIMES = new Set([GOOGLE_SHEET, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']);
const SLIDES_MIMES = new Set([GOOGLE_SLIDES, 'application/vnd.openxmlformats-officedocument.presentationml.presentation']);
const TEXT_MIMES = new Set(['text/plain', 'text/markdown']);

const nonWhitespace = (s: string): number => s.replace(/\s+/g, '').length;
const unbold = (s: string) => s.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();
const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;

/** Every YYYY-MM-DD the text states, as ISO dates or as "Jul 16, 2026" words, in order, deduplicated. */
export function datesIn(text: string): string[] {
  const out: string[] = [];
  const push = (d: string | null) => { if (d && !out.includes(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`))) out.push(d); };
  const marks: Array<{ at: number; d: string }> = [];
  for (const m of text.matchAll(ISO_DATE)) marks.push({ at: m.index ?? 0, d: m[0] });
  for (const m of text.matchAll(/\b([A-Z][a-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})\b/g)) { const d = dateFromWords(m[0]); if (d) marks.push({ at: m.index ?? 0, d }); }
  for (const m of marks.sort((a, b) => a.at - b.at)) push(m.d);
  return out;
}

/** Every http(s) link in the text (markdown targets and bare urls), in order, deduplicated; mailto and the like excluded. */
export function linksIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/https?:\/\/[^\s)<>\]"']+/g)) {
    const url = m[0].replace(/[.,;:]+$/, '').replace(/\\([_&!])/g, '$1');
    if (!out.includes(url)) out.push(url);
  }
  return out;
}

const unreadable = (format: DriveFormat, reason: string): DriveParse => ({ format, passages: [], links: [], dates: [], readable: false, unreadableReason: reason, title: null, meetingDate: null, attendees: [], transcript: null });

/** The readability guard every format shares: the one place that decides "no document here". */
function readabilityOf(text: string | null | undefined): string | null {
  const n = nonWhitespace(text ?? '');
  if (n === 0) return 'the document yields no text (image-only or empty); nothing was extracted';
  if (n < MIN_READABLE_CHARS) return `the document yields ${n} characters of text, fewer than ${MIN_READABLE_CHARS}: image-only or empty; nothing usable was extracted`;
  return null;
}

/** The one entry point: the format from the mime type and the text's own shape, then that format's reader. */
export function parseDriveText(input: { mimeType: string; name: string; text: string | null; unreadableReason?: string | null }): DriveParse {
  const format = formatOf(input.mimeType, input.text ?? '');
  if (input.unreadableReason) return unreadable(format, input.unreadableReason);
  const reason = readabilityOf(input.text);
  if (reason) return unreadable(format, reason);
  const text = (input.text ?? '').replace(/\r\n?/g, '\n');
  switch (format) {
    case 'gemini_notes': return parseGeminiNotes(text);
    case 'sheet': return parseSheetText(text);
    case 'slides': return parseSlidesText(text);
    case 'text': return parseDocumentText(text, 'text');
    default: return parseDocumentText(text, 'document');
  }
}

export function formatOf(mimeType: string, text: string): DriveFormat {
  if (isGeminiNotes(text)) return 'gemini_notes';
  if (SHEET_MIMES.has(mimeType)) return 'sheet';
  if (SLIDES_MIMES.has(mimeType)) return 'slides';
  if (TEXT_MIMES.has(mimeType)) return 'text';
  return 'document';
}

/** A "Notes by Gemini" document: Google's own footer line, or its quick notes and full notes headings together. */
export function isGeminiNotes(text: string): boolean {
  return /review Gemini'?s notes/i.test(text) || /Notes by Gemini/i.test(text) || (/^#+\s*\**[^\n]*Quick notes/im.test(text) && /^#+\s*\**[^\n]*Full notes/im.test(text));
}

// ------------------------------------------------------------------------------------------------ documents

/** Markdown headings (# to ######), or a line of bold text alone, start a section. */
function headingOf(line: string): string | null {
  const h = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
  if (h) return unbold(h[1]);
  const b = /^\*\*([^*]{2,120})\*\*\s*$/.exec(line.trim());
  if (b) return b[1].trim();
  return null;
}

/** A document's sections, in order; the words of each kept as written. */
export function parseDocumentText(text: string, format: 'document' | 'text' = 'document'): DriveParse {
  const lines = text.split('\n');
  const sections: Array<{ heading: string | null; lines: string[] }> = [{ heading: null, lines: [] }];
  let title: string | null = null;
  for (const line of lines) {
    const h = headingOf(line);
    if (h !== null) {
      if (!title && /^#\s/.test(line)) title = h;
      sections.push({ heading: h, lines: [] });
      continue;
    }
    sections[sections.length - 1].lines.push(line);
  }
  const passages: DrivePassage[] = sections
    .map((s) => ({ heading: s.heading, text: s.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(), kind: 'source' as const }))
    .filter((p) => p.text || p.heading)
    .map((p) => (p.text ? p : { ...p, text: p.heading ?? '' }));
  return { format, passages, links: linksIn(text), dates: datesIn(text), readable: true, unreadableReason: null, title, meetingDate: null, attendees: [], transcript: null };
}

// ------------------------------------------------------------------------------------------------ Gemini notes

const GEMINI_INTERPRETATION_HEADINGS = /^(summary|decisions|next steps|suggested next steps|aligned|action items)$/i;
const GEMINI_BOILERPLATE = /review Gemini'?s notes|Get tips and learn how Gemini takes notes|support\.google\.com\/meet/i;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * "Notes by Gemini": "# Quick notes" (Gemini's topic notes and next steps), "# Full notes" (its summary, decisions,
 * next steps and details), then "# Transcript" (speaker lines). The topic notes, summary, decisions, next steps and
 * details are Gemini's interpretation, labelled; a transcript line is a source statement, attributed to its speaker.
 */
export function parseGeminiNotes(text: string): DriveParse {
  const lines = text.split('\n');
  type Part = 'notes' | 'transcript';
  let part: Part = 'notes';
  let title: string | null = null;
  let meetingDate: string | null = null;
  const attendees: string[] = [];
  const passages: DrivePassage[] = [];
  let current: { heading: string | null; lines: string[] } | null = null;
  const transcriptLines: Array<{ speaker: string | null; text: string }> = [];
  const flush = () => {
    if (!current) return;
    const body = current.lines.map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (body) passages.push({ heading: current.heading, text: body, kind: 'gemini_interpretation' });
    current = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const top = /^#\s+(.+)$/.exec(line);
    if (top) {
      flush();
      const words = unbold(top[1]).replace(/[^\x20-\x7E]/g, '').trim();
      part = /transcript/i.test(words) ? 'transcript' : 'notes';
      continue;
    }
    if (part === 'transcript') {
      const sp = /^\*\*([^*:]{1,80}):\*\*\s*(.*)$/.exec(line.trim()) ?? /^([A-Z][A-Za-z.' -]{1,60}):\s+(.+)$/.exec(line.trim());
      if (sp) transcriptLines.push({ speaker: sp[1].trim(), text: sp[2].trim() });
      else if (/^#{2,}\s/.test(line) || /^\s*$/.test(line) || /^\*/.test(line.trim())) continue;
      else if (transcriptLines.length) transcriptLines[transcriptLines.length - 1].text += ` ${line.trim()}`;
      continue;
    }
    const h = /^#{2,6}\s+(.+)$/.exec(line);
    if (h) {
      flush();
      const heading = unbold(h[1]);
      if (!title && !/^(quick notes|full notes)$/i.test(heading)) title = heading.replace(/\s*-\s*Transcript$/i, '');
      current = { heading, lines: [] };
      continue;
    }
    for (const m of line.matchAll(EMAIL)) if (!attendees.includes(m[0].toLowerCase())) attendees.push(m[0].toLowerCase());
    // The dateline ("Jul 16, 2026" alone) is the meeting date, not a passage; a line of markup alone separates paragraphs.
    if (/^\s*[A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4}\s*$/.test(line.replace(/\*/g, ''))) { if (!meetingDate) meetingDate = dateFromWords(line); continue; }
    if (/^[\s*_]*$/.test(line)) { if (current) current.lines.push(''); continue; }
    if (GEMINI_BOILERPLATE.test(line)) continue;
    if (/^\s*(Invited\s+)?<[^>]+>/.test(line) || /^\s*Meeting records\s+\[/.test(line)) continue;
    if (!current) current = { heading: null, lines: [] };
    current.lines.push(line);
  }
  flush();
  // The transcript's useful lines: long enough to say something, in order, bounded in count and in characters.
  const kept: DrivePassage[] = [];
  let chars = 0;
  for (const t of transcriptLines) {
    if (t.text.length < TRANSCRIPT_LINE_MIN_CHARS) continue;
    if (kept.length >= TRANSCRIPT_LINES_MAX || chars + t.text.length > TRANSCRIPT_CHARS_MAX) break;
    kept.push({ heading: 'Transcript', text: t.text, kind: 'transcript', speaker: t.speaker });
    chars += t.text.length;
  }
  // Gemini's passages are deduplicated by their words (the quick notes repeat the full notes' next steps).
  const seen = new Set<string>();
  const unique = passages.filter((p) => { const k = `${(p.heading ?? '').toLowerCase()}|${p.text}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const links = linksIn(text).filter((u) => !GEMINI_BOILERPLATE.test(u));
  return { format: 'gemini_notes', passages: [...unique, ...kept], links, dates: datesIn(text), readable: true, unreadableReason: null, title, meetingDate: meetingDate ?? datesIn(text)[0] ?? null, attendees, transcript: { kept: kept.length, total: transcriptLines.length } };
}

/** Which Gemini passages are its summary, decisions or suggested next steps (the interpretation field), apart from its topic notes. */
export const isGeminiSummaryHeading = (heading: string | null): boolean => !!heading && GEMINI_INTERPRETATION_HEADINGS.test(heading.trim());

// ------------------------------------------------------------------------------------------------ sheets

/** One CSV line to its cells (quotes honoured). */
export function csvCells(line: string): string[] {
  const out: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cell += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(cell); cell = ''; }
    else cell += c;
  }
  out.push(cell);
  return out.map((c) => c.trim());
}

/**
 * A sheet as text: CSV (the API's export, one sheet; the client's XLSX extraction, one "## Sheet" block per sheet) or
 * the MCP's table rendering ("| a | b |" rows). The first non-empty row of each block is the header; the rows follow
 * it, bounded to SHEET_ROWS_MAX per table passage (the cut is said in the heading).
 */
export function parseSheetText(text: string): DriveParse {
  const blocks: Array<{ name: string | null; lines: string[] }> = [{ name: null, lines: [] }];
  for (const line of text.split('\n')) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) { blocks.push({ name: unbold(h[1]), lines: [] }); continue; }
    blocks[blocks.length - 1].lines.push(line);
  }
  const passages: DrivePassage[] = [];
  for (const b of blocks) {
    const rows = b.lines
      .map((l) => l.trim())
      .filter((l) => l && !/^###?\s/.test(l) && !/^[-|:\s]+$/.test(l))
      .map((l) => (l.startsWith('|') ? l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()) : csvCells(l)))
      .filter((cells) => cells.some((c) => c));
    if (!rows.length) continue;
    const [header, ...body] = rows;
    const kept = body.slice(0, SHEET_ROWS_MAX);
    const render = (cells: string[]) => cells.map((c) => c.replace(/\|/g, '/')).join(' | ').replace(/(\s\|\s*)+$/, '');
    const heading = `${b.name ?? 'Sheet'}${body.length > kept.length ? ` (${kept.length} of ${body.length} rows)` : ''}`;
    passages.push({ heading, text: [render(header), ...kept.map(render)].join('\n'), kind: 'table' });
  }
  return { format: 'sheet', passages, links: linksIn(text), dates: datesIn(text), readable: true, unreadableReason: null, title: null, meetingDate: null, attendees: [], transcript: null };
}

// ------------------------------------------------------------------------------------------------ slides

/** Slides as text: separated by a `-----` line (the client's PPTX extraction, the captured fixtures) or a form feed; one passage per slide with its number. */
export function parseSlidesText(text: string): DriveParse {
  const raw = text.split(/\n-{3,}\n|\f/);
  const passages: DrivePassage[] = [];
  let n = 0;
  for (const chunk of raw) {
    const body = chunk.replace(/^-{3,}\s*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    if (!body) continue;
    n += 1;
    passages.push({ heading: `Slide ${n}`, text: body, kind: 'slide' });
  }
  // A deck's first line is a slide title, not the document's name: the file name stands for the title.
  return { format: 'slides', passages, links: linksIn(text), dates: datesIn(text), readable: true, unreadableReason: null, title: null, meetingDate: null, attendees: [], transcript: null };
}
