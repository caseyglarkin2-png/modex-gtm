import { describe, it, expect, beforeAll } from 'vitest';

process.env.UNSUBSCRIBE_SECRET = 'test-secret';

const { generateOpenToken, verifyOpenToken } = await import('@/lib/email/open-token');

describe('open-tracking token', () => {
  it('round-trips: a generated token verifies back to its tracking id', () => {
    const id = 'abc-123-tracking';
    const token = generateOpenToken(id);
    expect(token).toContain('.');
    expect(token.startsWith(`${id}.`)).toBe(true);
    expect(verifyOpenToken(token)).toBe(id);
  });

  it('preserves tracking ids that themselves contain dots (splits on the last dot)', () => {
    const id = 'a.b.c';
    const token = generateOpenToken(id);
    expect(verifyOpenToken(token)).toBe(id);
  });

  it('rejects a tampered signature', () => {
    const token = generateOpenToken('xyz');
    const tampered = `${token.slice(0, -1)}${token.slice(-1) === '0' ? '1' : '0'}`;
    expect(verifyOpenToken(tampered)).toBeNull();
  });

  it('rejects a tampered tracking id (signature no longer matches)', () => {
    const token = generateOpenToken('xyz');
    const [, sig] = token.split('.');
    expect(verifyOpenToken(`zzz.${sig}`)).toBeNull();
  });

  it('returns null for malformed tokens', () => {
    expect(verifyOpenToken('')).toBeNull();
    expect(verifyOpenToken('no-separator')).toBeNull();
    expect(verifyOpenToken('.leadingdot')).toBeNull();
    expect(verifyOpenToken('trailingdot.')).toBeNull();
  });

  describe('pixel injection in wrapHtml', () => {
    let templates: typeof import('@/lib/email/templates');
    beforeAll(async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://modex-gtm.vercel.app';
      templates = await import('@/lib/email/templates');
    });

    it('embeds a slash-terminated pixel URL with the token as the l= query param', () => {
      const html = templates.wrapHtml('Hello', 'Acme', 'a@b.com', undefined, undefined, undefined, undefined, 'track-1');
      // Trailing slash BEFORE the query (trailingSlash:true; clients do not follow 308).
      expect(html).toContain('/api/e/open/?l=');
      const token = generateOpenToken('track-1');
      expect(html).toContain(`l=${encodeURIComponent(token)}`);
      expect(html).toContain('width="1" height="1"');
    });

    it('omits the pixel when no tracking id is supplied', () => {
      const html = templates.wrapHtml('Hello', 'Acme', 'a@b.com');
      expect(html).not.toContain('/api/e/open/');
    });
  });
});
