/**
 * EVERY VISIBLE ACTION ENDS IN A RECOVERABLE STATE (C44 of the commercial-context audit, 2026-10-08). Pure,
 * client-safe (no node imports).
 *
 * One reading of what a GAP action request came to, for every button that fires one (decide, record, approve, done,
 * snooze, skip, resolve, plan, run routing): accepted, refused, queued, prepared, failed or unknown, with the source
 * item, a line in the seller's words and the next path (retry, reload, open). The rule the audit asks for:
 *
 *   refused   the route said no (a bad body, a stale revision, a closed origin, GAP off, not signed in): nothing was
 *             written, the originals stand; retry only when the refusal is a transient read (a CRM that could not be
 *             confirmed just now, an attempt in flight)
 *   failed    the server failed (5xx): nothing is assumed written; the same click retries
 *   unknown   the request did not complete (no connection, a timeout, a 504): it MAY have applied; the next path is
 *             reload to see, then retry. Never "nothing changed", never a spinner left on, never a silent nothing.
 *
 * A refused or failed action never consumes a retry: the routes are idempotent per item (a day claim, a unique source
 * key, an append-only row keyed by the item), so the same click is always safe to repeat.
 */
export type ActionState = 'accepted' | 'refused' | 'queued' | 'prepared' | 'failed' | 'unknown';

export interface ActionNext {
  kind: 'retry' | 'reload' | 'open';
  label: string;
  href?: string;
}

export interface ActionResult {
  state: ActionState;
  /** The seller line, one sentence or two, ending in a period. */
  line: string;
  /** The item the action was about (a decision key, a commitment id, an account), when the caller named it. */
  source: string | null;
  next: ActionNext | null;
  /** True when the same click is a safe retry. */
  retry: boolean;
  /** The route's error code (or the failure's name); null when accepted. */
  error: string | null;
  status: number;
  body: Record<string, unknown>;
}

export interface ActionContext {
  /** The past participle for the lines: "Decided", "Recorded", "Saved", "Approved", "Planned". */
  verb: string;
  source?: string | null;
  /** The line for an accepted result when the route gave none. */
  accepted?: (body: Record<string, unknown>) => string | null;
  /** The reason words for a refusal code; null keeps the code's own words. */
  refusal?: (code: string, body: Record<string, unknown>) => string | null;
  /** The whole refusal line, when a surface has its own wording to keep. */
  refusedLine?: (code: string, reason: string, body: Record<string, unknown>) => string;
  /** 409 codes that are transient reads and may be retried as they are. */
  retryable?: readonly string[];
}

/** 409 codes GAP answers when a read could not be completed just now: the originals stand, the same click retries. */
export const TRANSIENT_REFUSALS: readonly string[] = ['deal_unverified', 'in_progress', 'activity_unreadable', 'history_unavailable', 'opportunity_unknown', 'no_provider'];

const STATES: ReadonlySet<string> = new Set(['accepted', 'refused', 'queued', 'prepared', 'failed', 'unknown']);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const words = (code: string) => code.replace(/_/g, ' ');
const lower = (verb: string) => verb.charAt(0).toLowerCase() + verb.slice(1);

export const RETRY: ActionNext = { kind: 'retry', label: 'Try again' };
export const RELOAD: ActionNext = { kind: 'reload', label: 'Reload to see' };

/** The unknown outcome: the request did not complete, so it may have applied. */
export function unknownAction(ctx: ActionContext, detail: string, status = 0): ActionResult {
  return {
    state: 'unknown',
    line: `${ctx.verb}? The request did not complete (${detail}). It may have applied. Reload to see; if it did not, try again.`,
    source: ctx.source ?? null,
    next: RELOAD,
    retry: true,
    error: 'request_incomplete',
    status,
    body: {},
  };
}

/** A thrown fetch (no connection, aborted, a bad response body) is unknown, never "nothing changed". */
export function failedAction(err: unknown, ctx: ActionContext): ActionResult {
  const name = err instanceof Error ? (err.name === 'AbortError' ? 'timed out' : err.message || err.name) : String(err || 'no connection');
  return unknownAction(ctx, /fetch|network|connection/i.test(name) ? 'no connection' : name);
}

/** The route's answer, read into one state. */
export function readAction(res: { ok: boolean; status: number }, rawBody: unknown, ctx: ActionContext): ActionResult {
  const body = isRecord(rawBody) ? rawBody : {};
  const source = ctx.source ?? str(body.key) ?? null;
  if (res.ok) {
    const said = str(body.state);
    const state: ActionState = said && STATES.has(said) && said !== 'refused' && said !== 'failed' && said !== 'unknown' ? (said as ActionState) : body.queued === true || str(body.taskId) ? 'queued' : body.prepared === true ? 'prepared' : 'accepted';
    const line = str(body.line) ?? ctx.accepted?.(body) ?? (state === 'queued' ? `${ctx.verb}. GAP is working on it in the background; it comes back on the item.` : state === 'prepared' ? `${ctx.verb}. Prepared; nothing is sent until you send it.` : `${ctx.verb}.`);
    const href = str(body.href) ?? str(body.next);
    return { state, line, source, next: href ? { kind: 'open', label: 'Open it', href } : null, retry: false, error: null, status: res.status, body };
  }
  const code = str(body.error) ?? (body.skipped === true ? str(body.reason) ?? 'gap_disabled' : null) ?? `http_${res.status}`;
  const detail = str(body.detail) ?? (str(body.reason) && body.skipped !== true ? str(body.reason) : null) ?? (str(body.message) ?? null);
  if (res.status === 0 || res.status === 504) return unknownAction(ctx, res.status === 504 ? 'the server took too long; it may have partly run' : 'no answer', res.status);
  if (res.status >= 500) {
    return { state: 'failed', line: `Not ${lower(ctx.verb)}: the server failed (${words(code)}). Nothing is assumed written; try again.`, source, next: RETRY, retry: true, error: code, status: res.status, body };
  }
  const transient = (ctx.retryable ?? TRANSIENT_REFUSALS).includes(code);
  const reason =
    ctx.refusal?.(code, body) ??
    (res.status === 401 ? 'you are signed out; sign in and try again' : null) ??
    (body.skipped === true || code === 'gap_disabled' || code === 'flag_off' ? 'GAP is turned off here' : null) ??
    (code === 'invalid_body' ? `the ${str(body.field) ?? 'request'} is not valid; fix it and try again` : null) ??
    (str(body.existingRevision) ? `a newer revision exists (${str(body.existingRevision)}); open it and decide on that one` : null) ??
    (detail ? `${words(code)} (${detail})` : words(code));
  const revision = str(body.existingRevision);
  const next: ActionNext | null = transient ? RETRY : revision ? { kind: 'open', label: 'Open the current revision', href: str(body.href) ?? undefined } : res.status === 404 && body.skipped !== true ? RELOAD : null;
  const line = ctx.refusedLine ? ctx.refusedLine(code, reason, body) : `Not ${lower(ctx.verb)}: ${reason}.${transient ? ' Nothing changed; the same click tries again.' : ''}`;
  return { state: 'refused', line, source, next, retry: transient, error: code, status: res.status, body };
}

type FetchLike = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** One action request. Never throws; the result carries the state. */
export async function runAction(url: string, init: RequestInit, ctx: ActionContext, fetchImpl?: FetchLike): Promise<ActionResult> {
  const doFetch: FetchLike | undefined = fetchImpl ?? (typeof fetch === 'function' ? (fetch as unknown as FetchLike) : undefined);
  if (!doFetch) return unknownAction(ctx, 'no fetch in this environment');
  let res: { ok: boolean; status: number; json(): Promise<unknown> };
  try {
    res = await doFetch(url, init);
  } catch (err) {
    return failedAction(err, ctx);
  }
  const body = await res.json().catch(() => ({}));
  return readAction(res, body, ctx);
}

/** POST JSON through runAction. */
export function postAction(url: string, body: unknown, ctx: ActionContext, fetchImpl?: FetchLike): Promise<ActionResult> {
  return runAction(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, ctx, fetchImpl);
}

/** The ARIA role for a result: an alert when it needs the seller, a status when it is done. */
export function actionRole(r: ActionResult): 'status' | 'alert' {
  return r.state === 'accepted' || r.state === 'queued' || r.state === 'prepared' ? 'status' : 'alert';
}
