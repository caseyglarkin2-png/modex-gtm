/**
 * Route after USE (weekend reduction pass, 2026-09-26; targeted since the
 * debt burn the same day).
 *
 * APPROVE + USE already means "I believe this and want GAP to use it", so the
 * approve action routes on its own; Casey never presses a separate ROUTE
 * button for the same rows. This is the one server seam for that, shared by
 * the thesis approve op, the one-off hypothesis PATCH and the research
 * proposal decision.
 *
 * Scope is exactly the people Casey just put in use, at their own accounts.
 * The queue shows each person's newest applicable card from any run, so this
 * run replaces only their cards and leaves every other account as it was.
 *
 * Routing writes shadow RoutingDecision rows only. Nothing here drafts,
 * enrolls or sends. Voice: no em dashes.
 */

import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '@/lib/hubspot/client';
import { sellerLaneOf, type SellerLane } from './card-readiness';
import { listQueue as defaultListQueue, type QueueItem } from './queue';
import { DEFAULT_MAX_PAIRS, createHubSpotSnapshotProvider, faultText, runRouting as defaultRunRouting, type RunReport, type SnapshotReads } from './run';
import { createClawdSuppressionReader } from './suppression-read';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** The SDK reads for the routing snapshot: two READS per account, never a write. */
export const hubspotReads: SnapshotReads = {
  async readCompany(hubspotCompanyId, properties) {
    const client = getHubSpotClient();
    const res = await withHubSpotRetry(
      () => client.crm.companies.basicApi.getById(hubspotCompanyId, [...properties]),
      `gap-routing company read (${hubspotCompanyId})`,
    );
    return res ? { properties: res.properties ?? {} } : null;
  },
  async readContacts(ids, properties) {
    const client = getHubSpotClient();
    const res = await withHubSpotRetry(
      () =>
        client.crm.contacts.batchApi.read({
          inputs: ids.map((id) => ({ id })),
          properties: [...properties],
          propertiesWithHistory: [],
        }),
      `gap-routing contacts batch read (${ids.length})`,
    );
    return (res.results ?? []).map((r) => ({ id: String(r.id), properties: r.properties ?? {} }));
  },
};

/** `failed`: routing could not finish this person's account (reason in `failures`). `not_routed`: routing ran and skipped them. */
export type OutcomeLane = SellerLane | 'not_routed' | 'failed';

export interface PersonOutcome {
  personaId: number;
  name: string | null;
  lane: OutcomeLane;
  decisionId: string | null;
}

export interface UseOutcomes {
  runId: string;
  people: PersonOutcome[];
  counts: Record<OutcomeLane, number>;
  /** Accounts routing could not finish, with the exact reason. Other accounts' cards are untouched. */
  failures: RunReport['failed'];
}

export type RouteAfterUseResult =
  | ({ ok: true } & UseOutcomes)
  | { ok: false; reason: string; detail?: string };

const EMPTY_COUNTS = (): Record<OutcomeLane, number> => ({ review: 0, research: 0, ready: 0, follow_up: 0, later: 0, blocked: 0, not_routed: 0, failed: 0 });

/**
 * Pure: where each approved person landed in the new run. A person with no
 * card in the run is `failed` when their account failed, else `not_routed`
 * (the run skipped them), never silently dropped, so Casey is not left with
 * an in-use row and no recommendation.
 */
export function summarizeUseOutcomes(
  runId: string,
  items: readonly QueueItem[],
  people: ReadonlyArray<{ personaId: number; name: string | null; accountName?: string | null }>,
  failures: RunReport['failed'] = [],
): UseOutcomes {
  const failedAccounts = new Set(failures.map((f) => f.accountName));
  const counts = EMPTY_COUNTS();
  const out: PersonOutcome[] = [];
  const seen = new Set<number>();
  for (const p of people) {
    if (seen.has(p.personaId)) continue;
    seen.add(p.personaId);
    const item = items.find((i) => i.persona.id === p.personaId);
    const lane: OutcomeLane = item ? sellerLaneOf(item) : p.accountName && failedAccounts.has(p.accountName) ? 'failed' : 'not_routed';
    counts[lane] += 1;
    out.push({ personaId: p.personaId, name: item?.persona.displayName ?? p.name, lane, decisionId: item?.id ?? null });
  }
  return { runId, people: out, counts, failures: [...failures] };
}

export interface RouteAfterUseDeps {
  run?: typeof defaultRunRouting;
  listQueue?: typeof defaultListQueue;
}

/**
 * Route exactly these people (apply, shadow rows only) at their own accounts
 * and report where each landed. A person whose account failed is `failed`
 * with the account's reason; everyone else still gets their card. Every
 * failure is returned for the caller to show inline; nothing throws past here.
 */
export async function routeAfterUse(
  prisma: PrismaLike,
  input: { actor: string; now: Date; people: ReadonlyArray<{ personaId: number; name: string | null }> },
  deps: RouteAfterUseDeps = {},
): Promise<RouteAfterUseResult> {
  try {
    const ids = [...new Set(input.people.map((p) => p.personaId))];
    if (ids.length === 0) return { ok: false, reason: 'no_people' };
    const rows: Array<{ id: number; account_name: string | null }> = await prisma.persona.findMany({
      where: { id: { in: ids } },
      select: { id: true, account_name: true },
    });
    const accountOf = new Map(rows.map((r) => [r.id, r.account_name]));
    const accountNames = [...new Set(rows.map((r) => r.account_name).filter((n): n is string => typeof n === 'string' && n.length > 0))];
    const people = input.people.map((p) => ({ ...p, accountName: accountOf.get(p.personaId) ?? null }));
    if (accountNames.length === 0) return { ok: true, ...summarizeUseOutcomes('', [], people) };
    const report: RunReport = await (deps.run ?? defaultRunRouting)(
      prisma,
      { now: input.now, actor: input.actor, dryRun: false, maxPairs: DEFAULT_MAX_PAIRS, accountNames, personaIds: ids },
      {
        suppression: createClawdSuppressionReader(),
        hubspotSnapshot: createHubSpotSnapshotProvider(prisma, hubspotReads, { configured: isHubSpotConfigured }),
      },
    );
    const page = await (deps.listQueue ?? defaultListQueue)(prisma, { runId: report.runId, limit: 100 });
    return { ok: true, ...summarizeUseOutcomes(report.runId, page.items, people, report.failed) };
  } catch (error) {
    return { ok: false, reason: 'routing_failed', detail: faultText(error) };
  }
}
