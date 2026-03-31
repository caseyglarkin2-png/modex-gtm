// YardFlow Touch 3 Sender — MODEX Urgency Close
// Sends to contacts who got Touch 2 (Re:) but no Touch 3 yet
// Usage: BATCH_SIZE=75 OFFSET=0 npx ts-node scripts/touch3-sender.ts

const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';
const BLOCKED_DOMAINS = ['bluetriton.com', 'homedepot.com', 'fedex.com', 'johndeere.com', 'niagarawater.com', 'kencogroup.com', 'heb.com'];

function getVertical(accountName: string): string {
  const name = (accountName || '').toLowerCase();
  if (/food|bev|drink|dairy|snack|cereal|beverage|brewery|wine|spirit|beer/.test(name)) return 'food_bev';
  if (/cpg|consumer|retail|grocery|supermarket|apparel|cosmetic/.test(name)) return 'cpg_retail';
  if (/auto|motor|vehicle|aerospace|defense|aircraft/.test(name)) return 'auto_heavy';
  if (/pharma|biotech|medical|drug|life science/.test(name)) return 'pharma';
  if (/3pl|logistics|warehouse|distribution|wholesale|fulfillment/.test(name)) return 'distribution';
  return 'general_mfg';
}

function isBlocked(email: string) {
  return BLOCKED_DOMAINS.some(d => email?.toLowerCase().includes(d));
}

// Canonical HTML wrapper
function wrapHtml(body: string, accountName: string, toEmail: string) {
  const unsubUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title></title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#fff;margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;">
<tr><td style="padding:32px 24px 24px;color:#1a1a1a;font-size:15px;line-height:1.75;letter-spacing:-0.01em;">
  ${body}
</td></tr>
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
      <a href="${BOOKING_LINK}" style="color:#0e7490;text-decoration:none;font-weight:500;">Book a Network Audit</a>
    </p>
  </td></tr></table>
</td></tr>
<tr><td style="padding:0 24px 24px;border-top:1px solid #f0f0f0;">
  <p style="margin:8px 0 0;font-size:10px;color:#9ca3af;line-height:1.5;">
    FreightRoll Inc. · Austin, TX 78701<br/>
    <a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
  </p>
</td></tr>
</table>
</body>
</html>`;
}

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi,'\n').replace(/<\/p>\s*<p[^>]*>/gi,'\n\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\n{3,}/g,'\n\n').trim();
}

function listUnsubHeaders(email: string): Record<string, string> {
  const url = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
  return { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
}

// Touch 3: Short, MODEX-anchored, different angle from Touch 2
// Touch 2 was question-forward ("How does X track...?")
// Touch 3 is demo-forward ("The demo that lands with [vertical] teams is X. Floor at MODEX?")
function touch3Body(firstName: string, company: string, vertical: string): string {
  const name = firstName ? `${firstName},` : 'Hi,';

  switch (vertical) {
    case 'food_bev':
      return `<p style="margin:0 0 14px 0;">${name}</p>
<p style="margin:0 0 14px 0;">Last note before MODEX.</p>
<p style="margin:0 0 14px 0;">The demo that resonates most with food ops teams is cold chain visibility from gate to dock — every trailer, every temp status, every minute. No manual checks, no blind spots.</p>
<p style="margin:0 0 14px 0;">We'll be at the show April 13-16 in Atlanta. Ten minutes on the floor?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    case 'cpg_retail':
      return `<p style="margin:0 0 14px 0;">${name}</p>
<p style="margin:0 0 14px 0;">Last note before MODEX.</p>
<p style="margin:0 0 14px 0;">For CPG teams, the number that usually surprises is how much dock appointment compliance is determined by what happens in the yard before the trailer ever reaches the door.</p>
<p style="margin:0 0 14px 0;">We'll be at the show April 13-16 in Atlanta. Ten minutes on the floor?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    case 'auto_heavy':
      return `<p style="margin:0 0 14px 0;">${name}</p>
<p style="margin:0 0 14px 0;">Last note before MODEX.</p>
<p style="margin:0 0 14px 0;">Gate-to-dock JIT sequencing is the demo that lands hardest with manufacturing teams. We show you the yard map, a parts trailer hits the gate, and the dock assignment is automated before the driver walks in.</p>
<p style="margin:0 0 14px 0;">We'll be at the show April 13-16 in Atlanta. Ten minutes on the floor?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    case 'pharma':
      return `<p style="margin:0 0 14px 0;">${name}</p>
<p style="margin:0 0 14px 0;">Last note before MODEX.</p>
<p style="margin:0 0 14px 0;">The audit trail demo is the one pharma ops teams tend to want to see twice — every gate entry, every dock move, every dwell interval, timestamped and searchable. GDP compliance starts in the yard.</p>
<p style="margin:0 0 14px 0;">We'll be at the show April 13-16. Ten minutes on the floor?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    case 'distribution':
      return `<p style="margin:0 0 14px 0;">${name}</p>
<p style="margin:0 0 14px 0;">Last note before MODEX.</p>
<p style="margin:0 0 14px 0;">For distribution teams, we usually start by showing what the yard looks like 30 minutes before your peak shift starts — every trailer, status, and dock assignment in one view. It's the part of the operation most teams have never actually seen.</p>
<p style="margin:0 0 14px 0;">We'll be at the show April 13-16. Ten minutes on the floor?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    default: // industrial, general_mfg
      return `<p style="margin:0 0 14px 0;">${name}</p>
<p style="margin:0 0 14px 0;">Last note from me on this.</p>
<p style="margin:0 0 14px 0;">If yard operations isn't on your radar right now, I understand — not every conversation has perfect timing.</p>
<p style="margin:0 0 14px 0;">If it is, we'll be at MODEX April 13-16 in Atlanta. Ten minutes on the floor?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;
  }
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const batchSize = parseInt(process.env.BATCH_SIZE || '75');
  const offset = parseInt(process.env.OFFSET || '0');

  // Find contacts who got Touch 2 (one Re: email) but not Touch 3 (no second Re:)
  const candidates: any[] = await prisma.$queryRaw`
    WITH touch2 AS (
      SELECT DISTINCT ON (to_email)
        to_email, account_name, persona_name, subject, provider_message_id, sent_at
      FROM email_logs
      WHERE subject LIKE 'Re:%'
        AND status IN ('delivered', 'sent')
        AND to_email NOT LIKE '%freightroll%'
        AND to_email NOT LIKE '%yardflow%'
      ORDER BY to_email, sent_at DESC
    ),
    touch3_sent AS (
      SELECT DISTINCT l1.to_email
      FROM email_logs l1
      JOIN email_logs l2
        ON l1.to_email = l2.to_email
        AND l1.subject LIKE 'Re:%'
        AND l2.subject LIKE 'Re:%'
        AND l1.id != l2.id
    ),
    unsubs AS (
      SELECT email FROM unsubscribed_emails
    )
    SELECT t2.*
    FROM touch2 t2
    LEFT JOIN touch3_sent t3 ON t2.to_email = t3.to_email
    LEFT JOIN unsubs u ON t2.to_email = u.email
    WHERE t3.to_email IS NULL
      AND u.email IS NULL
    ORDER BY t2.account_name
    OFFSET ${offset}
    LIMIT ${batchSize}
  `;

  const clean = candidates.filter(c => !isBlocked(c.to_email));

  console.log(`\nTouch 3 Batch: offset=${offset}, size=${batchSize}`);
  console.log(`Found ${candidates.length} candidates, ${clean.length} after filtering\n`);

  let sent = 0, failed = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    const firstName = c.persona_name?.split(' ')[0] || '';
    const vertical = getVertical(c.account_name);
    const body = touch3Body(firstName, c.account_name, vertical);

    // Thread to the Touch 2 message
    const originalSubject = c.subject.replace(/^Re:\s*/i, '');
    const subject = `Re: ${originalSubject}`;

    try {
      const htmlContent = wrapHtml(body, c.account_name || 'the team', c.to_email);
      const result = await resend.emails.send({
        from: 'Casey Larkin <casey@yardflow.ai>',
        to: c.to_email,
        subject,
        html: htmlContent,
        text: stripHtml(body),
        reply_to: 'casey@freightroll.com',
        headers: {
          ...listUnsubHeaders(c.to_email),
          ...(c.provider_message_id ? {
            'In-Reply-To': c.provider_message_id,
            'References': c.provider_message_id
          } : {})
        }
      });

      if (result.error) {
        console.log(`❌ ${offset+i+1}. ${(c.account_name || '').padEnd(20)} | ${c.to_email} | ${(result.error as any).message}`);
        failed++;
      } else {
        await prisma.emailLog.create({
          data: {
            account_name: c.account_name || 'Unknown',
            persona_name: c.persona_name || 'Unknown',
            to_email: c.to_email,
            subject,
            body_html: body,
            status: 'sent',
            sent_at: new Date(),
            provider_message_id: result.data?.id
          }
        });
        console.log(`✅ ${String(offset+i+1).padStart(3)}. [T3:${vertical.padEnd(12)}] ${(c.account_name || '').padEnd(20)} | ${c.to_email}`);
        sent++;
      }
    } catch (e: any) {
      console.log(`❌ ${offset+i+1}. ${c.account_name} | ERROR: ${e.message}`);
      failed++;
    }

    if (i < clean.length - 1) await sleep(8000);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TOUCH 3 COMPLETE: Sent=${sent} Failed=${failed}`);
  console.log(`Next: OFFSET=${offset + batchSize} BATCH_SIZE=${batchSize}`);
  console.log('═'.repeat(60));
}

main().catch(e => console.error('Fatal:', e)).finally(() => prisma.$disconnect());
