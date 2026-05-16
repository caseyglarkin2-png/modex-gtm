import { prisma } from '@/lib/prisma';
import { buildEngagementItems, type EngagementItem } from '@/lib/engagement-center';
import { readTrafficQuality } from '@/lib/microsites/bot-detection';

/**
 * Loads the unified, newest-first engagement stream for the Home cockpit
 * "Since your last visit" feed. Reuses buildEngagementItems — the same
 * merge the Engagement workspace uses — so Home and Engagement never
 * drift. Bot/scanner microsite sessions are filtered out.
 */
export async function loadRecentEngagementItems(): Promise<EngagementItem[]> {
  const [notifications, emailLogs, sendFailures, micrositeSessions, meetings, activities] =
    await Promise.all([
      prisma.notification.findMany({
        orderBy: { created_at: 'desc' },
        take: 40,
        select: {
          id: true,
          type: true,
          account_name: true,
          persona_email: true,
          subject: true,
          preview: true,
          created_at: true,
          read: true,
        },
      }),
      prisma.emailLog.findMany({
        where: { OR: [{ opened_at: { not: null } }, { clicked_at: { not: null } }] },
        orderBy: [{ clicked_at: 'desc' }, { opened_at: 'desc' }],
        take: 30,
        select: {
          id: true,
          account_name: true,
          persona_name: true,
          to_email: true,
          subject: true,
          campaign_id: true,
          generated_content_id: true,
          campaign: { select: { name: true, slug: true } },
          status: true,
          opened_at: true,
          clicked_at: true,
          sent_at: true,
        },
      }),
      prisma.sendJobRecipient.findMany({
        where: { status: 'failed' },
        orderBy: { updated_at: 'desc' },
        take: 20,
        select: {
          id: true,
          account_name: true,
          persona_name: true,
          to_email: true,
          error_message: true,
          campaign_id: true,
          generated_content_id: true,
          campaign: { select: { name: true, slug: true } },
          updated_at: true,
        },
      }),
      prisma.micrositeEngagement.findMany({
        orderBy: { updated_at: 'desc' },
        take: 30,
        select: {
          id: true,
          account_name: true,
          person_name: true,
          path: true,
          scroll_depth_pct: true,
          duration_seconds: true,
          cta_ids: true,
          updated_at: true,
          metadata: true,
        },
      }),
      prisma.meeting.findMany({
        orderBy: { updated_at: 'desc' },
        take: 20,
        select: {
          id: true,
          account_name: true,
          persona: true,
          meeting_status: true,
          objective: true,
          meeting_date: true,
          updated_at: true,
        },
      }),
      prisma.activity.findMany({
        orderBy: { created_at: 'desc' },
        take: 20,
        select: {
          id: true,
          account_name: true,
          activity_type: true,
          persona: true,
          outcome: true,
          next_step: true,
          created_at: true,
        },
      }),
    ]);

  const humanSessions = micrositeSessions.filter(
    (session) => readTrafficQuality(session.metadata) === 'human',
  );

  return buildEngagementItems({
    notifications,
    emailLogs,
    sendFailures,
    micrositeSessions: humanSessions,
    meetings,
    activities,
  });
}
