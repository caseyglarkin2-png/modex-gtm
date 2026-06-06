import { describe, it, expect, vi, beforeEach } from 'vitest';

// wrapHtml builds an HMAC unsubscribe link for the recipient, which needs a secret.
beforeEach(() => {
  process.env.UNSUBSCRIBE_SECRET = 'test-secret-for-wrapandsend';
});

// Mock the transport so wrapAndSend builds + returns the HTML without sending.
vi.mock('@/lib/email/client', () => ({
  sendEmail: vi.fn(async () => ({
    headers: {},
    threadId: null,
    hubspotEngagementId: null,
    provider: 'gmail',
    hubspotError: null,
  })),
}));

import { wrapAndSend } from '@/lib/email/perform-send';

const base = {
  to: 'ops@acme.com',
  subject: 'Hi',
  bodyHtml: 'hello there',
  accountName: 'Acme',
  personaName: null,
} as const;

describe('wrapAndSend uses an owner-correct signature', () => {
  it('defaults to the Casey signature when no sender is provided', async () => {
    const r = await wrapAndSend({ ...base }, []);
    expect(r.html).toContain('Casey Larkin');
    expect(r.html).toContain('GTM Lead');
  });

  it('renders the Jake signature when the sender is jake@freightroll.com', async () => {
    const r = await wrapAndSend(
      { ...base, sender: { refreshToken: 'tok', userEmail: 'jake@freightroll.com' } },
      [],
    );
    expect(r.html).toContain('Jake');
    expect(r.html).not.toContain('Casey Larkin');
  });
});
