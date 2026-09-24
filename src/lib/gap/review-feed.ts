/**
 * GAP fan-out to the war-room review feed.
 *
 * The review feed is the operator's veto surface: every autonomous GAP state
 * change that a human might want to reverse is logged there so Casey sees it
 * and can veto it. Contract (AGENT_CLIS.md, "REVIEW FEED"):
 *
 *   POST {WAR_ROOM_URL}/api/review/log
 *   Authorization: Bearer {MC_API_TOKEN}
 *   { motion, action, target, title, intent, criticVerdict?, criticScore?, url?, rollbackRef? }
 *
 * This is fire-and-forget telemetry for the human veto loop. A failure to post
 * must NEVER block or roll back a state change: the function never throws, it
 * resolves `{posted:false, reason}` on a missing token, a non-2xx response, a
 * network error, or a timeout. Env is read at CALL time (same rule as
 * ./flags.ts) so a test or a redeploy can change it without a re-import.
 */

export const DEFAULT_WAR_ROOM_URL = 'https://yardflow-war-room.vercel.app';

/** Upper bound on one review-log POST. The feed is telemetry, not a gate. */
export const REVIEW_LOG_TIMEOUT_MS = 5_000;

export type ReviewMotion = 'gap';

export interface ReviewLogEntry {
  motion: ReviewMotion;
  action: string;
  target: string;
  title: string;
  intent: string;
  criticVerdict?: string;
  criticScore?: number;
  url?: string;
  rollbackRef?: string;
}

export type ReviewLogFailureReason = 'no_token' | 'network_error' | `http_${number}`;

export type ReviewLogResult = { posted: true } | { posted: false; reason: ReviewLogFailureReason };

/** `process.env` satisfies this; tests can pass a bare object literal. */
export type ReviewEnv = Record<string, string | undefined>;

export interface PostReviewLogOptions {
  fetchImpl?: typeof fetch;
  env?: ReviewEnv;
}

function resolveWarRoomUrl(env: ReviewEnv): string {
  const raw = env.WAR_ROOM_URL?.trim() || DEFAULT_WAR_ROOM_URL;
  return raw.replace(/\/+$/, '');
}

function resolveToken(env: ReviewEnv): string {
  return env.MC_API_TOKEN?.trim() || '';
}

export async function postReviewLog(
  entry: ReviewLogEntry,
  opts: PostReviewLogOptions = {},
): Promise<ReviewLogResult> {
  const env = opts.env ?? process.env;
  const token = resolveToken(env);
  if (!token) return { posted: false, reason: 'no_token' };

  const fetchImpl = opts.fetchImpl ?? fetch;
  const url = `${resolveWarRoomUrl(env)}/api/review/log`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REVIEW_LOG_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
      signal: controller.signal,
    });
    if (!response.ok) return { posted: false, reason: `http_${response.status}` };
    return { posted: true };
  } catch {
    return { posted: false, reason: 'network_error' };
  } finally {
    clearTimeout(timer);
  }
}
