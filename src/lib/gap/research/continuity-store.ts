/**
 * EVIDENCE CONTINUITY, stored (2026-09-28). Runs over an account's VERIFIED
 * research facts after every research run; deterministic, no model.
 *
 *   CORROBORATED  an older ONGOING fact whose program a NEWER verified fact
 *                 says still operates: a new evidence_record signal is
 *                 registered (`continuity:<source>:<date>`) with the SAME
 *                 verbatim primary sentence, URL, title and publication date,
 *                 and an explicit freshness_expires_at from the corroboration
 *                 date. Every existing gate reads freshness_expires_at, so the
 *                 whole pipeline honors the corroborated clock unchanged. The
 *                 original row is never altered (fact columns are frozen).
 *   SUPERSEDED    a newer verified fact says the program ended: the older fact
 *                 and its continuation rows get metadata.continuity.kind =
 *                 'ended', which the outreach gate refuses ('superseded').
 *   SEEKING       an ongoing fact near or past its own clock with no
 *                 corroboration; research makes ONE focused web call for it.
 *                 It is never called fresh on its own wording.
 * The trigger clock (signals/promote.ts) is untouched: none of this ever
 * creates a Pounce trigger.
 */
import type { SignalType } from '../taxonomy';
import { classifyContinuity, corroboratesCurrentness, outreachCurrentUntil, programKeys, sellerRelevance, supersedes, CORROBORATION_CHECK_AFTER_MS } from './continuity';
import { registerSignal } from '../signals/registry';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

interface FactRow {
  id: string;
  source_id: string;
  account_name: string;
  persona_id: number | null;
  type: string;
  title: string;
  source_type: string;
  evidence_url: string | null;
  evidence_text: string | null;
  observed_at: Date;
  freshness_expires_at: Date | null;
  confidence: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- stored JSON, read defensively
  metadata: Record<string, any> | null;
}

export const CONTINUITY_PREFIX = 'continuity:';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const day = (d: Date) => d.toISOString().slice(0, 10);

export interface ContinuityOutcome {
  corroborated: Array<{ primarySignalId: string; continuitySignalId: string; created: boolean; currentnessUrl: string | null; currentnessPublishedAt: string; currentUntil: string }>;
  superseded: Array<{ signalId: string; byUrl: string | null; byPublishedAt: string }>;
  seeking: Array<{ signalId: string; programKeys: string[]; ownClockEnds: string | null }>;
}

const chainRef = (r: FactRow) => ({ signalId: r.id, url: r.evidence_url, title: r.title, publishedAt: r.observed_at.toISOString() });

/** Prefer the company's own source, then the most seller-relevant sentence, then the earliest, for the observation. */
function preferred(a: FactRow, b: FactRow): number {
  const p = (r: FactRow) => (r.source_type === 'public_primary' ? 0 : 1);
  if (p(a) !== p(b)) return p(a) - p(b);
  const ra = sellerRelevance(a.evidence_text ?? '').rank;
  const rb = sellerRelevance(b.evidence_text ?? '').rank;
  if (ra !== rb) return ra - rb;
  if (a.observed_at.getTime() !== b.observed_at.getTime()) return a.observed_at.getTime() - b.observed_at.getTime();
  return a.id < b.id ? -1 : 1;
}

export async function establishContinuity(prisma: PrismaLike, input: { accountName: string; actor: string; now: Date }): Promise<ContinuityOutcome> {
  const out: ContinuityOutcome = { corroborated: [], superseded: [], seeking: [] };
  const rows: FactRow[] = await prisma.prospectingSignal.findMany({
    where: { account_name: input.accountName, source_kind: 'evidence_record' },
    select: { id: true, source_id: true, account_name: true, persona_id: true, type: true, title: true, source_type: true, evidence_url: true, evidence_text: true, observed_at: true, freshness_expires_at: true, confidence: true, metadata: true },
  });
  // Only verified research facts take part, as a primary or as a corroboration (a failed recheck is out).
  const verified = rows.filter((r) => isObj(r.metadata) && r.metadata.verified === 'excerpt_found_at_source' && !!r.evidence_text?.trim());
  const base = verified.filter((r) => !r.source_id.startsWith(CONTINUITY_PREFIX));
  const continuations = verified.filter((r) => r.source_id.startsWith(CONTINUITY_PREFIX));
  const dated = (r: FactRow) => ({ excerpt: r.evidence_text!, publishedAt: r.observed_at });
  // A continuation stands only while BOTH its sources stay verified: if either failed its recheck, the
  // continuation loses its verified stamp (metadata only) and the outreach gate refuses it.
  const verifiedIds = new Set(verified.map((r) => r.id));
  for (const c of continuations) {
    const k = c.metadata?.continuity;
    if (k?.kind !== 'ongoing_state' || (verifiedIds.has(k.primary?.signalId) && verifiedIds.has(k.currentness?.signalId))) continue;
    await prisma.prospectingSignal.update({ where: { id: c.id }, data: { metadata: { ...(c.metadata ?? {}), verified: 'source_failed_recheck' } } });
    c.metadata = { ...(c.metadata ?? {}), verified: 'source_failed_recheck' };
    await prisma.gapAuditEvent.create({ data: { kind: 'research.continuity_withdrawn', actor: input.actor, subject_type: 'prospecting_signal', subject_id: c.id, payload: { accountName: input.accountName, primary: k.primary?.signalId, currentness: k.currentness?.signalId } } });
  }
  const endedIds = new Set(base.filter((r) => r.metadata?.continuity?.kind === 'ended').map((r) => r.id));

  // SUPERSEDED first: an ended program never becomes current.
  for (const p of base) {
    if (endedIds.has(p.id) || classifyContinuity(p.evidence_text!) !== 'ongoing_state') continue;
    const by = base.filter((n) => n.id !== p.id && supersedes(dated(p), dated(n), input.accountName)).sort((a, b) => b.observed_at.getTime() - a.observed_at.getTime())[0];
    if (!by) continue;
    const record = { kind: 'ended', primary: chainRef(p), endedBy: { ...chainRef(by), excerpt: by.evidence_text }, establishedAt: input.now.toISOString() };
    for (const r of [p, ...continuations.filter((c) => c.metadata?.continuity?.primary?.signalId === p.id)]) {
      await prisma.prospectingSignal.update({ where: { id: r.id }, data: { metadata: { ...(r.metadata ?? {}), continuity: record } } });
    }
    endedIds.add(p.id);
    out.superseded.push({ signalId: p.id, byUrl: by.evidence_url, byPublishedAt: by.observed_at.toISOString() });
    await prisma.gapAuditEvent.create({ data: { kind: 'research.continuity_ended', actor: input.actor, subject_type: 'prospecting_signal', subject_id: p.id, payload: { accountName: input.accountName, endedBy: by.id, url: by.evidence_url } } });
  }

  // CORROBORATED: group the ongoing primaries by the newest newer source that says the program still operates.
  const byCorroborator = new Map<string, { n: FactRow; primaries: FactRow[] }>();
  const uncorroborated: FactRow[] = [];
  for (const p of base) {
    if (endedIds.has(p.id) || classifyContinuity(p.evidence_text!) !== 'ongoing_state') continue;
    const n = base
      .filter((c) => c.id !== p.id && c.evidence_url !== p.evidence_url && !endedIds.has(c.id) && corroboratesCurrentness(dated(p), dated(c), input.accountName))
      .sort((a, b) => b.observed_at.getTime() - a.observed_at.getTime())[0];
    if (!n) { uncorroborated.push(p); continue; }
    const g = byCorroborator.get(n.id) ?? { n, primaries: [] };
    g.primaries.push(p);
    byCorroborator.set(n.id, g);
  }
  // A primary that is itself the corroborator of an older one is shown through that chain, not twice.
  const corroboratorIds = new Set(byCorroborator.keys());
  for (const { n, primaries } of byCorroborator.values()) {
    const chosen = primaries.filter((p) => !corroboratorIds.has(p.id)).sort(preferred)[0] ?? primaries.sort(preferred)[0];
    const until = outreachCurrentUntil(chosen.type as SignalType, chosen.observed_at, n.observed_at);
    if (chosen.freshness_expires_at && until.getTime() <= chosen.freshness_expires_at.getTime()) continue; // nothing newer to say
    const record = {
      kind: 'ongoing_state',
      primary: chainRef(chosen),
      currentness: { ...chainRef(n), excerpt: n.evidence_text },
      otherSources: primaries.filter((p) => p.id !== chosen.id).map(chainRef),
      programKeys: [...programKeys(chosen.evidence_text!, input.accountName)],
      establishedAt: input.now.toISOString(),
    };
    const reg = await registerSignal(prisma, {
      accountName: chosen.account_name,
      personaId: chosen.persona_id,
      sourceKind: 'evidence_record',
      sourceId: `${CONTINUITY_PREFIX}${chosen.source_id}:${day(n.observed_at)}`,
      type: chosen.type as SignalType,
      title: chosen.title,
      summary: null,
      sourceType: chosen.source_type as 'public_primary' | 'public_secondary',
      evidenceUrl: chosen.evidence_url,
      evidenceText: chosen.evidence_text,
      externalOk: true,
      observedAt: chosen.observed_at,
      confidence: chosen.confidence,
      freshnessExpiresAt: until,
      metadata: { ...(chosen.metadata ?? {}), verified: 'excerpt_found_at_source', continuity: record },
      registeredBy: input.actor,
    });
    out.corroborated.push({ primarySignalId: chosen.id, continuitySignalId: reg.id, created: reg.created, currentnessUrl: n.evidence_url, currentnessPublishedAt: n.observed_at.toISOString(), currentUntil: until.toISOString() });
    if (reg.created) {
      await prisma.gapAuditEvent.create({ data: { kind: 'research.continuity_established', actor: input.actor, subject_type: 'prospecting_signal', subject_id: reg.id, payload: { accountName: input.accountName, primary: chosen.id, currentness: n.id, currentUntil: until.toISOString() } } });
    }
  }

  // SEEKING: an ongoing fact whose own clock ends soon (or has ended) and nothing newer says it still runs.
  const soon = input.now.getTime() + CORROBORATION_CHECK_AFTER_MS;
  for (const p of uncorroborated) {
    if (corroboratorIds.has(p.id)) continue;
    const ends = p.freshness_expires_at?.getTime() ?? 0;
    if (ends > soon) continue;
    const keys = [...programKeys(p.evidence_text!, input.accountName)];
    if (keys.length === 0) continue; // nothing specific to look for
    out.seeking.push({ signalId: p.id, programKeys: keys, ownClockEnds: p.freshness_expires_at?.toISOString() ?? null });
  }
  return out;
}

/** The web-research focus for currentness: a newer report that the program still operates, not the announcement. */
export function currentnessFocus(accountName: string, seeking: ContinuityOutcome['seeking'], now: Date): string {
  const keys = [...new Set(seeking.flatMap((s) => s.programKeys))].slice(0, 3).map((k) => k.charAt(0).toUpperCase() + k.slice(1));
  const month = now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `CURRENTNESS CHECK: find reporting published in the last 60 days (as of ${month}) stating that ${keys.join(' / ')} is STILL operating for ${accountName} today. Not the original announcement, and not a report that repeats it.`;
}
