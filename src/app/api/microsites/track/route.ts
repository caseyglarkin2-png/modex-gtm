import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { buildMicrositeEngagementUpdate } from '@/lib/microsites/engagement';
import { micrositeTrackingSnapshotSchema } from '@/lib/microsites/tracking';

async function parseRequestBody(req: NextRequest): Promise<unknown> {
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return req.json();
  }

  const text = await req.text();
  return JSON.parse(text);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok, remaining } = rateLimit(`microsite-track:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded', remaining: 0 }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await parseRequestBody(req);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = micrositeTrackingSnapshotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const snapshot = parsed.data;

  try {
    const existing = await prisma.micrositeEngagement.findUnique({
      where: {
        session_id_path: {
          session_id: snapshot.sessionId,
          path: snapshot.path,
        },
      },
    });

    const merged = buildMicrositeEngagementUpdate(existing, snapshot);

    const engagement = existing
      ? await prisma.micrositeEngagement.update({
          where: {
            session_id_path: {
              session_id: snapshot.sessionId,
              path: snapshot.path,
            },
          },
          data: {
            person_slug: snapshot.personSlug,
            person_name: snapshot.personName,
            variant_slug: merged.variant_slug,
            sections_viewed: merged.sections_viewed,
            cta_ids: merged.cta_ids,
            variant_history: merged.variant_history,
            last_cta_id: merged.last_cta_id,
            scroll_depth_pct: merged.scroll_depth_pct,
            duration_seconds: merged.duration_seconds,
            metadata: merged.metadata,
          },
        })
      : await prisma.micrositeEngagement.create({
          data: {
            session_id: snapshot.sessionId,
            account_slug: snapshot.accountSlug,
            account_name: snapshot.accountName,
            person_slug: snapshot.personSlug,
            person_name: snapshot.personName,
            variant_slug: merged.variant_slug,
            path: snapshot.path,
            sections_viewed: merged.sections_viewed,
            cta_ids: merged.cta_ids,
            variant_history: merged.variant_history,
            last_cta_id: merged.last_cta_id,
            scroll_depth_pct: merged.scroll_depth_pct,
            duration_seconds: merged.duration_seconds,
            metadata: merged.metadata,
          },
        });

    return NextResponse.json({
      success: true,
      id: engagement.id,
      remaining,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tracking write failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}