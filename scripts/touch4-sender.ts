// YardFlow Touch 4 — Personalized MODEX Close + Primo Brands Reference
// Architecture:
//   TIER1: hardcoded custom copy for named executives (may or may not be in DB)
//   BROAD: DB query for T3 recipients who haven't received a fresh (non-Re:) email yet
//
// Usage:
//   BATCH_SIZE=50 OFFSET=0 npx ts-node scripts/touch4-sender.ts
//   DRY_RUN=1 npx ts-node scripts/touch4-sender.ts          (preview, no sends)
//   DRY_RUN=1 TIER1_ONLY=1 npx ts-node scripts/touch4-sender.ts  (Tier 1 preview only)

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const DRY_RUN = process.env.DRY_RUN === '1';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';
const BLOCKED_DOMAINS = ['bluetriton.com', 'homedepot.com', 'fedex.com', 'johndeere.com', 'niagarawater.com', 'kencogroup.com', 'heb.com'];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — Custom copy per named executive
// ─────────────────────────────────────────────────────────────────────────────

interface Tier1Send {
  to: string;
  firstName: string;
  accountName: string;
  subject: string;
  bodyParagraphs: string[];
}

const TIER1_SENDS: Tier1Send[] = [
  {
    to: 'paul.gallagher@genmills.com',
    firstName: 'Paul',
    accountName: 'General Mills',
    subject: 'General Mills yard — the gap in the digital twin',
    bodyParagraphs: [
      'Paul,',
      "You've built end-to-end visibility at General Mills. Palantir on demand and supply, warehouse automation at multiple locations, a new DC in Belvidere.",
      "There's one piece that isn't covered. Between your TMS and your WMS is a yard that none of those systems see in real time. That's where dock appointments slip, trailers queue, and throughput gets lost.",
      "With 3 Missouri plants consolidating, your remaining facilities are absorbing more volume right now. Primo Brands (fka Nestle Waters) will be at MODEX with us on Tuesday, April 14. They moved from Kaleris to YardFlow across every facility. They're the Shipper of Choice benchmark most of your carrier network aspires to.",
      'Worth 15 minutes?',
      'Casey',
    ],
  },
  {
    to: 'elito.siqueira@ab-inbev.com',
    firstName: 'Elito',
    accountName: 'AB InBev',
    subject: 'After 85% touchless — what happens at the gate?',
    bodyParagraphs: [
      'Elito,',
      "You've hit 85% touchless planning in US demand. That's exceptional.",
      "The question your team faces now is what happens when a planned load actually hits the gate. Sensolus tells your team where the trailers are. YardFlow tells them how to move them faster. It's the execution layer between your planning transformation and your dock throughput.",
      'Primo Brands (fka Nestle Waters) will be at MODEX with us on Tuesday, April 14. They moved from Kaleris to YardFlow across all their facilities. Worth 15 minutes on the floor?',
      'Casey',
    ],
  },
  {
    to: 'kelly.killingsworth@kdrp.com',
    firstName: 'Kelly',
    accountName: 'Keurig Dr Pepper',
    subject: 'KDP yard ops: DSD depots and warehouse in one view',
    bodyParagraphs: [
      'Kelly,',
      'The DSD side of KDP lives on fixed morning departure windows. Each depot is a high-frequency operation where dock scheduling cascades. One late trailer backs up the whole day.',
      "Most YMS tools were built for warehouse distribution. We built YardFlow for both. DSD depots where every minute counts, plus warehouse DCs on a completely different schedule. One system, not two.",
      'Primo Brands (fka Nestle Waters) will be at MODEX with us on Tuesday, April 14. They moved from Kaleris to YardFlow across every facility. Worth 15 minutes?',
      'Casey',
    ],
  },
  {
    to: 'john.kester@cbrands.com',
    firstName: 'John',
    accountName: 'Constellation Brands',
    subject: 'Constellation: Laredo yard throughput',
    bodyParagraphs: [
      'John,',
      "The Laredo receiving yards are unlike anything else in beverage logistics. Thousands of truckloads a week crossing at the border, staged for US distribution while compliance clears. Time sitting in a yard at $35,000 per truckload isn't a logistics cost. It's a margin problem.",
      'We built YardFlow for exactly this kind of cross-border staging and dock assignment complexity. Real-time yard visibility tied directly to dock assignment and status.',
      "We're at MODEX April 13-16 in Atlanta. Worth 15 minutes?",
      'Casey',
    ],
  },
  {
    to: 'claudio.parrotta@mdlz.com',
    firstName: 'Claudio',
    accountName: 'Mondelez',
    subject: 'Mondelez: where Halloween throughput gets tested',
    bodyParagraphs: [
      'Claudio,',
      "Oreo and Ritz aren't difficult supply chains until October hits. Halloween triples inbound volume for a 6-week window. The plants can handle it. The yard often can't.",
      "When you're running 3x the usual trailer traffic into a facility, the yard becomes the bottleneck before the dock does. That gap between TMS and WMS is where throughput gets lost and detention gets billed.",
      'Primo Brands (fka Nestle Waters) will be at MODEX with us on Tuesday, April 14. They moved from Kaleris to YardFlow at every facility. Worth 15 minutes?',
      'Casey',
    ],
  },
  {
    to: 'dan_poland@campbells.com',
    firstName: 'Dan',
    accountName: "Campbell's",
    subject: "Maxton, Napoleon, and what comes after Tualatin",
    bodyParagraphs: [
      'Dan,',
      "The Maxton investment is the biggest single-facility bet Campbell's has made in over two decades. $150M, 100 new jobs, and more inbound volume than the facility has ever seen.",
      "That kind of capacity increase only pays off if the yard can move trailers as fast as the line can process them. When you're simultaneously absorbing Tualatin volume and ramping Maxton, the dock is where transformation either lands or gets stuck.",
      "We're at MODEX April 13-16. Primo Brands (fka Nestle Waters) is joining us on Tuesday, April 14. They moved from Kaleris to YardFlow at every facility. Worth 15 minutes?",
      'Casey',
    ],
  },
  {
    to: 'cassandra_green@campbells.com',
    firstName: 'Cassandra',
    accountName: "Campbell's",
    subject: "Campbell's yard ops: Maxton capacity absorption",
    bodyParagraphs: [
      'Cassandra,',
      "Wanted to reach out directly given your focus on the Campbell's supply chain network.",
      "The Maxton investment is the biggest Campbell's has made at a single facility in over two decades. When you're simultaneously adding workers and dramatically increasing trailer traffic, the yard is where throughput either keeps pace with the new capacity or becomes the new bottleneck. The Napoleon facility is absorbing the Tualatin volume on top of that.",
      'Primo Brands (fka Nestle Waters) will be joining us at MODEX on Tuesday, April 14. They moved from Kaleris to YardFlow across every facility. Worth 15 minutes to see if the math fits the Campbell\'s footprint?',
      'Casey',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getVertical(accountName: string): string {
  const n = (accountName || '').toLowerCase();
  if (/food|bev|drink|dairy|snack|cereal|beverage|brewery|wine|spirit|beer/.test(n)) return 'food_bev';
  if (/cpg|consumer|retail|grocery|supermarket|apparel|cosmetic/.test(n)) return 'cpg_retail';
  if (/auto|motor|vehicle|aerospace|defense|aircraft/.test(n)) return 'auto_heavy';
  if (/pharma|biotech|medical|drug|life science/.test(n)) return 'pharma';
  if (/3pl|logistics|warehouse|distribution|wholesale|fulfillment/.test(n)) return 'distribution';
  return 'general_mfg';
}

function isBlocked(email: string) {
  return BLOCKED_DOMAINS.some(d => email?.toLowerCase().includes(d));
}

function wrapHtml(paragraphs: string[], toEmail: string): string {
  const unsubUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`;
  const bodyHtml = paragraphs
    .map(p => `<p style="margin:0 0 14px 0;">${p}</p>`)
    .join('\n  ');
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
  ${bodyHtml}
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

function toPlainText(paragraphs: string[]): string {
  return paragraphs.join('\n\n') + '\n\n--\nCasey Larkin\nGTM Lead, YardFlow by FreightRoll\nhttps://yardflow.ai\n\nFreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104';
}

function listUnsubHeaders(email: string): Record<string, string> {
  const url = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Broad T4 copy — vertical-based, Primo hook for F&B/CPG
// ─────────────────────────────────────────────────────────────────────────────

function broadT4Body(firstName: string, accountName: string, vertical: string): string[] {
  const name = firstName ? `${firstName},` : 'Hi,';

  const primoLine =
    'Primo Brands (fka Nestle Waters) will be at MODEX with us on Tuesday, April 14. They moved from Kaleris to YardFlow across every facility and became the Shipper of Choice benchmark. Worth 15 minutes?';

  switch (vertical) {
    case 'food_bev':
      return [
        name,
        `Cold chain yard ops at ${accountName || 'your scale'} run a different clock than dry freight. Temperature-sensitive trailers can't queue for 45 minutes waiting on dock assignments. Gate-to-dock timing is a product quality decision, not just a scheduling one.`,
        primoLine,
        'Casey',
      ];

    case 'cpg_retail':
      return [
        name,
        `Retailer on-time compliance starts in the yard, not at the dock door. The appointment window you promised starts counting the moment a trailer hits the gate. Most CPG teams don't see that gap until a chargeback shows up.`,
        primoLine,
        'Casey',
      ];

    case 'auto_heavy':
      return [
        name,
        `Gate-to-dock JIT sequencing is where manufacturing yard ops either support the line or slow it down. When a parts trailer hits the gate, the dock assignment should be done before the driver walks in.`,
        `We're at MODEX April 13-16 in Atlanta. Ten minutes on the floor?`,
        'Casey',
      ];

    case 'pharma':
      return [
        name,
        `GDP compliance starts in the yard. Every gate entry, every dock move, every dwell interval needs a timestamped audit trail. Most yard operations can't produce that on demand.`,
        `We're at MODEX April 13-16. Ten minutes to see the audit trail demo?`,
        'Casey',
      ];

    case 'distribution':
      return [
        name,
        `For distribution operations, the 30 minutes before peak shift is where the day is won or lost. Every trailer status, every dock assignment, in one view before the first driver walks in.`,
        primoLine,
        'Casey',
      ];

    default:
      return [
        name,
        `One last note before MODEX. If yard throughput is something your team is looking at this year, we're at the show April 13-16 in Atlanta. Ten minutes on the floor?`,
        'Casey',
      ];
  }
}

function broadT4Subject(accountName: string, vertical: string): string {
  switch (vertical) {
    case 'food_bev':      return 'Primo Brands at MODEX Tuesday: 15 minutes?';
    case 'cpg_retail':    return 'MODEX April 13: Primo Brands on yard ops';
    case 'auto_heavy':    return 'MODEX: gate-to-dock sequencing for manufacturing';
    case 'pharma':        return 'MODEX: GDP-compliant yard audit trails';
    case 'distribution':  return 'MODEX: yard visibility for distribution ops';
    default:              return 'MODEX April 13-16: worth 15 minutes?';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  paragraphs: string[],
  accountName: string,
  label: string
): Promise<boolean> {
  if (DRY_RUN) {
    console.log(`[DRY RUN] ${label} | ${to} | "${subject}"`);
    console.log('  Body preview:', paragraphs.slice(0, 2).join(' ').slice(0, 100));
    return true;
  }

  const htmlContent = wrapHtml(paragraphs, to);
  const result = await resend.emails.send({
    from: 'Casey Larkin <casey@freightroll.com>',
    to,
    subject,
    html: htmlContent,
    text: toPlainText(paragraphs),
    reply_to: 'casey@freightroll.com',
    headers: listUnsubHeaders(to),
  });

  if (result.error) {
    console.log(`❌ ${label} | ${to} | ${(result.error as any).message}`);
    return false;
  }

  await prisma.emailLog.create({
    data: {
      account_name: accountName,
      persona_name: to.split('@')[0],
      to_email: to,
      subject,
      body_html: htmlContent,
      status: 'sent',
      sent_at: new Date(),
      provider_message_id: result.data?.id,
    },
  });
  return true;
}

async function main() {
  const batchSize = parseInt(process.env.BATCH_SIZE || '50');
  const offset = parseInt(process.env.OFFSET || '0');
  const sendBroad = process.env.TIER1_ONLY !== '1';

  console.log(`\nTouch 4 | DRY_RUN=${DRY_RUN} | BATCH_SIZE=${batchSize} | OFFSET=${offset} | BROAD=${sendBroad}\n`);

  // ── Load unsubscribed emails ──────────────────────────────────────────────
  const unsubscribedRows = await prisma.unsubscribedEmail.findMany({ select: { email: true } });
  const unsubSet = new Set(unsubscribedRows.map((r: { email: string }) => r.email.toLowerCase()));

  // ── TIER1 sends ───────────────────────────────────────────────────────────
  console.log('───── TIER 1 CUSTOM SENDS ─────');
  let tier1Sent = 0, tier1Skipped = 0;

  for (const s of TIER1_SENDS) {
    if (unsubSet.has(s.to.toLowerCase())) {
      console.log(`⏭  UNSUB  | ${s.to}`);
      tier1Skipped++;
      continue;
    }
    if (isBlocked(s.to)) {
      console.log(`⏭  BLOCKED| ${s.to}`);
      tier1Skipped++;
      continue;
    }

    // Check if already sent (same subject to same address)
    const alreadySent = await prisma.emailLog.findFirst({
      where: { to_email: s.to, subject: s.subject },
    });
    if (alreadySent) {
      console.log(`⏭  DUPE   | ${s.to} | already sent "${s.subject}"`);
      tier1Skipped++;
      continue;
    }

    const ok = await sendEmail(s.to, s.subject, s.bodyParagraphs, s.accountName, `T4:TIER1 ${s.accountName}`);
    if (ok) {
      console.log(`✅ T4:TIER1 | ${s.accountName.padEnd(20)} | ${s.to}`);
      tier1Sent++;
    }

    if (tier1Sent > 0 || tier1Skipped < TIER1_SENDS.length - 1) {
      await sleep(8000);
    }
  }

  console.log(`\nTier 1 done: sent=${tier1Sent} skipped=${tier1Skipped}`);

  if (!sendBroad) {
    console.log('TIER1_ONLY=1 — skipping broad send.');
    return;
  }

  // ── BROAD T4 — T3 recipients not yet touched with a fresh email ───────────
  console.log('\n───── BROAD T4 SENDS ─────');

  const tier1Emails = new Set(TIER1_SENDS.map(s => s.to.toLowerCase()));

  // Touch 4 = got a Re: email (T2 or T3) AND has NOT received any non-Re: email since 2026-03-28
  // T4 identification:
  //   "Got a Re: (T2/T3) but has NOT received a non-Re: email AFTER their most recent Re: email"
  //   This correctly excludes T1 (which is non-Re: but predates their T3) while catching
  //   any contact who already received a fresh T4 message.
  const candidates: any[] = await prisma.$queryRaw`
    WITH last_re AS (
      SELECT DISTINCT ON (to_email)
        to_email, account_name, persona_name, sent_at AS last_re_at
      FROM email_logs
      WHERE subject LIKE 'Re:%'
        AND status IN ('delivered', 'sent')
        AND to_email NOT LIKE '%freightroll%'
        AND to_email NOT LIKE '%yardflow%'
      ORDER BY to_email, sent_at DESC
    ),
    touch4_sent AS (
      SELECT DISTINCT l1.to_email
      FROM email_logs l1
      JOIN last_re lr ON l1.to_email = lr.to_email
      WHERE l1.subject NOT LIKE 'Re:%'
        AND l1.status IN ('delivered', 'sent')
        AND l1.sent_at > lr.last_re_at
    ),
    unsubs AS (
      SELECT email FROM unsubscribed_emails
    )
    SELECT lr.*
    FROM last_re lr
    LEFT JOIN touch4_sent t4 ON lr.to_email = t4.to_email
    LEFT JOIN unsubs u ON lr.to_email = u.email
    WHERE t4.to_email IS NULL
      AND u.email IS NULL
    ORDER BY lr.account_name
    OFFSET ${offset}
    LIMIT ${batchSize}
  `;

  const clean = candidates.filter(c =>
    !isBlocked(c.to_email) &&
    !tier1Emails.has(c.to_email.toLowerCase())
  );

  console.log(`Found ${candidates.length} broad candidates, ${clean.length} after filtering\n`);

  let broadSent = 0, broadFailed = 0;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    const firstName = c.persona_name?.split(' ')[0] || '';
    const vertical = getVertical(c.account_name);
    const paragraphs = broadT4Body(firstName, c.account_name, vertical);
    const subject = broadT4Subject(c.account_name, vertical);

    try {
      const ok = await sendEmail(c.to_email, subject, paragraphs, c.account_name, `T4:${vertical.padEnd(12)}`);
      if (ok) {
        console.log(`✅ ${String(offset + i + 1).padStart(3)}. [T4:${vertical.padEnd(12)}] ${(c.account_name || '').padEnd(20)} | ${c.to_email}`);
        broadSent++;
      } else {
        broadFailed++;
      }
    } catch (e: any) {
      console.log(`❌ ${offset + i + 1}. ${c.account_name} | ERROR: ${e.message}`);
      broadFailed++;
    }

    if (i < clean.length - 1) await sleep(8000);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TOUCH 4 COMPLETE`);
  console.log(`  Tier 1: sent=${tier1Sent} skipped=${tier1Skipped}`);
  console.log(`  Broad:  sent=${broadSent} failed=${broadFailed}`);
  console.log(`  Next broad batch: OFFSET=${offset + batchSize} BATCH_SIZE=${batchSize}`);
  console.log('═'.repeat(60));
}

main()
  .catch(e => console.error('Fatal:', e))
  .finally(() => prisma.$disconnect());
