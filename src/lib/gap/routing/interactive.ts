/**
 * Route after USE (weekend reduction pass, 2026-09-26).
 *
 * APPROVE + USE already means "I believe this and want GAP to use it", so the
 * approve action routes on its own; Casey never presses a separate ROUTE
 * button for the same rows. This is the one server seam for that, shared by
 * the thesis approve op, the one-off hypothesis PATCH and the diagnostic
 * Run routing button.
 *
 * Scope is the existing bounded `routable_hypotheses` scope (distinct accounts
 * with an approved/active hypothesis, capped), NOT just the approved account:
 * the queue shows only the latest routing run, so an account-only run would
 * hide every other account's cards. The outcome is then read back for the
 * people Casey just approved only.
 *
 * Routing writes shadow RoutingDecision rows only. Nothing here drafts,
 * enrolls or sends. Voice: no em dashes.
 */

import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '@/lib/hubspot/client';
import { sellerLaneOf, type SellerLane } from './card-readiness';
import { listQueue as defaultListQueue, type QueueItem } from './queue';
import {
  DEFAULT_MAX_PAIRS,
  createHubSpotSnapshotProvider,
  resolveRoutableHypothesisScope as defaultResolveScope,
  runRouting as defaultRunRouting,
  type RunReport,
  type SnapshotReads,
} from './run';
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

export type OutcomeLane = SellerLane | 'not_routed';

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
}

export type RouteAfterUseResult =
  | ({ ok: true } & UseOutcomes)
  | { ok: false; reason: string; detail?: string };

const EMPTY_COUNTS = (): Record<OutcomeLane, number> => ({ review: 0, research: 0, ready: 0, follow_up: 0, later: 0, blocked: 0, not_routed: 0 });

/**
 * Pure: where each approved person landed in the new run. A person with no
 * card in the run is `not_routed` (the run skipped them), never silently
 * dropped, so Casey is not left with an in-use row and no recommendation.
 */
export function summarizeUseOutcomes(runId: string, items: readonly QueueItem[], people: ReadonlyArray<{ personaId: number; name: string | null }>): UseOutcomes {
  const counts = EMPTY_COUNTS();
  const out: PersonOutcome[] = [];
  const seen = new Set<number>();
  for (const p of people) {
    if (seen.has(p.personaId)) continue;
    seen.add(p.personaId);
    const item = items.find((i) => i.persona.id === p.personaId);
    const lane: OutcomeLane = item ? sellerLaneOf(item) : 'not_routed';
    counts[lane] += 1;
    out.push({ personaId: p.personaId, name: item?.persona.displayName ?? p.name, lane, decisionId: item?.id ?? null });
  }
  return { runId, people: out, counts };
}

export interface RouteAfterUseDeps {
  resolveScope?: typeof defaultResolveScope;
  run?: typeof defaultRunRouting;
  listQueue?: typeof defaultListQueue;
}

/**
 * Run the bounded routing pass (apply, shadow rows only) and report where the
 * given people landed. Every failure is returned as a reason for the caller to
 * show inline; nothing throws past here.
 */
export async function routeAfterUse(
  prisma: PrismaLike,
  input: { actor: string; now: Date; people: ReadonlyArray<{ personaId: number; name: string | null }> },
  deps: RouteAfterUseDeps = {},
): Promise<RouteAfterUseResult> {
  try {
    const scope = await (deps.resolveScope ?? defaultResolveScope)(prisma);
    if ('tooLarge' in scope) {
      return { ok: false, reason: 'routable_scope_too_large', detail: `${scope.accountCount} accounts are in use; the interactive cap is ${scope.cap}.` };
    }
    if (scope.accountNames.length === 0) return { ok: false, reason: 'no_routable_hypotheses' };
    const report: RunReport = await (deps.run ?? defaultRunRouting)(
      prisma,
      { now: input.now, actor: input.actor, dryRun: false, maxPairs: DEFAULT_MAX_PAIRS, accountNames: scope.accountNames },
      {
        suppression: createClawdSuppressionReader(),
        hubspotSnapshot: createHubSpotSnapshotProvider(prisma, hubspotReads, { configured: isHubSpotConfigured }),
      },
    );
    const page = await (deps.listQueue ?? defaultListQueue)(prisma, { runId: report.runId, limit: 100 });
    return { ok: true, ...summarizeUseOutcomes(report.runId, page.items, input.people) };
  } catch (error) {
    // The last line of a driver error is the human part ("Can't reach database server ..."); never a stack.
    const message = (error instanceof Error ? error.message : String(error)).trim().split('\n').filter((l) => l.trim()).pop() ?? 'unknown error';
    return { ok: false, reason: 'routing_failed', detail: message.trim().slice(0, 200) };
  }
}
