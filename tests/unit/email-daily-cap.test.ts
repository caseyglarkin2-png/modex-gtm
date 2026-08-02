/**
 * modex-gtm could send an unbounded number of emails per day, and nothing
 * counted them.
 *
 * VERIFIED 2026-08-02. Seven application paths reach the Gmail wire call and
 * none consulted a volume ceiling: perform-send (manual /discovery + the
 * clawd-driven draft queue), send-bulk (recipients array had .min(1) and NO
 * .max()), process-send-jobs, monday-bump, the engagement thread reply, the
 * daily digest, and the admin gmail-token probe - which imports sendViaGmail
 * directly and bypasses client.sendEmail.
 *
 * A `daily_cap` already existed and was DEAD CODE at send time
 * (src/lib/revops/send-strategy.ts): validated as form input, persisted onto
 * SendJob.send_strategy, then read back only to pull `.workflow` for EmailLog
 * metadata. Configuration that looks like a guard is worse than no guard.
 *
 * The only other ceiling is per-RECIPIENT (recipient-guard, 8 sends/30d),
 * which is not a volume cap: a thousand distinct recipients is a thousand
 * sends without touching it, and it fails open and exempts freightroll.com /
 * yardflow.ai / dwtb.dev.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCount = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: { emailLog: { count: (...a: unknown[]) => mockCount(...a) } },
}));

import {
  assertUnderDailyCap,
  dailySendCap,
  utcMidnight,
  DailyCapExceededError,
  __resetDailyCapMemo,
} from '@/lib/email/daily-cap';

const ORIGINAL = { ...process.env };

beforeEach(() => {
  mockCount.mockReset();
  // The tally is module state and reserves a slot per allowed send, so without
  // this a passing case leaks its reservation into the next one.
  __resetDailyCapMemo();
  process.env = { ...ORIGINAL };
});
afterEach(() => {
  process.env = ORIGINAL;
});

describe('the daily send ceiling', () => {
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

  it('FAILS CLOSED when the ledger cannot be read', async () => {
    // recipient-guard fails open on a DB error, deliberately. A volume ceiling
    // must not: an unreadable counter means the day's volume is unknown, and
    // unknown is not zero on a domain recovering from a burn.
    process.env.EMAIL_DAILY_CAP = '50';
    mockCount.mockRejectedValue(new Error('P1001 cannot reach db at secret-host:5432'));

    const err = await assertUnderDailyCap().catch((e) => e);
    expect(err).toBeInstanceOf(DailyCapExceededError);
    expect(err.unreadable).toBe(true);
    // The Prisma message names the datasource host and this error reaches API
    // clients via the reply route. Log the cause, do not return it.
    expect(err.message).not.toContain('secret-host');
  });

  it('does NOT count rows that never left the mailbox', async () => {
    // send-bulk writes an EmailLog row for EVERY result -
    // status: fulfilled ? 'sent' : 'failed'. Counting rows blindly meant the
    // cap counted its own refusals: refuse 95, log 95 'failed', and the
    // counter ratchets with nothing sent. Raising the cap to unblock then
    // logs more failures and inflates it further.
    process.env.EMAIL_DAILY_CAP = '50';
    mockCount.mockResolvedValue(0);
    await assertUnderDailyCap();

    const where = mockCount.mock.calls[0][0].where;
    expect(where.NOT.status.in).toEqual(expect.arrayContaining(['failed', 'skipped']));
    // A bounce DID leave the mailbox, so it must still count.
    expect(where.NOT.status.in).not.toContain('bounced');
  });

  it('counts from midnight UTC today, not merely from a zeroed clock', async () => {
    process.env.EMAIL_DAILY_CAP = '50';
    mockCount.mockResolvedValue(0);
    await assertUnderDailyCap();

    const since = mockCount.mock.calls[0][0].where.sent_at.gte as Date;
    // Asserting only H/M/S are zero would pass for new Date(0).
    expect(since.getTime()).toBe(utcMidnight().getTime());
  });

  it('has a conservative default so an unset env is not an unbounded one', () => {
    delete process.env.EMAIL_DAILY_CAP;
    expect(dailySendCap()).toBe(200);
  });

  it('a malformed or absurd cap falls back rather than disabling the gate', () => {
    process.env.EMAIL_DAILY_CAP = 'not-a-number';
    expect(dailySendCap()).toBe(200);
    // 0 or negative would refuse everything, which reads as an outage.
    process.env.EMAIL_DAILY_CAP = '0';
    expect(dailySendCap()).toBe(1);
    process.env.EMAIL_DAILY_CAP = '-5';
    expect(dailySendCap()).toBe(1);
  });

  it('can be disabled only by an explicit, named opt-out', async () => {
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

describe('concurrent sends inside one invocation see each other', () => {
  it('a batch cannot outrun the cap by reading one stale total', async () => {
    // THE DEFECT THIS CLOSES. sendBulk fires Promise.allSettled over every
    // payload at once, and send-bulk writes its EmailLog rows only AFTER the
    // whole batch resolves - so nothing incremented mid-batch and all N checks
    // read the same pre-batch total. With 199 rows and a cap of 200, a
    // 1,000-recipient request put 1,199 messages out against a cap of 200.
    process.env.EMAIL_DAILY_CAP = '200';
    mockCount.mockResolvedValue(199);

    const results = await Promise.allSettled(
      Array.from({ length: 50 }, () => assertUnderDailyCap())
    );

    const allowed = results.filter((r) => r.status === 'fulfilled').length;
    expect(allowed).toBe(1);
    expect(mockCount).toHaveBeenCalledTimes(1); // memoised, not 50 scans
  });

  it('reserves optimistically, so a send that later fails still spends a slot', async () => {
    process.env.EMAIL_DAILY_CAP = '3';
    mockCount.mockResolvedValue(0);

    await assertUnderDailyCap();
    await assertUnderDailyCap();
    await assertUnderDailyCap();

    await expect(assertUnderDailyCap()).rejects.toBeInstanceOf(DailyCapExceededError);
  });
});

describe('the gate is wired into the transport', () => {
  it('sendViaGmail refuses at the cap and never reaches the wire', async () => {
    // BEHAVIOURAL, replacing a source-string test that compared indexOf
    // positions. That test passed if the call were commented out, put behind
    // `if (false)`, or placed after an early return - and it discriminated
    // only because the surrounding comment happens not to write the name with
    // parens. This asserts the thing that actually matters: at the ceiling,
    // no HTTP request is made to Gmail.
    vi.resetModules();
    const countAtCap = vi.fn(async () => 9999);
    vi.doMock('@/lib/prisma', () => ({ prisma: { emailLog: { count: countAtCap } } }));

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    process.env.EMAIL_DAILY_CAP = '10';
    delete process.env.EMAIL_DAILY_CAP_DISABLED;

    const { sendViaGmail } = await import('@/lib/email/gmail-sender');
    const { DailyCapExceededError: Err } = await import('@/lib/email/daily-cap');

    await expect(
      sendViaGmail({ to: 'x@example.com', subject: 's', html: '<p>h</p>' })
    ).rejects.toBeInstanceOf(Err);
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
    vi.doUnmock('@/lib/prisma');
    vi.resetModules();
  });

  it('no application path hand-rolls the Gmail endpoint', async () => {
    // A route that writes its own fetch leaves the transport - and the ceiling
    // - behind, the way scripts/batch-send-gmail.ts and wave1-resend-gmail.ts
    // already do. scripts/ is excluded and that exclusion is documented.
    const { execSync } = await import('node:child_process');
    // No `|| true`: on Windows cmd.exe `true` is not a command, so the
    // zero-hit branch threw instead of yielding []. git grep exits 1 on no
    // match, which is not an error here.
    let out = '';
    try {
      out = execSync('git grep -l "gmail.googleapis.com/gmail/v1/users" -- src/', {
        encoding: 'utf8',
      });
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status !== 1) throw e; // 1 = no matches; anything else is a real failure
    }
    const hits = out.split('\n').map((s) => s.trim()).filter(Boolean);

    expect(hits).toEqual(['src/lib/email/gmail-sender.ts']);
  });
});
