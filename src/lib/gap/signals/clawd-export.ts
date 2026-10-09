/**
 * THE CLAWD EXPORT MAPPER (intelligence wiring, IW09, 2026-10-09). Pure.
 *
 * One item of Clawd's `GET /api/yardflow/signals/export` page becomes one IntelligenceRecordInput for the import
 * (intelligence-import.ts). The producer is `clawd_signal_hunter`; the identity is the hunter's signal_id; the run is
 * the page the item came from. Relevance is Clawd's label, carried in the status and the uncertainty, never a gate:
 * every row (a candidate below the hunter's cut too) is `digest` visibility, and Casey judges. Nothing here fetches,
 * scores with a model, or trusts the text as an instruction: the exported fields are data.
 */
import type { IntelligenceRecordInput } from './intelligence-record';

/** One item as the export serves it (every stored column; the raw text keys that were present). */
export interface ClawdExportItem {
  signal_id: string;
  title?: string | null;
  url?: string | null;
  source?: string | null;
  company?: string | null;
  domain?: string | null;
  vendor?: string | null;
  customer?: string | null;
  intent_category?: string | null;
  urgency?: string | null;
  relevance?: number | null;
  keyword_score?: number | null;
  cluster_id?: string | null;
  published?: string | null;
  fetched_at?: string | null;
  classified?: boolean | null;
  matched_keywords?: string[] | null;
  tags?: string[] | null;
  raw_text?: Partial<Record<'summary' | 'body' | 'context' | 'snippet' | 'description' | 'excerpt', string>> | null;
  candidate?: boolean;
  dropped_reason?: string | null;
  captured_at?: string | null;
}

export interface ClawdExportPage {
  items: ClawdExportItem[];
  next: string | null;
  count: number;
  source: string;
}

export const CLAWD_PRODUCER = 'clawd_signal_hunter' as const;
export const CLAWD_REPORT_REF = 'clawd:yardflow_signals' as const;
/** The order of preference for the record's text, the first present wins. */
export const CLAWD_TEXT_KEYS = ['summary', 'body', 'context', 'snippet', 'description', 'excerpt'] as const;

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** The YYYY-MM-DD part of an ISO instant or a date; null when it does not start with one. */
export function datePart(value: unknown): string | null {
  const s = str(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  return DATE_ONLY.test(m[1]) && !Number.isNaN(Date.parse(`${m[1]}T00:00:00Z`)) ? m[1] : null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host || null;
  } catch {
    return null;
  }
}

export interface MapClawdOptions {
  /** The day the page was read, YYYY-MM-DD: the reportedOn fallback when an item has no fetched_at. */
  capturedOn: string;
  /** The page's run id (the import script passes one per run); the record's producerRunId. */
  runId?: string;
}

/**
 * Map one export item to the record contract; null when the item has neither a title nor any text.
 *   kind: development when a company or a domain is named, else observation
 *   text: the first present raw_text key in CLAWD_TEXT_KEYS order, else the title
 *   eventDate: the date part of `published`; reportedOn: the date part of fetched_at (stated), else capturedOn (captured)
 *   producerStatus: "relevance <r>" plus ", candidate" for a candidate row
 *   interpretation: Clawd's classification, only from the fields present; uncertainty: the relevance as a label
 */
export function mapClawdSignal(item: ClawdExportItem, opts: MapClawdOptions): IntelligenceRecordInput | null {
  const producerItemId = str(item?.signal_id);
  if (!producerItemId) return null;
  const title = str(item.title);
  const rawText = item.raw_text && typeof item.raw_text === 'object' ? item.raw_text : {};
  let text = '';
  for (const k of CLAWD_TEXT_KEYS) {
    const v = str((rawText as Record<string, unknown>)[k]);
    if (v) { text = v; break; }
  }
  if (!text) text = title;
  if (!title && !text) return null;

  const company = str(item.company);
  const domain = str(item.domain);
  const url = str(item.url);
  const source = str(item.source);
  const relevance = typeof item.relevance === 'number' && Number.isFinite(item.relevance) ? item.relevance : null;
  const candidate = item.candidate === true;

  const reportedFromFetched = datePart(item.fetched_at);
  const reportedOn = reportedFromFetched ?? opts.capturedOn;
  const reportedOnBasis: 'stated' | 'captured' = reportedFromFetched ? 'stated' : 'captured';
  const collectedAt = str(item.fetched_at) && !Number.isNaN(Date.parse(str(item.fetched_at))) ? new Date(str(item.fetched_at)).toISOString() : null;

  const classified: string[] = [];
  const category = str(item.intent_category);
  const urgency = str(item.urgency);
  const keywords = Array.isArray(item.matched_keywords) ? item.matched_keywords.filter((k): k is string => typeof k === 'string' && k.trim().length > 0).map((k) => k.trim()) : [];
  if (category) classified.push(category);
  if (urgency) classified.push(`urgency ${urgency}`);
  if (keywords.length) classified.push(`keywords ${keywords.join(', ')}`);
  const interpretation = classified.length ? `Clawd classified it: ${classified.join(', ')}` : null;

  const relevanceWord = relevance === null ? 'not scored' : String(relevance);
  const producerStatus = `relevance ${relevanceWord}${candidate ? ', candidate' : ''}`;
  const uncertainty = relevance === null
    ? "Not scored by Clawd's classifier; not verified by GAP."
    : `Relevance ${relevance} by Clawd's classifier; not verified by GAP.`;

  return {
    producer: CLAWD_PRODUCER,
    producerRunId: str(opts.runId) || `clawd-export:${opts.capturedOn}`,
    producerItemId,
    kind: company || domain ? 'development' : 'observation',
    title,
    text,
    sources: url ? [{ url, publisher: hostOf(url), label: source || null }] : [],
    eventDate: datePart(item.published),
    reportedOn,
    reportedOnBasis,
    collectedAt,
    accountHint: company || domain || null,
    producerStatus,
    uncertainty,
    interpretation,
    archive: { reportRef: CLAWD_REPORT_REF, section: str(item.cluster_id) || null },
    visibility: 'digest',
  };
}

/** Map a page; items without a title or text are dropped and counted. */
export function mapClawdPage(items: ClawdExportItem[], opts: MapClawdOptions): { records: IntelligenceRecordInput[]; skipped: number } {
  const records: IntelligenceRecordInput[] = [];
  let skipped = 0;
  for (const item of items ?? []) {
    const r = mapClawdSignal(item, opts);
    if (r) records.push(r);
    else skipped += 1;
  }
  return { records, skipped };
}
