/**
 * STRANDED DRAFTS, READ ONLY (GAP OS execution recovery, R65 for the R64 repair, 2026-10-07). Server only.
 *
 * A stranded draft is a thesis left in `draft` (never submitted for review), never superseded, with no `source_ref`:
 * an older path made it (PepsiCo's `unmapped` draft for Tom came from the recording on 2026-10-06), so nothing keys it
 * to the fact it cites and the draft control would otherwise mint a twin. The R11 service (story/draft-from-fact.ts)
 * ADOPTS such a draft when the seller drafts from its fact for its person: it runs the fact's checks first, then, if no
 * thesis already holds the story's key (`anchor:<fact>:p<person>`), stamps the key on the newest stranded draft for
 * that fact and person and continues it.
 *
 * `planStrandedRepair` says, per stranded draft, what that service would do, reading only: the fact it would draft
 * from (the primary fact first, then supporting facts), whether that fact passes the service's own checks now
 * (`draftFactRefusal`), whether another thesis already holds the key, and whether a newer stranded draft for the
 * same fact and person would be adopted instead. Nothing here writes; the adoption itself runs through the service.
 */
import { anchorSourceRef, draftFactRefusal, DRAFT_FACT_SELECT, type DraftFactRow } from '../story/draft-from-fact';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const STRANDED_PLAN_MAX = 500;

export interface StrandedPlanItem {
  hypothesisId: string;
  accountName: string;
  personaId: number | null;
  person: string | null;
  family: string;
  createdAt: string;
  ageDays: number;
  verdict: 'adopt' | 'not_adopted';
  /** The fact the service would draft from, and its role on the draft. */
  factId: string | null;
  factRole: 'primary' | 'supporting' | null;
  /** The story key the service would stamp. */
  key: string | null;
  /** Why, in words. */
  why: string;
}

export interface StrandedPlan {
  checkedAt: string;
  items: StrandedPlanItem[];
  counts: { stranded: number; adopt: number; notAdopted: number };
  /** True when more stranded drafts exist than the plan reads (the plan is the oldest STRANDED_PLAN_MAX). */
  truncated: boolean;
}

type DraftRow = {
  id: string;
  account_name: string;
  primary_persona_id: number | null;
  problem_family: string;
  created_at: Date;
  primary_persona: { name: string | null } | null;
  signals: Array<{ signal_id: string; role: string }>;
};

/** The stranded drafts: `draft`, no `source_ref`, never superseded (the oldest first). */
export const STRANDED_WHERE = { status: 'draft', source_ref: null, superseded_by: { is: null } } as const;

export async function planStrandedRepair(prisma: PrismaLike, now: Date): Promise<StrandedPlan> {
  const rows: DraftRow[] = await prisma.prospectingHypothesis.findMany({
    where: STRANDED_WHERE,
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    take: STRANDED_PLAN_MAX + 1,
    select: { id: true, account_name: true, primary_persona_id: true, problem_family: true, created_at: true, primary_persona: { select: { name: true } }, signals: { select: { signal_id: true, role: true } } },
  });
  const truncated = rows.length > STRANDED_PLAN_MAX;
  const drafts = rows.slice(0, STRANDED_PLAN_MAX);
  const factIds = [...new Set(drafts.flatMap((d) => d.signals.map((s) => s.signal_id)))];
  const facts: DraftFactRow[] = factIds.length ? await prisma.prospectingSignal.findMany({ where: { id: { in: factIds } }, select: DRAFT_FACT_SELECT }) : [];
  const factById = new Map(facts.map((f) => [f.id, f]));
  const keys = [...new Set(drafts.flatMap((d) => d.signals.map((s) => anchorSourceRef(s.signal_id, d.primary_persona_id))))];
  const held: Array<{ id: string; source_ref: string | null }> = keys.length ? await prisma.prospectingHypothesis.findMany({ where: { source_ref: { in: keys } }, select: { id: true, source_ref: true } }) : [];
  const holder = new Map(held.map((h) => [h.source_ref, h.id]));
  // The service adopts the NEWEST unkeyed open thesis for a fact and person, a draft or one under review (its query
  // orders by created_at desc over both).
  const reviewing: Array<{ id: string; primary_persona_id: number | null; created_at: Date; signals: Array<{ signal_id: string }> }> = factIds.length
    ? await prisma.prospectingHypothesis.findMany({ where: { status: 'review_required', source_ref: null, superseded_by: { is: null }, signals: { some: { signal_id: { in: factIds } } } }, select: { id: true, primary_persona_id: true, created_at: true, signals: { select: { signal_id: true } } } })
    : [];
  const newest = new Map<string, { id: string; at: number }>();
  for (const d of [...drafts, ...reviewing]) {
    for (const s of d.signals) {
      const key = anchorSourceRef(s.signal_id, d.primary_persona_id);
      const at = new Date(d.created_at).getTime();
      const cur = newest.get(key);
      if (!cur || at > cur.at || (at === cur.at && d.id > cur.id)) newest.set(key, { id: d.id, at });
    }
  }

  const items: StrandedPlanItem[] = drafts.map((d) => {
    const base = {
      hypothesisId: d.id,
      accountName: d.account_name,
      personaId: d.primary_persona_id,
      person: d.primary_persona?.name ?? null,
      family: d.problem_family,
      createdAt: new Date(d.created_at).toISOString(),
      ageDays: Math.max(0, Math.floor((now.getTime() - new Date(d.created_at).getTime()) / 86_400_000)),
    };
    const ordered = [...d.signals].sort((a, b) => Number(b.role === 'primary') - Number(a.role === 'primary'));
    if (!ordered.length) return { ...base, verdict: 'not_adopted', factId: null, factRole: null, key: null, why: 'It cites no fact, so drafting from a fact never reaches it: close it, or link the fact it was meant to rest on.' };
    const reasons: string[] = [];
    for (const s of ordered) {
      const key = anchorSourceRef(s.signal_id, d.primary_persona_id);
      const role = s.role === 'primary' ? 'primary' : 'supporting';
      const refused = draftFactRefusal(factById.get(s.signal_id) ?? null, d.account_name, now);
      if (refused) {
        reasons.push(`its ${role} fact ${s.signal_id} fails the service's checks now (${refused.detail ?? refused.reason})`);
        continue;
      }
      const other = holder.get(key);
      if (other && other !== d.id) {
        reasons.push(`thesis ${other} already holds the story key ${key}, so the service continues that one, never this draft`);
        continue;
      }
      if (newest.get(key)?.id !== d.id) {
        reasons.push(`a newer unkeyed thesis (${newest.get(key)?.id}) for the same fact and person would be adopted instead`);
        continue;
      }
      return { ...base, verdict: 'adopt', factId: s.signal_id, factRole: role, key, why: `Drafting from its ${role} fact for ${d.primary_persona?.name ?? 'its person'} adopts it as ${key} and continues the draft (the family question, then review).` };
    }
    return { ...base, verdict: 'not_adopted', factId: ordered[0].signal_id, factRole: ordered[0].role === 'primary' ? 'primary' : 'supporting', key: anchorSourceRef(ordered[0].signal_id, d.primary_persona_id), why: `Not adopted: ${reasons.join('; ')}.` };
  });
  const adopt = items.filter((i) => i.verdict === 'adopt').length;
  return { checkedAt: now.toISOString(), items, counts: { stranded: items.length, adopt, notAdopted: items.length - adopt }, truncated };
}
