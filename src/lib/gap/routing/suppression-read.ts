/**
 * Suppression READ for routing (Sprint 2, S2-T5).
 *
 * A read at routing time, not a send-time gate. The router needs to know
 * whether a persona is suppressed so R0/R0b can fire before any work item is
 * created, but the authority stays remote and the WIRE GATE STILL RUNS AT
 * SEND (`assertSuppressionPermitsSend` in src/lib/email/suppression-gate.ts).
 * A clear answer here is a routing input, never permission to send.
 *
 * Same contract, same body, same env pair as the send gate, so the two cannot
 * drift: `POST ${CLAWD_CONTROL_PLANE_URL}${CLAWD_CONTRACT_PATH}` with
 * `{ emails: [to], automated: true }`, bearer `CLAWD_CONTROL_PLANE_TOKEN`.
 * The gate carries no purpose field on the wire (its `SendPurpose` is a local
 * exemption switch, not part of the body), so none is sent here either.
 *
 * Mapping, deliberately three-valued because the rules table treats them
 * differently (R0 blocks, R0b blocks with research_required):
 *   refusal (blocked: true)          -> 'suppressed', refusing leg marked 'hit'
 *   clean answer (blocked: false)    -> 'clear'
 *   missing config, network error, non-2xx, malformed body, timeout
 *                                    -> 'unknown', never 'clear'
 *
 * Never throws. The assembler wraps it anyway, but a reader that can throw is
 * a reader whose failure a caller can forget to catch.
 */

import { CLAWD_CONTRACT_PATH } from '../../email/suppression-gate';
import type { SuppressionLegVerdict, SuppressionVerdict } from './types';

export interface SuppressionReadResult {
  verdict: SuppressionVerdict;
  legs: Record<string, SuppressionLegVerdict>;
}

export interface SuppressionReader {
  read(target: { to: string }): Promise<SuppressionReadResult>;
}

/** The aggregate leg name when clawd answers without naming an authority. */
export const CONTRACT_LEG = 'clawd_contract';

export const SUPPRESSION_READ_TIMEOUT_MS = 5_000;

export interface ClawdSuppressionReaderOptions {
  fetchImpl?: typeof fetch;
  env?: Record<string, string | undefined>;
  timeoutMs?: number;
}

const unknown = (leg: string = CONTRACT_LEG): SuppressionReadResult => ({
  verdict: 'unknown',
  legs: { [leg]: 'unknown' },
});

export function createClawdSuppressionReader(opts: ClawdSuppressionReaderOptions = {}): SuppressionReader {
  const timeoutMs = opts.timeoutMs ?? SUPPRESSION_READ_TIMEOUT_MS;
  return {
    async read(target) {
      try {
        return await readOnce(target.to, opts, timeoutMs);
      } catch {
        return unknown();
      }
    },
  };
}

async function readOnce(
  to: string,
  opts: ClawdSuppressionReaderOptions,
  timeoutMs: number,
): Promise<SuppressionReadResult> {
  const env = opts.env ?? process.env;
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const base = env.CLAWD_CONTROL_PLANE_URL?.trim();
  const token = env.CLAWD_CONTROL_PLANE_TOKEN?.trim();
  const email = String(to ?? '').trim().toLowerCase();
  if (!email) return unknown();
  // Unconfigured is unknown, not clear: an absent authority is exactly the
  // condition under which nobody is watching (same stance as the send gate).
  if (!base || !token || typeof fetchImpl !== 'function') return unknown();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetchImpl(`${base.replace(/\/+$/, '')}${CLAWD_CONTRACT_PATH}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ emails: [email], automated: true }),
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch {
    return unknown();
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) return unknown();

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return unknown();
  }

  // Validate the SHAPE before trusting it, exactly as the send gate does: a
  // 200 that happens to parse is not an answer.
  const d = body as { ok?: unknown; results?: unknown; legs_read?: unknown } | null;
  if (!d || typeof d !== 'object' || d.ok !== true || !Array.isArray(d.results)) return unknown();
  if (d.results.length !== 1) return unknown();

  const r = d.results[0] as { email?: unknown; blocked?: unknown; reason?: unknown; unknown_legs?: unknown } | null;
  if (!r || typeof r !== 'object') return unknown();
  if (String(r.email ?? '').trim().toLowerCase() !== email) return unknown();
  if (typeof r.blocked !== 'boolean') return unknown();

  // Per-leg detail, when clawd reports it (`legs_read: {name: readable}` and
  // `unknown_legs: [name]` on the result). Informational: the verdict is
  // `blocked`, the same field the send gate trusts.
  const legs: Record<string, SuppressionLegVerdict> = {};
  if (d.legs_read && typeof d.legs_read === 'object' && !Array.isArray(d.legs_read)) {
    for (const [name, readable] of Object.entries(d.legs_read as Record<string, unknown>)) {
      legs[name] = readable === true ? 'clear' : 'unknown';
    }
  }
  if (Array.isArray(r.unknown_legs)) {
    for (const name of r.unknown_legs) if (typeof name === 'string' && name) legs[name] = 'unknown';
  }

  if (r.blocked) {
    const leg = String(r.reason ?? '').trim() || 'suppressed';
    legs[leg] = 'hit';
    return { verdict: 'suppressed', legs };
  }
  if (Object.keys(legs).length === 0) legs[CONTRACT_LEG] = 'clear';
  return { verdict: 'clear', legs };
}

/** Fixed-answer reader for tests and dry runs. */
export function staticSuppressionReader(
  verdict: SuppressionVerdict,
  legs?: Record<string, SuppressionLegVerdict>,
): SuppressionReader {
  const defaultLeg: SuppressionLegVerdict = verdict === 'suppressed' ? 'hit' : verdict;
  const answer: SuppressionReadResult = { verdict, legs: legs ?? { [CONTRACT_LEG]: defaultLeg } };
  return {
    async read() {
      return { verdict: answer.verdict, legs: { ...answer.legs } };
    },
  };
}
