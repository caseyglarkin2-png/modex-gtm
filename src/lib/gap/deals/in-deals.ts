/**
 * IN DEALS (Phase 2 F1, 2026-09-28). When HubSpot says an account already has
 * an open opportunity, GAP stops cold prospecting there (routing rule
 * `active_opportunity`, every send gate) but stays useful: the account is
 * listed here with its open deals, the people GAP holds there and how much
 * buyer truth is confirmed, and its Deal Brief is one click away.
 *
 * The cockpit tile counts accounts routing already holds for an open deal
 * (no HubSpot call on every cockpit load). The lane reads LIVE truth per GAP
 * account, bounded (five at a time, 8s each). An account whose truth cannot
 * be read is listed separately as "could not verify", never dropped and never
 * treated as clear. Read-only: nothing here writes to HubSpot.
 */
import { resolveAccountOpportunity, type OpportunityTruth } from '../opportunity/active-opportunity';
import { BRIEF_BID_SELECT, knownSectionsOf, type BriefBidRow } from './deal-brief';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const IN_DEALS_TIMEOUT_MS = 8_000;
export const IN_DEALS_CONCURRENCY = 5;
export const IN_DEALS_MAX_ACCOUNTS = 40;

export interface InDealAccount {
  accountName: string;
  deals: Array<{ name: string | null; stage: string; lastActivityAt: string | null }>;
  /** HubSpot contacts on the open deals (distinct). */
  dealContacts: number;
  /** People GAP holds at the account. */
  people: Array<{ name: string; title: string | null }>;
  /** Truth sections with confirmed buyer truth (of 6). */
  known: number;
}

export interface InDeals {
  inDeals: InDealAccount[];
  couldNotVerify: Array<{ accountName: string; reason: string }>;
}

/** Accounts the current routing cards hold for an open deal, once each (the tile count). */
export function heldDealAccounts(items: ReadonlyArray<{ ruleId: string | null; account: { name: string } }>): string[] {
  return [...new Set(items.filter((i) => i.ruleId === 'active_opportunity').map((i) => i.account.name))];
}

const DEFAULT_STAGES: Record<string, string> = {
  appointmentscheduled: 'Appointment scheduled',
  qualifiedtobuy: 'Qualified to buy',
  presentationscheduled: 'Presentation scheduled',
  decisionmakerboughtin: 'Decision maker bought in',
  contractsent: 'Contract sent',
};

/** A HubSpot stage id in words; a portal's custom stage says so rather than guessing its name. */
export function stageLabel(stage: string | null | undefined): string {
  if (!stage) return 'Stage unknown';
  return DEFAULT_STAGES[stage] ?? `Custom stage ${stage}`;
}

async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function loadInDeals(
  prisma: PrismaLike,
  accountNames: readonly string[],
  deps: { resolve?: (accountName: string) => Promise<OpportunityTruth> } = {},
): Promise<InDeals> {
  const all = [...new Set(accountNames)];
  const names = all.slice(0, IN_DEALS_MAX_ACCOUNTS);
  const resolve = deps.resolve ?? ((a: string) => resolveAccountOpportunity(prisma, a, {}, { timeoutMs: IN_DEALS_TIMEOUT_MS }));
  const truths = await mapLimit(names, IN_DEALS_CONCURRENCY, async (name): Promise<OpportunityTruth> => {
    try {
      return await resolve(name);
    } catch {
      return { status: 'UNKNOWN', reason: 'hubspot_error' };
    }
  });

  // Review F: an account past the cap is listed as not checked, never silently dropped.
  const couldNotVerify: InDeals['couldNotVerify'] = [];
  const overCap = all.slice(IN_DEALS_MAX_ACCOUNTS).map((accountName) => ({ accountName, reason: 'not_checked_account_limit' }));
  const active: Array<{ accountName: string; truth: Extract<OpportunityTruth, { status: 'ACTIVE' }> }> = [];
  names.forEach((accountName, i) => {
    const t = truths[i];
    if (t.status === 'ACTIVE') active.push({ accountName, truth: t });
    else if (t.status === 'UNKNOWN') couldNotVerify.push({ accountName, reason: t.reason });
  });
  couldNotVerify.push(...overCap);
  if (active.length === 0) return { inDeals: [], couldNotVerify };

  const activeNames = active.map((a) => a.accountName);
  const [people, bids] = await Promise.all([
    prisma.persona.findMany({ where: { account_name: { in: activeNames } }, select: { account_name: true, name: true, title: true }, orderBy: { id: 'asc' } }).catch(() => []),
    prisma.buyerInputData.findMany({ where: { account_name: { in: activeNames } }, select: { ...BRIEF_BID_SELECT, account_name: true } }).catch(() => []),
  ]);
  return {
    inDeals: active.map(({ accountName, truth }) => ({
      accountName,
      deals: truth.deals.map((d) => ({ name: d.name, stage: stageLabel(d.stage), lastActivityAt: d.lastActivityAt ?? null })),
      dealContacts: new Set(truth.deals.flatMap((d) => d.contactIds)).size,
      people: (people as Array<{ account_name: string; name: string; title: string | null }>).filter((p) => p.account_name === accountName).map((p) => ({ name: p.name, title: p.title ?? null })),
      known: knownSectionsOf((bids as Array<BriefBidRow & { account_name: string }>).filter((b) => b.account_name === accountName)),
    })),
    couldNotVerify,
  };
}
