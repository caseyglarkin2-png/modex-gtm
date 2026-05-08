import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default async function middleware(request: NextRequest) {
  return (auth as unknown as (req: NextRequest) => Promise<NextResponse>)(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (auth page)
     * - /api/auth (NextAuth routes)
     * - /api/webhooks (inbound webhooks from HubSpot, etc.)
     * - /api/unsubscribe (public unsubscribe endpoint)
     * - /api/microsites/track (public microsite engagement endpoint)
     * - /api/cron (Vercel cron endpoints with their own auth)
     * - /api/proof (local deterministic e2e seed helpers)
     * - /unsubscribe (public unsubscribe page)
     * - /proposal (public proposal decks)
     * - /api/proposal (public proposal data API)
     * - /for (public account microsites)
     * - /opengraph-image, /twitter-image (public social metadata images)
     * - /_next (Next.js internals)
     * - /manifest.json, /robots.txt, /favicon.ico (static assets)
     */
    '/((?!login|api/auth|api/webhooks|api/unsubscribe|api/microsites/track|api/cron|api/proposal|api/proof|unsubscribe|proposal|for|opengraph-image|twitter-image|_next|manifest\\.json|robots\\.txt|favicon\\.ico).*)',
  ],
};
