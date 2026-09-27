/**
 * Red team T4: bounded external calls on the send path.
 *
 *  - the autonomy (kill-switch) read and the suppression read carry an
 *    AbortSignal timeout; a hung authority is UNREADABLE -> the send is
 *    refused before the wire (fail closed, provably not sent)
 *  - the Gmail send carries an AbortSignal timeout; no answer in time is
 *    "outcome unknown", never a definitive "not sent" (the claim stays open)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ prisma: { emailLog: { count: vi.fn(async () => 0) } } }));

const ENV = { ...process.env };

/** A fetch that never answers unless its signal aborts. Records every init. */
function hangingFetch(answer: (url: string) => Response | null) {
  const inits: Array<{ url: string; init?: RequestInit }> = [];
  const fn = vi.fn((url: string | URL, init?: RequestInit) => {
    const u = String(url);
    inits.push({ url: u, init });
    const now = answer(u);
    if (now) return Promise.resolve(now);
    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal!.reason ?? new DOMException('aborted', 'AbortError')));
    });
  });
  return { fn, inits };
}

beforeEach(() => {
  vi.resetModules();
  process.env.CLAWD_CONTROL_PLANE_URL = 'https://clawd.example';
  process.env.CLAWD_CONTROL_PLANE_TOKEN = 't';
  process.env.GOOGLE_CLIENT_ID = 'cid';
  process.env.GOOGLE_CLIENT_SECRET = 'secret';
  process.env.GOOGLE_REFRESH_TOKEN = 'rt';
  process.env.AUTONOMY_READ_TIMEOUT_MS = '30';
  process.env.SUPPRESSION_READ_TIMEOUT_MS = '30';
  process.env.GMAIL_SEND_TIMEOUT_MS = '30';
});

afterEach(() => {
  process.env = { ...ENV };
  vi.unstubAllGlobals();
});

const payload = { to: 'recipient@example.com', subject: 'Hi', html: '<p>x</p>', purpose: 'PROSPECT_OUTREACH' as const };
const autonomyLive = () => new Response(JSON.stringify({ global: true, motions: { outreach: true, prospect_outreach: true }, updated_by: 'x', reason: null }), { status: 200 });
const suppressionClear = () => new Response(JSON.stringify({ ok: true, results: [{ email: 'recipient@example.com', blocked: false }] }), { status: 200 });

describe('safety reads are bounded and fail closed', () => {
  it('a hung autonomy authority refuses the send before the wire, with a signal on the request', async () => {
    const { fn, inits } = hangingFetch(() => null);
    vi.stubGlobal('fetch', fn);
    const { sendViaGmail } = await import('@/lib/email/gmail-sender');
    await expect(sendViaGmail(payload)).rejects.toThrow(/^Canonical autonomy refused/);
    expect(inits[0].url).toContain('/api/autonomy/state');
    expect(inits[0].init?.signal).toBeInstanceOf(AbortSignal);
    expect(inits.some((i) => i.url.includes('gmail.googleapis.com'))).toBe(false);
  });

  it('a hung suppression authority refuses the send before the wire', async () => {
    const { fn, inits } = hangingFetch((u) => (u.includes('/api/autonomy/state') ? autonomyLive() : null));
    vi.stubGlobal('fetch', fn);
    const { sendViaGmail } = await import('@/lib/email/gmail-sender');
    await expect(sendViaGmail(payload)).rejects.toThrow(/^Cross-plane suppression refused/);
    const sup = inits.find((i) => !i.url.includes('/api/autonomy/state'))!;
    expect(sup.init?.signal).toBeInstanceOf(AbortSignal);
    expect(inits.some((i) => i.url.includes('gmail.googleapis.com'))).toBe(false);
  });
});

describe('the Gmail send is bounded and a timeout is an UNKNOWN outcome', () => {
  it('no answer within the timeout throws "Gmail send outcome unknown", never "Gmail send failed (NNN)"', async () => {
    const { fn, inits } = hangingFetch((u) => {
      if (u.includes('/api/autonomy/state')) return autonomyLive();
      if (u.includes('oauth2.googleapis.com')) return new Response(JSON.stringify({ access_token: 'a' }), { status: 200 });
      if (u.includes('gmail.googleapis.com')) return null;
      return suppressionClear();
    });
    vi.stubGlobal('fetch', fn);
    const { sendViaGmail } = await import('@/lib/email/gmail-sender');
    const err = await sendViaGmail(payload).then(() => null, (e: Error) => e);
    expect(err?.message).toMatch(/^Gmail send outcome unknown/);
    const send = inits.find((i) => i.url.includes('/messages/send'))!;
    expect(send.init?.signal).toBeInstanceOf(AbortSignal);
  });
});
