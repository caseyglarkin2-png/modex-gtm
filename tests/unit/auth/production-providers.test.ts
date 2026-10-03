/**
 * T1 (red team): production must not register the passwordless Credentials
 * provider. With it registered, typing an allowlisted email minted a session
 * for that person, which made every HUMAN_APPROVED_1TO1 send forgeable.
 * src/lib/auth.ts registers exactly `authProviders()`; the live proof is
 * GET /api/auth/providers on production listing google only.
 */
import { describe, expect, it } from 'vitest';
import { authProviders, signInAllowed } from '@/lib/auth-providers';

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
    expect(isAdminEmail('casey@yardflow.ai')).toBe(true);
    expect(isAdminEmail('jake@freightroll.com')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});

describe('ops closeout: a Google sign-in needs a verified email', () => {
  it.each<[string, Parameters<typeof signInAllowed>[0], boolean]>([
    ['allowlisted + Google email_verified true', { email: 'casey@freightroll.com', provider: 'google', profile: { email_verified: true } }, true],
    ['allowlisted but Google email_verified false', { email: 'casey@freightroll.com', provider: 'google', profile: { email_verified: false } }, false],
    ['allowlisted but Google says nothing about verification', { email: 'casey@freightroll.com', provider: 'google', profile: {} }, false],
    ['allowlisted, verified as the STRING "true" (not the boolean)', { email: 'casey@freightroll.com', provider: 'google', profile: { email_verified: 'true' } }, false],
    ['Casey on yardflow.ai, Google verified (2026-10-04: was denied)', { email: 'casey@yardflow.ai', provider: 'google', profile: { email_verified: true } }, true],
    ['another yardflow.ai address is not allowlisted', { email: 'someone@yardflow.ai', provider: 'google', profile: { email_verified: true } }, false],
    ['verified but not allowlisted', { email: 'stranger@example.com', provider: 'google', profile: { email_verified: true } }, false],
    ['no email', { email: null, provider: 'google', profile: { email_verified: true } }, false],
    ['development credentials (no Google profile) on the allowlist', { email: 'casey@freightroll.com', provider: 'credentials', profile: undefined }, true],
  ])('%s', (_label, input, expected) => {
    expect(signInAllowed(input)).toBe(expected);
  });
});

describe('ops closeout: the NextAuth signIn callback is signInAllowed', () => {
  it('auth.ts passes the provider and the Google profile, not just the email', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('src/lib/auth.ts', 'utf8');
    expect(src).toMatch(/async signIn\(\{ user, account, profile \}\) \{\s*return signInAllowed\(\{ email: user\.email, provider: account\?\.provider, profile:/);
  });
});
