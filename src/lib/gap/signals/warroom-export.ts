/**
 * THE WAR-ROOM DOSSIER AS A RECORD (the war-room adapter, 2026-10-09). Pure.
 *
 * The war-room keeps one seller-written dossier per account (`data/accounts/<slug>.json`, in its git): the why-now
 * paragraphs, the surprising findings, the sources by name, the committee, the talk track, the intent score and the
 * deck and page views. GAP takes the EVIDENCE: the why-now paragraphs and the surprising findings as the passage,
 * the named sources and the public links as sources, the file's last git change as the report date. It leaves the
 * talk track (seller pitch) out, labels the intent score and the views as engagement context (never intent), and
 * says the dossier is seller interpretation with sources named but not linked. One record per dossier; the identity
 * is the slug, so a changed dossier is a revision.
 */
import type { IntelligenceRecordInput } from './intelligence-record';

export const WAR_ROOM_PRODUCER = 'war_room_dossier';

export interface WarRoomDossier {
  slug: string;
  displayName?: string;
  archetype?: string;
  oneLiner?: string;
  status?: { domain?: string | null; dealStage?: string | null; tamTier?: string | null; intentScore?: number | null; lastIntentAt?: string | null };
  whyNow?: string[];
  surprisingFindings?: string[];
  sources?: string[];
  links?: Record<string, string>;
  engagement?: { deckViews?: number; forPageVisits?: number };
  committee?: Array<{ name?: string; title?: string }>;
}

/** One dossier to one record; null for the example or an empty dossier. `changedOn` is the file's last git change (YYYY-MM-DD). */
export function mapWarRoomDossier(d: WarRoomDossier, opts: { changedOn: string; runId: string; commitSha?: string | null }): IntelligenceRecordInput | null {
  if (!d?.slug || d.slug === 'example' || d.slug.startsWith('_')) return null;
  const whyNow = (d.whyNow ?? []).filter((s) => typeof s === 'string' && s.trim());
  const findings = (d.surprisingFindings ?? []).filter((s) => typeof s === 'string' && s.trim());
  if (!whyNow.length && !findings.length) return null;
  const name = d.displayName ?? d.slug;
  const text = [...whyNow.map((w) => w.trim()), ...findings.map((f) => `Finding: ${f.trim()}`)].join('\n\n');
  const sources = [
    ...Object.entries(d.links ?? {}).filter(([, url]) => typeof url === 'string' && /^https?:\/\//.test(url)).map(([k, url]) => ({ url, publisher: 'yardflow.ai', label: `the ${k} page` })),
    ...(d.sources ?? []).filter((s) => typeof s === 'string' && s.trim()).slice(0, 8).map((s) => ({ url: null, publisher: 'war-room dossier', label: s.trim().slice(0, 200) })),
  ];
  const score = typeof d.status?.intentScore === 'number' ? d.status.intentScore : null;
  const views = d.engagement ? `${d.engagement.deckViews ?? 0} deck views, ${d.engagement.forPageVisits ?? 0} page visits` : null;
  const context = [score !== null ? `intent score ${score}${d.status?.lastIntentAt ? ` (last ${d.status.lastIntentAt.slice(0, 10)})` : ''}` : null, views].filter(Boolean).join('; ');
  return {
    producer: WAR_ROOM_PRODUCER,
    producerRunId: opts.runId,
    producerItemId: d.slug,
    kind: 'observation',
    title: `${name}: why now, from the war-room dossier`,
    text,
    sources,
    sourceRecordIds: d.status?.domain ? [{ system: 'war_room', type: 'dossier', id: d.slug }] : [{ system: 'war_room', type: 'dossier', id: d.slug }],
    eventDate: null,
    reportedOn: opts.changedOn,
    reportedOnBasis: 'stated',
    collectedAt: null,
    accountHint: name,
    personHints: (d.committee ?? []).map((c) => c?.name).filter((n): n is string => typeof n === 'string' && !!n.trim()).slice(0, 6),
    producerStatus: d.status?.tamTier ? `tam tier ${d.status.tamTier}` : null,
    uncertainty: `A seller-written dossier from the war-room, last changed ${opts.changedOn}; its claims are as written, the sources named but not linked here; ${context ? `${context}: engagement context, never buying intent` : 'no engagement recorded'}.`,
    interpretation: d.oneLiner ? `The dossier's one-liner: ${d.oneLiner.trim()}` : null,
    suggestions: [],
    archive: { reportRef: `war-room:data/accounts/${d.slug}.json${opts.commitSha ? `@${opts.commitSha}` : ''}`, section: 'whyNow, surprisingFindings' },
    visibility: 'digest',
  };
}
