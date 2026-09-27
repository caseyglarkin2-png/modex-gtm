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
     * - /api/demo (public demo Street View image proxy for /demo microsites)
     * - /api/cron (Vercel cron endpoints with their own auth)
     * - /api/intel (read-only intel export for clawd; own x-queue-secret auth)
     * - /api/geocode (internal geocoder for clawd proximity; own QUEUE_AGENT_SECRET auth)
     * - /api/pounce (Pounce Spine ingest; own x-pounce-token auth)
     * - /api/suppression (cross-plane do-not-contact leg for clawd; own
     *   x-pounce-token auth). It MUST bypass the session wrapper: clawd reads
     *   a non-200 as UNREADABLE, the contract maps UNREADABLE to UNKNOWN, and
     *   UNKNOWN refuses the send. Wrapped, this route 401s every lookup and
     *   holds every wave at 100% while looking like a working fail-closed
     *   gate. Pinned by tests/unit/middleware-matcher.test.ts.
     * - /api/concierge (concierge booking->deal webhook; own x-concierge-secret auth)
     * - /api/proof (local deterministic e2e seed helpers)
     * - /unsubscribe (public unsubscribe page)
     * - /proposal (public proposal decks)
     * - /api/proposal (public proposal data API)
     * - /for (public account microsites)
     * - /demo (public YNS network demo — same prospect-facing audience as /for)
     * - /demo-packs (public demo pack JSON + satellite tiles consumed by /demo)
     * - /opengraph-image, /twitter-image (public social metadata images)
     * - /docs (public tracked sales docs - same prospect audience as /for)
     * - /audio (public audio briefs served alongside /for/* memos)
     * - /video (public video codas served alongside /for/* memos)
     * - /artifacts (public artifact SVGs embedded in /for/* memos)
     * - /_next (Next.js internals)
     * - /api/microsites/roi-lead (public ROI->pipeline ingest; ROI_LEAD_SECRET-gated)
     * - /manifest.json, /robots.txt, /favicon.ico (static assets)
     *
     * Every named exclusion is a WHOLE PATH SEGMENT: it must be followed by
     * `/` or the end of the path. As bare prefixes, `api/e` (the open pixel)
     * also exempted /api/email/*, /api/engagement/*, /api/enrich* and
     * /api/export, and /api/email/send has no auth of its own: an anonymous
     * POST sent email (red team T1 review, 2026-09-26). Only the file-like
     * metadata/static names stay prefix matches.
     */
    '/((?!(?:login|api/auth|api/webhooks|api/unsubscribe|api/microsites/track|api/microsites/roi-lead|api/demo|api/cron|api/intel|api/geocode|api/campaigns|api/e|api/pounce|api/suppression|api/concierge|api/proposal|api/proof|api/for|api/slack|api/outbox|unsubscribe|proposal|for|demo|demo-packs|docs|audio|video|artifacts)(?:/|$)|opengraph-image|twitter-image|_next|manifest\\.json|robots\\.txt|favicon\\.ico).*)',
  ],
};
