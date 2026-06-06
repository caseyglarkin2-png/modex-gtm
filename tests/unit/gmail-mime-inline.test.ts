import { describe, it, expect } from 'vitest';
import { buildMimeMessage } from '@/lib/email/gmail-sender';
import type { InlineImage } from '@/lib/email/inline-image';

const inlineImage: InlineImage = {
  contentId: 'proof@yardflow',
  mimeType: 'image/jpeg',
  // 200 bytes → base64 ~268 chars → must wrap across multiple 76-char lines.
  base64: Buffer.from(new Uint8Array(200).fill(0x41)).toString('base64'),
};

describe('buildMimeMessage with inline image (multipart/related)', () => {
  it('wraps the alternative block inside multipart/related and adds the image part', () => {
    const raw = buildMimeMessage({
      to: 'gm@acme.com',
      subject: 'recap',
      html: '<p>hi <img src="cid:proof@yardflow" /></p>',
      text: 'hi',
      inlineImage,
    } as any);

    const headerBlock = raw.split('\r\n\r\n')[0];
    // Top-level is multipart/related when an inline image is present.
    expect(headerBlock).toMatch(/^Content-Type: multipart\/related; boundary="/m);

    // The inner alternative block + both leaf parts survive.
    expect(raw).toMatch(/Content-Type: multipart\/alternative; boundary="/);
    expect(raw).toMatch(/Content-Type: text\/plain; charset="UTF-8"/);
    expect(raw).toMatch(/Content-Type: text\/html; charset="UTF-8"/);

    // Image part headers.
    expect(raw).toMatch(/Content-Type: image\/jpeg/);
    expect(raw).toMatch(/Content-Transfer-Encoding: base64/);
    // Content-ID is angle-bracketed.
    expect(raw).toContain('Content-ID: <proof@yardflow>');
    expect(raw).toMatch(/Content-Disposition: inline/);
  });

  it('wraps the base64 payload at 76 chars per line', () => {
    const raw = buildMimeMessage({
      to: 'gm@acme.com',
      subject: 'recap',
      html: '<p>hi</p>',
      text: 'hi',
      inlineImage,
    } as any);

    // Find the image part (after Content-Disposition: inline + blank line).
    const marker = 'Content-Disposition: inline\r\n\r\n';
    const idx = raw.indexOf(marker);
    expect(idx).toBeGreaterThan(-1);
    const after = raw.slice(idx + marker.length);
    const payload = after.split('\r\n--')[0]; // up to the closing boundary
    const lines = payload.split('\r\n').filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThan(1); // actually wrapped
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(76);
    }
    // Round-trips back to the original base64.
    expect(lines.join('')).toBe(inlineImage.base64);
  });
});

describe('buildMimeMessage without inline image (regression)', () => {
  it('keeps the top-level as multipart/alternative — no multipart/related', () => {
    const raw = buildMimeMessage({
      to: 'gm@acme.com',
      subject: 'recap',
      html: '<p>hi</p>',
    } as any);
    const headerBlock = raw.split('\r\n\r\n')[0];
    expect(headerBlock).toMatch(/^Content-Type: multipart\/alternative; boundary="/m);
    expect(raw).not.toMatch(/multipart\/related/);
    expect(raw).not.toContain('Content-ID:');
  });
});
