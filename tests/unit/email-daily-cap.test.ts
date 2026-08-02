/**
 * modex-gtm can send an unbounded number of emails per day as
 * casey@freightroll.com, and nothing counts them.
 *
 * VERIFIED 2026-08-02. Seven application paths reach the Gmail wire call, and
 * not one of them consults a volume ceiling:
 *
 *   perform-send.ts:253 (manual /discovery + the clawd-driven draft queue),
 *   send-bulk/route.ts:208 (recipients array has .min(1) and NO .max()),
 *   process-send-jobs/route.ts:98, monday-bump/route.ts:213,
 *   engagement/thread/[id]/reply/route.ts:57, cron/daily-digest/route.ts:420,
 *   admin/gmail-token/route.ts:44.
 *
 * A `daily_cap` DOES exist - src/lib/revops/send-strategy.ts, presets safe 120
 * / balanced 240 / aggressive 400 - and it is DEAD CODE at send time. It is
 * validated as form input, persisted onto SendJob.send_strategy, and then the
 * only place it is read back (process-send-jobs/route.ts:119) destructures the
 * strategy solely to pull `.workflow` for EmailLog metadata. `daily_cap`,
 * `domain_cap` and `timezone_window` are never consulted before a send.
 * isWithinTimezoneWindow has zero call sites outside its own unit test.
 *
 * The only real ceiling is per-RECIPIENT: recipient-guard.ts, 8 sends / 30
 * days. That is not a mailbox cap - 1,000 distinct recipients is 1,000 sends
 * with the cap never touched. It also fails OPEN on a DB error and exempts
 * freightroll.com / yardflow.ai / dwtb.dev outright.
 *
 * Meanwhile clawd bounds the SAME mailbox at 40/day (the cold motion) and
 * 200/day (V2_HARD_DAILY_CAP, the mailbox). Those numbers are meaningless while
 * a second system sends into the same inbox uncounted - and the two write to
 * different Postgres instances, so neither can see the other. This closes
 * modex's half: a real ceiling at the one wire call every app path funnels
 * through.
 *
 * The gate FAILS CLOSED. Every other guard here fails open, which is right for
 * a per-recipient check that must not block a legitimate reply. It is wrong for
 * a volume ceiling on a domain in recovery: if we cannot prove how much has
 * already gone out today, the answer is not "send anyway".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCount = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: { emailLog: { count: (...a: unknown[]) => mockCount(...a) } },
}));

import {
  assertUnderDailyCap,
  dailySendCap,
  DailyCapExceededError,
} from '@/lib/email/daily-cap';

const ORIGINAL = { ...process.env };

beforeEach(() => {
  mockCount.mockReset();
  process.env = { ...ORIGINAL };
});
afterEach(() => {
  process.env = ORIGINAL;
});

describe('the mailbox daily ceiling', () => {
  it('allows a send below the cap', async () => {
    process.env.EMAIL_DAILY_CAP = '50';
    mockCount.mockResolvedValue(10);

    await expect(assertUnderDailyCap()).resolves.toBeUndefined();
  });

  it('refuses the send that would cross the cap', async () => {
    process.env.EMAIL_DAILY_CAP = '50';
    mockCount.mockResolvedValue(50);

    await expect(assertUnderDailyCap()).rejects.toBeInstanceOf(DailyCapExceededError);
  });

  it('refuses once past the cap, not merely at it', async () => {
    process.env.EMAIL_DAILY_CAP = '50';
    mockCount.mockResolvedValue(73);

    await expect(assertUnderDailyCap()).rejects.toThrow(/73\/50/);
  });

  it('FAILS CLOSED when the ledger cannot be read', async () => {
    // recipient-guard fails open on a DB error, deliberately. A volume ceiling
    // must not: an unreadable counter means the day's volume is unknown, and
    // "unknown" is not "zero" on a domain that is recovering from a burn.
    process.env.EMAIL_DAILY_CAP = '50';
    mockCount.mockRejectedValue(new Error('db down'));

    await expect(assertUnderDailyCap()).rejects.toBeInstanceOf(DailyCapExceededError);
  });

  it('counts only sends from the current UTC day', async () => {
    process.env.EMAIL_DAILY_CAP = '50';
    mockCount.mockResolvedValue(0);
    await assertUnderDailyCap();

    const where = mockCount.mock.calls[0][0].where;
    const since = where.sent_at.gte as Date;
    expect(since.getUTCHours()).toBe(0);
    expect(since.getUTCMinutes()).toBe(0);
    expect(since.getUTCSeconds()).toBe(0);
  });

  it('has a conservative default so an unset env is not an unbounded one', async () => {
    delete process.env.EMAIL_DAILY_CAP;
    expect(dailySendCap()).toBe(200);
  });

  it('reads the cap live, so it can be lowered without a redeploy', () => {
    process.env.EMAIL_DAILY_CAP = '10';
    expect(dailySendCap()).toBe(10);
    process.env.EMAIL_DAILY_CAP = '25';
    expect(dailySendCap()).toBe(25);
  });

  it('a malformed or absurd cap falls back rather than disabling the gate', () => {
    process.env.EMAIL_DAILY_CAP = 'not-a-number';
    expect(dailySendCap()).toBe(200);
    // 0 or negative would mean "refuse everything", which reads as an outage;
    // the floor keeps a misconfiguration from looking like a dead mailbox.
    process.env.EMAIL_DAILY_CAP = '0';
    expect(dailySendCap()).toBe(1);
    process.env.EMAIL_DAILY_CAP = '-5';
    expect(dailySendCap()).toBe(1);
  });

  it('can be disabled only by an explicit, named opt-out', async () => {
    // A kill switch that reads like a typo is not a kill switch. Requiring the
    // literal string means nobody disables the ceiling by setting it to "0".
    process.env.EMAIL_DAILY_CAP = '1';
    process.env.EMAIL_DAILY_CAP_DISABLED = 'i-accept-an-uncapped-mailbox';
    mockCount.mockResolvedValue(9999);

    await expect(assertUnderDailyCap()).resolves.toBeUndefined();
  });

  it('is NOT disabled by a merely truthy value', async () => {
    process.env.EMAIL_DAILY_CAP = '1';
    process.env.EMAIL_DAILY_CAP_DISABLED = 'true';
    mockCount.mockResolvedValue(9999);

    await expect(assertUnderDailyCap()).rejects.toBeInstanceOf(DailyCapExceededError);
  });
});

describe('the gate is wired at the wire call', () => {
  it('sendViaGmail calls assertUnderDailyCap before it fetches Gmail', async () => {
    // Source-level, on purpose. Seven routes reach this function and more will
    // be added; a behavioural test on one route would pass while another
    // bypassed the ceiling. What must hold is that the guard sits in the
    // transport, ahead of the wire call.
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/lib/email/gmail-sender.ts', 'utf8');
    const fn = src.slice(src.indexOf('export async function sendViaGmail'));

    const guardAt = fn.indexOf('assertUnderDailyCap()');
    const wireAt = fn.indexOf('gmail.googleapis.com');

    expect(guardAt).toBeGreaterThan(-1);
    expect(wireAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(wireAt);
  });

  it('no application path imports the raw Gmail endpoint itself', async () => {
    // If a route ever hand-rolls the fetch the way the two CLI scripts do, it
    // leaves the transport - and the ceiling - behind. scripts/ is excluded:
    // batch-send-gmail.ts and wave1-resend-gmail.ts already do exactly that and
    // are known-uncapped, which is recorded in the module docstring.
    const { execSync } = await import('node:child_process');
    const hits = execSync(
      'git grep -l "gmail.googleapis.com/gmail/v1/users" -- src/ || true',
      { encoding: 'utf8' }
    )
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    expect(hits).toEqual(['src/lib/email/gmail-sender.ts']);
  });
});
