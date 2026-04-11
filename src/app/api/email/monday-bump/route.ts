import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email/client';
import { rateLimit } from '@/lib/rate-limit';
import { firstNameFromEmail } from '@/lib/contact-standard';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

const QuerySchema = z.object({
  since: z.string().datetime().optional(),
  batch: z.coerce.number().int().positive().optional(),
  dryRun: z
    .string()
    .optional()
    .transform(v => v === '1' || v === 'true'),
});

const BANNED_DOMAINS = ['dannon.com', 'danone.com', 'bluetriton.com', 'yardflow.ai'];
const BATCH_SIZE = 25;
const RATE_LIMIT_MS = 6000;
const CRON_NAME = 'monday-bump';
const CRON_PATH = '/api/email/monday-bump';
const CRON_SCHEDULE = '5 11 * * 1';

const BUMP_BODIES = [
  (firstName: string) =>
`Hey ${firstName},

Bumping this to the top in case it got buried over the weekend. Inboxes take a beating on Mondays.

Worth a quick look? We'll be at MODEX in Atlanta April 13-16 and I'd love to show you what we built.`,

  (firstName: string) =>
`${firstName},

Quick bump on this. Saturdays are quiet but Monday mornings are brutal.

If the yard is on your radar at all, happy to do a 15-minute walkthrough. We'll be at MODEX in a couple weeks.`,

  (firstName: string) =>
`${firstName},

Floating this back up. Weekend emails tend to disappear.

If this lands at a good time, I'd love to chat. We're at MODEX April 13-16 in Atlanta and the demo takes 5 minutes.`,

  (firstName: string) =>
`Hey ${firstName},

Moving this to the top of the pile. Monday inboxes are no joke.

Let me know if the yard is something you're thinking about. Happy to do a quick call or meet at MODEX in a couple weeks.`,

  (firstName: string) =>
`${firstName},

Bumping this up. Saturday sends have a way of getting lost by Monday.

If any of this resonated, I'm around for a quick call. Or catch us at MODEX in Atlanta April 13-16.`,
];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function wrapHtml(bodyText: string, accountName: string): string {
  const escaped = bodyText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 14px 0; padding:0;">')
    .replace(/\n/g, '<br />');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>YardFlow - ${accountName}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;">
<tr><td style="padding:32px 24px 24px;color:#1a1a1a;font-size:15px;line-height:1.75;letter-spacing:-0.01em;">
<p style="margin:0 0 14px 0;padding:0;">${escaped}</p></td></tr>
<tr><td style="padding:0 24px 32px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e0e0e0;padding-top:16px;width:100%;">
<tr><td style="padding-top:16px;">
<p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1a1a1a;">Casey Larkin</p>
<p style="margin:0 0 10px;font-size:13px;color:#6b7280;">GTM Lead, <span style="color:#0e7490;font-weight:600;">Yard</span><span style="font-weight:600;color:#1a1a1a;">Flow</span> by FreightRoll</p>
<p style="margin:0 0 10px;font-size:12px;color:#9ca3af;font-style:italic;">The First Yard Network System. Deterministic throughput across every facility.</p>
<p style="margin:0;font-size:12px;">
<a href="https://yardflow.ai" style="color:#0e7490;text-decoration:none;font-weight:500;">yardflow.ai</a>
<span style="color:#d1d5db;margin:0 6px;">|</span>
<a href="https://yardflow.ai/roi" style="color:#0e7490;text-decoration:none;font-weight:500;">Run ROI</a>
<span style="color:#d1d5db;margin:0 6px;">|</span>
<a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" style="color:#0e7490;text-decoration:none;font-weight:500;">Book a Network Audit</a></p>
</td></tr></table></td></tr></table></body></html>`;
}

function resolveGreetingName(personaName: string | null, toEmail: string): string {
  const candidate = (personaName || '').trim().split(/\s+/)[0] || '';
  if (candidate && candidate.length >= 2 && !/^\d+$/.test(candidate)) {
    return candidate;
  }

  const fallback = firstNameFromEmail(toEmail);
  if (fallback && fallback.length >= 2) {
    return fallback;
  }

  return 'there';
}

async function handle(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'vercel-cron';
  const { ok } = rateLimit(`cron:monday-bump:${ip}`);
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  try {
    const sinceDate = parsed.data.since ? new Date(parsed.data.since) : new Date(Date.now() - 48 * 60 * 60 * 1000);
    const targetBatch = parsed.data.batch ?? null;
    const isDryRun = parsed.data.dryRun ?? false;
    const campaignEmails = await prisma.emailLog.findMany({
      where: {
        created_at: { gte: sinceDate },
        provider_message_id: { not: null },
        status: { in: ['sent', 'delivered', 'opened'] },
      },
      select: {
        id: true,
        to_email: true,
        subject: true,
        account_name: true,
        persona_name: true,
        provider_message_id: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const bouncedEmails = await prisma.emailLog.findMany({
      where: {
        to_email: { in: campaignEmails.map(e => e.to_email) },
        status: { in: ['bounced', 'complained'] },
      },
      select: { to_email: true },
    });
    const bouncedSet = new Set(bouncedEmails.map(e => e.to_email));

    const eligible = campaignEmails.filter(e => {
      const domain = e.to_email.split('@')[1]?.toLowerCase();
      if (BANNED_DOMAINS.some(d => domain?.includes(d))) return false;
      if (bouncedSet.has(e.to_email)) return false;
      return true;
    });

    const bumps = eligible.map((email, index) => {
      const firstName = resolveGreetingName(email.persona_name, email.to_email);
      const bumpVariant = index % BUMP_BODIES.length;
      const body = BUMP_BODIES[bumpVariant](firstName);

      return {
        to: email.to_email,
        subject: `Re: ${email.subject}`,
        body,
        accountName: email.account_name || '',
        personaName: email.persona_name || '',
        originalMessageId: email.provider_message_id!,
      };
    });

    if (isDryRun) {
      const stats = {
        found: campaignEmails.length,
        eligible: bumps.length,
        excludedBounced: bouncedSet.size,
        batches: Math.ceil(bumps.length / BATCH_SIZE),
      };
      await markCronSkipped(CRON_NAME, {
        path: CRON_PATH,
        schedule: CRON_SCHEDULE,
        reason: 'Dry run only',
        stats,
      }).catch(() => undefined);
      return NextResponse.json({
        mode: 'dry-run',
        since: sinceDate.toISOString(),
        ...stats,
        sample: bumps[0] ?? null,
      });
    }

    let sent = 0;
    let failed = 0;
    const totalBatches = Math.ceil(bumps.length / BATCH_SIZE);

    for (let b = 0; b < totalBatches; b++) {
      const batchNum = b + 1;
      if (targetBatch && batchNum !== targetBatch) continue;
      const batch = bumps.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);

      for (const bump of batch) {
        const html = wrapHtml(bump.body, bump.accountName);

        try {
          const response = await sendEmail({
            to: bump.to,
            subject: bump.subject,
            html,
          });

          const messageId = response.headers?.['x-message-id'] ?? null;

          await prisma.emailLog.create({
            data: {
              account_name: bump.accountName,
              persona_name: bump.personaName || null,
              to_email: bump.to,
              subject: bump.subject,
              body_html: html,
              status: 'sent',
              provider_message_id: messageId,
            },
          });

          sent++;
        } catch {
          failed++;
        }

        await sleep(RATE_LIMIT_MS);
      }
    }

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Sent ${sent} Monday bumps. ${failed} failed.`,
      stats: {
        found: campaignEmails.length,
        eligible: bumps.length,
        excludedBounced: bouncedSet.size,
        batches: totalBatches,
        sent,
        failed,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      mode: 'live',
      since: sinceDate.toISOString(),
      found: campaignEmails.length,
      eligible: bumps.length,
      excludedBounced: bouncedSet.size,
      batches: totalBatches,
      sent,
      failed,
    });
  } catch (error) {
    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Monday bump failed' },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}