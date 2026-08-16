/**
 * M4 — modex prospect sends honor the CANONICAL clawd autonomy state.
 *
 * WHY THIS EXISTS (2026-08-16). The clawd kill-switch did not gate modex at
 * all. clawd had `outreach` and `actuator` HALTED while modex's Draft Queue
 * drain was armed and would send on request: the only brake on the modex side
 * was its own `OUTREACH_PAUSED` env var, which was ABSENT in production, and
 * `isOutreachPaused()` fail-OPENs on absent. Two planes, one mailbox, one of
 * them deaf to the switch.
 *
 * THE AUTHORITY IS REMOTE AND STAYS REMOTE. modex does NOT get a second
 * autonomy table. The canonical state lives in clawd
 * (clawd-control-plane/scripts/autonomy.py) and is read over
 * `GET /api/autonomy/state`. This mirrors war-room/src/lib/review/autonomy.ts,
 * which is the other cross-repo consumer of the same contract, pinned on the
 * clawd side by scripts/tests/test_autonomy_contract.py (AUT-5).
 *
 * WHAT THESE TESTS ASSERT, AND WHY THE SHAPE MATTERS. Every case asserts the
 * SPECIFIC reason, never merely that a send was refused. A test that accepts
 * any rejection passes when an unrelated guard trips on the same root cause -
 * that exact confusion cost this program a day. So `global:false` must say
 * global, a halted motion must name the motion, and an unreadable authority
 * must say unreadable.
 *
 * THE DRIFT CASE IS THE DANGEROUS ONE. clawd builds its payload as
 * `{m: ... for m in KNOWN_MOTIONS}`, so a motion it stops publishing is simply
 * ABSENT from the map - and `motions['outreach'] === false` on an absent key is
 * `undefined === false`, which is `false`, which reads as "not halted". An
 * absent key must therefore fail CLOSED. It is dangerous precisely because the
 * safe direction is silent: nothing errors, nothing pages, the lane just stops
 * or (in the un-fixed direction) never stops.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const CLAWD = 'https://clawd.example.test';
const ORIGINAL_ENV = { ...process.env };

/** A live-and-permissive autonomy payload. */
function liveState(overrides: Record<string, unknown> = {}) {
  return {
    global: true,
    motions: { outreach: true, actuator: true, social: true, content: true },
    overrides: {},
    updated_at: '2026-08-16T00:00:00+00:00',
    updated_by: 'test',
    reason: '',
    ...overrides,
  };
}

/**
 * Route fetch by URL so one stub serves three different callees: the autonomy
 * read, the Google OAuth token exchange, and the Gmail wire itself. Returns the
 * spy so a test can assert which hosts were (and were not) contacted.
 */
function stubFetch(autonomy: { status?: number; body?: unknown; throws?: boolean }) {
  const calls: string[] = [];
  const spy = vi.fn(async (url: unknown) => {
    const u = String(url);
    calls.push(u);
    if (u.includes('/api/autonomy/state')) {
      if (autonomy.throws) throw new Error('ECONNREFUSED');
      return {
        ok: (autonomy.status ?? 200) < 400,
        status: autonomy.status ?? 200,
        json: async () => autonomy.body ?? liveState(),
      };
    }
    if (u.includes('oauth2.googleapis.com')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'at' }) };
    }
    if (u.includes('gmail.googleapis.com')) {
      return { ok: true, status: 200, json: async () => ({ id: 'mid', threadId: 'tid' }) };
    }
    throw new Error(`unexpected fetch: ${u}`);
  });
  vi.stubGlobal('fetch', spy);
  return { spy, calls, reachedWire: () => calls.some((c) => c.includes('gmail.googleapis.com')) };
}

/** Fresh module graph per test so the autonomy memo never leaks between cases. */
async function loadSender() {
  vi.resetModules();
  vi.doMock('@/lib/prisma', () => ({
    prisma: { emailLog: { count: vi.fn(async () => 0) } },
  }));
  return import('@/lib/email/gmail-sender');
}

const PAYLOAD = { to: 'prospect@example.com', subject: 's', html: '<p>h</p>' };

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = 'cid';
  process.env.GOOGLE_CLIENT_SECRET = 'secret';
  process.env.GOOGLE_REFRESH_TOKEN = 'rt';
  process.env.CLAWD_CONTROL_PLANE_URL = CLAWD;
  process.env.CLAWD_CONTROL_PLANE_TOKEN = 'tok';
  delete process.env.EMAIL_DAILY_CAP_DISABLED;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock('@/lib/prisma');
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

describe('canonical autonomy gates the modex provider wire', () => {
  it('refuses when the outreach MOTION is halted, naming the motion, and never reaches Gmail', async () => {
    const f = stubFetch({ body: liveState({ motions: { outreach: false, actuator: true, social: true, content: true } }) });
    const { sendViaGmail } = await loadSender();

    await expect(sendViaGmail({ ...PAYLOAD })).rejects.toThrow(/outreach motion halted/i);
    expect(f.reachedWire()).toBe(false);
  });

  it('refuses when GLOBAL autonomy is halted, naming global rather than a motion', async () => {
    const f = stubFetch({ body: liveState({ global: false }) });
    const { sendViaGmail } = await loadSender();

    await expect(sendViaGmail({ ...PAYLOAD })).rejects.toThrow(/global autonomy halted/i);
    expect(f.reachedWire()).toBe(false);
  });

  it('fails CLOSED when the outreach motion key is ABSENT (cross-repo drift)', async () => {
    // The silent-and-dangerous case: `undefined === false` is false, so an
    // absent key reads as "not halted" unless it is handled explicitly.
    const f = stubFetch({ body: liveState({ motions: { actuator: true, social: true, content: true } }) });
    const { sendViaGmail } = await loadSender();

    await expect(sendViaGmail({ ...PAYLOAD })).rejects.toThrow(/drift/i);
    expect(f.reachedWire()).toBe(false);
  });

  it('refuses when the authority answers non-200 (clawd 503 = state unavailable)', async () => {
    const f = stubFetch({ status: 503, body: { error: 'unavailable' } });
    const { sendViaGmail } = await loadSender();

    await expect(sendViaGmail({ ...PAYLOAD })).rejects.toThrow(/unreadable/i);
    expect(f.reachedWire()).toBe(false);
  });

  it('refuses when the authority is unreachable (network error)', async () => {
    const f = stubFetch({ throws: true });
    const { sendViaGmail } = await loadSender();

    await expect(sendViaGmail({ ...PAYLOAD })).rejects.toThrow(/unreadable/i);
    expect(f.reachedWire()).toBe(false);
  });

  it('refuses a 200 whose SHAPE is wrong, rather than reading a missing field as permission', async () => {
    // A health payload, an auth error returned with 200, or a proxy page that
    // happens to parse. `d.global !== false` would be true for all of them.
    const f = stubFetch({ body: { ok: true } });
    const { sendViaGmail } = await loadSender();

    await expect(sendViaGmail({ ...PAYLOAD })).rejects.toThrow(/unreadable/i);
    expect(f.reachedWire()).toBe(false);
  });

  it('refuses when the authority is not CONFIGURED, rather than treating absence as permission', async () => {
    delete process.env.CLAWD_CONTROL_PLANE_URL;
    delete process.env.CLAWD_CONTROL_PLANE_TOKEN;
    const f = stubFetch({});
    const { sendViaGmail } = await loadSender();

    await expect(sendViaGmail({ ...PAYLOAD })).rejects.toThrow(/unreadable/i);
    expect(f.reachedWire()).toBe(false);
  });

  it('SENDS when canonical autonomy is live', async () => {
    // The gate must not be a brick. Without this the whole suite passes by
    // refusing everything, which is the failure mode that looks like safety.
    const f = stubFetch({ body: liveState() });
    const { sendViaGmail } = await loadSender();

    const res = await sendViaGmail({ ...PAYLOAD });
    expect(res.id).toBe('mid');
    expect(f.reachedWire()).toBe(true);
  });

  it('exempts an OPERATOR_ALERT: the daily digest still sends while outreach is halted', async () => {
    // Naming the intent, not a bypass flag. Operator alerts are how we learn
    // the system is halted; muting them with the outreach lane would be a
    // guard that hides its own effects.
    const f = stubFetch({ body: liveState({ motions: { outreach: false, actuator: true, social: true, content: true } }) });
    const { sendViaGmail } = await loadSender();

    const res = await sendViaGmail({ ...PAYLOAD, purpose: 'OPERATOR_ALERT' });
    expect(res.id).toBe('mid');
    expect(f.reachedWire()).toBe(true);
  });

  it('treats an UNDECLARED purpose as prospect outreach (fail-safe default)', async () => {
    // A caller that forgets to declare must be gated, not exempted. The
    // default has to be the strict side or every new route is a hole.
    const f = stubFetch({ body: liveState({ motions: { outreach: false, actuator: true, social: true, content: true } }) });
    const { sendViaGmail } = await loadSender();

    await expect(sendViaGmail({ ...PAYLOAD })).rejects.toThrow(/outreach motion halted/i);
    expect(f.reachedWire()).toBe(false);
  });
});
