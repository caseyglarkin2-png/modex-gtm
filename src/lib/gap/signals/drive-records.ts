/**
 * DRIVE FILE TO RECORDS (the Google Workspace and Gemini extension, 2026-10-10). Pure.
 *
 * One Drive file and its parse become IntelligenceRecordInput records: producer `google_drive` for a Doc, Sheet,
 * Slides, PDF, DOCX, XLSX, PPTX, Markdown or text file, `gemini_notes` for a Notes by Gemini document; the identity
 * is the Drive file id (one record per document; a document with distinct sections gives `<id>#<n>` records, at
 * most RECORDS_PER_FILE, the rest said in the uncertainty, never silently dropped); the text verbatim; the Drive link
 * and the file name as the first source plus every link the text holds; the meeting or document date (the file name,
 * a Gemini note's dateline, a dateline at the top of the text) apart from the Drive modified time (reportedOn, stated)
 * apart from the extraction time (collectedAt); the account as a HINT from the folder or the title, never a
 * placement; the attendees as person hints; Gemini's summary and suggested next steps as the interpretation, apart
 * from its topic notes and apart from what people said; the archive naming the Drive id and the mime type. An
 * unreadable parse yields NO record: the sync records the file as unreadable instead.
 */
import { datesIn, isGeminiSummaryHeading, type DriveParse, type DrivePassage } from './drive-parsers';
import { evidenceGroupKey, type IntelSource, type IntelligenceRecordInput } from './intelligence-record';

export const DRIVE_PRODUCER = 'google_drive';
export const GEMINI_PRODUCER = 'gemini_notes';
export const RECORDS_PER_FILE = 6;
/** A record's text is cut into sections past this many characters (the contract allows 20,000; the digest wants less). */
export const RECORD_CHARS_MAX = 6_000;

export interface DriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  /** ISO instant, the Drive modified time. */
  modifiedTime: string;
  owners: string[];
  webViewLink: string | null;
  /** The folder the file was listed under, when the sync knows it. */
  folderName?: string | null;
  size?: number | null;
}

/** Folders that name a scope, not an account. */
const SCOPE_FOLDERS = /^(meet recordings|gemini artifacts|my drive|shared with me|root|yard audits?|audits?|documents|exports?|inbox)$/i;
const OUR_NAMES = /^(yardflow|freightroll|yard flow|freight roll|yardflow by freightroll)$/i;
const INTERNAL_EMAIL = /@(freightroll\.com|yardflow\.ai)$/i;
const NAME_DATE = /(\d{4}-\d{2}-\d{2})/;

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

/** The account hint: the folder name when it names an account; else the title's first segment when it is not us. */
export function accountHintOf(file: Pick<DriveFileMeta, 'name' | 'folderName'>, parse: Pick<DriveParse, 'title' | 'passages'>): { hint: string | null; basis: 'folder' | 'title' | 'text' | null } {
  const folder = (file.folderName ?? '').trim();
  if (folder && !SCOPE_FOLDERS.test(folder) && !OUR_NAMES.test(folder)) return { hint: folder.slice(0, 120), basis: 'folder' };
  // The file's name first (Drive names are the inventory's names), then the document's own title.
  for (const candidate of [file.name, parse.title ?? '']) {
    const name = candidate.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/\s*\((?:Notes by Gemini|\d+)\)\s*$/i, '').trim();
    if (!name) continue;
    const segments = name.split(/\s+x\s+|\s+[-:+|]\s+|\s+(?:\\u2014|\\u2013)\s+|\s+vs\.?\s+/i).map((s) => s.trim()).filter(Boolean);
    // "YardFlow x Kenco" names the counterpart after us: the first segment that is not our own name.
    const first = segments.find((s) => !OUR_NAMES.test(s)) ?? '';
    const words = first.split(/\s+/).filter(Boolean);
    if (first && words.length <= 4 && !/^(deep-audit|dossier|notes|meeting|untitled|copy of|yard audit|pricing|offer)/i.test(first)) return { hint: first.slice(0, 120), basis: 'title' };
  }
  // A dossier's own "Account: X" label in its opening lines (a yard-audit dossier states one).
  const head = parse.passages.slice(0, 2).map((p) => p.text).join('\n').slice(0, 600);
  const labelled = /\*{0,2}Account:?\*{0,2}\s*([A-Z][A-Za-z0-9&.' -]{1,60}?)(?=\s{2,}|\s*\*\*|\n|$)/.exec(head)?.[1]?.trim();
  if (labelled) return { hint: labelled.slice(0, 120), basis: 'text' };
  return { hint: null, basis: null };
}

/** The document's own date: the file name's YYYY-MM-DD, a Gemini note's dateline, else a dateline in the first lines of the text. */
export function eventDateOf(file: Pick<DriveFileMeta, 'name'>, parse: DriveParse): string | null {
  const inName = NAME_DATE.exec(file.name)?.[1];
  if (inName && !Number.isNaN(Date.parse(`${inName}T00:00:00Z`))) return inName;
  if (parse.meetingDate) return parse.meetingDate;
  const head = parse.passages.slice(0, 2).map((p) => `${p.heading ?? ''}\n${p.text}`).join('\n').slice(0, 400);
  return datesIn(head)[0] ?? null;
}

/** The order and the words of Gemini's summary passages in the interpretation: the summary, then the decisions, then the next steps. */
const SUMMARY_ORDER: Array<{ test: RegExp; label: string; rank: number }> = [
  { test: /^summary$/i, label: 'summary', rank: 0 },
  { test: /^(decisions|aligned)$/i, label: 'decisions', rank: 1 },
  { test: /^action items$/i, label: 'action items', rank: 2 },
  { test: /next steps$/i, label: 'suggested next steps', rank: 3 },
];
const summaryOf = (heading: string | null) => SUMMARY_ORDER.find((s) => s.test.test((heading ?? '').trim())) ?? { label: (heading ?? 'summary').toLowerCase(), rank: 9 };

/** The words of one passage as the record carries them: the heading, then the text; a transcript line with its speaker. */
const render = (p: DrivePassage): string => {
  if (p.kind === 'transcript') return `${p.speaker ? `${p.speaker}: ` : ''}${p.text}`;
  return p.heading ? `${p.heading}\n${p.text}` : p.text;
};

/** Consecutive passages grouped under the character bound, at most `max` groups; the passages past the last group are counted. */
export function groupPassages(passages: DrivePassage[], max = RECORDS_PER_FILE, chars = RECORD_CHARS_MAX): { groups: DrivePassage[][]; dropped: number } {
  const groups: DrivePassage[][] = [];
  let current: DrivePassage[] = [];
  let size = 0;
  let dropped = 0;
  for (const p of passages) {
    const len = render(p).length + 2;
    if (current.length && size + len > chars) {
      if (groups.length + 1 >= max) { dropped += 1; continue; }
      groups.push(current);
      current = [];
      size = 0;
    }
    if (groups.length >= max) { dropped += 1; continue; }
    current.push(p);
    size += len;
  }
  if (current.length && groups.length < max) groups.push(current);
  return { groups, dropped };
}

export interface DriveRecordOptions {
  /** ISO instant: when the text was extracted (collectedAt). */
  extractedAt: string;
  runId: string;
}

/** One file and its parse to its records; an unreadable parse yields none (the invariant the sync and its test pin). */
export function driveRecordsOf(file: DriveFileMeta, parse: DriveParse, opts: DriveRecordOptions): IntelligenceRecordInput[] {
  if (!parse.readable || !parse.passages.length) return [];
  const gemini = parse.format === 'gemini_notes';
  const producer = gemini ? GEMINI_PRODUCER : DRIVE_PRODUCER;
  const title = (parse.title ?? file.name.replace(/\.[a-z0-9]{2,5}$/i, '')).trim();
  const { hint, basis } = accountHintOf(file, parse);
  const eventDate = eventDateOf(file, parse);
  const reportedOn = file.modifiedTime.slice(0, 10);
  const owner = file.owners[0] ?? 'unknown';
  const linkSources: IntelSource[] = parse.links.map((url) => ({ url, publisher: hostOf(url), label: null }));
  const sources: IntelSource[] = [{ url: file.webViewLink, publisher: 'Google Drive', label: file.name }, ...linkSources];
  const personHints = parse.attendees.filter((e) => !INTERNAL_EMAIL.test(e)).slice(0, 10);
  // The extraction time rides on collectedAt, not here: the words here are hashed, and a re-read of an unchanged file must be a duplicate, not a revision.
  const provenance = `Owner ${owner}; modified in Drive ${file.modifiedTime}; the extraction time is the record's collectedAt.${hint ? ` The account "${hint}" is a hint from the ${basis}, not a placement.` : ' No account hint: the folder names a scope and the title does not name a counterpart.'}`;
  const archive = { reportRef: `drive:${file.id}`, section: file.mimeType };
  const evidenceGroup = evidenceGroupKey(hint, eventDate, title);
  const base = { producer, producerRunId: opts.runId, reportedOn, reportedOnBasis: 'stated' as const, collectedAt: opts.extractedAt, accountHint: hint, personHints, archive, visibility: 'digest' as const, evidenceGroup };

  if (gemini) {
    const notes = parse.passages.filter((p) => p.kind === 'gemini_interpretation' && !isGeminiSummaryHeading(p.heading));
    const summary = parse.passages.filter((p) => p.kind === 'gemini_interpretation' && isGeminiSummaryHeading(p.heading));
    const transcript = parse.passages.filter((p) => p.kind === 'transcript');
    const out: IntelligenceRecordInput[] = [];
    const notesText = (notes.length ? notes : summary).map(render).join('\n\n').slice(0, RECORD_CHARS_MAX * 2);
    const ordered = summary.map((p, i) => ({ p, i, s: summaryOf(p.heading) })).sort((a, b) => a.s.rank - b.s.rank || a.i - b.i);
    const interpretation = ordered.length ? ordered.map(({ p, s }) => `Gemini's ${s.label}: ${p.text}`).join('\n\n') : null;
    const generated = 'Gemini-generated meeting notes (Google says to review them for accuracy); the transcript lines are what people said, the rest is Gemini\'s reading.';
    out.push({
      ...base,
      producerItemId: file.id,
      kind: 'engagement',
      title,
      text: notesText,
      sources,
      eventDate,
      uncertainty: `${generated} ${provenance}${parse.transcript ? ` Transcript: ${parse.transcript.kept} of ${parse.transcript.total} lines kept${transcript.length ? ' (its own record)' : ''}.` : ''}`,
      interpretation,
    });
    if (transcript.length) {
      out.push({
        ...base,
        producerItemId: `${file.id}#transcript`,
        kind: 'engagement',
        title: `${title}: transcript excerpts`,
        text: transcript.map(render).join('\n'),
        sources,
        eventDate,
        uncertainty: `A machine transcript (Gemini); ${parse.transcript?.kept ?? transcript.length} of ${parse.transcript?.total ?? transcript.length} lines kept, the substantive ones in order; the whole transcript is at the link. ${provenance}`,
        interpretation: null,
      });
    }
    return out;
  }

  const { groups, dropped } = groupPassages(parse.passages);
  const cut = dropped ? ` ${dropped} more section${dropped === 1 ? '' : 's'} not imported (the bound is ${RECORDS_PER_FILE} records per document); the whole document is at the link.` : '';
  const sheetNote = parse.format === 'sheet' && file.mimeType === 'application/vnd.google-apps.spreadsheet' ? ' The CSV export carries the first sheet only.' : '';
  const kind = parse.format === 'sheet' ? 'the rows as exported' : parse.format === 'slides' ? 'the slides as text' : 'the document as text';
  return groups.map((g, i) => ({
    ...base,
    producerItemId: groups.length === 1 ? file.id : `${file.id}#${i + 1}`,
    kind: 'observation' as const,
    title: groups.length === 1 ? title : `${title}: ${g[0].heading ?? `part ${i + 1}`}`,
    text: g.map(render).join('\n\n'),
    sources,
    eventDate,
    uncertainty: `A Drive document, ${kind}; nothing in it is verified by GAP. ${provenance}${sheetNote}${cut}`,
    interpretation: null,
  }));
}
