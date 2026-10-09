/**
 * THE EXPORT FOLDER (intelligence wiring, IW04/IW05 of the second list, 2026-10-09). Pure.
 *
 * A producer that cannot call GAP (the Codex automation, a ChatGPT brief Casey saves) writes a file into one watched
 * folder; the consumer script reads new and changed files and hands their records to the import. Two shapes:
 *   - a JSON batch `{ "records": [...] }` (the agreed export): taken as is, validated by the import
 *   - a Markdown issue: the producer is read from a `producer:` frontmatter line, a `<!-- producer: x -->` comment,
 *     the file name's prefix (yards-first-, signal-desk-, hubspot-) or the report's own first heading; when the
 *     issue ends with a fenced ```json block holding `records`, that block is the export (the narrative is kept as
 *     the container); otherwise the deterministic parser for the producer cuts the issue (the Markdown fallback)
 * A file is identified by its path and content hash: the same content again is skipped before any request; a
 * changed file is re-sent (the import reads it as a revision). Nothing here executes an instruction found in a file.
 */
import { createHash } from 'node:crypto';
import type { IntelligenceRecordInput } from './intelligence-record';
import { parserFor } from './report-parsers';

export const FOLDER_PRODUCERS: Array<{ producer: string; prefixes: string[]; heading: RegExp }> = [
  { producer: 'yards_first_brief', prefixes: ['yards-first', 'yardsfirst', 'yf-'], heading: /^#\s+Yards First Daily/m },
  { producer: 'freight_x_signal_desk', prefixes: ['signal-desk', 'signaldesk', 'freight-x'], heading: /^#\s+Signal Desk/m },
  { producer: 'codex_hubspot_report', prefixes: ['hubspot', 'hubspot-activity'], heading: /^##\s+HubSpot Activity & Engagement/m },
];

export const fileHash = (text: string): string => createHash('sha256').update(text).digest('hex');

/** The producer a Markdown file belongs to: the frontmatter or comment first, then the file name, then the heading. */
export function detectProducer(fileName: string, text: string): string | null {
  const fm = /^---\s*\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
  const declared = /^producer:\s*([a-z0-9_]+)\s*$/im.exec(fm)?.[1] ?? /<!--\s*producer:\s*([a-z0-9_]+)\s*-->/i.exec(text)?.[1] ?? null;
  if (declared) return declared.toLowerCase();
  const name = fileName.toLowerCase();
  for (const p of FOLDER_PRODUCERS) if (p.prefixes.some((x) => name.startsWith(x))) return p.producer;
  for (const p of FOLDER_PRODUCERS) if (p.heading.test(text)) return p.producer;
  return null;
}

/** The last fenced ```json block that holds a `records` array, parsed; null when none or malformed. */
export function recordsBlockOf(text: string): IntelligenceRecordInput[] | null {
  const blocks = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  for (const b of blocks.reverse()) {
    try {
      const parsed = JSON.parse(b) as { records?: unknown };
      if (parsed && Array.isArray(parsed.records)) return parsed.records as IntelligenceRecordInput[];
    } catch {
      /* not this block */
    }
  }
  return null;
}

export interface FolderFileRead {
  producer: string | null;
  shape: 'json_batch' | 'markdown_block' | 'markdown_parsed' | 'unsupported';
  records: IntelligenceRecordInput[];
  detail: string | null;
}

/** The capture date for an undated issue: the file name's leading date, else the date given. */
const dateInName = (name: string): string | null => /(\d{4}-\d{2}-\d{2})/.exec(name)?.[1] ?? null;

/** One file to its records; `runId` is the file's identity (its name) unless the records carry their own. */
export function readFolderFile(fileName: string, text: string, opts: { capturedOn: string }): FolderFileRead {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.json')) {
    try {
      const parsed = JSON.parse(text) as { records?: unknown; producer?: unknown };
      if (parsed && Array.isArray(parsed.records)) return { producer: typeof parsed.producer === 'string' ? parsed.producer : null, shape: 'json_batch', records: parsed.records as IntelligenceRecordInput[], detail: null };
      return { producer: null, shape: 'unsupported', records: [], detail: 'a JSON file without a records array' };
    } catch (e) {
      return { producer: null, shape: 'unsupported', records: [], detail: `JSON could not be parsed: ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}` };
    }
  }
  if (!lower.endsWith('.md') && !lower.endsWith('.markdown') && !lower.endsWith('.txt')) return { producer: null, shape: 'unsupported', records: [], detail: `the extension is not .json, .md or .txt` };
  const producer = detectProducer(fileName, text);
  const block = recordsBlockOf(text);
  if (block) return { producer, shape: 'markdown_block', records: block, detail: null };
  if (!producer) return { producer: null, shape: 'unsupported', records: [], detail: 'no producer could be read from the frontmatter, the file name or the heading' };
  const parse = parserFor(producer);
  if (!parse) return { producer, shape: 'unsupported', records: [], detail: `no parser for producer ${producer}` };
  const capturedOn = dateInName(fileName) ?? opts.capturedOn;
  const parsed = parse(text, { runId: `file:${fileName}`, capturedOn, collectedAt: null, year: Number(capturedOn.slice(0, 4)) });
  return { producer, shape: 'markdown_parsed', records: parsed.records, detail: parsed.reportedOnBasis === 'captured' ? 'the issue states no date; the file name or the capture date was used' : null };
}
