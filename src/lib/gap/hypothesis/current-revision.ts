/**
 * CURRENT REVISION (final Monday P1, 2026-09-27).
 *
 * The audit defect: after Casey chose verified evidence and GAP created ONE
 * replacement revision for a frozen thesis, the person's routing card still
 * pointed at the old frozen row, still offered RESEARCH THIS, and a click
 * proposed a SECOND equivalent draft for the same person and thesis.
 *
 * The rule: when a person already has current work for this thesis, that is
 * where the seller goes. Research and propose never mint another draft beside
 * it. History is never touched: frozen rows and supersedes links stay.
 *
 * Current work, for (account, person, family, card thesis):
 *   1. the newest live successor of the card's thesis along supersedes_id
 *      (draft, review_required, approved or active), else
 *   2. the card's OWN thesis when it is an open draft / review_required row
 *      that is already outreach ready (verified evidence was used on it in
 *      place: RESEARCH THIS again would only propose a second one), else
 *   3. an open draft / review_required row for the same person at the same
 *      account (same family when the family is known), not itself superseded.
 */
import { GATE_SIGNAL_SELECT } from '../research/evidence-gate';
import { outreachReadiness } from './actionability';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const LIVE_REVISION_STATUSES = ['draft', 'review_required', 'approved', 'active'] as const;
const OPEN_WORK_STATUSES = ['draft', 'review_required'] as const;
/** A supersedes chain longer than this is data damage; stop walking. */
const MAX_CHAIN = 20;

export interface ExistingRevision {
  hypothesisId: string;
  status: string;
  /** How it was found: the card thesis was superseded, or the person has open thesis work. */
  via: 'supersedes' | 'open_work';
}

export async function existingRevisionFor(
  prisma: PrismaLike,
  input: { accountName: string; personaId: number | null; problemFamily?: string | null; hypothesisId?: string | null },
): Promise<ExistingRevision | null> {
  if (input.hypothesisId) {
    let at = input.hypothesisId;
    let newest: { id: string; status: string } | null = null;
    for (let i = 0; i < MAX_CHAIN; i += 1) {
      const next: { id: string; status: string } | null = await prisma.prospectingHypothesis.findFirst({
        where: { supersedes_id: at },
        select: { id: true, status: true },
      });
      if (!next) break;
      newest = next;
      at = next.id;
    }
    if (newest && (LIVE_REVISION_STATUSES as readonly string[]).includes(newest.status)) {
      return { hypothesisId: newest.id, status: newest.status, via: 'supersedes' };
    }
  }
  if (input.hypothesisId) {
    const own: { id: string; status: string; observation: string | null; account_name: string; metadata?: unknown; signals?: Array<{ signal: unknown }> } | null = await prisma.prospectingHypothesis.findFirst({
      where: { id: input.hypothesisId, status: { in: [...OPEN_WORK_STATUSES] }, superseded_by: { is: null } },
      include: { signals: { include: { signal: { select: { ...GATE_SIGNAL_SELECT, freshness_expires_at: true } } } } },
    });
    if (own && outreachReadiness({ observation: own.observation, account_name: own.account_name, metadata: own.metadata, signals: (own.signals ?? []).map((l) => l.signal as never) }, new Date()).ready) {
      return { hypothesisId: own.id, status: own.status, via: 'open_work' };
    }
  }
  if (input.personaId == null) return null;
  const open: { id: string; status: string } | null = await prisma.prospectingHypothesis.findFirst({
    where: {
      account_name: input.accountName,
      primary_persona_id: input.personaId,
      status: { in: [...OPEN_WORK_STATUSES] },
      superseded_by: { is: null },
      ...(input.problemFamily ? { problem_family: input.problemFamily } : {}),
      ...(input.hypothesisId ? { id: { not: input.hypothesisId } } : {}),
    },
    orderBy: { created_at: 'desc' },
    select: { id: true, status: true },
  });
  return open ? { hypothesisId: open.id, status: open.status, via: 'open_work' } : null;
}

/** The newest live successor of each thesis, for the queue (one read per page). */
export async function revisedByOf(prisma: PrismaLike, hypothesisIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (hypothesisIds.length === 0 || typeof prisma?.prospectingHypothesis?.findMany !== 'function') return out;
  const rows: Array<{ id: string; supersedes_id: string | null; status: string }> =
    (await prisma.prospectingHypothesis.findMany({
      where: { supersedes_id: { in: hypothesisIds } },
      select: { id: true, supersedes_id: true, status: true },
    })) ?? [];
  for (const r of rows) {
    if (r.supersedes_id && (LIVE_REVISION_STATUSES as readonly string[]).includes(r.status)) out.set(r.supersedes_id, r.id);
  }
  return out;
}
