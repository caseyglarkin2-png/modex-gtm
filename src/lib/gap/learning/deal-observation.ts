/**
 * READ-ONLY deal observation (Phase 2 A2, 2026-09-28).
 *
 * The question it can answer later: "did a HubSpot deal appear at a
 * GAP-touched account within 60 / 120 days of the first GAP send there?"
 * It is an observation, never a claim of causality, and it writes nothing:
 * no HubSpot writes (no stage changes), no modex writes.
 *
 *   first touch   the earliest Gmail-proven GAP send at the account, from the
 *                 append-only send ledger (DIRECT_SENT, MANUAL_SENT, DRAFT_SENT)
 *   company       the SAME identity rule the opportunity resolver uses
 *                 (resolveCompanyIdentity): one identity rule, not two
 *   deals         every deal on those companies, with HubSpot's createdate
 *
 * A window that has not finished yet is reported as open (the absence of a
 * deal is not evidence of anything until the window closes). An account whose
 * identity or deals cannot be read is `unknown`, never "no deal".
 */
import { DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, MANUAL_SENT } from '../execution/draft-ledger';
import { loadOpportunityIdentity, resolveCompanyIdentity, type OpportunityReads } from '../opportunity/active-opportunity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const OBSERVATION_WINDOWS_DAYS = [60, 120] as const;
const DAY = 86_400_000;

export interface ObservedDeal {
  id: string;
  name: string | null;
  createdAt: string;
  closed: boolean | null;
  daysAfterFirstTouch: number;
}

export type DealObservation =
  | {
      accountName: string;
      status: 'observed';
      firstTouchAt: string;
      /** Per window: closed (the window has fully elapsed) and the deals created inside it, after the first touch. */
      windows: Array<{ days: number; closed: boolean; deals: ObservedDeal[] }>;
      /** Deals that already existed before the first GAP touch (context, never attributed). */
      dealsBeforeFirstTouch: number;
    }
  | { accountName: string; status: 'unknown'; firstTouchAt: string; reason: string };

/** The first Gmail-proven GAP send per account, from the append-only ledger. */
export async function firstTouchByAccount(prisma: PrismaLike): Promise<Map<string, Date>> {
  const rows: Array<{ kind: string; subject_id: string; payload: Record<string, unknown>; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [DIRECT_SENT, MANUAL_SENT, DRAFT_SENT] } },
    select: { kind: true, subject_id: true, payload: true, created_at: true },
  });
  // DRAFT_SENT rows name only their decision: the account comes from the routing decision.
  const needDecision = [...new Set(rows.filter((r) => !r.payload?.accountName).map((r) => r.subject_id))];
  const decisions: Array<{ id: string; account_name: string }> = needDecision.length
    ? await prisma.routingDecision.findMany({ where: { id: { in: needDecision } }, select: { id: true, account_name: true } })
    : [];
  const accountOfDecision = new Map(decisions.map((d) => [d.id, d.account_name]));
  const first = new Map<string, Date>();
  for (const r of rows) {
    const account = String(r.payload?.accountName ?? accountOfDecision.get(r.subject_id) ?? '').trim();
    if (!account) continue;
    const at = new Date(String(r.payload?.sentAt ?? r.created_at));
    if (Number.isNaN(at.getTime())) continue;
    const prev = first.get(account);
    if (!prev || at < prev) first.set(account, at);
  }
  return first;
}

export async function observeDealsAfterFirstTouch(prisma: PrismaLike, reads: OpportunityReads, opts: { now: Date; accounts?: string[] }): Promise<DealObservation[]> {
  const touched = await firstTouchByAccount(prisma);
  const names = opts.accounts ? opts.accounts.filter((a) => touched.has(a)) : [...touched.keys()].sort();
  const out: DealObservation[] = [];
  for (const accountName of names) {
    const firstTouch = touched.get(accountName)!;
    const unknownOf = (reason: string): DealObservation => ({ accountName, status: 'unknown', firstTouchAt: firstTouch.toISOString(), reason });
    try {
      const identity = await loadOpportunityIdentity(prisma, accountName);
      const resolved = await resolveCompanyIdentity(identity, reads);
      if (!resolved.ok) {
        out.push(unknownOf(resolved.truth.status === 'UNKNOWN' ? resolved.truth.reason : 'identity_unresolved'));
        continue;
      }
      const assoc = await reads.associations('companies', 'deals', resolved.companyIds);
      if (assoc.truncated) {
        out.push(unknownOf('deal_associations_truncated'));
        continue;
      }
      const dealIds = [...new Set([...assoc.byId.values()].flat())].sort();
      const deals = dealIds.length ? await reads.readDeals(dealIds) : [];
      let before = 0;
      const after: ObservedDeal[] = [];
      for (const d of deals) {
        const created = new Date(String(d.properties?.createdate ?? ''));
        if (Number.isNaN(created.getTime())) continue;
        if (created < firstTouch) {
          before += 1;
          continue;
        }
        const closed = String(d.properties?.hs_is_closed ?? '').toLowerCase();
        after.push({
          id: String(d.id),
          name: d.properties?.dealname ?? null,
          createdAt: created.toISOString(),
          closed: closed === 'true' ? true : closed === 'false' ? false : null,
          daysAfterFirstTouch: Math.floor((created.getTime() - firstTouch.getTime()) / DAY),
        });
      }
      out.push({
        accountName,
        status: 'observed',
        firstTouchAt: firstTouch.toISOString(),
        windows: OBSERVATION_WINDOWS_DAYS.map((days) => ({
          days,
          closed: opts.now.getTime() >= firstTouch.getTime() + days * DAY,
          deals: after.filter((d) => d.daysAfterFirstTouch <= days),
        })),
        dealsBeforeFirstTouch: before,
      });
    } catch (e) {
      out.push(unknownOf(`hubspot_error: ${(e instanceof Error ? e.message : String(e)).slice(0, 160)}`));
    }
  }
  return out;
}
