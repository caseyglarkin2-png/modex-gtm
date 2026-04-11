/**
 * Monday Morning Thread Bump Script
 * 
 * Pulls all campaign emails sent on Saturday, sends a short follow-up
 * in the same thread using In-Reply-To headers so it appears as a reply.
 * 
 * "Bumping this in case it got buried over the weekend" strategy.
 * 
 * Usage: RESEND_API_KEY=xxx npx tsx scripts/monday-bump.ts [--dry-run]
 * 
 * Flags:
 *   --dry-run    Generate bumps without sending (outputs to /tmp/monday-bumps.json)
 *   --batch N    Only process batch N (1-indexed, 25 per batch)
 *   --since DATE Override the cutoff date (default: last 48 hours)
 */

import { PrismaClient } from '@prisma/client';
import { firstNameFromEmail } from '../src/lib/contact-standard';
import { sendEmail } from '../src/lib/email/client';

const prisma = new PrismaClient();
const FROM = `${process.env.FROM_NAME ?? 'Casey Larkin - YardFlow'} <${process.env.FROM_EMAIL ?? 'casey@freightroll.com'}>`;
const RATE_LIMIT_MS = 6000;
const BATCH_SIZE = 25;

const BANNED_DOMAINS = ['dannon.com', 'danone.com', 'bluetriton.com', 'yardflow.ai'];
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';

// Short bump variants — MODEX-anchored, no "bumping/buried" language
const BUMP_BODIES = [
  (firstName: string) =>
`${firstName},

One more note. We'll be at MODEX April 13-16 in Atlanta — if you're attending, I'd love to connect.

If yard throughput is on your list at all, happy to do a 15-minute walkthrough at the show.`,

  (firstName: string) =>
`${firstName},

Floating this back in case timing is better now.

We're at MODEX April 13-16 in Atlanta. If any of this landed, I'd love to do a quick demo on the floor.`,

  (firstName: string) =>
`${firstName},

Still thinking about your yard. MODEX is two weeks out — if you're planning to be there, worth grabbing 15 minutes.

Happy to talk before the show too if that's easier.`,

  (firstName: string) =>
`${firstName},

We'll be at MODEX April 13-16 in Atlanta. The 15-minute demo on the floor tends to make the value obvious faster than an email can.

If yard operations is on your radar, let me know.`,

  (firstName: string) =>
`${firstName},

Last note on this before the show. We'll be at MODEX April 13-16 in Atlanta.

If yard throughput is something you're thinking about this year, happy to do a quick walkthrough. Five minutes is enough.`,
];

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

function wrapHtml(bodyText: string, accountName: string, toEmail?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
  const unsubUrl = toEmail ? `${baseUrl}/unsubscribe?email=${encodeURIComponent(toEmail)}` : `${baseUrl}/unsubscribe`;
  const escaped = bodyText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 14px 0; padding:0;">')
    .replace(/\n/g, '<br />');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title></title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;">
<tr><td style="padding:32px 24px 24px;color:#1a1a1a;font-size:15px;line-height:1.75;letter-spacing:-0.01em;">
<p style="margin:0 0 14px 0;padding:0;">${escaped}</p></td></tr>
<tr><td style="padding:0 24px 32px;">
<table cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #e0e0e0;padding-top:16px;width:100%;">
<tr><td style="padding-top:16px;">
<p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1a1a1a;">Casey Larkin</p>
<p style="margin:0 0 10px;font-size:13px;color:#6b7280;">GTM Lead · <span style="color:#0e7490;font-weight:600;">Yard</span><span style="font-weight:600;color:#1a1a1a;">Flow</span> by FreightRoll</p>
<p style="margin:0 0 10px;font-size:12px;color:#9ca3af;font-style:italic;">The First Yard Network System. Deterministic throughput across every facility.</p>
<p style="margin:0;font-size:12px;">
<a href="https://yardflow.ai" style="color:#0e7490;text-decoration:none;font-weight:500;">yardflow.ai</a>
<span style="color:#d1d5db;margin:0 6px;">|</span>
<a href="https://yardflow.ai/roi" style="color:#0e7490;text-decoration:none;font-weight:500;">Run ROI</a>
<span style="color:#d1d5db;margin:0 6px;">|</span>
<a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW" style="color:#0e7490;text-decoration:none;font-weight:500;">Book a Network Audit</a></p>
</td></tr></table></td></tr>
<tr><td style="padding:0 24px 24px;border-top:1px solid #f0f0f0;">
<p style="margin:8px 0 0;font-size:10px;color:#9ca3af;line-height:1.5;">
FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104<br/>
<a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
</p>
</td></tr>
</table></body></html>`;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const fs = await import('fs');
  
  const isDryRun = process.argv.includes('--dry-run');
  const batchIdx = process.argv.indexOf('--batch');
  const targetBatch = batchIdx !== -1 ? parseInt(process.argv[batchIdx + 1]) : null;
  const sinceIdx = process.argv.indexOf('--since');
  const sinceDate = sinceIdx !== -1 
    ? new Date(process.argv[sinceIdx + 1]) 
    : new Date(Date.now() - 48 * 60 * 60 * 1000); // default: last 48 hours

  console.log('=== Monday Morning Thread Bump ===\n');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE SEND'}`);
  console.log(`Looking for emails sent since: ${sinceDate.toISOString()}`);

  // Pull all campaign emails sent since cutoff that have a provider_message_id
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

  console.log(`Found ${campaignEmails.length} emails to bump\n`);

  if (campaignEmails.length === 0) {
    console.log('Nothing to bump. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Filter out bounced emails (check if any have been marked as bounced via webhook)
  const bouncedEmails = await prisma.emailLog.findMany({
    where: {
      to_email: { in: campaignEmails.map(e => e.to_email) },
      status: { in: ['bounced', 'complained'] },
    },
    select: { to_email: true },
  });
  const bouncedSet = new Set(bouncedEmails.map(e => e.to_email));

  const unsubscribedEmails = await prisma.unsubscribedEmail.findMany({
    where: { email: { in: campaignEmails.map(e => e.to_email) } },
    select: { email: true },
  });
  const unsubscribedSet = new Set(unsubscribedEmails.map(e => e.email));

  const eligible = campaignEmails.filter(e => {
    const domain = e.to_email.split('@')[1]?.toLowerCase();
    if (BANNED_DOMAINS.some(d => domain?.includes(d))) return false;
    if (bouncedSet.has(e.to_email)) return false;
    if (unsubscribedSet.has(e.to_email)) return false;
    return true;
  });

  console.log(`Eligible after bounce/ban/unsub filter: ${eligible.length}`);
  if (bouncedSet.size > 0) {
    console.log(`Excluded ${bouncedSet.size} bounced/complained addresses`);
  }
  if (unsubscribedSet.size > 0) {
    console.log(`Excluded ${unsubscribedSet.size} unsubscribed addresses`);
  }

  // Build bump items
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
      bumpVariant,
    };
  });

  // Batch them
  const totalBatches = Math.ceil(bumps.length / BATCH_SIZE);
  console.log(`Total batches: ${totalBatches} (${BATCH_SIZE} per batch)\n`);

  if (isDryRun) {
    // Write to file for review
    const outPath = '/tmp/monday-bumps.json';
    fs.writeFileSync(outPath, JSON.stringify(bumps, null, 2));
    console.log(`Dry run complete. ${bumps.length} bumps written to ${outPath}`);
    console.log('\nSample bump:');
    console.log(`  TO: ${bumps[0].to}`);
    console.log(`  SUBJECT: ${bumps[0].subject}`);
    console.log(`  REPLY-TO MSG: ${bumps[0].originalMessageId}`);
    console.log(`  BODY:\n${bumps[0].body}`);
    await prisma.$disconnect();
    return;
  }

  // Send
  let sent = 0;
  let failed = 0;

  for (let b = 0; b < totalBatches; b++) {
    const batchNum = b + 1;
    if (targetBatch && batchNum !== targetBatch) continue;

    const batch = bumps.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    console.log(`\n--- Batch ${batchNum}/${totalBatches} (${batch.length} emails) ---`);

    for (const bump of batch) {
      const html = wrapHtml(bump.body, bump.accountName, bump.to);

      try {
        // Resend message ID format for In-Reply-To header
        const messageId = `<${bump.originalMessageId}@resend.dev>`;

        const result = await sendEmail({
          to: bump.to,
          replyTo: 'casey@freightroll.com',
          subject: bump.subject,
          html,
          text: bump.body,
          headers: {
            'In-Reply-To': messageId,
            'References': messageId,
            'List-Unsubscribe': `<${BASE_URL}/unsubscribe?email=${encodeURIComponent(bump.to)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        // Log to DB
        await prisma.emailLog.create({
          data: {
            account_name: bump.accountName,
            persona_name: bump.personaName || null,
            to_email: bump.to,
            subject: bump.subject,
            body_html: html,
            status: 'sent',
            provider_message_id: result.headers['x-message-id'] || null,
          },
        });

        sent++;
        console.log(`  BUMP: ${bump.to} (${bump.accountName}) - ${result.headers['x-message-id'] || 'gmail'}`);

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`  ERROR: ${bump.to} - ${msg}`);
        failed++;
      }

      await sleep(RATE_LIMIT_MS);
    }

    console.log(`  Batch ${batchNum} complete: ${batch.length} processed`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`COMPLETE: ${sent} bumps sent, ${failed} failed`);
  console.log(`${'='.repeat(60)}`);

  await prisma.$disconnect();
}

main().catch(console.error);
