import { NextResponse } from 'next/server';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';

/**
 * Thin geocoder for internal agents (clawd's proximity enrichment). Resolves a
 * free-text place ("City, State") to { lat, lng } via the same Google Maps key
 * the /for roster geocoder uses. Bearer QUEUE_AGENT_SECRET only.
 *
 * Stateless by design: the caller (clawd yardflow_proximity_enrich) caches by
 * city|state so each unique place is billed once. Fail-soft: unresolvable or
 * keyless returns { lat: null, lng: null }, never an error the batch must
 * special-case.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedQueueAgent(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (!q) {
    return NextResponse.json({ error: 'q required' }, { status: 400 });
  }

  const key = (process.env.GOOGLE_MAPS_STATIC_API_KEY || '').trim();
  if (!key) {
    return NextResponse.json({ lat: null, lng: null, reason: 'no_key' });
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}`,
    );
    if (!res.ok) {
      return NextResponse.json({ lat: null, lng: null, reason: `http_${res.status}` });
    }
    const data: unknown = await res.json();
    const loc =
      (data as { status?: string; results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }> })
        ?.status === 'OK'
        ? (data as { results: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }> })
            .results?.[0]?.geometry?.location
        : null;
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
      return NextResponse.json({ lat: null, lng: null, reason: 'no_result' });
    }
    return NextResponse.json({ lat: loc.lat, lng: loc.lng });
  } catch {
    return NextResponse.json({ lat: null, lng: null, reason: 'fetch_failed' });
  }
}
