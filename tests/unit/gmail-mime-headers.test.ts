import { describe, it, expect } from 'vitest';
import { buildMimeMessage } from '@/lib/email/gmail-sender';

describe('buildMimeMessage header sanitization', () => {
  it('strips CRLF from Subject and To so headers cannot be injected', () => {
    const raw = buildMimeMessage({
      to: 'gm@acme.com\r\nBcc: attacker@evil.com',
      subject: 'recap\r\nReply-To: spoof@evil.com',
      html: '<p>hi</p>',
    } as any);
    expect(raw).not.toMatch(/Bcc: attacker@evil.com/);
    expect(raw).not.toMatch(/Reply-To: spoof@evil.com/);
    const headerBlock = raw.split('\r\n\r\n')[0];
    expect(headerBlock.split('\r\n').filter((l) => /^Bcc:/i.test(l))).toHaveLength(0);
    // sanity: the legitimate headers still present
    expect(headerBlock).toMatch(/^To: gm@acme.com/m);
    expect(headerBlock).toMatch(/^Subject: recap/m);
  });
});
