/**
 * GET /api/cron/gap-alignment-test (ops closeout 3). NOT scheduled; triggered
 * by hand with the cron secret.
 *
 * Sends ONE harmless internal message through the exact GAP sender path (the
 * Gmail API as the GAP mailbox, GAP_GMAIL_USER_EMAIL = casey@yardflow.ai, with
 * the GAP credentials that only exist in production) to a hard-coded internal
 * address on another Google Workspace domain, so the RECEIVED copy carries
 * Authentication-Results that prove SPF, DKIM and DMARC alignment for the
 * domain prospects will see. The recipient is a constant: no query, header or
 * body can change it. OPERATOR_ALERT (an internal operator message, not
 * outreach). At most one per hour, audited as ops.alignment_test_sent.
 */
import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { sendViaGmail } from '@/lib/email/gmail-sender';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const ALIGNMENT_TEST_RECIPIENT = 'casey@freightroll.com';
const KIND = 'ops.alignment_test_sent';

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const skip = assertGapEnabled();
  if (skip) return NextResponse.json(skip);

  const sender = gapGmailSender();
  if (!sender) return NextResponse.json({ skipped: true, reason: 'gap_mailbox_not_configured' });

  const now = new Date();
  const recent = await prisma.gapAuditEvent.findFirst({ where: { kind: KIND, created_at: { gt: new Date(now.getTime() - 3_600_000) } }, select: { id: true } });
  if (recent) return NextResponse.json({ error: 'rate_limited', detail: 'one alignment test per hour' }, { status: 429 });

  const subject = `[gap-alignment-test] ${now.toISOString()}`;
  const text = `Internal alignment test from the GAP sender path (${sender.userEmail}). It checks SPF, DKIM and DMARC on a real message. No action needed.`;
  const sent = await sendViaGmail({ to: ALIGNMENT_TEST_RECIPIENT, subject, html: `<p>${text}</p>`, text, sender, purpose: 'OPERATOR_ALERT' });
  await prisma.gapAuditEvent.create({
    data: { kind: KIND, actor: 'cron:gap-alignment-test', subject_type: 'mailbox', subject_id: sender.userEmail, payload: { to: ALIGNMENT_TEST_RECIPIENT, subject, gmailMessageId: sent.id, threadId: sent.threadId } },
    select: { id: true },
  });
  return NextResponse.json({ ok: true, from: sender.userEmail, to: ALIGNMENT_TEST_RECIPIENT, subject, gmailMessageId: sent.id });
}
