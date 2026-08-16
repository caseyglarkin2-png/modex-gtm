import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// sendViaGmail now enforces the mailbox daily ceiling before it reaches the
// wire (src/lib/email/daily-cap.ts), and that ceiling reads Prisma and FAILS
// CLOSED. Without this mock these tests exercise the guard rather than the
// transport: the ledger is unreadable under vitest, so the send is correctly
// refused and the assertions about tokens and mailbox URLs never run.
//
// Mocked at the counter, not at assertUnderDailyCap, so the wiring itself
// stays under test - if the guard were removed from sendViaGmail these tests
// would still pass, which is why test_the_gate_is_wired_at_the_wire_call in
// email-daily-cap.test.ts asserts the call site separately.
vi.mock('@/lib/prisma', () => ({
  prisma: { emailLog: { count: vi.fn(async () => 0) } },
}));

// sendViaGmail also consults the CANONICAL clawd kill-switch before the wire
// (src/lib/email/autonomy-gate.ts), which fails CLOSED when the authority is
// unreadable - and under vitest it is unconfigured, so every send here would be
// refused before a single assertion about tokens or mailbox URLs could run.
//
// Mocked as a permissive gate because these tests are about the TRANSPORT, not
// the switch. That does mean removing the autonomy check from sendViaGmail
// would not fail this file; email-autonomy-gate.test.ts asserts the wiring
// behaviourally instead, exactly as email-daily-cap.test.ts does for the cap.
vi.mock('@/lib/email/autonomy-gate', () => ({
  assertAutonomyPermitsSend: vi.fn(async () => undefined),
}));

import { buildMimeMessage, sendViaGmail } from '@/lib/email/gmail-sender';

/**
 * Per-identity send: when a `sender` is supplied, the MIME `From` must be the
 * sender's address, the access token must be minted from the sender's refresh
 * token, and the Gmail mailbox URL must address the sender. When `sender` is
 * absent, behavior is exactly as before (env/Casey).
 */

const BASE = {
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<p>Hi there</p>',
};

describe('buildMimeMessage — From selection', () => {
  it('uses the sender email as From when a sender is set', () => {
    const mime = buildMimeMessage({
      ...BASE,
      sender: { refreshToken: 'jake-rt', userEmail: 'jake@freightroll.com' },
    });
    expect(mime).toContain('From: jake@freightroll.com');
    expect(mime).not.toContain('casey@freightroll.com');
  });

  it('keeps the env/Casey From when no sender is set', () => {
    const mime = buildMimeMessage({ ...BASE });
    // Default FROM_EMAIL is casey@freightroll.com with a display name.
    expect(mime).toMatch(/From: .*<casey@freightroll\.com>/);
    expect(mime).not.toContain('From: jake@freightroll.com');
  });
});

describe('sendViaGmail — per-identity token + mailbox URL', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'cid';
    process.env.GOOGLE_CLIENT_SECRET = 'secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'casey-env-rt';
    delete process.env.GMAIL_USER_EMAIL; // default → casey@freightroll.com
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it('mints the access token from the sender refresh token and sends to the sender mailbox', async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('oauth2.googleapis.com/token')) {
        const body = String(init?.body ?? '');
        // The token endpoint must receive the SENDER's refresh token, not env.
        expect(body).toContain('refresh_token=jake-rt');
        expect(body).not.toContain('casey-env-rt');
        return new Response(JSON.stringify({ access_token: 'jake-access' }), { status: 200 });
      }
      // Gmail send: URL must address the sender's mailbox, Authorization uses jake's token.
      expect(u).toContain('/users/jake%40freightroll.com/messages/send');
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jake-access');
      return new Response(JSON.stringify({ id: 'm1', threadId: 't1' }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const res = await sendViaGmail({
      ...BASE,
      sender: { refreshToken: 'jake-rt', userEmail: 'jake@freightroll.com' },
    });

    expect(res).toEqual({ provider: 'gmail', id: 'm1', threadId: 't1' });
  });

  it('falls back to the env/Casey refresh token + mailbox when no sender is set', async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('oauth2.googleapis.com/token')) {
        const body = String(init?.body ?? '');
        expect(body).toContain('refresh_token=casey-env-rt');
        return new Response(JSON.stringify({ access_token: 'casey-access' }), { status: 200 });
      }
      expect(u).toContain('/users/casey%40freightroll.com/messages/send');
      return new Response(JSON.stringify({ id: 'm2', threadId: 't2' }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const res = await sendViaGmail({ ...BASE });
    expect(res).toEqual({ provider: 'gmail', id: 'm2', threadId: 't2' });
  });
});
