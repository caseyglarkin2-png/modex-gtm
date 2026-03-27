export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (auth page)
     * - /api/auth (NextAuth routes)
     * - /api/webhooks (inbound webhooks from Resend etc.)
     * - /_next (Next.js internals)
     * - /manifest.json, /robots.txt, /favicon.ico (static assets)
     */
    '/((?!login|api/auth|api/webhooks|_next|manifest\\.json|robots\\.txt|favicon\\.ico).*)',
  ],
};
