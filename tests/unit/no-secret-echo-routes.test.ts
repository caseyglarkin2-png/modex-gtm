/**
 * Ops closeout (security): no API route answers with a credential. The old
 * GET /api/admin/gmail-token returned the Google refresh token in its JSON body
 * (and sent a test email on every GET); its own header said to delete it once
 * GOOGLE_REFRESH_TOKEN was in Vercel, which it has been since 2026-06.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? routes(p) : name === 'route.ts' ? [p] : [];
  });
}

describe('no route echoes a secret', () => {
  it('the refresh-token probe is gone', () => {
    expect(existsSync('src/app/api/admin/gmail-token/route.ts')).toBe(false);
  });

  it('no route puts a refresh token or client secret in a response body', () => {
    const offenders = routes('src/app/api').filter((f) => /(GOOGLE_REFRESH_TOKEN|refresh_token|refreshToken|GOOGLE_CLIENT_SECRET)\s*[:,}]/.test(readFileSync(f, 'utf8').split('NextResponse.json').slice(1).join('\n')));
    expect(offenders).toEqual([]);
  });
});
