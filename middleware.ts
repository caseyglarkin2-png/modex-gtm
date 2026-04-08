export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (auth page)
     * - /api/auth (NextAuth routes)
     * - /api/webhooks (inbound webhooks from Resend etc.)
     * - /api/unsubscribe (public unsubscribe endpoint)
     * - /api/microsites/track (public microsite engagement endpoint)
     * - /unsubscribe (public unsubscribe page)
     * - /proposal (public proposal decks)
     * - /api/proposal (public proposal data API)
     * - /for (public account microsites)
     * - /opengraph-image, /twitter-image (public social metadata images)
     * - /_next (Next.js internals)
     * - /manifest.json, /robots.txt, /favicon.ico (static assets)
     */
    '/((?!login|api/auth|api/webhooks|api/unsubscribe|api/microsites/track|api/proposal|unsubscribe|proposal|for|opengraph-image|twitter-image|_next|manifest\\.json|robots\\.txt|favicon\\.ico).*)',
  ],
};
