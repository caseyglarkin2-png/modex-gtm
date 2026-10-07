/**
 * WORK AGREES WITH THE ACCOUNT ON A DEAL'S TRUTH, ON THE FIRST LOAD (R63-B S12, 2026-10-07). Server only.
 *
 * The defect: Sysco's Work card said "Ready for a first touch: Lee Scratch ... Prepare the first touch" while Sysco's
 * page said "Parked: ... closed lost on Sep 1, 2026 ... No cold outreach until then." Work builds READY from the
 * database alone (a chosen person and a usable thesis) and holds an account only for an open deal in the In Deals
 * summary or a current routing card; a CLOSED deal (R55: a customer, or parked after a loss) is read only by the
 * per-account opportunity resolver, which the page, the pursuit state and every send gate run. Until the account's
 * pursuit summary was written (a visit or the warmer), Work offered the first touch the gate would refuse.
 *
 * Here Work asks that same resolver (`resolveAccountOpportunity`, the gate's own read), for the few accounts it would
 * otherwise offer cold work, and holds each one the way the workspace does: a closure in the closure's words, an open
 * deal the summary missed, or HubSpot not answering (UNKNOWN never permits outbound). Bounded (the first
 * OPPORTUNITY_HOLD_MAX accounts in Work's own order), each answer remembered per instance for the In Deals cache's
 * five minutes (a failed read for one), never a write.
 */
import { opportunitySentence, type OpportunityTruth } from '../opportunity/active-opportunity';
import { unknownReasonWords } from '../opportunity/unknown-words';
import { closureStateLine } from '../pursuit/state';
import { IN_DEALS_CACHE_MS, IN_DEALS_FAILURE_CACHE_MS } from '../deals/in-deals';

/** What the opportunity read holds an account for, in the workspace's own words. */
export type OpportunityHold =
  | { kind: 'closure'; closure: 'customer' | 'parked'; stateLine: string; why: string }
  | { kind: 'open_deal'; why: string }
  | { kind: 'unknown'; why: string };

/** How many accounts one Work read checks (Work's own order; the warmer writes the rest's summaries after it). */
export const OPPORTUNITY_HOLD_MAX = 8;
/** One account's read is bounded tighter than a click's: a HubSpot that does not answer holds the card (UNKNOWN). */
export const OPPORTUNITY_HOLD_TIMEOUT_MS = 4_000;

/** The truth as a hold, or null when nothing holds the account (CLEAR with no closure). */
export function opportunityHoldOf(t: OpportunityTruth): OpportunityHold | null {
  if (t.status === 'ACTIVE') return { kind: 'open_deal', why: opportunitySentence(t) };
  if (t.status === 'UNKNOWN') return { kind: 'unknown', why: `HubSpot could not be checked: ${unknownReasonWords(t.reason)}. No cold touch until it can.` };
  if (t.closure) return { kind: 'closure', closure: t.closure.kind, stateLine: closureStateLine(t.closure.kind), why: t.closure.why };
  return null;
}

/**
 * The accounts Work would offer cold work (a ready or follow-up card, or the database's own READY), plus the accounts a
 * routing card holds "for an open deal" that the In Deals summary does not list (a closure's hold, said as a deal), in
 * Work's own order, none already in an open deal, at most `max`.
 */
export function accountsToCheck(
  i: {
    candidates: ReadonlyArray<{ accountName: string | null; lane: string; failsGate?: boolean }>;
    dbState: ReadonlyMap<string, { sendable: boolean; chosen: unknown }>;
    held: ReadonlyMap<string, 'active_opportunity' | 'opportunity_unknown'>;
    inDeals: { status: 'complete' | 'unavailable'; accounts: ReadonlyArray<{ accountName: string }> };
  },
  max = OPPORTUNITY_HOLD_MAX,
): string[] {
  const inDeal = new Set(i.inDeals.status === 'complete' ? i.inDeals.accounts.map((a) => a.accountName) : []);
  const out: string[] = [];
  const add = (name: string | null) => {
    if (!name || inDeal.has(name) || i.held.get(name) === 'opportunity_unknown' || out.includes(name)) return;
    out.push(name);
  };
  for (const c of i.candidates) if (!c.failsGate && (c.lane === 'ready' || c.lane === 'follow_up')) add(c.accountName);
  for (const [name, db] of i.dbState) if (db.chosen && db.sendable) add(name);
  if (i.inDeals.status === 'complete') for (const [name, why] of i.held) if (why === 'active_opportunity') add(name);
  return out.slice(0, max);
}

const remembered = new Map<string, { at: number; ttl: number; hold: OpportunityHold | null }>();

/** Tests only: forget every remembered answer. */
export function resetOpportunityHolds(): void {
  remembered.clear();
}

/** Each account's hold, read through `resolve` (the gate's resolver), at once; an account nothing holds is absent. */
export async function loadOpportunityHolds(accounts: readonly string[], resolve: (accountName: string) => Promise<OpportunityTruth>, now = Date.now()): Promise<Map<string, OpportunityHold>> {
  const out = new Map<string, OpportunityHold>();
  await Promise.all(
    accounts.map(async (name) => {
      const have = remembered.get(name);
      let hold: OpportunityHold | null;
      if (have && now - have.at < have.ttl) hold = have.hold;
      else {
        const truth = await resolve(name).catch((e): OpportunityTruth => ({ status: 'UNKNOWN', reason: 'hubspot_error', detail: e instanceof Error ? e.message : String(e) }));
        hold = opportunityHoldOf(truth);
        remembered.set(name, { at: now, ttl: truth.status === 'UNKNOWN' ? IN_DEALS_FAILURE_CACHE_MS : IN_DEALS_CACHE_MS, hold });
      }
      if (hold) out.set(name, hold);
    }),
  );
  return out;
}
