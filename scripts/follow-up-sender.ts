// YardFlow Follow-Up Sender — A+ Standards v2
// Usage: TIER=all BATCH_SIZE=50 npx ts-node scripts/follow-up-sender.ts

const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';

const TIER1_ACCOUNTS = ['dannon', 'frito', 'diageo', 'coca-cola', 'ab inbev', 'general mills', 'hormel', 'campbell', 'constellation'];

function isTier1(account: string) {
  return TIER1_ACCOUNTS.some(t => account?.toLowerCase().includes(t));
}

function getVertical(accountName: string): string {
  const name = (accountName || '').toLowerCase();
  if (/food|bev|drink|dairy|snack|cereal|beverage|brewery|wine|spirit|beer/.test(name)) return 'food_bev';
  if (/cpg|consumer|retail|grocery|supermarket|apparel|cosmetic/.test(name)) return 'cpg_retail';
  if (/auto|motor|vehicle|aerospace|defense|aircraft/.test(name)) return 'auto_heavy';
  if (/pharma|biotech|medical|drug|life science/.test(name)) return 'pharma';
  if (/3pl|logistics|warehouse|distribution|wholesale|fulfillment/.test(name)) return 'distribution';
  if (/chemical|plastic|building|material|mining|metal|packaging|paper|oil|energy/.test(name)) return 'industrial';
  return 'general_mfg';
}

// Canonical HTML wrapper — color #0e7490, correct booking link, env-based unsubscribe URL
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
    FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104<br/>
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

// Tier 1 company-specific insight database — no fake numbers
const TIER1_INSIGHTS: Record<string, string> = {
  'general mills': "30+ US plants, the Blue Buffalo cold chain layer, and the pet food DC network running on different velocity profiles than your legacy cereal lines. That's where the yard becomes the hidden bottleneck between WMS and TMS.",
  'frito': "Running DSD at Frito-Lay's velocity means the yard isn't a parking lot — it's a live sequencing problem that resets dozens of times a day. That's where most of the recoverable throughput hides, and where most YMS tools fall apart.",
  'pepsico': "Running DSD at that velocity means the yard isn't a parking lot — it's a live sequencing problem that resets dozens of times a day. That's where most of the recoverable throughput hides.",
  'campbell': "After the Sovos acquisition you're now running shelf-stable and refrigerated on the same yard infrastructure. That's a complexity multiplier — two different velocity profiles, two different cold chain requirements, one yard team.",
  'coca-cola': "Your bottler network has incredible volume but inconsistent yard visibility across franchises. The throughput that's recoverable lives in those consistency gaps.",
  'diageo': "Spirits distribution has compliance requirements that add dwell time most operations don't track. The yard is where controlled-substance handling meets logistics throughput.",
  'constellation': "Beer and wine distribution with seasonal demand spikes that stress yard capacity. Your peak periods are where throughput variability is highest — and most recoverable.",
  'hormel': "Protein processing across refrigerated, shelf-stable, and foodservice lines means your yard is managing three cold chain profiles simultaneously. That's where sequencing complexity hides.",
  'ab inbev': "Brewery logistics at scale with cross-dock complexity. Your yard is essentially a real-time traffic control system for trailers moving on tight replenishment windows.",
  'dannon': "Dairy cold chain with strict temperature windows and rapid spoilage risk. Every untracked minute of yard dwell is a freshness risk that doesn't show up until it's too late.",
};

// Tier 2: vertical-aware, no fake ROI stats, question-forward
function tier2Body(firstName: string, company: string, vertical: string): string {
  const name = firstName ? `${firstName},` : 'Hi,';

  const apology = `<p style="margin:0 0 14px 0;">My earlier note may not have reached you — we resolved a technical issue on our end last week.</p>`;

  switch (vertical) {
    case 'food_bev':
      return `<p style="margin:0 0 14px 0;">${name}</p>${apology}
<p style="margin:0 0 14px 0;">How does ${company} track reefer dwell time in the yard right now? Most food operations don't have a clean answer — the yard is the one place where cold chain visibility goes dark.</p>
<p style="margin:0 0 14px 0;">That's the gap we close. Worth 15 minutes before MODEX?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    case 'cpg_retail':
      return `<p style="margin:0 0 14px 0;">${name}</p>${apology}
<p style="margin:0 0 14px 0;">When ${company} has trailers stacking up and retail appointment windows closing, how does the yard team prioritize?</p>
<p style="margin:0 0 14px 0;">That decision — made manually, dozens of times a day — is what determines whether you make the window or pay detention. Worth 15 minutes to see how we automate it?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    case 'auto_heavy':
      return `<p style="margin:0 0 14px 0;">${name}</p>${apology}
<p style="margin:0 0 14px 0;">When an inbound parts trailer hits ${company}'s gate, how long before the dock team knows it's there?</p>
<p style="margin:0 0 14px 0;">That gap is where JIT breaks down. We fix it with real-time gate-to-dock visibility — no hardware install, works on day one. Worth 15 minutes before MODEX?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    case 'pharma':
      return `<p style="margin:0 0 14px 0;">${name}</p>${apology}
<p style="margin:0 0 14px 0;">GDP compliance doesn't pause in the yard. When a temperature-sensitive trailer sits at the gate for four hours, that's audit exposure — and most teams don't have a timestamped record to show for it.</p>
<p style="margin:0 0 14px 0;">We give you that record. Worth 15 minutes before MODEX?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    case 'distribution':
      return `<p style="margin:0 0 14px 0;">${name}</p>${apology}
<p style="margin:0 0 14px 0;">In a cross-dock operation, the bottleneck usually isn't the sort — it's the 30 minutes between a trailer hitting the gate and anyone knowing it's ready to unload.</p>
<p style="margin:0 0 14px 0;">That dead window is where throughput leaks. It's also where we find the most room to recover. Worth 15 minutes?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;

    default: // industrial, general_mfg
      return `<p style="margin:0 0 14px 0;">${name}</p>${apology}
<p style="margin:0 0 14px 0;">If I asked ${company}'s dock team what's sitting in the yard right now, could they tell me in under 60 seconds?</p>
<p style="margin:0 0 14px 0;">At most sites the answer is no. That gap — between gate and dock awareness — is where throughput leaks hide. Worth 15 minutes before MODEX?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;
  }
}

function tier1Body(firstName: string, company: string): string {
  const name = firstName ? `${firstName},` : 'Hi,';
  const companyLower = company.toLowerCase();
  const insight = Object.entries(TIER1_INSIGHTS).find(([key]) => companyLower.includes(key))?.[1];

  if (!insight) return tier2Body(firstName, company, 'general_mfg');

  return `<p style="margin:0 0 14px 0;">${name}</p>
<p style="margin:0 0 14px 0;">My earlier note may not have reached you — we resolved a technical issue on our end last week.</p>
<p style="margin:0 0 14px 0;">For ${company} specifically, the complexity caught my attention — ${insight}</p>
<p style="margin:0 0 14px 0;">Would 15 minutes make sense to see if the math applies?</p>
<p style="margin:0 0 14px 0;">Casey</p>`;
}

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const batchSize = parseInt(process.env.BATCH_SIZE || '50');
  const tierFilter = process.env.TIER || 'all';
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  let candidates: any[] = await prisma.$queryRaw`
    WITH initial_emails AS (
      SELECT DISTINCT ON (to_email)
        id, to_email, persona_name, account_name, subject, provider_message_id, sent_at
      FROM email_logs
      WHERE status IN ('delivered', 'sent')
        AND sent_at < ${twoDaysAgo}
        AND subject NOT LIKE 'Re:%'
        AND subject NOT ILIKE '%apolog%'
        AND subject NOT ILIKE '%test%'
        AND subject NOT ILIKE '%technical issue%'
        AND subject != ''
        AND to_email NOT LIKE '%freightroll%'
      ORDER BY to_email, sent_at DESC
    ),
    already_followed AS (
      SELECT DISTINCT to_email
      FROM email_logs
      WHERE subject LIKE 'Re:%'
        OR subject ILIKE '%technical issue%'
    ),
    unsubs AS (
      SELECT email FROM unsubscribed_emails
    )
    SELECT i.*
    FROM initial_emails i
    LEFT JOIN already_followed f ON i.to_email = f.to_email
    LEFT JOIN unsubs u ON i.to_email = u.email
    WHERE f.to_email IS NULL
      AND u.email IS NULL
    ORDER BY i.account_name, i.sent_at ASC
  `;

  if (tierFilter === '1') {
    candidates = candidates.filter(c => isTier1(c.account_name));
  } else if (tierFilter === '2') {
    candidates = candidates.filter(c => !isTier1(c.account_name));
  }

  candidates = candidates.slice(0, batchSize);

  console.log(`\nSending ${candidates.length} follow-ups (Tier: ${tierFilter})...\n`);

  let sent = 0, failed = 0;
  const tierCounts: Record<string, number> = { T1: 0 };

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const firstName = c.persona_name?.split(' ')[0] || '';
    const tier1 = isTier1(c.account_name);
    const vertical = getVertical(c.account_name);
    const body = tier1 ? tier1Body(firstName, c.account_name) : tier2Body(firstName, c.account_name, vertical);
    const subject = 'Re: ' + c.subject;

    try {
      const htmlContent = wrapHtml(body, c.account_name || 'the team', c.to_email);
      const result = await resend.emails.send({
        from: 'Casey Larkin <casey@freightroll.com>',
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
        console.log(`❌ ${i+1}. ${(c.account_name || '').padEnd(22)} | ${c.to_email} | ERROR: ${(result.error as any).message}`);
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
        const tierLabel = tier1 ? 'T1' : `T2:${vertical}`;
        console.log(`✅ ${String(i+1).padStart(2)}. [${tierLabel.padEnd(16)}] ${(c.account_name || '').padEnd(22)} | ${c.to_email}`);
        sent++;
        tierCounts[tierLabel] = (tierCounts[tierLabel] || 0) + 1;
      }
    } catch (e: any) {
      console.log(`❌ ${i+1}. ${c.account_name} | ERROR: ${e.message}`);
      failed++;
    }

    if (i < candidates.length - 1) await sleep(8000);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('BATCH COMPLETE');
  console.log(`Sent: ${sent} | Failed: ${failed}`);
  console.log('Breakdown:', JSON.stringify(tierCounts, null, 2));
  console.log('═'.repeat(60));
}

main().catch(e => console.error('Fatal:', e)).finally(() => prisma.$disconnect());
