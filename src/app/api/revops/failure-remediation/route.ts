import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const FailureRemediationSchema = z.object({
  action: z.enum(['retry-later', 'switch-persona', 'mark-bad-address', 'suppress-recipient']),
  recipientIds: z.array(z.number().int().positive()).min(1),
  actor: z.string().optional().default('Casey'),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = FailureRemediationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  const recipients = await prisma.sendJobRecipient.findMany({
    where: { id: { in: payload.recipientIds } },
    select: {
      id: true,
      send_job_id: true,
      to_email: true,
      account_name: true,
      campaign_id: true,
      status: true,
    },
  });
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found for remediation action.' }, { status: 404 });
  }

  if (payload.action === 'retry-later') {
    await prisma.sendJobRecipient.updateMany({
      where: { id: { in: recipients.map((row) => row.id) } },
      data: {
        status: 'pending',
        error_message: null,
        attempted_at: null,
      },
    });
    await prisma.sendJob.updateMany({
      where: { id: { in: Array.from(new Set(recipients.map((row) => row.send_job_id))) } },
      data: {
        status: 'pending',
        completed_at: null,
        error_message: null,
      },
    }).catch(() => undefined);
  }

  if (payload.action === 'mark-bad-address') {
    const emails = recipients.map((row) => row.to_email.toLowerCase());
    await prisma.persona.updateMany({
      where: { email: { in: emails } },
      data: {
        email_valid: false,
        do_not_contact: true,
        email_status: 'invalid',
      },
    });
    await Promise.all(emails.map((email) => prisma.unsubscribedEmail.upsert({
      where: { email },
      update: { reason: 'Marked bad address from failure remediation' },
      create: {
        email,
        reason: 'Marked bad address from failure remediation',
      },
    }).catch(() => undefined)));
    await prisma.sendJobRecipient.updateMany({
      where: { id: { in: recipients.map((row) => row.id) } },
      data: {
        status: 'skipped',
        error_message: 'Marked bad address from failure remediation',
      },
    }).catch(() => undefined);
  }

  if (payload.action === 'switch-persona') {
    await Promise.all(recipients.map((row) => prisma.activity.create({
      data: {
        account_name: row.account_name,
        campaign_id: row.campaign_id,
        activity_type: 'Follow-up',
        owner: payload.actor,
        outcome: 'Persona switch requested from failure remediation',
        next_step: `Select alternate persona for ${row.to_email} and regenerate content.`,
        notes: `failure-remediation:switch-persona:${row.id}`,
      },
    }).catch(() => undefined)));
  }

  if (payload.action === 'suppress-recipient') {
    const emails = recipients.map((row) => row.to_email.toLowerCase());
    await Promise.all(emails.map((email) => prisma.unsubscribedEmail.upsert({
      where: { email },
      update: { reason: 'Suppressed from failure remediation' },
      create: {
        email,
        reason: 'Suppressed from failure remediation',
      },
    }).catch(() => undefined)));
    await prisma.persona.updateMany({
      where: { email: { in: emails } },
      data: {
        do_not_contact: true,
      },
    }).catch(() => undefined);
    await prisma.sendJobRecipient.updateMany({
      where: { id: { in: recipients.map((row) => row.id) } },
      data: {
        status: 'skipped',
        error_message: 'Suppressed from failure remediation',
      },
    }).catch(() => undefined);
  }

  return NextResponse.json({
    success: true,
    action: payload.action,
    affected: recipients.length,
    recipientIds: recipients.map((row) => row.id),
  });
}
