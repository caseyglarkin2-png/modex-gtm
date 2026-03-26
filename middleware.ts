export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (auth page)
     * - /api/auth (NextAuth routes)
     * - /_next (Next.js internals)
     * - /manifest.json, /robots.txt, /favicon.ico (static assets)
     */
    '/((?!login|api/auth|_next|manifest\\.json|robots\\.txt|favicon\\.ico).*)',
  ],
};
