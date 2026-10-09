/**
 * THE INTELLIGENCE RECORD CONTRACT (intelligence wiring, IW01, 2026-10-09). Pure.
 *
 * An external producer (a daily brief, the Codex HubSpot report, the Clawd signal hunter) hands GAP what it already
 * collected as ATOMIC RECORDS. GAP ingests and displays them; it never re-researches, re-scores with a model, or turns
 * an imported recommendation into an obligation. Casey judges usefulness. So a record needs no verified fact, no
 * account, no contact and no URL to be stored or shown; what it must carry is the substance and its provenance:
 *
 *   - producer + producerItemId: the STABLE IDENTITY (a second import of the same item is a duplicate or a revision,
 *     never a second row); producerRunId: the report or run it came from
 *   - text: the substantive passage, verbatim from the producer (never a summary GAP wrote)
 *   - sources: the original links and publishers; sourceRecordIds: CRM record ids the producer cited
 *   - eventDate (date-only, when the producer stated one) apart from reportedOn (the report's date) apart from
 *     collectedAt (when the producer gathered it) apart from importedAt (set on import)
 *   - uncertainty: the producer's own confidence and limitations, kept verbatim; interpretation: the producer's
 *     commentary (why it matters, a suggested move), kept APART from the substance; suggestions: drafted posts or
 *     messages, archived and never executed
 *   - accountHint and personHints: what the producer said, apart from what GAP later resolves
 *   - archive: where in the original report the item sits, so the whole report stays reachable
 *
 * The rows live in `gap_signals` (origin `report_import`, the identity hash in `url_hash`, the contract fields under
 * `metadata.import`), so the existing decisions (pursue, explore, save, skip, dismiss, more), the Work panel and the
 * briefing all read them without a second store. A `report` record is the container (the narrative as captured,
 * `source_class` report_archive): reachable in the archive, never a digest item.
 */
import { createHash } from 'node:crypto';

export const REPORT_IMPORT_ORIGIN = 'report_import' as const;
export const REPORT_ITEM_CLASS = 'report' as const;
export const REPORT_ARCHIVE_CLASS = 'report_archive' as const;
export const INTEL_IMPORTED_EVENT = 'intelligence.imported' as const;

export const INTEL_RECORD_KINDS = ['development', 'engagement', 'observation', 'report'] as const;
export type IntelRecordKind = (typeof INTEL_RECORD_KINDS)[number];

/** The producers GAP knows by name (any other producer string is accepted and shown by its id). */
export const INTEL_PRODUCERS: Record<string, { label: string; cadenceDays: number; how: string }> = {
  yards_first_brief: { label: 'Yards First Brief', cadenceDays: 1, how: 'a ChatGPT daily brief, exported as records' },
  freight_x_signal_desk: { label: 'Freight X Signal Desk', cadenceDays: 1, how: 'a ChatGPT daily desk, exported as records' },
  codex_hubspot_report: { label: 'HubSpot Activity & Engagement report', cadenceDays: 1, how: 'the Codex weekday automation, exported as records' },
  clawd_signal_hunter: { label: 'Clawd signal hunter', cadenceDays: 1, how: 'the yardflow_signals dataset, read through its export' },
};
export const producerLabel = (producer: string): string => INTEL_PRODUCERS[producer]?.label ?? producer;

export interface IntelSource {
  url: string | null;
  /** The original publisher (a host or a name), when the producer named one. */
  publisher: string | null;
  label: string | null;
}

export interface IntelSourceRecordId {
  system: string;
  type: string;
  id: string;
}

/** A record as a producer hands it in (the import validates and fills the rest). */
export interface IntelligenceRecordInput {
  producer: string;
  producerRunId: string;
  producerItemId: string;
  kind: IntelRecordKind;
  title: string;
  text: string;
  sources?: IntelSource[];
  sourceRecordIds?: IntelSourceRecordId[];
  /** YYYY-MM-DD, when the producer stated the event's own date. */
  eventDate?: string | null;
  /** YYYY-MM-DD, the report's date. */
  reportedOn: string;
  /** Whether the report stated its date or the capture supplied it. */
  reportedOnBasis?: 'stated' | 'captured';
  /** ISO instant, when the producer collected it (a run time); null when unknown. */
  collectedAt?: string | null;
  accountHint?: string | null;
  personHints?: string[];
  /** The producer's own status word for the item (NEW, ESCALATING, CONFIRMED, active evaluation, ...). */
  producerStatus?: string | null;
  uncertainty?: string | null;
  interpretation?: string | null;
  suggestions?: string[];
  archive?: { reportRef: string; section: string | null };
  /** digest: a candidate for the briefing and the panel; archive: reachable in the full list only. */
  visibility?: 'digest' | 'archive';
}

/** A record as stored under `metadata.import` (every field present, the hash and the import time set). */
export interface IntelligenceRecord {
  producer: string;
  producerLabel: string;
  producerRunId: string;
  producerItemId: string;
  kind: IntelRecordKind;
  title: string;
  text: string;
  sources: IntelSource[];
  sourceRecordIds: IntelSourceRecordId[];
  eventDate: string | null;
  reportedOn: string;
  reportedOnBasis: 'stated' | 'captured';
  collectedAt: string | null;
  importedAt: string;
  accountHint: string | null;
  personHints: string[];
  producerStatus: string | null;
  uncertainty: string | null;
  interpretation: string | null;
  suggestions: string[];
  archive: { reportRef: string; section: string | null };
  visibility: 'digest' | 'archive';
  contentHash: string;
  /** Earlier versions of this item (the producer revised it): the hash and when it was replaced. */
  revisions: Array<{ contentHash: string; replacedAt: string }>;
}

export type RecordRefusal =
  | 'producer_required'
  | 'producer_item_id_required'
  | 'producer_run_id_required'
  | 'kind_unknown'
  | 'title_or_text_required'
  | 'reported_on_not_a_date'
  | 'event_date_not_a_date'
  | 'text_too_long'
  | 'bad_source_url';

export const TEXT_MAX = 20_000;
export const TITLE_MAX = 300;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const nonEmpty = (v: unknown): string | null => (str(v) ? str(v) : null);

function sourceOk(s: unknown): s is IntelSource {
  if (!s || typeof s !== 'object') return false;
  const o = s as Record<string, unknown>;
  if (o.url != null && o.url !== '') {
    if (typeof o.url !== 'string') return false;
    try {
      const u = new URL(o.url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    } catch {
      return false;
    }
  }
  return true;
}

/** The tracking parameters a producer's links carry (a ChatGPT citation adds utm_source=chatgpt.com). */
export function cleanSourceUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (/^utm_/i.test(k)) u.searchParams.delete(k);
    return u.toString().replace(/\?$/, '');
  } catch {
    return url;
  }
}

/** Validate a producer's record; the result is the normalised record WITHOUT the import-time fields (importedAt, hash). */
export function validateIntelligenceRecord(input: unknown): { ok: true; record: Omit<IntelligenceRecord, 'importedAt' | 'contentHash' | 'revisions'> } | { ok: false; reason: RecordRefusal } {
  const o = (input ?? {}) as Record<string, unknown>;
  const producer = str(o.producer).toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  if (!producer) return { ok: false, reason: 'producer_required' };
  const producerItemId = str(o.producerItemId);
  if (!producerItemId) return { ok: false, reason: 'producer_item_id_required' };
  const producerRunId = str(o.producerRunId);
  if (!producerRunId) return { ok: false, reason: 'producer_run_id_required' };
  const kind = str(o.kind) as IntelRecordKind;
  if (!(INTEL_RECORD_KINDS as readonly string[]).includes(kind)) return { ok: false, reason: 'kind_unknown' };
  const title = clean(str(o.title)).slice(0, TITLE_MAX);
  const text = typeof o.text === 'string' ? o.text.replace(/\r/g, '').trim() : '';
  if (!title && !text) return { ok: false, reason: 'title_or_text_required' };
  if (text.length > TEXT_MAX) return { ok: false, reason: 'text_too_long' };
  const reportedOn = str(o.reportedOn);
  if (!DATE_ONLY.test(reportedOn) || Number.isNaN(Date.parse(`${reportedOn}T00:00:00Z`))) return { ok: false, reason: 'reported_on_not_a_date' };
  const eventDate = nonEmpty(o.eventDate);
  if (eventDate && (!DATE_ONLY.test(eventDate) || Number.isNaN(Date.parse(`${eventDate}T00:00:00Z`)))) return { ok: false, reason: 'event_date_not_a_date' };
  const rawSources = Array.isArray(o.sources) ? o.sources : [];
  if (!rawSources.every(sourceOk)) return { ok: false, reason: 'bad_source_url' };
  const sources: IntelSource[] = rawSources.map((s) => ({ url: s.url ? cleanSourceUrl(s.url) : null, publisher: nonEmpty(s.publisher), label: nonEmpty(s.label) }));
  const sourceRecordIds: IntelSourceRecordId[] = (Array.isArray(o.sourceRecordIds) ? o.sourceRecordIds : [])
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => ({ system: str(r.system), type: str(r.type), id: str(r.id) }))
    .filter((r) => r.system && r.id);
  const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean) : []);
  const collectedRaw = nonEmpty(o.collectedAt);
  const collectedAt = collectedRaw && !Number.isNaN(Date.parse(collectedRaw)) ? new Date(collectedRaw).toISOString() : null;
  const archive = o.archive && typeof o.archive === 'object' ? (o.archive as Record<string, unknown>) : {};
  return {
    ok: true,
    record: {
      producer,
      producerLabel: producerLabel(producer),
      producerRunId,
      producerItemId,
      kind,
      title: title || clean(text).slice(0, TITLE_MAX),
      text,
      sources,
      sourceRecordIds,
      eventDate,
      reportedOn,
      reportedOnBasis: o.reportedOnBasis === 'captured' ? 'captured' : 'stated',
      collectedAt,
      accountHint: nonEmpty(o.accountHint)?.slice(0, 200) ?? null,
      personHints: strings(o.personHints).slice(0, 10),
      producerStatus: nonEmpty(o.producerStatus)?.slice(0, 60) ?? null,
      uncertainty: nonEmpty(o.uncertainty),
      interpretation: nonEmpty(o.interpretation),
      suggestions: strings(o.suggestions).slice(0, 10),
      archive: { reportRef: str(archive.reportRef) || producerRunId, section: nonEmpty(archive.section) },
      visibility: kind === 'report' ? 'archive' : o.visibility === 'archive' ? 'archive' : 'digest',
    },
  };
}

/** The stable identity of an imported item: producer + item id, hashed into the `url_hash` slot (unique). */
export function intelligenceIdentityHash(producer: string, producerItemId: string): string {
  return createHash('sha256').update(`intel:${producer}:${producerItemId}`).digest('hex');
}

/** The content hash: the substantive fields only (a changed interpretation or a new source is a revision too). */
export function intelligenceContentHash(r: Pick<IntelligenceRecord, 'title' | 'text' | 'sources' | 'sourceRecordIds' | 'eventDate' | 'reportedOn' | 'uncertainty' | 'interpretation' | 'suggestions' | 'producerStatus' | 'accountHint' | 'personHints'>): string {
  const body = JSON.stringify([r.title, r.text, r.sources, r.sourceRecordIds, r.eventDate, r.reportedOn, r.uncertainty, r.interpretation, r.suggestions, r.producerStatus, r.accountHint, r.personHints]);
  return createHash('sha256').update(body).digest('hex');
}

/** The import record a stored row carries, when it is one (the reader's guard). */
export function importOf(metadata: unknown): IntelligenceRecord | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = (metadata as Record<string, unknown>).import;
  if (!m || typeof m !== 'object') return null;
  const r = m as Record<string, unknown>;
  if (typeof r.producer !== 'string' || typeof r.producerItemId !== 'string') return null;
  return r as unknown as IntelligenceRecord;
}

/** "Oct 9, 2026" for a date-only value, in words, no time zone shift. */
export function dateOnlyText(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
