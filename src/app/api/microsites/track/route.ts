import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import {
  buildMicrositeCtaActivity,
  buildMicrositeEngagementUpdate,
  shouldLogMicrositeCtaActivity,
} from '@/lib/microsites/engagement';
import { micrositeTrackingSnapshotSchema } from '@/lib/microsites/tracking';
import { classifyMicrositeTraffic } from '@/lib/microsites/bot-detection';
import type { MicrositeEngagementAnalyticsInput } from '@/lib/microsites/analytics';
import {
  buildIntentMessage,
  decideIntentNotification,
  sendSlackNotification,
} from '@/lib/microsites/intent-notifications';

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
  const sourceDomain = req.headers.get('host') ?? undefined;
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

  // Server-derived traffic metadata. Microsite links are delivered by
  // email, so every URL gets hit by the recipient's security scanner —
  // classify each session so analytics + intent alerts can ignore it.
  const userAgent = req.headers.get('user-agent');
  const referrer = req.headers.get('referer') ?? undefined;
  const trafficQuality = classifyMicrositeTraffic({
    userAgent,
    scrollDepthPct: snapshot.scrollDepthPct,
    durationSeconds: snapshot.durationSeconds,
    ctaCount: snapshot.ctaIds.length,
    sectionCount: snapshot.sectionsViewed.length,
  });
  snapshot.metadata = {
    ...(snapshot.metadata ?? {}),
    ip,
    trafficQuality,
    ...(userAgent ? { userAgent: userAgent.slice(0, 512) } : {}),
    ...(referrer ? { referrer: referrer.slice(0, 512) } : {}),
    // Audio/video depth — only written when non-zero so an early
    // pre-playback flush never clobbers a deeper value already stored.
    ...(snapshot.audioProgressPct > 0
      ? { audioProgressPct: String(snapshot.audioProgressPct) }
      : {}),
    ...(snapshot.videoProgressPct > 0
      ? { videoProgressPct: String(snapshot.videoProgressPct) }
      : {}),
  };

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
    const shouldLogActivity = shouldLogMicrositeCtaActivity(existing, snapshot);

    // Intent notification — decide before the write so the dedup flag
    // can ride along in the same upsert. The merged session is the
    // existing record plus this flush.
    const mergedSession: MicrositeEngagementAnalyticsInput = {
      account_name: snapshot.accountName,
      account_slug: snapshot.accountSlug,
      person_name: snapshot.personName ?? null,
      person_slug: snapshot.personSlug ?? null,
      path: snapshot.path,
      sections_viewed: merged.sections_viewed,
      cta_ids: merged.cta_ids,
      variant_history: merged.variant_history,
      scroll_depth_pct: merged.scroll_depth_pct,
      duration_seconds: merged.duration_seconds,
      updated_at: new Date(),
      metadata: merged.metadata,
    };
    const intentDecision = decideIntentNotification({ existing, snapshot, mergedSession });
    if (intentDecision.notify) {
      merged.metadata = { ...(merged.metadata ?? {}), intentNotified: 'true' };
    }

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
            source_domain: sourceDomain,
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
            source_domain: sourceDomain,
          },
        });

    if (shouldLogActivity) {
      try {
        await prisma.activity.create({
          data: buildMicrositeCtaActivity(snapshot),
        });
      } catch (activityError) {
        console.error('Failed to log microsite CTA activity', activityError);
      }
    }

    // Fire the Slack ping after the dedup flag is persisted — a missed
    // alert is better than a duplicate, and the flag is now written.
    if (intentDecision.notify) {
      try {
        await sendSlackNotification(
          buildIntentMessage(snapshot, mergedSession, intentDecision.reason),
        );
      } catch (notifyError) {
        console.error('Failed to send intent notification', notifyError);
      }
    }

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