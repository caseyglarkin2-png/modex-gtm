import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

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
    async signIn({ user }) {
      return !!user.email && ALLOWED_EMAILS.includes(user.email);
    },
    async session({ session }) {
      if (session.user?.email) {
        (session as unknown as Record<string, Record<string, unknown>>).user.role = ADMINS.includes(session.user.email) ? 'admin' : 'rep';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  trustHost: true,
});
