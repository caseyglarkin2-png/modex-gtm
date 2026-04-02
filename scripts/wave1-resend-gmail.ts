// Wave 1 Re-Send via Gmail API
// These 14 contacts bounced from casey@yardflow.ai on 3/27.
// They never received any email. Fresh subjects, fresh copy.
// Uses Gmail API (casey@freightroll.com) directly.
//
// Usage:
//   DRY_RUN=1 npx tsx scripts/wave1-resend-gmail.ts       (preview only)
//   npx tsx scripts/wave1-resend-gmail.ts                   (send for real)

import 'dotenv/config';

const DRY_RUN = process.env.DRY_RUN === '1';
const RATE_LIMIT_MS = 8000; // 8 seconds between sends

const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2UyZRVDBYFwV3QOTx7-WK4APujmADpAGspAqeR5qAmK4KJjN2P1QNIrsVj0SPO0qMZIWKzuPoW';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';

// ── Gmail API helpers (inline to avoid ESM import issues in scripts) ──────

function getGmailConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim(),
    userEmail: process.env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com',
  };
}

const FROM_EMAIL = 'casey@freightroll.com';
const FROM_NAME = 'Casey Larkin';

function base64Url(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMimeMessage(payload: { to: string; subject: string; html: string; plainText: string }): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    payload.plainText,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    payload.html,
    `--${boundary}--`,
  ];
  return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`;
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getGmailConfig();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in .env.local');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json() as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || 'Failed to get access token');
  }
  return data.access_token;
}

async function sendViaGmail(to: string, subject: string, html: string, plainText: string): Promise<string | null> {
  const { userEmail } = getGmailConfig();
  const accessToken = await getAccessToken();
  const raw = base64Url(buildMimeMessage({ to, subject, html, plainText }));
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(userEmail)}/messages/send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${err.slice(0, 300)}`);
  }
  const result = await res.json() as { id?: string };
  return result.id ?? null;
}

// ── HTML wrapper (matches src/lib/email/templates.ts) ──────────────────────

function wrapHtml(paragraphs: string[], toEmail: string): string {
  const unsubUrl = `${BASE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}`;
  const bodyHtml = paragraphs
    .map(p => `<p style="margin:0 0 14px 0;">${p}</p>`)
    .join('\n  ');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
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
      <a href="${BOOKING_LINK}" style="color:#0e7490;text-decoration:none;font-weight:500;">Book a Meeting</a>
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
  return paragraphs.join('\n\n') + '\n\n--\nCasey Larkin\nGTM Lead, YardFlow by FreightRoll\nhttps://yardflow.ai';
}

// ── Contact list — bounced Wave 1 prospects who never received an email ────
// Excludes: jonathan.ness@genmills.com (got a delivered email on 3/26)
//           isaac.scott@pepsico.com (got a delivered email later)
// All subjects are FRESH (not Re: threads) and different from bounced subjects.

interface Contact {
  to: string;
  firstName: string;
  accountName: string;
  subject: string;
  body: string[];
  micrositeSlug: string;
}

const CONTACTS: Contact[] = [
  // ── General Mills (5 contacts) ──────────────────────────────────────
  {
    to: 'paul.gallagher@genmills.com',
    firstName: 'Paul',
    accountName: 'General Mills',
    micrositeSlug: 'general-mills',
    subject: 'General Mills yard visibility - quick question',
    body: [
      'Paul,',
      'Quick question. Between the Palantir demand planning layer and your WMS, what does General Mills use for real-time yard visibility?',
      "Most companies we talk to don't have an answer. The yard is the gap. Trailers queue, dock appointments slip, and nobody sees it until detention invoices show up.",
      'Primo Brands replaced Kaleris with YardFlow across every facility. They cut gate-to-dock time in half.',
      `We're at MODEX April 13-16. I put together a short page on what this looks like for General Mills: ${BASE_URL}/for/general-mills`,
      'Worth 15 minutes on the floor?',
      'Casey',
    ],
  },
  {
    to: 'nisar.ahsanullah@genmills.com',
    firstName: 'Nisar',
    accountName: 'General Mills',
    micrositeSlug: 'general-mills',
    subject: 'Yard throughput at General Mills',
    body: [
      'Nisar,',
      'Your supply chain team has done impressive work on the digital side. Palantir for demand, automation in the warehouses, Belvidere coming online.',
      "One piece that's typically missing: the yard. Between when a truck arrives at the gate and when it's at the dock, most facilities run blind. That's where 22% of dwell time hides.",
      `I put together a short overview of what closing that gap looks like for General Mills: ${BASE_URL}/for/general-mills`,
      "We'll be at MODEX April 13-16. Open to a quick conversation?",
      'Casey',
    ],
  },
  {
    to: 'ryan.underwood@genmills.com',
    firstName: 'Ryan',
    accountName: 'General Mills',
    micrositeSlug: 'general-mills',
    subject: 'Gate-to-dock at General Mills facilities',
    body: [
      'Ryan,',
      'The facilities absorbing volume from the Missouri consolidation are handling more trailers than they were designed for. That pressure shows up in the yard first.',
      'YardFlow gives your team real-time visibility from gate check-in to dock assignment. No clipboards, no radio calls. Primo Brands cut gate-to-dock time by 50% after switching from Kaleris.',
      `Short overview for General Mills: ${BASE_URL}/for/general-mills`,
      'At MODEX April 13-16. Worth a conversation?',
      'Casey',
    ],
  },
  {
    to: 'zoe.bracey@genmills.com',
    firstName: 'Zoe',
    accountName: 'General Mills',
    micrositeSlug: 'general-mills',
    subject: 'Yard management at General Mills',
    body: [
      'Zoe,',
      'Reaching out because the yard is the one piece of the General Mills supply chain that typically runs without real-time visibility. TMS handles the route. WMS handles the warehouse. But between the gate and the dock, most sites are manual.',
      'That gap is where detention charges accumulate and dock appointments drift. We built YardFlow to close it.',
      `Quick overview: ${BASE_URL}/for/general-mills`,
      'We have a booth at MODEX April 13-16. Open to 15 minutes?',
      'Casey',
    ],
  },
  {
    to: 'lars.stolpestad@genmills.com',
    firstName: 'Lars',
    accountName: 'General Mills',
    micrositeSlug: 'general-mills',
    subject: 'General Mills dock scheduling',
    body: [
      'Lars,',
      'When a truck arrives at a General Mills facility, how long before it hits a dock? At most CPG companies, the answer is "we don\'t actually know." The yard is the blind spot.',
      'Primo Brands replaced Kaleris with YardFlow and cut that number in half across every facility.',
      `Put together a brief overview for your team: ${BASE_URL}/for/general-mills`,
      "At MODEX next week. Happy to walk through it if you're around.",
      'Casey',
    ],
  },
  // ── Frito-Lay / PepsiCo (4 contacts) ───────────────────────────────
  {
    to: 'brian.watson@pepsico.com',
    firstName: 'Brian',
    accountName: 'Frito-Lay',
    micrositeSlug: 'frito-lay',
    subject: 'Frito-Lay yard ops - one question',
    body: [
      'Brian,',
      'When a carrier pulls into a Frito-Lay DC, does your team have real-time visibility on yard position, dock assignment, and dwell time? Or is it still clipboard and radio?',
      "Most Frito-Lay-scale operations don't. The yard is the gap between your TMS and your WMS that nobody owns.",
      'Primo Brands replaced Kaleris with YardFlow across every facility. They cut gate-to-dock by 50%.',
      `Short overview for Frito-Lay: ${BASE_URL}/for/frito-lay`,
      "We're at MODEX April 13-16. Worth 15 minutes?",
      'Casey',
    ],
  },
  {
    to: 'beth.mars@pepsico.com',
    firstName: 'Beth',
    accountName: 'Frito-Lay',
    micrositeSlug: 'frito-lay',
    subject: 'Dock throughput at Frito-Lay facilities',
    body: [
      'Beth,',
      "At Frito-Lay's scale, a 10-minute improvement in gate-to-dock time across the network compounds into real money. Fewer detention charges. Better carrier relationships. More dock capacity without building more docks.",
      'That improvement is hard to get when the yard runs on manual check-ins and radio dispatching. YardFlow automates that entire window.',
      `Overview for Frito-Lay: ${BASE_URL}/for/frito-lay`,
      'At MODEX next week. Would 15 minutes work on the floor?',
      'Casey',
    ],
  },
  {
    to: 'bob.fanslow@pepsico.com',
    firstName: 'Bob',
    accountName: 'Frito-Lay',
    micrositeSlug: 'frito-lay',
    subject: 'Frito-Lay carrier dwell time',
    body: [
      'Bob,',
      'Carrier dwell time at high-volume DCs is where Shipper of Choice scores get made or lost. When your top carriers sit in the yard waiting for a dock, it costs both of you.',
      "YardFlow gives your team real-time yard visibility so dock assignments happen faster and carriers stop waiting. Primo Brands cut their dwell time in half.",
      `Brief look at the Frito-Lay fit: ${BASE_URL}/for/frito-lay`,
      "We'll be at MODEX April 13-16. Open to a short conversation?",
      'Casey',
    ],
  },
  {
    to: 'david.chambers@pepsico.com',
    firstName: 'David',
    accountName: 'Frito-Lay',
    micrositeSlug: 'frito-lay',
    subject: 'Frito-Lay yard visibility',
    body: [
      'David,',
      "Between the gate and the dock at a Frito-Lay facility, there's a window that most systems don't see. TMS drops the load. WMS picks it up inside. But the yard in between? That's where throughput gets lost.",
      'We built YardFlow to close that gap. Real-time trailer positioning, automated dock assignment, and measurable dwell time reduction.',
      `Quick overview: ${BASE_URL}/for/frito-lay`,
      'At MODEX April 13-16. Worth a few minutes?',
      'Casey',
    ],
  },
  // ── Diageo (4 contacts) ─────────────────────────────────────────────
  {
    to: 'marsha.mcintosh-hamilton@diageo.com',
    firstName: 'Marsha',
    accountName: 'Diageo',
    micrositeSlug: 'diageo',
    subject: 'Diageo yard operations - quick thought',
    body: [
      'Marsha,',
      "Diageo runs some of the most complex yard operations in spirits. Temperature-sensitive loads, compliance holds, and high-value inventory sitting in trailers. When yard visibility is manual, that's risk sitting in the parking lot.",
      'YardFlow gives your team real-time positioning and automated dock assignment. Primo Brands made the switch from Kaleris across every facility.',
      `Short overview for Diageo: ${BASE_URL}/for/diageo`,
      "We're at MODEX April 13-16. Worth 15 minutes?",
      'Casey',
    ],
  },
  {
    to: 'raymond.reddrick@diageo.com',
    firstName: 'Raymond',
    accountName: 'Diageo',
    micrositeSlug: 'diageo',
    subject: 'Diageo NA supply chain yard gap',
    body: [
      'Raymond,',
      "Your NA supply chain handles a mix of domestic production and imports that creates unique yard complexity. When inbound trailers from Plainfield sit next to import containers clearing customs, the scheduling gets manual fast.",
      "YardFlow handles that complexity in real time. No clipboards. No radio dispatching. Just automated gate-to-dock flow.",
      `Overview for Diageo: ${BASE_URL}/for/diageo`,
      'At MODEX next week. Open to a conversation?',
      'Casey',
    ],
  },
  {
    to: 'joseph.wanshek@diageo.com',
    firstName: 'Joseph',
    accountName: 'Diageo',
    micrositeSlug: 'diageo',
    subject: 'Diageo dock scheduling',
    body: [
      'Joseph,',
      "At Diageo's volume, every hour a trailer sits in the yard is money. Detention charges, missed dock windows, and carriers who start deprioritizing your loads.",
      'Primo Brands cut their dwell time in half after switching to YardFlow. The math is similar for spirits distribution.',
      `Brief overview: ${BASE_URL}/for/diageo`,
      "At MODEX April 13-16 in Atlanta. Would 15 minutes work?",
      'Casey',
    ],
  },
  {
    to: 'joshua.sallee@diageo.com',
    firstName: 'Joshua',
    accountName: 'Diageo',
    micrositeSlug: 'diageo',
    subject: 'Yard visibility at Diageo facilities',
    body: [
      'Joshua,',
      "When a truck arrives at a Diageo facility, how does the team know where to send it? At most operations this size, it's still manual. Radio, clipboard, phone calls.",
      'YardFlow automates that entire window. Gate check-in to dock assignment in real time. Primo Brands replaced Kaleris with YardFlow and cut gate-to-dock by 50%.',
      `Quick look at the Diageo fit: ${BASE_URL}/for/diageo`,
      "We'll be at MODEX next week. Open to 15 minutes on the floor?",
      'Casey',
    ],
  },
  {
    to: 'jose.martins@diageo.com',
    firstName: 'Jose',
    accountName: 'Diageo',
    micrositeSlug: 'diageo',
    subject: 'Diageo yard throughput',
    body: [
      'Jose,',
      "Between Diageo's TMS and WMS, there's a yard that typically runs without real-time visibility. That's where dock appointments slip and dwell time accumulates.",
      "We built YardFlow to close that gap. It's the execution layer that turns your planned loads into actual dock assignments, automatically.",
      `Overview for Diageo: ${BASE_URL}/for/diageo`,
      'At MODEX April 13-16. Worth a quick conversation?',
      'Casey',
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Wave 1 Re-Send via Gmail API ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no emails sent)' : 'LIVE SEND'}`);
  console.log(`Contacts: ${CONTACTS.length}`);
  console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`Rate limit: ${RATE_LIMIT_MS}ms between sends\n`);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const contact of CONTACTS) {
    const { to, firstName, accountName, subject, body, micrositeSlug } = contact;
    console.log(`[${sent + failed + skipped + 1}/${CONTACTS.length}] ${to} (${accountName})`);
    console.log(`  Subject: ${subject}`);

    if (DRY_RUN) {
      console.log(`  Body preview: ${body[1]?.slice(0, 80)}...`);
      console.log(`  Microsite: ${BASE_URL}/for/${micrositeSlug}`);
      console.log('  -> DRY RUN, skipping\n');
      skipped++;
      continue;
    }

    try {
      const html = wrapHtml(body, to);
      const plainText = toPlainText(body);
      const msgId = await sendViaGmail(to, subject, html, plainText);
      console.log(`  -> SENT (Gmail ID: ${msgId})\n`);
      sent++;

      // Rate limit
      if (sent < CONTACTS.length) {
        await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  -> FAILED: ${msg}\n`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Sent: ${sent}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped (dry run): ${skipped}`);
  console.log(`Total: ${CONTACTS.length}`);
}

main().catch(console.error);
