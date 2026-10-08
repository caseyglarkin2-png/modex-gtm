/**
 * SIGNED ACTION LINKS (X05a, GAP OS sales execution engine, 2026-10-08). Pure.
 *
 * A link in the briefing or an assignment email carries `<base64url(payload)>.<base64url(hmac-sha256)>` under
 * GAP_ACTION_SECRET. The payload names the op (start, open, defer, review), the plan item's token when one applies,
 * the New York day and the expiry. A link opens the session-protected app at the item; it never executes an external
 * action by itself (the mandate's section 5 and the review's B1). Verification refuses, by name, a forged or tampered
 * token (`bad_signature`), an expired one (`expired`), a malformed one (`malformed`) and a missing secret
 * (`no_secret`): there is no fallback to trust. Pinned by tests/unit/gap/briefing.test.ts.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const ACTION_OPS = ['start', 'open', 'defer', 'review'] as const;
export type ActionOp = (typeof ACTION_OPS)[number];

export interface ActionPayload {
  op: ActionOp;
  /** The plan item's token (work/plan.ts) when the op is about one item. */
  item?: string;
  /** The New York day the link was minted for. */
  day: string;
  /** Unix seconds. */
  exp: number;
}

export type ActionVerification = { ok: true; payload: ActionPayload } | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'no_secret' };

export const ACTION_TOKEN_TTL_SECONDS = 7 * 86_400;

/** The secret the links are signed with; null when unset (then links are minted unsigned and never verify). */
export function actionSecret(env: Record<string, string | undefined> = process.env): string | null {
  const s = env.GAP_ACTION_SECRET?.trim();
  return s ? s : null;
}

const mac = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

export function signActionToken(input: Omit<ActionPayload, 'exp'>, opts: { secret: string | null; now: Date; ttlSeconds?: number }): string {
  if (!opts.secret) throw new Error('no_secret');
  const exp = Math.floor(opts.now.getTime() / 1000) + (opts.ttlSeconds ?? ACTION_TOKEN_TTL_SECONDS);
  const payload: ActionPayload = { op: input.op, ...(input.item ? { item: input.item } : {}), day: input.day, exp };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encoded}.${mac(encoded, opts.secret)}`;
}

export function verifyActionToken(token: string, opts: { secret: string | null; now: Date }): ActionVerification {
  if (!opts.secret) return { ok: false, reason: 'no_secret' };
  const parts = String(token ?? '').split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: 'malformed' };
  const [encoded, sig] = parts;
  const expected = mac(encoded, opts.secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'bad_signature' };
  let payload: ActionPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ActionPayload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (!payload || typeof payload !== 'object' || !(ACTION_OPS as readonly string[]).includes(payload.op) || typeof payload.day !== 'string' || typeof payload.exp !== 'number') {
    return { ok: false, reason: 'malformed' };
  }
  if (payload.exp <= Math.floor(opts.now.getTime() / 1000)) return { ok: false, reason: 'expired' };
  return { ok: true, payload };
}
