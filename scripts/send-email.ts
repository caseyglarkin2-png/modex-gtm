/**
 * Reusable email send script that logs to DB via Prisma.
 * Usage: npx tsx scripts/send-email.ts
 * 
 * Reads emails from /tmp/outbox.json (array of SendItem)
 * Sends via Resend API with rate limiting
 * Logs each send to email_logs with provider_message_id for webhook tracking
 * Creates activity records per account
 * 
 * /tmp/outbox.json format:
 * [{ "to": "email", "subject": "...", "body": "plain text", "accountName": "Company", "personaName": "Name" }]
 */

import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.FROM_NAME ?? 'Casey Larkin - YardFlow'} <${process.env.FROM_EMAIL ?? 'casey@yardflow.ai'}>`;
const RATE_LIMIT_MS = 6000; // 6 seconds between sends

// Banned domains - NEVER send
const BANNED_DOMAINS = ['dannon.com', 'danone.com', 'bluetriton.com', 'yardflow.ai'];

// Import the template wrapper inline (can't import ESM from scripts easily)
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

interface SendItem {
  to: string;
  subject: string;
  body: string;
  accountName: string;
  personaName?: string;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const fs = await import('fs');
  const outboxPath = process.argv[2] || '/tmp/outbox.json';
  
  if (!fs.existsSync(outboxPath)) {
    console.error(`No outbox file found at ${outboxPath}`);
    process.exit(1);
  }

  const items: SendItem[] = JSON.parse(fs.readFileSync(outboxPath, 'utf-8'));
  console.log(`\nLoaded ${items.length} emails from ${outboxPath}`);

  const existingAccounts = new Set(
    (await prisma.account.findMany({ select: { name: true } })).map(a => a.name)
  );

  // Validate - check for banned domains and emdashes
  const validItems: SendItem[] = [];
  for (const item of items) {
    const domain = item.to.split('@')[1]?.toLowerCase();
    if (BANNED_DOMAINS.some(d => domain?.includes(d))) {
      console.log(`  SKIP (banned domain): ${item.to}`);
      continue;
    }
    if (item.body.includes('\u2014') || item.body.includes('\u2013')) {
      console.log(`  SKIP (contains em/en dash): ${item.to}`);
      continue;
    }
    if (item.body.includes(';')) {
      console.log(`  WARN (semicolons): ${item.to}`);
    }
    validItems.push(item);
  }

  console.log(`\nSending ${validItems.length} emails (${items.length - validItems.length} skipped)\n`);

  let sent = 0;
  let failed = 0;

  for (const item of validItems) {
    const html = wrapHtml(item.body, item.accountName);

    try {
      const { data, error } = await resend.emails.send({
        from: FROM,
        to: item.to,
        subject: item.subject,
        html,
        text: item.body,
      });

      if (error || !data?.id) {
        console.log(`  FAIL: ${item.to} - ${error?.message ?? 'no ID returned'}`);
        failed++;
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      // Log to DB
      await prisma.emailLog.create({
        data: {
          account_name: item.accountName,
          persona_name: item.personaName ?? null,
          to_email: item.to,
          subject: item.subject,
          body_html: html,
          status: 'sent',
          provider_message_id: data.id,
        },
      });

      // Create activity
      if (existingAccounts.has(item.accountName)) {
        await prisma.activity.create({
          data: {
            account_name: item.accountName,
            persona: item.personaName ?? null,
            activity_type: 'Email',
            outcome: `Email sent: "${item.subject}" to ${item.to}`,
            next_step: 'Monitor for open/reply - follow up in 3 days if no response',
            next_step_due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            owner: 'Casey',
            activity_date: new Date(),
          },
        }).catch(() => {}); // Activity logging is best-effort
      }

      sent++;
      console.log(`  SENT: ${item.to} (${item.accountName}) - ${data.id}`);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ERROR: ${item.to} - ${msg}`);
      failed++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`COMPLETE: ${sent} sent, ${failed} failed out of ${validItems.length}`);
  console.log(`${'='.repeat(60)}`);

  await prisma.$disconnect();
}

main().catch(console.error);
