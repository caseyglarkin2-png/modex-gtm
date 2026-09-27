import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import type { Provider } from 'next-auth/providers';

export const ALLOWED_EMAILS = [
  'casey@freightroll.com',
  'caseyglarkin2@gmail.com',
  'jake@freightroll.com',
];

/**
 * The sign-in providers for this environment.
 *
 * Production (and an unset NODE_ENV) is Google only. The email-only
 * Credentials provider proves nothing about who is typing: with it registered
 * in production, anyone who knew an allowlisted address got that person's
 * session, and a HUMAN_APPROVED_1TO1 send meant nothing. It stays for local
 * development and tests only.
 */
export function authProviders(nodeEnv: string | undefined): Provider[] {
  const google = Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.insert',
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (nodeEnv !== 'development' && nodeEnv !== 'test') return [google];
  return [
    google,
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        if (!email || !ALLOWED_EMAILS.includes(email)) return null;
        return { id: email, email, name: email.split('@')[0] };
      },
    }),
  ];
}

/** Owners: the only people who may approve a send or press CONFIRM + SEND (HUMAN_APPROVED_1TO1 means Casey). */
export const ADMINS = [
  'casey@freightroll.com',
  'caseyglarkin2@gmail.com',
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && ADMINS.includes(email.trim().toLowerCase());
}

/**
 * Whether a decoded session token may stay a session. Outside development and
 * test, only a token minted by a Google sign-in (stamped `signInProvider` in
 * the jwt callback) is honored. A token minted by the old email-only provider
 * is signed with the same AUTH_SECRET and would otherwise stay valid for its
 * full lifetime after that provider is removed; this ends every such session
 * on the next request.
 */
export function sessionTokenAllowed(token: { signInProvider?: unknown } | null | undefined, nodeEnv: string | undefined): boolean {
  if (nodeEnv === 'development' || nodeEnv === 'test') return true;
  return token?.signInProvider === 'google';
}
