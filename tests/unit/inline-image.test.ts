import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isAllowedImageUrl, fetchImageAsAttachment } from '@/lib/email/inline-image';

function mockImageResponse(opts: {
  ok?: boolean;
  contentType?: string;
  contentLength?: string | null;
  bytes?: Uint8Array;
}): Response {
  const bytes = opts.bytes ?? new Uint8Array([1, 2, 3, 4]);
  const headers = new Map<string, string>();
  if (opts.contentType !== undefined) headers.set('content-type', opts.contentType);
  if (opts.contentLength !== undefined && opts.contentLength !== null)
    headers.set('content-length', opts.contentLength);
  return {
    ok: opts.ok ?? true,
    headers: {
      get: (k: string) => headers.get(k.toLowerCase()) ?? null,
    },
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as Response;
}

describe('isAllowedImageUrl', () => {
  it('allows https on an allowlisted host', () => {
    expect(isAllowedImageUrl('https://modex-gtm.vercel.app/artifacts/proof.jpg')).toBe(true);
  });
  it('rejects non-https schemes', () => {
    expect(isAllowedImageUrl('http://modex-gtm.vercel.app/proof.jpg')).toBe(false);
  });
  it('rejects metadata IP and localhost', () => {
    expect(isAllowedImageUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isAllowedImageUrl('http://localhost/proof.jpg')).toBe(false);
    expect(isAllowedImageUrl('https://localhost/proof.jpg')).toBe(false);
  });
  it('rejects a non-allowlisted host', () => {
    expect(isAllowedImageUrl('https://evil.com/x.jpg')).toBe(false);
  });
  it('rejects garbage / unparseable input', () => {
    expect(isAllowedImageUrl('not a url')).toBe(false);
    expect(isAllowedImageUrl('')).toBe(false);
  });
});

describe('fetchImageAsAttachment', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an inline attachment for an allowlisted https image', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    fetchMock.mockResolvedValue(
      mockImageResponse({ contentType: 'image/jpeg', contentLength: '4', bytes })
    );
    const result = await fetchImageAsAttachment('https://modex-gtm.vercel.app/artifacts/proof.jpg');
    expect(result).not.toBeNull();
    expect(result!.mimeType).toBe('image/jpeg');
    expect(result!.contentId).toBe('proof@yardflow');
    expect(result!.base64).toBe(Buffer.from(bytes).toString('base64'));
    // redirect: 'error' must be set so an allowlisted URL can't bounce internal
    expect(fetchMock).toHaveBeenCalledWith(
      'https://modex-gtm.vercel.app/artifacts/proof.jpg',
      expect.objectContaining({ redirect: 'error' })
    );
  });

  it('returns null for a non-https URL without fetching', async () => {
    const result = await fetchImageAsAttachment('http://modex-gtm.vercel.app/proof.jpg');
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null for the metadata IP and localhost without fetching', async () => {
    expect(await fetchImageAsAttachment('http://169.254.169.254/latest/meta-data')).toBeNull();
    expect(await fetchImageAsAttachment('http://localhost/proof.jpg')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null for a non-allowlisted host without fetching', async () => {
    const result = await fetchImageAsAttachment('https://evil.com/x.jpg');
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when content-type is not image/*', async () => {
    fetchMock.mockResolvedValue(
      mockImageResponse({ contentType: 'text/html', contentLength: '4' })
    );
    const result = await fetchImageAsAttachment('https://modex-gtm.vercel.app/proof.jpg');
    expect(result).toBeNull();
  });

  it('returns null when content-length exceeds the cap', async () => {
    fetchMock.mockResolvedValue(
      mockImageResponse({ contentType: 'image/png', contentLength: String(1_000_001) })
    );
    const result = await fetchImageAsAttachment('https://modex-gtm.vercel.app/big.png');
    expect(result).toBeNull();
  });

  it('returns null when the streamed body exceeds the cap (no content-length header)', async () => {
    const big = new Uint8Array(1_000_001);
    fetchMock.mockResolvedValue(
      mockImageResponse({ contentType: 'image/png', contentLength: null, bytes: big })
    );
    const result = await fetchImageAsAttachment('https://modex-gtm.vercel.app/big.png');
    expect(result).toBeNull();
  });

  it('returns null when the response is not ok', async () => {
    fetchMock.mockResolvedValue(
      mockImageResponse({ ok: false, contentType: 'image/jpeg', contentLength: '4' })
    );
    const result = await fetchImageAsAttachment('https://modex-gtm.vercel.app/proof.jpg');
    expect(result).toBeNull();
  });

  it('returns null (never throws) when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('redirect blocked'));
    const result = await fetchImageAsAttachment('https://modex-gtm.vercel.app/proof.jpg');
    expect(result).toBeNull();
  });
});
