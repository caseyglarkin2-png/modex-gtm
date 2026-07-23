/**
 * "Hand to Clawd" — draft-batch dispatch library.
 *
 * Pure payload builder + network dispatch only. No UI, no server action.
 * Hands a slice of target accounts to the external "Clawd" control plane, which
 * sources contacts, drafts copy, and stages drafts back into our app.
 *
 *   POST {baseUrl}/api/yardflow/draft-batch
 *   Auth: Authorization: Bearer {MC_API_TOKEN}
 *
 * Client-safe: no `node:*` imports. Base URL + token resolution is reused from
 * the signal-bridge clawd export client so both share one convention.
 */
import {
  resolveClawdBaseUrl,
  resolveClawdToken,
} from '@/lib/signal-bridge/clawd-export-client';
import { REFERENCE_SITES } from '@/lib/discovery/reference-sites';

export interface DraftBatchTarget {
  account: string;
  facilityCityState: string;
  nearestLiveSite: string;
  distanceMi: number;
  icpTier: string;
  segment: string;
  corridor: string;
  hook: string;
}

/** Common envelope every draft-batch dispatch shares. `dispatchDraftBatch`
 * accepts this base so both the cold discovery-worklist payload and the warm
 * warm-committee payload (src/lib/discovery/warm-committee.ts) POST through the
 * one client. The `source` tells Clawd which drafting path to run. */
export interface DraftBatchEnvelope {
  owner: string;
  requestedBy: string;
  source: string;
  targets: unknown[];
}

export interface DraftBatchPayload extends DraftBatchEnvelope {
  source: 'discovery-worklist';
  targets: DraftBatchTarget[];
}

/**
 * Minimal structural shape of a row we need. Accepts a plain object so tests can
 * pass literals without constructing a full RankedRow/CuratedRow.
 */
export type DraftBatchRow = Pick<
  import('@/lib/discovery/types').CuratedRow,
  'name' | 'cityState' | 'segment' | 'tier' | 'nearestPrimoName' | 'nearestPrimoDistance' | 'corridor'
>;

/**
 * Resolve a reference-site NAME to "City, ST". Mirrors nearestLiveSite() in
 * scripts/discovery/build-target-accounts.ts. Empty string when unresolved.
 */
function nearestLiveSite(name: string): string {
  const s = REFERENCE_SITES.find((r) => r.name === name);
  return s ? `${s.city}, ${s.state}` : '';
}

/** Map worklist rows to a Clawd draft-batch payload. Pure. */
export function buildDraftBatchPayload(
  rows: DraftBatchRow[],
  owner: string,
): DraftBatchPayload {
  const targets: DraftBatchTarget[] = rows.map((r) => {
    const site = nearestLiveSite(r.nearestPrimoName);
    // No em/en dashes anywhere — project copy rule.
    const hook = `we're live ${r.nearestPrimoDistance.toFixed(1)} mi away at the Primo Brands site in ${site}`;
    return {
      account: r.name,
      facilityCityState: r.cityState,
      nearestLiveSite: site,
      distanceMi: r.nearestPrimoDistance,
      icpTier: r.tier,
      segment: r.segment,
      corridor: r.corridor,
      hook,
    };
  });
  return { owner, requestedBy: owner, source: 'discovery-worklist', targets };
}

/**
 * Auth + empty gates and payload assembly for the "Hand to Clawd" server action.
 * Pure: the OWNER is resolved server-side from the session and passed in here —
 * a row-supplied owner is never trusted. The server action calls this, then
 * forwards a successful result's payload to `dispatchDraftBatch`.
 */
export function prepareClawdDispatch(
  ownerEmail: string | null | undefined,
  rows: DraftBatchRow[],
):
  | { ok: false; reason: string }
  | { ok: true; payload: DraftBatchPayload } {
  if (!ownerEmail) return { ok: false, reason: 'unauthenticated' };
  if (!rows?.length) return { ok: false, reason: 'empty' };
  return { ok: true, payload: buildDraftBatchPayload(rows, ownerEmail) };
}

export interface DispatchOptions {
  baseUrl?: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export type DispatchResult =
  | { ok: true; accepted: number; batchId?: string }
  | { ok: false; reason: string };

/**
 * POST a draft batch to Clawd. Never throws — every failure path returns a
 * tagged { ok:false, reason } result.
 *
 * Token resolution: `opts.token ?? resolveClawdToken()`. `??` only falls through
 * on null/undefined, so an explicit empty-string token means "not configured"
 * and short-circuits WITHOUT calling fetch.
 */
export async function dispatchDraftBatch(
  payload: DraftBatchEnvelope,
  opts: DispatchOptions = {},
): Promise<DispatchResult> {
  const baseUrl = opts.baseUrl ?? resolveClawdBaseUrl();
  const token = opts.token ?? resolveClawdToken();
  const fetchImpl = opts.fetchImpl ?? fetch;

  if (!token) {
    return { ok: false, reason: 'clawd_not_configured' };
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/api/yardflow/draft-batch`;

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let body: Record<string, unknown> = {};
    if (text) {
      try {
        body = JSON.parse(text) as Record<string, unknown>;
      } catch {
        body = { raw: text };
      }
    }

    if (response.ok) {
      return {
        ok: true,
        accepted: Number(body.accepted) || 0,
        batchId: body.batchId as string | undefined,
      };
    }
    if (response.status === 404) {
      return { ok: false, reason: 'clawd_endpoint_not_ready' };
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: 'unauthorized' };
    }
    return {
      ok: false,
      reason: (body.error as string) || `request_failed_${response.status}`,
    };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}
