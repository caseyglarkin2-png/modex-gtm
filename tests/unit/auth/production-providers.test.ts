/**
 * T1 (red team): production must not register the passwordless Credentials
 * provider. With it registered, typing an allowlisted email minted a session
 * for that person, which made every HUMAN_APPROVED_1TO1 send forgeable.
 * src/lib/auth.ts registers exactly `authProviders()`; the live proof is
 * GET /api/auth/providers on production listing google only.
 */
import { describe, expect, it } from 'vitest';
import { authProviders } from '@/lib/auth-providers';

function ids(nodeEnv: string | undefined): string[] {
  return authProviders(nodeEnv).map((p) => (typeof p === 'function' ? p() : p).id).sort();
}

describe('auth providers by environment', () => {
  it('production registers google only: no credentials provider', () => {
    expect(ids('production')).toEqual(['google']);
  });

  it('an unset NODE_ENV fails closed to google only', () => {
    expect(ids(undefined)).toEqual(['google']);
  });

  it('development keeps the credentials provider for local work', () => {
    expect(ids('development')).toEqual(['credentials', 'google']);
  });

  it('test keeps the credentials provider', () => {
    expect(ids('test')).toEqual(['credentials', 'google']);
  });
});

describe('src/lib/auth.ts registers exactly authProviders(NODE_ENV)', () => {
  it('has no provider of its own and no second Credentials import', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/lib/auth.ts', 'utf8');
    expect(src).toContain('providers: authProviders(process.env.NODE_ENV),');
    expect(src).not.toMatch(/next-auth\/providers\/credentials/);
    expect(src).not.toMatch(/Credentials\(/);
  });
});

describe('sessions minted before the fix end (T1 review)', () => {
  it('production honors only a token stamped by a Google sign-in', async () => {
    const { sessionTokenAllowed } = await import('@/lib/auth-providers');
    expect(sessionTokenAllowed({ signInProvider: 'google' }, 'production')).toBe(true);
    expect(sessionTokenAllowed({ signInProvider: 'credentials' }, 'production')).toBe(false);
    expect(sessionTokenAllowed({}, 'production')).toBe(false);
    expect(sessionTokenAllowed(null, 'production')).toBe(false);
    expect(sessionTokenAllowed({}, undefined)).toBe(false);
    expect(sessionTokenAllowed({}, 'development')).toBe(true);
  });

  it('auth.ts stamps the sign-in provider and drops a disallowed token before any other work', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/lib/auth.ts', 'utf8');
    const stamp = src.indexOf('signInProvider = account.provider');
    const gate = src.indexOf('if (!sessionTokenAllowed(token as { signInProvider?: unknown }, process.env.NODE_ENV)) return null;');
    const refresh = src.indexOf("if (account?.provider === 'google')");
    expect(stamp).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(stamp);
    expect(refresh).toBeGreaterThan(gate);
  });

  it('only the owners are admins', async () => {
    const { isAdminEmail } = await import('@/lib/auth-providers');
    expect(isAdminEmail('casey@freightroll.com')).toBe(true);
    expect(isAdminEmail('Casey@FreightRoll.com')).toBe(true);
    expect(isAdminEmail('jake@freightroll.com')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});
