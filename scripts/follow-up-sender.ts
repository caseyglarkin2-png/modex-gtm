// YardFlow Follow-Up Sender - A+ Standards
// Sends apology/olive branch follow-ups with correct branding

const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const TIER1 = ['dannon', 'frito', 'diageo', 'coca-cola', 'ab inbev', 'general mills', 'hormel', 'campbell', 'constellation'];

function isTier1(account: string) {
  return TIER1.some(t => account?.toLowerCase().includes(t));
}

// A+ Compliant HTML Template
function wrapHtml(body: string, toEmail: string) {
  const unsubUrl = 'https://modex-gtm.vercel.app/unsubscribe?email=' + encodeURIComponent(toEmail);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px;">
    <tr>
      <td>
        ${body}
      </td>
    </tr>
    <tr>
      <td style="padding-top: 24px; border-top: 1px solid #e5e5e5;">
        <strong style="color: #1a1a1a;">Casey Larkin</strong><br/>
        <span style="font-size: 14px; color: #333;">Business Development · YardFlow by FreightRoll</span><br/>
        <span style="font-size: 13px; color: #666; font-style: italic;">The yard network system — predictable throughput across every facility.</span><br/>
        <span style="font-size: 13px;">
          <a href="https://yardflow.ai" style="color: #00A67E;">yardflow.ai</a> · 
          <a href="https://yardflow.ai/roi" style="color: #00A67E;">ROI Calculator</a> · 
          <a href="https://calendly.com/casey-yardflow" style="color: #00A67E;">Book a Call</a>
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 16px; font-size: 11px; color: #999;">
        <a href="${unsubUrl}" style="color: #999;">Unsubscribe</a> · FreightRoll Inc. · Austin, TX
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Tier 1 personalization database
const TIER1_INSIGHTS: Record<string, { insight: string }> = {
  'general mills': {
    insight: "30+ US plants, the Blue Buffalo cold chain layer, and the pet food DC network running on different velocity profiles than your legacy cereal lines. That's where the yard becomes the hidden bottleneck between WMS and TMS."
  },
  'frito-lay': {
    insight: "high-velocity snack distribution with razor-thin delivery windows. Your DSD network sees more trailer turns per day than most CPG companies see per week."
  },
  'frito': {
    insight: "high-velocity snack distribution with razor-thin delivery windows. Your DSD network sees more trailer turns per day than most CPG companies see per week."
  },
  'pepsico': {
    insight: "high-velocity snack distribution with razor-thin delivery windows. Your DSD network sees more trailer turns per day than most CPG companies see per week."
  },
  'campbell': {
    insight: "after the Sovos acquisition, you're now running shelf-stable and fresh on the same yard infrastructure. That's a complexity multiplier most WMS can't see."
  },
  'coca-cola': {
    insight: "your bottler network has incredible volume but inconsistent yard visibility across franchises. That's recoverable throughput."
  },
  'diageo': {
    insight: "spirits distribution has unique compliance requirements that add dwell time most companies don't track. The yard is where controlled substances meet logistics."
  },
  'constellation': {
    insight: "beer and wine distribution with seasonal demand spikes that stress yard capacity. Your peak periods probably hide 20%+ dwell time inflation."
  },
  'hormel': {
    insight: "protein processing with cold chain requirements across multiple product lines. The yard is where temperature compliance meets throughput."
  },
  'ab inbev': {
    insight: "brewery logistics at scale with cross-dock complexity. Your yard is essentially a traffic control system for trailers worth $50K+ each."
  },
  'dannon': {
    insight: "dairy cold chain with strict temperature requirements and rapid spoilage risk. Every minute of yard dwell is a freshness risk."
  }
};

// Tier 2 template - efficient but personal
function tier2Body(firstName: string, company: string) {
  const name = firstName || '';
  return `<p>${name ? name + ',' : 'Hi,'}</p>
<p>My earlier note may not have reached you — we resolved a technical issue on our end last week.</p>
<p>Short version: YardFlow maps the 15-20% of dwell time that lives between gate and dock — the part WMS and TMS don't see.</p>
<p>For a network like ${company}'s, that usually translates to $200K+ annually in recoverable throughput.</p>
<p>Would 15 minutes make sense to take a look?</p>
<p>Casey</p>`;
}

// Tier 1 template - highly personalized
function tier1Body(firstName: string, company: string) {
  const name = firstName || '';
  const companyLower = company.toLowerCase();
  const data = Object.entries(TIER1_INSIGHTS).find(([key]) => companyLower.includes(key))?.[1];

  if (!data) {
    return tier2Body(firstName, company);
  }

  return `<p>${name ? name + ',' : 'Hi,'}</p>
<p>My earlier note may not have reached you — we resolved a technical issue on our end last week.</p>
<p>Quick context: I've been studying yard throughput patterns across CPG distribution networks.</p>
<p>For ${company} specifically, the complexity caught my attention — ${data.insight}</p>
<p>Would 15 minutes make sense to see if the math applies?</p>
<p>Casey</p>`;
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
    )
    SELECT i.*
    FROM initial_emails i
    LEFT JOIN already_followed f ON i.to_email = f.to_email
    WHERE f.to_email IS NULL
    ORDER BY i.account_name, i.sent_at ASC
  `;

  if (tierFilter === '1') {
    candidates = candidates.filter(c => isTier1(c.account_name));
  } else if (tierFilter === '2') {
    candidates = candidates.filter(c => !isTier1(c.account_name));
  }

  candidates = candidates.slice(0, batchSize);

  console.log(`Sending ${candidates.length} follow-ups (Tier: ${tierFilter})...`);
  console.log('');

  let sent = 0, failed = 0;
  const results = { tier1: 0, tier2: 0 };

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const firstName = c.persona_name?.split(' ')[0] || '';
    const tier1 = isTier1(c.account_name);
    const body = tier1 ? tier1Body(firstName, c.account_name) : tier2Body(firstName, c.account_name);
    const subject = 'Re: ' + c.subject;

    try {
      const result = await resend.emails.send({
        from: 'Casey Larkin <casey@yardflow.ai>',
        to: c.to_email,
        subject: subject,
        html: wrapHtml(body, c.to_email),
        reply_to: 'casey@yardflow.ai',
        headers: c.provider_message_id ? {
          'In-Reply-To': c.provider_message_id,
          'References': c.provider_message_id
        } : {}
      });

      if (result.error) {
        console.log(`❌ ${i+1}. ${c.account_name} | ${c.to_email} | ERROR: ${(result.error as any).message}`);
        failed++;
      } else {
        await prisma.emailLog.create({
          data: {
            account_name: c.account_name,
            persona_name: c.persona_name || 'Unknown',
            to_email: c.to_email,
            subject: subject,
            body_html: body,
            status: 'sent',
            sent_at: new Date(),
            provider_message_id: result.data?.id
          }
        });

        const tierLabel = tier1 ? 'T1' : 'T2';
        console.log(`✅ ${String(i+1).padStart(2)}. [${tierLabel}] ${c.account_name.padEnd(22)} | ${c.to_email}`);
        sent++;
        if (tier1) results.tier1++; else results.tier2++;
      }
    } catch (e: any) {
      console.log(`❌ ${i+1}. ${c.account_name} | ERROR: ${e.message}`);
      failed++;
    }

    if (i < candidates.length - 1) await sleep(4000);
  }

  console.log('');
  console.log('═'.repeat(50));
  console.log('BATCH COMPLETE');
  console.log(`Sent: ${sent} | Failed: ${failed}`);
  console.log(`Tier 1: ${results.tier1} | Tier 2: ${results.tier2}`);
  console.log('═'.repeat(50));
}

main().catch(e => console.error('Fatal:', e)).finally(() => prisma.$disconnect());
