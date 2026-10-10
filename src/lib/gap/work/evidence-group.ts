/**
 * EVIDENCE GROUPS IN THE READER (the Google Workspace and Gemini extension, 2026-10-10). Pure.
 *
 * The same underlying evidence can be held in several places: the Kenco Discovery call of July 16 as a Fireflies
 * capture in the vault, as Gemini notes in Drive, as a producer's report. Each carries the deterministic key
 * `evidenceGroupKey` (account slug | meeting date | title words). In the `reports` group, the records sharing a key
 * collapse into ONE item: the first keeps its own passage, the other copies are listed on it as provenance
 * ("also held as: ..."), with their keys, producers, dates, labels and links, so no source is lost; a report that
 * duplicates a vault conversation (the `knowledge` group) says so and links it, and the knowledge item stays where
 * it is. The reader's order and ranks are untouched; nothing is dropped from the complete list.
 */
import type { IntelItem } from './intel';
import { dateOnlyText } from '../signals/intelligence-record';

export interface AlsoHeld {
  /** The other item's decision key (`signal:<id>`, `knowledge:<id>`). */
  key: string;
  producer: string;
  producerLabel: string;
  /** The event date when stated, else the report date (YYYY-MM-DD). */
  date: string | null;
  label: string | null;
  url: string | null;
}

export type GroupedIntelItem = IntelItem & { alsoHeldAs?: AlsoHeld[]; evidenceGroup?: string | null };

const heldAs = (it: IntelItem): AlsoHeld => {
  const s = it.substance;
  const first = s?.sources.find((x) => x.url || x.label) ?? null;
  return { key: it.key, producer: s?.producer ?? it.kind, producerLabel: s?.producerLabel ?? it.source ?? it.kind, date: s ? (s.eventDate ?? s.reportedOn) : it.publishedAt?.slice(0, 10) ?? null, label: first?.label ?? null, url: first?.url ?? it.url };
};

/** "the vault (Jul 16, 2026): 00_Inbox/raw/...md; Gemini meeting notes (Jul 16, 2026): Kenco x YardFlow" */
export function alsoHeldLine(copies: readonly AlsoHeld[]): string {
  return `Also held as: ${copies.map((c) => `${c.producerLabel}${c.date ? ` (${dateOnlyText(c.date)})` : ''}${c.label ? `: ${c.label}` : ''}`).join('; ')}.`;
}

/** The reports group with its evidence groups collapsed; the knowledge group is read for matches, never changed. */
export function collapseEvidenceGroups(reports: readonly IntelItem[], knowledge: readonly IntelItem[]): GroupedIntelItem[] {
  const knowledgeByKey = new Map<string, IntelItem[]>();
  for (const k of knowledge) {
    const g = k.substance?.evidenceGroup;
    if (g) knowledgeByKey.set(g, [...(knowledgeByKey.get(g) ?? []), k]);
  }
  const heads = new Map<string, GroupedIntelItem>();
  const out: GroupedIntelItem[] = [];
  for (const it of reports) {
    const g = it.substance?.evidenceGroup ?? null;
    if (!g) { out.push(it); continue; }
    const head = heads.get(g);
    if (head) {
      head.alsoHeldAs = [...(head.alsoHeldAs ?? []), heldAs(it)];
      continue;
    }
    const copy: GroupedIntelItem = { ...it, evidenceGroup: g, alsoHeldAs: (knowledgeByKey.get(g) ?? []).map(heldAs) };
    heads.set(g, copy);
    out.push(copy);
  }
  return out.map((it, i) => (it.alsoHeldAs?.length ? { ...it, line: `${it.line} ${alsoHeldLine(it.alsoHeldAs)}`, rank: i } : { ...it, rank: i }));
}
