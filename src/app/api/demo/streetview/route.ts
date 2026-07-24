import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

/**
 * #2 — Street View image proxy for the demo microsites' driver's-eye view.
 *
 * The audit captured, per zone, a Google Street View `pano` id + `heading`
 * (see pack-schema `streetViewMeta`). This route fetches that exact pano frame
 * with the SERVER-side key and streams it back, so the key is never exposed to
 * the client and panos cache hard (they don't change).
 *
 *   GET /api/demo/streetview?pano=<panoId>&heading=<0-359>
 *
 * Env: GOOGLE_MAPS_STATIC_API_KEY (same key probe.ts/build uses).
 */

export const runtime = 'nodejs';

const SIZE = '640x360';
const FOV = '78';

export async function GET(req: NextRequest) {
  const key = process.env.GOOGLE_MAPS_STATIC_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'streetview_not_configured' }, { status: 503 });
  }

  // Rate-limit per client IP so heading enumeration cannot run up unbounded
  // Google Maps Street View billing. Same limiter the /api/microsites/track
  // route uses (10 req/min/key). Valid panos still serve within the window.
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = rateLimit(`streetview:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const pano = req.nextUrl.searchParams.get('pano') ?? '';
  const headingRaw = req.nextUrl.searchParams.get('heading') ?? '0';

  // pano ids are URL-safe base64-ish tokens. Standard Google-car panos are
  // [A-Za-z0-9_-]; user-contributed photosphere panos are longer and end with
  // a '.' (e.g. "CAoSFkNJSE0...Uw."). Both are valid Street View Static API
  // ids, so allow the dot — rejecting it 400s every photosphere zone.
  if (!pano || !/^[A-Za-z0-9_.-]+$/.test(pano) || pano.length > 256) {
    return NextResponse.json({ error: 'invalid_pano' }, { status: 400 });
  }
  const heading = Math.max(0, Math.min(359, Math.round(Number(headingRaw) || 0)));

  const url =
    `https://maps.googleapis.com/maps/api/streetview?size=${SIZE}` +
    `&pano=${encodeURIComponent(pano)}&heading=${heading}&fov=${FOV}&pitch=2&return_error_code=true&key=${key}`;

  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store' });
  } catch {
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  }
  if (!res.ok) {
    // 404 = pano not found / no coverage; surface it so the client hides the panel.
    return NextResponse.json({ error: `streetview_${res.status}` }, { status: res.status === 404 ? 404 : 502 });
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
      // Panos are stable — cache aggressively at the edge + browser.
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
    },
  });
}
