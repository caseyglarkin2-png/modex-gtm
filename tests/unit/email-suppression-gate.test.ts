/**
 * The THIRD PLANE. modex's Gmail wire, gated on the cross-plane contract.
 *
 * clawd's `_boundary_check` is deployed and war-room's SendGrid lane is proven.
 * `sendViaGmail` called `assertAutonomyPermitsSend` and NOTHING ELSE, so modex
 * was the last hole in the invariant: a kill-switch is not a consent gate, and
 * the moment `OUTREACH_PAUSED` or the autonomy halt is lifted, modex could mail
 * someone we recorded a decision not to contact.
 *
 * WHAT THESE TESTS ARE FOR. The gate must refuse for a NAMED authority, and it
 * must refuse in every direction the authority can fail: unreachable,
 * non-200, unparseable, wrong shape, a short results array, a missing verdict
 * for an address we asked about, a non-boolean `blocked`. Each of those left
 * unhandled ends with mail reaching someone who told us to stop, and each is a
 * separate test below rather than one "it fails closed" assertion.
 *
 * BCC AND CC ARE RECIPIENTS. A gate that only checks `to` is a gate with a
 * documented bypass, and `bcc` is exactly where a suppressed address would sit
 * unnoticed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
const ORIGINAL_ENV = { ...process.env };

import {
  SuppressionRefusedError,
  __resetSuppressionGate,
  assertSuppressionPermitsSend,
  suppressionRefuses,
} from '@/lib/email/suppression-gate';

const OK = (results: unknown[], legs: Record<string, boolean> = {}) => ({
  ok: true,
  status: 200,
  json: async () => ({ ok: true, results, legs_read: legs }),
});

const verdict = (email: string, blocked: boolean, reason = '') => ({
  email,
  blocked,
  reason,
  keys: reason ? [reason] : [],
  unknown_legs: [],
});

beforeEach(() => {
  mockFetch.mockReset();
  __resetSuppressionGate();
  // Stubbed PER TEST, not at module scope. A module-scope `vi.stubGlobal`
  // survives this file and leaks into every suite that runs after it in the
  // same worker — which is exactly what it did: gmail-thread-exists,
  // hubspot-client and yard-audit-fov all passed in isolation and failed in the
  // full run, and the cause was here rather than in any of them.
  vi.stubGlobal('fetch', mockFetch);
  process.env.CLAWD_CONTROL_PLANE_URL = 'https://clawd.test';
  process.env.CLAWD_CONTROL_PLANE_TOKEN = 'tok';
});

afterEach(() => {
  // Both halves matter. `unstubAllGlobals` puts the real fetch back, and the env
  // restore undoes the Gmail credentials the wiring block sets — without it,
  // hubspot-client's "returns a client when token is set" and its negative twin
  // start disagreeing depending on file order.
  vi.unstubAllGlobals();
  process.env = { ...ORIGINAL_ENV };
});

describe('suppressionRefuses — the authority read', () => {
  it('names the SPECIFIC authority that refused', async () => {
    mockFetch.mockResolvedValue(
      OK([verdict('seannewtz@dswinc.com', true, 'modex_do_not_contact')]),
    );
    const v = await suppressionRefuses(['seannewtz@dswinc.com']);
    expect(v.refused).toBe(true);
    expect(v.reason).toBe('modex_do_not_contact');
    expect(v.unreadable).toBe(false);
  });

  it('refuses a SIBLING address, which is the fire itself', async () => {
    // modex holds john.drake@; clawd mailed john_d_drake@. The coarse key lives
    // clawd-side, so this asserts modex honours the verdict it is given.
    mockFetch.mockResolvedValue(
      OK([verdict('john_d_drake@homedepot.com', true, 'modex_do_not_contact')]),
    );
    expect((await suppressionRefuses(['john_d_drake@homedepot.com'])).refused).toBe(true);
  });

  it('lets a clear recipient through', async () => {
    // A gate that refuses everything is an outage, and would pass every other
    // test in this file.
    mockFetch.mockResolvedValue(OK([verdict('clear@heb.com', false)]));
    expect((await suppressionRefuses(['clear@heb.com'])).refused).toBe(false);
  });

  it('POSTs to clawd on its CANONICAL path, with the declared purpose', async () => {
    mockFetch.mockResolvedValue(OK([verdict('a@b.com', false)]));
    await suppressionRefuses(['a@b.com']);
    const [url, init] = mockFetch.mock.calls[0];
    // clawd registers `^/api/suppression/contract$`. Pinned as a literal
    // against that regex — NOT derived from a house style, because modex and
    // war-room have OPPOSITE trailing-slash conventions and assuming one cost
    // a whole leg once already.
    expect(url).toBe('https://clawd.test/api/suppression/contract');
    expect(JSON.parse(init.body).automated).toBe(true);
    expect(init.headers.authorization).toBe('Bearer tok');
  });

  describe('every way the authority can fail is UNKNOWN, never CLEAR', () => {
    it('unreachable', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
      const v = await suppressionRefuses(['a@b.com']);
      expect(v.refused).toBe(true);
      expect(v.unreadable).toBe(true);
    });

    it('non-200 (clawd answers 503 when a leg resolver fails)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({ ok: false }) });
      expect((await suppressionRefuses(['a@b.com'])).refused).toBe(true);
    });

    it('unparseable JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true, status: 200,
        json: async () => { throw new Error('nope'); },
      });
      expect((await suppressionRefuses(['a@b.com'])).refused).toBe(true);
    });

    it('a 200 whose shape is wrong', async () => {
      for (const body of [{ ok: true }, { ok: false, results: [] }, { results: 'x' }, null]) {
        mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => body });
        expect((await suppressionRefuses(['a@b.com'])).refused).toBe(true);
        __resetSuppressionGate();
      }
    });

    it('a PARTIALLY answered batch', async () => {
      // A short array leaves the tail unchecked, and unchecked reads as
      // sendable. The quiet one.
      mockFetch.mockResolvedValue(OK([verdict('a@b.com', false)]));
      expect((await suppressionRefuses(['a@b.com', 'c@d.com'])).refused).toBe(true);
    });

    it('a verdict MISSING for an address we asked about', async () => {
      mockFetch.mockResolvedValue(OK([verdict('someone.else@x.com', false), verdict('x@y.com', false)]));
      expect((await suppressionRefuses(['a@b.com', 'x@y.com'])).refused).toBe(true);
    });

    it('a non-boolean `blocked`, which `!== true` would read as permission', async () => {
      mockFetch.mockResolvedValue(OK([{ email: 'a@b.com', reason: '' }]));
      const v = await suppressionRefuses(['a@b.com']);
      expect(v.refused).toBe(true);
      expect(v.reason).toBe('malformed_verdict');
    });

    it('an UNCONFIGURED authority — absent config is not permission', async () => {
      delete process.env.CLAWD_CONTROL_PLANE_URL;
      const v = await suppressionRefuses(['a@b.com']);
      expect(v.refused).toBe(true);
      expect(v.unreadable).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('an unconfigured TOKEN', async () => {
      delete process.env.CLAWD_CONTROL_PLANE_TOKEN;
      expect((await suppressionRefuses(['a@b.com'])).refused).toBe(true);
    });
  });
});

describe('assertSuppressionPermitsSend — the wire gate', () => {
  it('throws SuppressionRefusedError naming the authority', async () => {
    mockFetch.mockResolvedValue(
      OK([verdict('seannewtz@dswinc.com', true, 'modex_do_not_contact')]),
    );
    await expect(
      assertSuppressionPermitsSend({ to: 'seannewtz@dswinc.com' }),
    ).rejects.toThrow(SuppressionRefusedError);
    await expect(
      assertSuppressionPermitsSend({ to: 'seannewtz@dswinc.com' }),
    ).rejects.toThrow(/modex_do_not_contact/);
  });

  it('checks CC and BCC, not just TO', async () => {
    // A gate that only reads `to` has a documented bypass, and bcc is exactly
    // where a suppressed address sits unnoticed.
    mockFetch.mockResolvedValue(
      OK([verdict('clear@heb.com', false), verdict('sean@dswinc.com', true, 'modex_do_not_contact')]),
    );
    await expect(
      assertSuppressionPermitsSend({ to: 'clear@heb.com', bcc: 'sean@dswinc.com' }),
    ).rejects.toThrow(/modex_do_not_contact/);

    __resetSuppressionGate();
    mockFetch.mockResolvedValue(
      OK([verdict('clear@heb.com', false), verdict('sean@dswinc.com', true, 'modex_do_not_contact')]),
    );
    await expect(
      assertSuppressionPermitsSend({ to: 'clear@heb.com', cc: ['sean@dswinc.com'] }),
    ).rejects.toThrow(/modex_do_not_contact/);
  });

  it('sends every recipient in ONE request, so none is checked in isolation', async () => {
    mockFetch.mockResolvedValue(
      OK([verdict('a@x.com', false), verdict('b@x.com', false), verdict('c@x.com', false)]),
    );
    await assertSuppressionPermitsSend({ to: 'a@x.com', cc: ['b@x.com'], bcc: 'c@x.com' });
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).emails.sort())
      .toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
  });

  it('OPERATOR_ALERT is exempt from SUPPRESSION and never even asks', async () => {
    // The alert announcing that suppression is holding a wave must not be
    // blocked by suppression. Same reasoning as the autonomy exemption.
    await assertSuppressionPermitsSend(
      { to: 'seannewtz@dswinc.com' }, 'OPERATOR_ALERT',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('an UNDECLARED purpose is gated, never exempted', async () => {
    mockFetch.mockResolvedValue(
      OK([verdict('seannewtz@dswinc.com', true, 'modex_do_not_contact')]),
    );
    // No purpose argument at all.
    await expect(
      assertSuppressionPermitsSend({ to: 'seannewtz@dswinc.com' }),
    ).rejects.toThrow(/modex_do_not_contact/);
  });

  it('resolves silently when every recipient is clear', async () => {
    mockFetch.mockResolvedValue(OK([verdict('clear@heb.com', false)]));
    await expect(
      assertSuppressionPermitsSend({ to: 'clear@heb.com' }),
    ).resolves.toBeUndefined();
  });
});

describe('concurrency — shared in-flight read, never a TTL cache', () => {
  it('collapses a concurrent burst for the SAME recipients into one read', async () => {
    // sendBulk fires Promise.allSettled over every payload at once. Without
    // this a 100-recipient batch opens 100 connections to clawd.
    mockFetch.mockResolvedValue(OK([verdict('a@b.com', false)]));
    await Promise.all([
      suppressionRefuses(['a@b.com']),
      suppressionRefuses(['a@b.com']),
      suppressionRefuses(['a@b.com']),
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does NOT share a read between DIFFERENT recipients', async () => {
    // The failure this prevents is the worst kind: one person's CLEAR verdict
    // authorising a send to somebody else.
    mockFetch
      .mockResolvedValueOnce(OK([verdict('a@b.com', false)]))
      .mockResolvedValueOnce(OK([verdict('c@d.com', true, 'hubspot_optout')]));
    const [first, second] = await Promise.all([
      suppressionRefuses(['a@b.com']),
      suppressionRefuses(['c@d.com']),
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(first.refused).toBe(false);
    expect(second.reason).toBe('hubspot_optout');
  });

  it('does NOT memoize across SEQUENTIAL calls', async () => {
    // THE TTL PROPERTY, stated as a test. A time-based memo keeps serving a
    // stale CLEAR after someone unsubscribes, which is the one direction of
    // staleness a suppression gate must not have.
    mockFetch.mockResolvedValue(OK([verdict('a@b.com', false)]));
    await suppressionRefuses(['a@b.com']);
    await suppressionRefuses(['a@b.com']);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('a refusal is not cached either, so a lifted suppression takes effect at once', async () => {
    mockFetch.mockResolvedValueOnce(OK([verdict('a@b.com', true, 'modex_do_not_contact')]));
    expect((await suppressionRefuses(['a@b.com'])).refused).toBe(true);
    mockFetch.mockResolvedValueOnce(OK([verdict('a@b.com', false)]));
    expect((await suppressionRefuses(['a@b.com'])).refused).toBe(false);
  });
});

describe('the gate is WIRED into the transport', () => {
  /**
   * The three existing wire suites now mock this gate permissively, so deleting
   * the call from `sendViaGmail` would not fail any of them. This block is the
   * behavioural counterweight, exactly as `email-daily-cap.test.ts` is for the
   * ceiling: it asserts the thing that actually matters, which is that a
   * suppressed recipient produces NO HTTP request to Gmail.
   *
   * Deliberately not a source-string test. Comparing `indexOf` positions passes
   * if the call is commented out, put behind `if (false)`, or placed after an
   * early return.
   */
  async function loadWiredSender(contractResponse: unknown) {
    vi.resetModules();
    // Gmail transport credentials. Needed ONLY by the clear-path test, which is
    // the one that actually reaches the wire — note that the three refusal
    // tests below pass without ever needing these, which is itself evidence
    // that the gate runs BEFORE the transport is even configured.
    process.env.GOOGLE_CLIENT_ID = 'cid';
    process.env.GOOGLE_CLIENT_SECRET = 'csec';
    process.env.GOOGLE_REFRESH_TOKEN = 'rtok';
    process.env.GMAIL_USER_EMAIL = 'casey@freightroll.com';
    vi.doMock('@/lib/prisma', () => ({
      prisma: { emailLog: { count: vi.fn(async () => 0) } },
    }));
    // The kill-switch is checked BEFORE suppression and fails closed on an
    // unreadable authority, which under vitest it always is. Without this the
    // send is refused by autonomy and this test would prove nothing about
    // suppression.
    vi.doMock('@/lib/email/autonomy-gate', () => ({
      assertAutonomyPermitsSend: vi.fn(async () => undefined),
    }));
    const spy = vi.fn(async (url: string) => {
      if (String(url).includes('/api/suppression/contract')) {
        return { ok: true, status: 200, json: async () => contractResponse } as unknown as Response;
      }
      if (String(url).includes('oauth2.googleapis.com')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'at', expires_in: 3600 }) } as unknown as Response;
      }
      return {
        ok: true, status: 200,
        json: async () => ({ id: 'mid', threadId: 't' }),
      } as unknown as Response;
    });
    vi.stubGlobal('fetch', spy);
    const mod = await import('@/lib/email/gmail-sender');
    return { sendViaGmail: mod.sendViaGmail, spy };
  }

  const gmailCalls = (spy: ReturnType<typeof vi.fn>) =>
    spy.mock.calls.filter((c) => String(c[0]).includes('gmail.googleapis.com'));

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('@/lib/prisma');
    vi.doUnmock('@/lib/email/autonomy-gate');
    vi.resetModules();
  });

  it('a SUPPRESSED recipient never reaches the Gmail wire', async () => {
    const { sendViaGmail, spy } = await loadWiredSender({
      ok: true,
      results: [{ email: 'seannewtz@dswinc.com', blocked: true, reason: 'modex_do_not_contact', keys: [], unknown_legs: [] }],
    });
    await expect(
      sendViaGmail({ to: 'seannewtz@dswinc.com', subject: 's', html: '<p>h</p>' }),
    ).rejects.toThrow(/modex_do_not_contact/);
    expect(gmailCalls(spy)).toHaveLength(0);
  });

  it('an UNREADABLE authority never reaches the Gmail wire', async () => {
    const { sendViaGmail, spy } = await loadWiredSender({ ok: false });
    await expect(
      sendViaGmail({ to: 'anyone@heb.com', subject: 's', html: '<p>h</p>' }),
    ).rejects.toThrow(/Cross-plane suppression/);
    expect(gmailCalls(spy)).toHaveLength(0);
  });

  it('a CLEAR recipient does reach the wire, so the gate is not a brick', async () => {
    // Without this the whole block passes by refusing everything, which is the
    // failure mode that looks like safety.
    const { sendViaGmail, spy } = await loadWiredSender({
      ok: true,
      results: [{ email: 'clear@heb.com', blocked: false, reason: '', keys: [], unknown_legs: [] }],
    });
    const res = await sendViaGmail({ to: 'clear@heb.com', subject: 's', html: '<p>h</p>' });
    expect(res.id).toBe('mid');
    expect(gmailCalls(spy)).toHaveLength(1);
  });

  it('a suppressed BCC stops the send even when TO is clear', async () => {
    const { sendViaGmail, spy } = await loadWiredSender({
      ok: true,
      results: [
        { email: 'clear@heb.com', blocked: false, reason: '', keys: [], unknown_legs: [] },
        { email: 'sean@dswinc.com', blocked: true, reason: 'modex_do_not_contact', keys: [], unknown_legs: [] },
      ],
    });
    await expect(
      sendViaGmail({ to: 'clear@heb.com', bcc: 'sean@dswinc.com', subject: 's', html: '<p>h</p>' }),
    ).rejects.toThrow(/modex_do_not_contact/);
    expect(gmailCalls(spy)).toHaveLength(0);
  });
});
