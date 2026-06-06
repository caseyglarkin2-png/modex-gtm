import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InlineImage } from '@/lib/email/inline-image';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';

const mockedSendEmail = vi.fn();
const mockedFetchImageAsAttachment = vi.fn<(url: string) => Promise<InlineImage | null>>();

vi.mock('@/lib/email/client', () => ({ sendEmail: mockedSendEmail }));
vi.mock('@/lib/email/inline-image', () => ({
  fetchImageAsAttachment: mockedFetchImageAsAttachment,
}));

const { wrapAndSend } = await import('@/lib/email/perform-send');

const HOSTED_URL = 'https://modex-gtm.vercel.app/artifacts/proof.png';

const baseInput = {
  to: 'alice@example.com',
  subject: 'Quarterly check-in',
  bodyHtml: 'Hello there',
  accountName: 'Acme Foods',
  personaName: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedSendEmail.mockResolvedValue({
    headers: { 'x-message-id': 'msg-1' },
    provider: 'gmail',
    threadId: null,
    hubspotEngagementId: null,
  });
});

describe('wrapAndSend inline image', () => {
  it('attaches the cid image when fetchImageAsAttachment returns an InlineImage', async () => {
    const inline: InlineImage = {
      contentId: 'proof@yardflow',
      mimeType: 'image/png',
      base64: 'aGVsbG8=',
    };
    mockedFetchImageAsAttachment.mockResolvedValue(inline);

    const result = await wrapAndSend({ ...baseInput, imageUrl: HOSTED_URL }, []);

    // html references the embedded attachment via cid:
    expect(result.html).toContain('cid:proof@yardflow');
    expect(result.html).not.toContain(HOSTED_URL);

    // sendEmail invoked with inlineImage set
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    const sendArg = mockedSendEmail.mock.calls[0][0];
    expect(sendArg.inlineImage).toEqual(inline);
    expect(mockedFetchImageAsAttachment).toHaveBeenCalledWith(HOSTED_URL);
  });

  it('falls back to hosted <img> when fetchImageAsAttachment returns null', async () => {
    mockedFetchImageAsAttachment.mockResolvedValue(null);

    const result = await wrapAndSend({ ...baseInput, imageUrl: HOSTED_URL }, []);

    // hosted url present, no cid
    expect(result.html).toContain(HOSTED_URL);
    expect(result.html).not.toContain('cid:');

    // sendEmail invoked WITHOUT inlineImage
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    const sendArg = mockedSendEmail.mock.calls[0][0];
    expect(sendArg.inlineImage).toBeUndefined();
  });

  it('does not fetch or attach when no imageUrl is provided', async () => {
    const result = await wrapAndSend(baseInput, []);

    expect(mockedFetchImageAsAttachment).not.toHaveBeenCalled();
    const sendArg = mockedSendEmail.mock.calls[0][0];
    expect(sendArg.inlineImage).toBeUndefined();
    expect(result.html).not.toContain('cid:');
  });
});
