/**
 * The CROSS-PLANE SUPPRESSION CONTRACT, as a modex send gate.
 *
 * WHY THIS EXISTS (2026-08-16). Three planes can put mail in front of a
 * prospect: clawd's governed Gmail, war-room's SendGrid coverage lane, and this
 * one. The first two were gated; `sendViaGmail` called
 * `assertAutonomyPermitsSend` and nothing else. modex was the last hole in the
 * invariant.
 *
 * A KILL SWITCH IS NOT A CONSENT GATE, and this is the distinction that made
 * this ticket real rather than theoretical. modex Gmail is currently blocked
 * twice over — `OUTREACH_PAUSED=true` and clawd's autonomy halt — but both are
 * kill switches. The moment either is lifted, modex could mail someone we had
 * already recorded a decision not to contact. Measured: 242 of 1,936 personas
 * carry `do_not_contact=TRUE`, 204 were invisible to clawd, and one had already
 * been mailed at that exact address.
 *
 * SUPPRESSION OUTRANKS DEDUP, since the two keep getting conflated. A dedup
 * failure means we FORGOT a prior touch. A suppression failure means we DECIDED
 * not to contact someone, RECORDED it, and sent anyway.
 *
 * THE AUTHORITY IS REMOTE AND STAYS REMOTE, exactly as in `autonomy-gate.ts`.
 * There is no suppression table in modex for this purpose: a second store is a
 * second answer, and the failure mode of two authorities is that the quiet one
 * is wrong. clawd aggregates all five legs (modex do_not_contact, clawd
 * do_not_send, HubSpot optout, SendGrid, war-room verbal do-not-call) and
 * answers over `POST /api/suppression/contract`.
 *
 * Note the loop that is deliberately NOT a problem: clawd's `modex` leg reads
 * modex's own `/api/suppression/personas`. modex asking clawd, which asks
 * modex, is one hop each way and terminates — the personas route is a plain
 * database read and calls nothing. modex must not shortcut to its own store
 * instead, because that would consult ONE leg and miss the other four.
 *
 * GATED AT THE WIRE, not at the routes, for the same reason the autonomy gate
 * and the daily ceiling are: eight application paths reach `sendViaGmail`, and
 * gating any subset leaves the rest open while more routes keep being added.
 */
import type { SendPurpose } from '@/lib/email/autonomy-gate';

/**
 * clawd's CANONICAL path, pinned as a literal against its registered route
 * `@register_route("POST", r"^/api/suppression/contract$")`.
 *
 * NOT derived from a house style, and this is a scar rather than a preference.
 * modex sets `trailingSlash: true`; war-room leaves it unset, so Next's default
 * makes it redirect the SLASHED form to the bare one. The two repos have
 * OPPOSITE conventions, and assuming one cost a whole suppression leg: a POST
 * to a 308-ing path raises in `urllib`, which read as "authority unreadable"
 * and refused every governed send while looking exactly like a healthy
 * fail-closed gate.
 *
 * Measured live 2026-08-16: clawd's router accepts BOTH forms with identical
 * results, so this leg carries no slash hazard at all — that hazard was
 * Next.js-specific and clawd is a Python `http.server`. The bare form is used
 * because it is what the route actually declares.
 */
export const CLAWD_CONTRACT_PATH = '/api/suppression/contract';

/**
 * THE action-time suppression timeout (2026-10-01): draft, direct send, governed copy and the health probe all
 * wait this long and no longer. Measured in production before the clawd fix: 2.8 s min, 3.2 s median, 5.0 s max
 * against a 5 s wire timeout, so a click could refuse while health said HEALTHY (it probed with 8 s). clawd now
 * reads its legs concurrently (each with a 6 s deadline); 8 s covers that plus the network on both sides. A
 * timeout is still UNREADABLE: the gate never fails open.
 */
export const ACTION_TIME_SUPPRESSION_TIMEOUT_MS = 8_000;

/** The timeout in force (an env override, else the action-time SLA). */
export function suppressionTimeoutMs(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.SUPPRESSION_READ_TIMEOUT_MS);
  return n > 0 ? n : ACTION_TIME_SUPPRESSION_TIMEOUT_MS;
}

/**
 * What a wire-gate refusal message means (the adapter only carries the message): `unreadable` (the authority
 * could not answer: a retry is safe, nothing was created), `suppressed` (an authority said do not contact), or
 * null (not a suppression refusal).
 */
export function suppressionRefusalKind(message: string | null | undefined): 'unreadable' | 'suppressed' | null {
  const m = /^Cross-plane suppression refused this send: ([\s\S]*)$/.exec(String(message ?? ''));
  if (!m) return null;
  return /^(suppression authority|malformed_verdict|unknown_)/.test(m[1].trim()) ? 'unreadable' : 'suppressed';
}

export class SuppressionRefusedError extends Error {
  /** The specific authority that refused: `modex_do_not_contact`, `hubspot_optout`, ... */
  readonly reason: string;
  /** True when we could not establish the answer at all, as opposed to reading a refusal. */
  readonly unreadable: boolean;
  constructor(reason: string, unreadable: boolean) {
    super(`Cross-plane suppression refused this send: ${reason}`);
    this.name = 'SuppressionRefusedError';
    this.reason = reason;
    this.unreadable = unreadable;
  }
}

export interface SuppressionVerdict {
  refused: boolean;
  /** The primary refusing authority, or `''` when nothing refused. */
  reason: string;
  unreadable: boolean;
}

const UNREADABLE = (reason: string): SuppressionVerdict => ({
  refused: true,
  reason,
  unreadable: true,
});

/**
 * Concurrent reads in flight, keyed by the exact recipient set.
 *
 * `sendBulk` fires `Promise.allSettled` over every payload at once, so without
 * this a 100-recipient batch opens 100 connections to clawd before the first
 * message. Sharing collapses a burst to one read per distinct recipient set.
 *
 * KEYED BY RECIPIENTS, unlike the autonomy gate's single global promise,
 * because autonomy state is one fact for the whole system and suppression is a
 * fact about a PERSON. A shared answer across different recipients would let
 * one person's CLEAR verdict authorise a send to somebody else, which is the
 * error with no recovery.
 *
 * DELIBERATELY NOT A TTL CACHE. Entries are removed the moment the read
 * settles, so only genuinely concurrent callers share one. A time-based memo
 * would keep serving a stale CLEAR for its whole window after someone
 * unsubscribes, and that is the one direction of staleness a suppression gate
 * must not have — the same argument the autonomy gate makes about a halt.
 */
const inFlight = new Map<string, Promise<SuppressionVerdict>>();

/** Test seam, mirroring `__resetAutonomyGate`. */
export function __resetSuppressionGate(): void {
  inFlight.clear();
}

function normalize(emails: readonly string[]): string[] {
  return [...new Set(
    emails.map((e) => String(e ?? '').trim().toLowerCase()).filter(Boolean),
  )].sort();
}

async function readContract(emails: string[], env: Record<string, string | undefined> = process.env): Promise<SuppressionVerdict> {
  const base = env.CLAWD_CONTROL_PLANE_URL?.trim();
  const token = env.CLAWD_CONTROL_PLANE_TOKEN?.trim();
  // Reuses the pair the autonomy gate already reads. A second name for the same
  // secret is a second thing to rotate and a second thing to get wrong.
  //
  // Unconfigured is UNREADABLE, not permission: an absent authority is exactly
  // the condition under which nobody is watching.
  if (!base || !token) {
    return UNREADABLE('suppression authority is not configured; refusing to send');
  }

  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/+$/, '')}${CLAWD_CONTRACT_PATH}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      // `automated: true` is declared rather than left to the server default, so
      // reading this call tells you which branch it takes.
      body: JSON.stringify({ emails, automated: true }),
      cache: 'no-store',
      // Bounded (red team T4): a hung authority is UNREADABLE (catch below).
      signal: AbortSignal.timeout(suppressionTimeoutMs(env)),
    });
  } catch (err) {
    return UNREADABLE(
      `suppression authority unreachable (${err instanceof Error ? err.message : 'unknown'})`,
    );
  }

  // clawd answers 503 when a leg resolver fails, deliberately rather than a 200
  // carrying a cheerful payload. Honour that.
  if (!res.ok) return UNREADABLE(`suppression authority answered HTTP ${res.status}`);

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return UNREADABLE('suppression authority returned unparseable JSON');
  }

  // Validate the SHAPE before trusting it. `res.ok` alone means any 200 reads as
  // clear: a proxy page that happens to parse, a deploy that changed the
  // response, or a bare health payload.
  const d = body as { ok?: unknown; results?: unknown } | null;
  if (!d || typeof d !== 'object' || d.ok !== true || !Array.isArray(d.results)) {
    return UNREADABLE('suppression authority returned an unrecognised payload');
  }

  // A short array would leave the tail of the batch unchecked, and unchecked
  // reads as sendable.
  if (d.results.length !== emails.length) {
    return UNREADABLE(
      `suppression authority answered ${d.results.length} of ${emails.length} recipients`,
    );
  }

  const seen = new Map<string, { blocked?: unknown; reason?: unknown }>();
  for (const r of d.results as { email?: unknown }[]) {
    seen.set(String(r?.email ?? '').trim().toLowerCase(), r as { blocked?: unknown; reason?: unknown });
  }

  for (const email of emails) {
    const r = seen.get(email);
    // An address we asked about and got no verdict for is UNCHECKED. The count
    // matching is not enough on its own — the authority could answer the right
    // number of verdicts about the wrong people.
    if (!r) return UNREADABLE(`suppression authority returned no verdict for ${email}`);
    // A verdict without an explicit boolean is MALFORMED, and malformed is a
    // refusal. `r.blocked !== true` alone would read a MISSING field as
    // permission.
    if (typeof r.blocked !== 'boolean') {
      return { refused: true, reason: 'malformed_verdict', unreadable: true };
    }
    if (r.blocked) {
      return {
        refused: true,
        reason: String(r.reason ?? '') || 'suppressed',
        unreadable: false,
      };
    }
  }

  return { refused: false, reason: '', unreadable: false };
}

/**
 * Does any authoritative plane refuse these recipients?
 *
 * Never throws. Every failure is reported as `refused` with `unreadable: true`,
 * so a caller cannot accidentally treat an outage as a clear answer by
 * forgetting a try/catch.
 */
export async function suppressionRefuses(
  emails: readonly string[],
): Promise<SuppressionVerdict> {
  const normalized = normalize(emails);
  // No recipients is not the same as an unreachable authority, but it is also
  // not something to send to.
  if (normalized.length === 0) {
    return UNREADABLE('no recipient to check');
  }

  const key = normalized.join(',');
  const existing = inFlight.get(key);
  if (existing) return existing;

  const p = readContract(normalized).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, p);
  return p;
}

/** Every address that would receive this message. */
export interface SuppressionRecipients {
  to: string;
  cc?: string[];
  bcc?: string;
}

/**
 * Refuse the send unless every recipient is clear on every authoritative plane.
 *
 * TO, CC AND BCC ARE ALL RECIPIENTS. A gate reading only `to` is a gate with a
 * documented bypass, and `bcc` is precisely where a suppressed address sits
 * unnoticed.
 *
 * OPERATOR_ALERT is exempt from SUPPRESSION, not from logging, and the
 * exemption is narrow on purpose: operator alerts are how a human finds out
 * that suppression is holding a wave, and a guard that mutes its own status
 * report hides its own effects. It consumes `SendPurpose` from the autonomy
 * gate rather than forking the taxonomy — one definition of intent, or the two
 * gates start disagreeing about what a purpose is.
 *
 * The default is PROSPECT_OUTREACH, so a caller that forgets to declare is
 * GATED rather than exempted. Purpose is a named intent, never a bypass flag: a
 * `skip_gates` boolean tells you a check was skipped and nothing about whether
 * it should have been, and it is the first thing reached for under pressure.
 */
export async function assertSuppressionPermitsSend(
  recipients: SuppressionRecipients,
  purpose: SendPurpose = 'PROSPECT_OUTREACH',
): Promise<void> {
  if (purpose === 'OPERATOR_ALERT') return;

  const everyone = [recipients.to, ...(recipients.cc ?? []), recipients.bcc ?? ''];
  const verdict = await suppressionRefuses(everyone);
  if (verdict.refused) throw new SuppressionRefusedError(verdict.reason, verdict.unreadable);
}

/**
 * The health probe (2026-10-01): EXACTLY the wire's contract read, timeout included, for one reserved address that
 * is never contacted. Health that probes anything else can say HEALTHY while every click times out.
 */
export async function probeSuppressionContract(
  email: string,
  env: Record<string, string | undefined> = process.env,
): Promise<{ verdict: 'clear' | 'suppressed' | 'unknown'; error: string | null }> {
  const v = await readContract(normalize([email]), env);
  if (v.unreadable) return { verdict: 'unknown', error: v.reason };
  // clawd answers 200 with blocked `unknown_<leg>` when a leg could not be read: every click refuses then, so
  // health must too (the same reading suppressionRefusalKind gives a click's refusal).
  if (v.refused && /^(unknown_|malformed_verdict)/.test(v.reason)) return { verdict: 'unknown', error: v.reason };
  return v.refused ? { verdict: 'suppressed', error: null } : { verdict: 'clear', error: null };
}
