import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

type TokenLike = {
  accessToken?: string;
  accessTokenExpires?: number;
  refreshToken?: string;
  error?: string;
};

async function refreshGoogleAccessToken(token: TokenLike): Promise<TokenLike> {
  if (!token.refreshToken) return { ...token, error: 'MissingRefreshToken' };

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    grant_type: 'refresh_token',
    refresh_token: token.refreshToken,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const refreshed = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };

  if (!res.ok || !refreshed.access_token || !refreshed.expires_in) {
    return { ...token, error: 'RefreshAccessTokenError' };
  }

  return {
    ...token,
    accessToken: refreshed.access_token,
    accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
  };
}

const ALLOWED_EMAILS = [
  'casey@freightroll.com',
  'casey@yardflow.ai',
  'caseyglarkin@gmail.com',
  'jake@freightroll.com',
  'jake@yardflow.ai',
];

const ADMINS = [
  'casey@freightroll.com',
  'casey@yardflow.ai',
  'caseyglarkin@gmail.com',
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.insert',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    // Dev-only credential login when Google OAuth is not configured
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
  ],
  callbacks: {
    async jwt({ token, account }) {
      const mutable = token as unknown as TokenLike;

      if (account?.provider === 'google') {
        mutable.accessToken = account.access_token ?? undefined;
        mutable.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
        mutable.refreshToken = account.refresh_token ?? mutable.refreshToken;

        // Persist refresh token to DB so we can bootstrap GOOGLE_REFRESH_TOKEN
        if (account.refresh_token) {
          try {
            const { prisma } = await import('@/lib/prisma');
            await prisma.generatedContent.upsert({
              where: { id: -1 },
              update: { content: account.refresh_token, tone: 'system' },
              create: { id: -1, account_name: '__system__', content_type: 'google_refresh_token', content: account.refresh_token, tone: 'system' },
            });
          } catch { /* non-blocking */ }
        }
      }

      if (mutable.accessToken && mutable.accessTokenExpires && Date.now() < mutable.accessTokenExpires - 60_000) {
        return token;
      }

      if (mutable.refreshToken) {
        const refreshed = await refreshGoogleAccessToken(mutable);
        Object.assign(token as Record<string, unknown>, refreshed);
      }

      return token;
    },
    async signIn({ user }) {
      return !!user.email && ALLOWED_EMAILS.includes(user.email);
    },
    async session({ session, token }) {
      if (session.user?.email) {
        (session as unknown as Record<string, Record<string, unknown>>).user.role = ADMINS.includes(session.user.email) ? 'admin' : 'rep';
      }
      (session as unknown as Record<string, unknown>).googleAccessToken = (token as unknown as TokenLike).accessToken;
      (session as unknown as Record<string, unknown>).googleTokenError = (token as unknown as TokenLike).error;
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isApiRoute = nextUrl.pathname.startsWith('/api/');

      if (isLoggedIn) return true;

      // Unauthenticated API calls get 401 instead of redirect
      if (isApiRoute) {
        return Response.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Unauthenticated page visits redirect to login
      return false;
    },
  },
  pages: {
    signIn: '/login',
  },
  trustHost: true,
});
