/**
 * The CANONICAL autonomy kill-switch, as a modex send gate.
 *
 * WHY THIS EXISTS (2026-08-16). modex had its own outreach brake and nothing
 * else: `isOutreachPaused()` reading `OUTREACH_PAUSED`. That variable was
 * ABSENT in production and the check fail-OPENs on absent, so while clawd had
 * `outreach` and `actuator` HALTED, the modex Draft Queue drain was armed and
 * would send on request. Two sending planes, one mailbox, one of them deaf to
 * the switch. A kill switch that only stops some of the autonomy is not a kill
 * switch.
 *
 * THE AUTHORITY IS REMOTE AND STAYS REMOTE. There is deliberately no autonomy
 * table in modex. A second store would be a second answer, and the failure mode
 * of two authorities is that the quiet one is wrong. The canonical state lives
 * in clawd (`clawd-control-plane/scripts/autonomy.py`) and is read over
 * `GET /api/autonomy/state`.
 *
 * MEASURED BEFORE CHOSEN. modex's Postgres is `innovative-ambition/Postgres`;
 * clawd's is `dazzling-spirit/Postgres`. Different Railway projects, different
 * clusters - so "read the shared Postgres authority" was never available, and
 * the HTTP read is the smaller and firmer of the two options rather than the
 * merely-easier one. Note for anyone re-checking: clawd uses the Railway
 * private DNS name and modex an external TCP proxy, so those two DSN hostnames
 * are guaranteed to differ EVEN IF they pointed at one database. Compare the
 * proxy-to-project mapping, not the strings.
 *
 * MIRRORED, NOT INVENTED. This follows `war-room/src/lib/review/autonomy.ts`,
 * the other cross-repo consumer of the same payload, which is pinned on the
 * clawd side by `scripts/tests/test_autonomy_contract.py` (AUT-5). modex is the
 * second consumer of a settled contract. Keep the two in step.
 */

/**
 * The motions clawd actually publishes. MUST match KNOWN_MOTIONS in
 * clawd-control-plane/scripts/autonomy.py.
 *
 * Mirrored here because the drift failure is silent in the worst direction:
 * clawd builds its response as `{m: ... for m in KNOWN_MOTIONS}`, so a motion
 * it no longer publishes is simply ABSENT, and `motions[m] === false` on an
 * absent key is `undefined === false` is `false` is "not halted". An absent key
 * must fail CLOSED. See `autonomyHalted`.
 */
export const CLAWD_MOTIONS = ['outreach', 'actuator', 'social', 'content'] as const;
export type ClawdMotion = (typeof CLAWD_MOTIONS)[number];

/**
 * Why a send is being made. Named intents, never a bypass flag: a
 * `skip_gates` boolean tells you a check was skipped and nothing about whether
 * it should have been, and it is the first thing reached for under pressure.
 *
 * PROSPECT_OUTREACH is the default for anything that does not declare, so a
 * caller that forgets is gated rather than exempted. M5 widens this to the full
 * taxonomy (adding HUMAN_APPROVED_1TO1 / SYSTEM_INTERNAL and an explicit
 * UNKNOWN); the two values here are the minimum this gate needs to honour the
 * operator-alert exemption without pre-empting that ticket.
 */
export type SendPurpose = 'PROSPECT_OUTREACH' | 'OPERATOR_ALERT';

export interface AutonomyState {
  /** null = UNREADABLE. A different fact from halted, and never renders as live. */
  global: boolean | null;
  motions: Record<string, boolean>;
  updatedBy: string | null;
  reason: string | null;
  reachable: boolean;
}

const OFFLINE: AutonomyState = {
  global: null,
  motions: {},
  updatedBy: null,
  reason: null,
  reachable: false,
};

export class AutonomyHaltedError extends Error {
  /** True when we could not establish the state at all, as opposed to reading a halt. */
  readonly unreadable: boolean;
  constructor(reason: string, unreadable: boolean) {
    super(`Canonical autonomy refused this send: ${reason}`);
    this.name = 'AutonomyHaltedError';
    this.unreadable = unreadable;
  }
}

/**
 * A single in-flight read, shared by every concurrent caller.
 *
 * `sendBulk` fires `Promise.allSettled` over every payload at once, so without
 * this a 100-recipient batch would open 100 connections to clawd before the
 * first message. Sharing the in-flight promise collapses a burst to one read.
 *
 * Deliberately NOT a TTL cache. A time-based memo would keep serving a
 * stale-LIVE answer for its whole window after an operator hits halt, and that
 * is the one direction of staleness a kill switch must not have. Concurrent
 * callers share a read that is already in flight; sequential sends each read
 * fresh.
 */
let inFlight: Promise<AutonomyState> | null = null;

/** Test seam. */
export function __resetAutonomyGate(): void {
  inFlight = null;
}

async function readAutonomyState(): Promise<AutonomyState> {
  const base = process.env.CLAWD_CONTROL_PLANE_URL?.trim();
  const token = process.env.CLAWD_CONTROL_PLANE_TOKEN?.trim();
  // Unconfigured is UNREADABLE, not permission. An absent authority is exactly
  // the condition under which nobody is watching.
  if (!base || !token) return OFFLINE;

  try {
    const res = await fetch(`${base.replace(/\/+$/, '')}/api/autonomy/state`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    // clawd answers 503 when its own state store is unreadable, deliberately
    // rather than a 200 carrying a cheerful payload. Honour that.
    if (!res.ok) return OFFLINE;

    const d = (await res.json()) as Record<string, unknown> | null;
    // Validate the SHAPE before trusting it. `res.ok` alone means any 200 reads
    // as live: a clawd deploy that changed the response, an auth error returned
    // with 200, a proxy HTML page that happens to parse, or a bare
    // `{"ok":true}` health payload. `d.global !== false` is true for undefined,
    // so a MISSING field would read as permission to send.
    if (
      !d ||
      typeof d !== 'object' ||
      typeof d.global !== 'boolean' ||
      typeof d.motions !== 'object' ||
      d.motions === null
    ) {
      return OFFLINE;
    }

    return {
      global: d.global,
      motions: d.motions as Record<string, boolean>,
      updatedBy: (d.updated_by as string | null) ?? null,
      reason: (d.reason as string | null) ?? null,
      reachable: true,
    };
  } catch {
    return OFFLINE;
  }
}

async function fetchAutonomyState(): Promise<AutonomyState> {
  if (!inFlight) {
    inFlight = readAutonomyState().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/**
 * The kill switch as a send gate, fail-closed.
 *
 * "Unreadable" and "halted" are distinct facts for a dashboard, but for
 * anything that actually sends they collapse into one answer: if we cannot
 * prove autonomy is live, we do not send.
 */
export async function autonomyHalted(
  motion: ClawdMotion,
): Promise<{ halted: boolean; reason: string; unreadable: boolean }> {
  const s = await fetchAutonomyState();
  if (!s.reachable) {
    return {
      halted: true,
      reason: 'canonical autonomy state is unreadable (clawd unreachable, unconfigured, or a bad response); refusing to send',
      unreadable: true,
    };
  }
  if (s.global === false) {
    return { halted: true, reason: 'global autonomy halted', unreadable: false };
  }
  // A motion we believe exists but that the payload does not carry means the
  // two repos have drifted. Fail CLOSED: an un-haltable sender is worse than a
  // held day.
  if (!(motion in (s.motions ?? {}))) {
    return {
      halted: true,
      reason: `kill-switch has no '${motion}' motion (modex and clawd have drifted); refusing to send`,
      unreadable: false,
    };
  }
  if (s.motions[motion] === false) {
    return { halted: true, reason: `${motion} motion halted`, unreadable: false };
  }
  return { halted: false, reason: '', unreadable: false };
}

/**
 * Gate one provider write.
 *
 * Called at the WIRE rather than at any route, for the same reason the daily
 * ceiling is: eight application paths reach `sendViaGmail`, gating any subset
 * of them leaves the rest open, and more routes keep being added.
 *
 * OPERATOR_ALERT is exempt by design. Operator alerts are how a human finds out
 * the system is halted; muting them along with the outreach lane would make the
 * guard hide its own effects. That is an exemption for a named intent, not a
 * bypass switch.
 */
export async function assertAutonomyPermitsSend(
  purpose: SendPurpose = 'PROSPECT_OUTREACH',
): Promise<void> {
  if (purpose === 'OPERATOR_ALERT') return;
  const verdict = await autonomyHalted('outreach');
  if (verdict.halted) throw new AutonomyHaltedError(verdict.reason, verdict.unreadable);
}
