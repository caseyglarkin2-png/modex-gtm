/**
 * WON, LOST AND REOPENED DEALS (GAP OS execution recovery, R55, 2026-10-06). Server only.
 *
 * HubSpot says when a deal closes and how (`hs_is_closed`, `hs_is_closed_won`; opportunity/active-opportunity.ts reads
 * it). GAP keeps an append-only `deal.state` row per deal per change (subject the account: open, won, lost, closed) so
 * it can tell a closure and a reopening apart, and acts on its own obligations only:
 *
 *   a deal closes      every open obligation on that deal is SKIPPED with the reason ("the deal closed won on Oct 2;
 *                      kept for history"): terminal, preserved, never deleted; and the account's cold follow-ups stop
 *                      (closed won: a customer, no first-touch campaign; closed lost: parked until something material
 *                      changes, which the opportunity resolver reads)
 *   a deal reopens     ONE current next step ("Reopened: decide the next step on X"), once per reopening; the obligations
 *                      skipped at the closure stay skipped, so no historical reminder is revived
 *   first sight        a deal seen open for the first time is recorded as the baseline, silently
 *
 * An UNKNOWN opportunity read changes nothing (never act on what could not be read). Nothing here sends, writes HubSpot
 * or changes a thesis, a person or a suppression.
 */
import { ensureCommitment, loadCommitments, transitionCommitment } from '../work/commitments';
import { TERMINAL_STATUSES, type Commitment } from '../work/commitment-model';
import { readCursor, rotateFrom, writeCursor } from '../work/cursor';
import type { ClosedDeal } from '../opportunity/active-opportunity';
import type { ClosedDealRef } from './scope';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DEAL_STATE = 'deal.state' as const;
export type DealState = 'open' | 'won' | 'lost' | 'closed';
export const CLOSURE_ACTOR = 'gap:deals';

const closedDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : 'a date HubSpot does not hold');
const stateOf = (d: ClosedDeal): DealState => (d.won === true ? 'won' : d.won === false ? 'lost' : 'closed');
const isDealId = (s: string) => /^\d+$/.test(s);
const sameName = (a: string | null | undefined, b: string | null | undefined) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Batch item 8: the open work on a deal: scoped by its HubSpot id, or (a legacy note, R44) by its exact NAME. A
 * name-scoped obligation on a closed deal was never skipped (the match was by id only).
 */
export function openWorkOn(commitments: readonly Commitment[], deal: { id: string; name: string | null }): Commitment[] {
  return commitments.filter((c) => !!c.dealId && !TERMINAL_STATUSES.includes(c.status) && (c.dealId === deal.id || (!isDealId(c.dealId) && sameName(c.dealId, deal.name))));
}

export async function loadDealStates(prisma: PrismaLike, accountName: string): Promise<Map<string, { state: DealState; at: string }>> {
  const rows: Array<{ payload: Record<string, unknown> | null; created_at: Date }> = await prisma.gapAuditEvent.findMany({ where: { kind: DEAL_STATE, subject_type: 'account', subject_id: accountName }, select: { payload: true, created_at: true }, orderBy: { created_at: 'asc' } });
  const out = new Map<string, { state: DealState; at: string }>();
  for (const r of rows) {
    const p = r.payload ?? {};
    if (typeof p.dealId === 'string' && typeof p.state === 'string') out.set(p.dealId, { state: p.state as DealState, at: new Date(r.created_at).toISOString() });
  }
  return out;
}

/**
 * Sprint 5 review: the deals GAP recorded as closed at these accounts (each deal's latest recorded state; a reopened
 * deal is not closed), named for seller text: one read of the `deal.state` rows, no HubSpot call.
 */
export async function loadRecordedClosures(prisma: PrismaLike, accountNames: readonly string[]): Promise<Map<string, ClosedDealRef>> {
  const out = new Map<string, ClosedDealRef>();
  const names = [...new Set(accountNames)];
  if (!names.length || typeof prisma?.gapAuditEvent?.findMany !== 'function') return out;
  const rows: Array<{ payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({ where: { kind: DEAL_STATE, subject_type: 'account', subject_id: { in: names } }, select: { payload: true }, orderBy: { created_at: 'asc' } });
  for (const r of rows) {
    const p = r.payload ?? {};
    if (typeof p.dealId !== 'string') continue;
    if (p.state === 'won' || p.state === 'lost' || p.state === 'closed') out.set(p.dealId, { id: p.dealId, name: typeof p.dealName === 'string' ? p.dealName : null, won: p.state === 'won' ? true : p.state === 'lost' ? false : null, closedAt: typeof p.closedAt === 'string' ? p.closedAt : null });
    else out.delete(p.dealId);
  }
  return out;
}

export interface ClosureSyncResult {
  closed: string[];
  reopened: string[];
  skipped: number;
  created: number;
}

/**
 * Reconcile GAP's obligations with HubSpot's deal states for one account. `open` and `closed` are the opportunity
 * resolver's answer (pass nothing for an UNKNOWN read). Idempotent: a state already recorded changes nothing.
 */
export async function syncDealStates(
  prisma: PrismaLike,
  input: { accountName: string; open: ReadonlyArray<{ id: string; name: string | null }>; closed: readonly ClosedDeal[]; now: Date },
): Promise<ClosureSyncResult> {
  const out: ClosureSyncResult = { closed: [], reopened: [], skipped: 0, created: 0 };
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return out;
  const recorded = await loadDealStates(prisma, input.accountName);
  const commitments = await loadCommitments(prisma, { accountNames: [input.accountName] });
  const openOn = (deal: { id: string; name: string | null }) => openWorkOn(commitments, deal);
  const record = (dealId: string, state: DealState, name: string | null, closedAt: string | null = null) => prisma.gapAuditEvent.create({ data: { kind: DEAL_STATE, actor: CLOSURE_ACTOR, subject_type: 'account', subject_id: input.accountName, payload: { dealId, state, dealName: name, closedAt } } });
  const skip = async (commitmentId: string, reason: string) => {
    const t = await transitionCommitment(prisma, { commitmentId, to: 'skipped', reason, actor: CLOSURE_ACTOR, now: input.now }).catch(() => null);
    if (t?.ok) out.skipped += 1;
  };

  for (const d of input.closed) {
    const was = recorded.get(d.id)?.state;
    const now = stateOf(d);
    if (was === now) continue;
    // A deal GAP never saw open and holds no work for: recorded, nothing else to do.
    if (!was && openOn(d).length === 0) {
      await record(d.id, now, d.name, d.closedAt);
      continue;
    }
    await record(d.id, now, d.name, d.closedAt);
    out.closed.push(d.id);
    const why = `the deal "${d.name ?? d.id}" closed ${now === 'closed' ? 'without an outcome' : now} on ${closedDay(d.closedAt)}; kept for history`;
    for (const c of openOn(d)) await skip(c.commitmentId, why);
  }
  // Obsolete prospecting stops once no deal is open: a customer gets no cold follow-up; a lost deal parks them.
  if (out.closed.length && input.open.length === 0) {
    const won = input.closed.some((d) => d.won === true);
    for (const c of commitments.filter((x) => x.kind === 'follow_up' && !x.dealId && !TERMINAL_STATUSES.includes(x.status))) {
      await skip(c.commitmentId, won ? 'a customer now (a deal closed won): no cold follow-up' : 'parked: the deal closed lost; no cold follow-up until something material changes');
    }
  }

  for (const d of input.open) {
    const was = recorded.get(d.id);
    if (!was) {
      await record(d.id, 'open', d.name);
      continue;
    }
    if (was.state === 'open') continue;
    // Reopened: ONE current next step, keyed by this reopening; nothing skipped at the closure comes back.
    await record(d.id, 'open', d.name);
    out.reopened.push(d.id);
    const made = await ensureCommitment(prisma, { accountName: input.accountName, kind: 'deal_step', title: `Reopened: decide the next step on "${d.name ?? d.id}"`.slice(0, 200), dueAt: input.now, dealId: d.id, source: { kind: 'deal', id: `reopen:${d.id}:${input.now.toISOString().slice(0, 10)}` }, detail: null }, { actor: CLOSURE_ACTOR, now: input.now }).catch(() => null);
    if (made?.ok && made.created) out.created += 1;
  }
  return out;
}

/** Per instance: the Work sweep reconciles closures at most this often, for at most this many accounts. */
export const CLOSURE_SWEEP_MS = 5 * 60_000;
export const CLOSURE_SWEEP_ACCOUNTS = 5;
/** Batch item 8: where the bounded closure sweep resumes (work/cursor.ts), so no account starves the rest. */
export const CLOSURE_SWEEP_CURSOR = 'gap:closure_sweep_cursor';
let lastClosureSweep = 0;
export function resetClosureSweep(): void {
  lastClosureSweep = 0;
}

/**
 * The Work sweep (bounded): accounts that hold open work scoped to a deal that is no longer in the portal's open
 * deals are read through the opportunity resolver (one account at a time, at most five per run, every five minutes per
 * instance) and reconciled. Never runs when the open-deal summary is unavailable (nothing is known to have closed).
 */
export async function sweepClosedDeals(
  prisma: PrismaLike,
  input: { now: Date; openDealIds: ReadonlySet<string> | null; /** Batch item 8: the open deals' names, lowercased (a legacy name-scoped obligation is checked too). */ openDealNames?: ReadonlySet<string> | null; resolve: (accountName: string) => Promise<{ status: string; deals?: Array<{ id: string; name: string | null }>; closed?: ClosedDeal[] }> },
): Promise<ClosureSyncResult & { accounts: string[] }> {
  const empty = { closed: [] as string[], reopened: [] as string[], skipped: 0, created: 0, accounts: [] as string[] };
  if (!input.openDealIds || input.now.getTime() - lastClosureSweep < CLOSURE_SWEEP_MS) return empty;
  lastClosureSweep = input.now.getTime();
  const all = await loadCommitments(prisma).catch(() => []);
  // Batch item 8: work scoped by a deal id that left the open deals, or by a legacy deal NAME no open deal carries; the
  // accounts in a stable order resumed after the last one swept, so a few unmapped deals never starve the rest.
  const left = (dealId: string) => (isDealId(dealId) ? !input.openDealIds!.has(dealId) : !!input.openDealNames && !input.openDealNames.has(dealId.trim().toLowerCase()));
  const candidates = [...new Set(all.filter((c) => c.dealId && !TERMINAL_STATUSES.includes(c.status) && left(c.dealId)).map((c) => c.accountName))];
  const accounts = rotateFrom(candidates, (a) => a, await readCursor(prisma, CLOSURE_SWEEP_CURSOR)).slice(0, CLOSURE_SWEEP_ACCOUNTS);
  if (accounts.length) await writeCursor(prisma, CLOSURE_SWEEP_CURSOR, accounts[accounts.length - 1]);
  const total = { ...empty, accounts };
  for (const a of accounts) {
    const t = await input.resolve(a).catch(() => null);
    if (!t || t.status === 'UNKNOWN') continue;
    const r = await syncDealStates(prisma, { accountName: a, open: t.status === 'ACTIVE' ? t.deals ?? [] : [], closed: t.closed ?? [], now: input.now }).catch(() => null);
    if (!r) continue;
    total.closed.push(...r.closed);
    total.reopened.push(...r.reopened);
    total.skipped += r.skipped;
    total.created += r.created;
  }
  return total;
}
