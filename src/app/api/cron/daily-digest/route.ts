import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/client';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  secret: z.string().min(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ secret: searchParams.get('secret') ?? '' });

  if (!parsed.success || parsed.data.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Gather stats
    const [totalSent, sentYesterday, openedYesterday, repliesYesterday, bouncedYesterday] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.count({
        where: { sent_at: { gte: yesterday } },
      }),
      prisma.emailLog.count({
        where: { opened_at: { gte: yesterday } },
      }),
      prisma.notification.count({
        where: { type: 'reply', created_at: { gte: yesterday } },
      }),
      prisma.emailLog.count({
        where: { status: 'bounced', sent_at: { gte: yesterday } },
      }),
    ]);

    // Top engaged accounts (most recent activities)
    const topAccounts = await prisma.activity.groupBy({
      by: ['account_name'],
      where: { created_at: { gte: yesterday } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 3,
    });

    // Pending follow-ups (personas with email_status = 'sent' and no reply)
    const pendingFollowups = await prisma.persona.count({
      where: {
        email_status: 'sent',
        do_not_contact: false,
        email: { not: null },
      },
    });

    // Build digest email - no em dashes, short sentences
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const topAccountsList = topAccounts.length > 0
      ? topAccounts.map((a) => `${a.account_name} (${a._count.id} activities)`).join(', ')
      : 'No activity yesterday';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px;">
        <h2 style="margin-bottom: 4px;">Daily Pipeline Digest</h2>
        <p style="color: #666; margin-top: 0;">${dateStr}</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #eee;"><strong>Sent yesterday</strong></td>
            <td style="padding: 8px 12px; border: 1px solid #eee; text-align: right;">${sentYesterday}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #eee;"><strong>Opens</strong></td>
            <td style="padding: 8px 12px; border: 1px solid #eee; text-align: right;">${openedYesterday}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #eee;"><strong>Replies</strong></td>
            <td style="padding: 8px 12px; border: 1px solid #eee; text-align: right;">${repliesYesterday}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #eee;"><strong>Bounces</strong></td>
            <td style="padding: 8px 12px; border: 1px solid #eee; text-align: right;">${bouncedYesterday}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #eee;"><strong>Total sent (all time)</strong></td>
            <td style="padding: 8px 12px; border: 1px solid #eee; text-align: right;">${totalSent}</td>
          </tr>
        </table>

        <h3 style="margin-bottom: 4px;">Top Engaged Accounts</h3>
        <p>${topAccountsList}</p>

        <h3 style="margin-bottom: 4px;">Pending Follow-ups</h3>
        <p>${pendingFollowups} contacts awaiting response.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          Sent automatically from YardFlow RevOps OS.
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app'}">Open dashboard</a>
        </p>
      </div>
    `;

    await sendEmail({
      to: 'casey@freightroll.com',
      subject: `Pipeline Digest - ${dateStr}`,
      html,
    });

    return NextResponse.json({ success: true, sentYesterday, openedYesterday, repliesYesterday });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Digest failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
