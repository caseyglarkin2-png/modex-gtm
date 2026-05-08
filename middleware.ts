import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const PUBLIC_DOMAIN = 'yardflow.ai';

// Paths allowed on the public yardflow.ai domain
const PUBLIC_DOMAIN_ALLOWLIST = ['/for', '/unsubscribe', '/api/webhooks', '/api/unsubscribe', '/api/microsites'];

function isPublicDomainPath(pathname: string): boolean {
  return PUBLIC_DOMAIN_ALLOWLIST.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // yardflow.ai domain: public microsites only, no auth
  if (host.includes(PUBLIC_DOMAIN)) {
    // Allow static assets
    if (pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname === '/robots.txt') {
      return NextResponse.next();
    }

    // Allow paths on the allowlist
    if (isPublicDomainPath(pathname)) {
      return NextResponse.next();
    }

    // Everything else on yardflow.ai → 404
    return new NextResponse('Not Found', { status: 404 });
  }

  // Internal domain: delegate to NextAuth auth middleware
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
