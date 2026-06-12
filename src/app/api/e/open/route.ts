import { prisma } from '@/lib/prisma';
import { verifyOpenToken } from '@/lib/email/open-token';

/**
 * Open-tracking pixel.
 *
 * Canonical URL: `/api/e/open/?l=<token>` — note the trailing slash BEFORE the
 * query. modex-gtm runs trailingSlash:true, and email clients fetching an <img>
 * do NOT follow the 308 a non-slash path would emit, so the path must already be
 * slash-terminated and the id must ride as a query param.
 *
 * Always returns a 1x1 transparent GIF with a 200, even on a bad/missing/forged
 * token or a DB error. Tracking is strictly best-effort: it must never break the
 * email render.
 *
 * Caveat (documented, not defeated): Gmail's image proxy pre-fetches images, so
 * an "open" is approximate. We record it anyway; first-open timestamp + a count
 * is still real signal.
 */

export const dynamic = 'force-dynamic';

// 1x1 transparent GIF (43 bytes).
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

function gif(): Response {
  return new Response(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = new URL(request.url).searchParams.get('l');
    const trackingId = token ? verifyOpenToken(token) : null;
    if (trackingId) {
      // First-touch only: set opened_at solely when it is still null, and always
      // bump the count. updateMany lets us scope on opened_at without a prior read.
      await prisma.emailLog
        .updateMany({
          where: { tracking_id: trackingId, opened_at: null },
          data: { opened_at: new Date(), open_count: { increment: 1 } },
        })
        .catch(() => undefined);
      // Already-opened rows: bump the count without touching opened_at.
      await prisma.emailLog
        .updateMany({
          where: { tracking_id: trackingId, opened_at: { not: null } },
          data: { open_count: { increment: 1 } },
        })
        .catch(() => undefined);
    }
  } catch {
    // Fail-soft: any error still returns the pixel.
  }
  return gif();
}
