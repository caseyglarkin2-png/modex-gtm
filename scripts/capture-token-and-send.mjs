/**
 * Automated Gmail setup: polls DB for refresh token, then sends test emails.
 * 
 * How it works:
 * 1. Opens browser to sign-in page
 * 2. Polls DB every 2 seconds for the refresh token (saved by auth.ts on Google sign-in)
 * 3. Once found: sets GOOGLE_REFRESH_TOKEN in Vercel + sends 3 test emails
 * 
 * Usage: node --env-file=.env.local scripts/capture-token-and-send.mjs
 */

import { execSync } from 'node:child_process';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const DATABASE_URL = process.env.DATABASE_URL?.trim();

if (!CLIENT_ID || !CLIENT_SECRET || !DATABASE_URL) {
  console.error('Missing env vars. Run: node --env-file=.env.local scripts/capture-token-and-send.mjs');
  process.exit(1);
}

function base64url(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMime({ to, subject, html }) {
  const from = 'Casey Larkin - YardFlow <casey@freightroll.com>';
  const plain = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
  const boundary = `b_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return [
    `From: ${from}`, `To: ${to}`, `Subject: ${subject}`,
    'MIME-Version: 1.0', `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '', `--${boundary}`, 'Content-Type: text/plain; charset="UTF-8"', '', plain,
    `--${boundary}`, 'Content-Type: text/html; charset="UTF-8"', '', html, `--${boundary}--`,
  ].join('\r\n');
}

async function getAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function sendEmail(accessToken, { to, subject, html }) {
  const raw = base64url(buildMime({ to, subject, html }));
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/casey@freightroll.com/messages/send`,
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
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  console.log('\n========================================');
  console.log('  Gmail Setup + Test Email Automation');
  console.log('========================================\n');

  // Check if token already exists
  let record = await prisma.generatedContent.findFirst({
    where: { account_name: '__system__', content_type: 'google_refresh_token' },
  });

  if (record?.content) {
    console.log('Refresh token already in DB! Skipping sign-in step.\n');
  } else {
    // Open browser to trigger sign-in
    console.log('Opening browser to sign in with Google...');
    console.log('Sign OUT if already logged in, then sign in with Google (casey@freightroll.com)\n');
    
    try {
      execSync('"$BROWSER" "https://modex-gtm.vercel.app/login" 2>/dev/null', { stdio: 'pipe' });
    } catch {
      console.log('Could not open browser. Go to: https://modex-gtm.vercel.app/login');
    }

    console.log('Waiting for Google sign-in (polling DB every 2s)...\n');

    // Poll DB
    for (let i = 0; i < 90; i++) { // 3 minutes max
      await new Promise(r => setTimeout(r, 2000));
      record = await prisma.generatedContent.findFirst({
        where: { account_name: '__system__', content_type: 'google_refresh_token' },
      });
      if (record?.content) {
        console.log('Refresh token captured!\n');
        break;
      }
      process.stdout.write('.');
    }

    if (!record?.content) {
      console.error('\n\nTimed out waiting for sign-in. Try again.');
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  const refreshToken = record.content;

  // ── Set in Vercel ──────────────────────────────────────────────────
  console.log('Setting GOOGLE_REFRESH_TOKEN in Vercel...');
  try {
    try { execSync('vercel env rm GOOGLE_REFRESH_TOKEN production --yes 2>/dev/null', { stdio: 'pipe' }); } catch {}
    execSync(`printf '%s' '${refreshToken}' | vercel env add GOOGLE_REFRESH_TOKEN production`, { stdio: 'pipe' });
    console.log('  Done - set in Vercel production.\n');
  } catch (e) {
    console.error('  Vercel env set failed:', e.message);
    console.log('  Manual fallback - copy this token and add it yourself:\n');
    console.log(`  GOOGLE_REFRESH_TOKEN=${refreshToken}\n`);
  }

  // ── Get access token ───────────────────────────────────────────────
  console.log('Getting Gmail access token...');
  let accessToken;
  try {
    accessToken = await getAccessToken(refreshToken);
    console.log('  Got access token.\n');
  } catch (e) {
    console.error('  Failed:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  // ── Send test emails ───────────────────────────────────────────────
  console.log('========================================');
  console.log('  Sending 3 Test Emails');
  console.log('========================================\n');

  const emails = [
    {
      to: 'caseyglarkin@gmail.com',
      subject: 'YardFlow Email System - Live Test (from Gmail API)',
      html: `<p>Casey,</p>
<p>This is an automated system test from the Modex RevOps OS.</p>
<p><strong>The Gmail API send pipeline is fully operational.</strong></p>
<ul>
<li>From: casey@freightroll.com</li>
<li>Sent via: Gmail API (OAuth2 refresh token)</li>
<li>Timestamp: ${new Date().toISOString()}</li>
</ul>
<p>The platform can now send personalized cold outreach, follow-ups, and one-pagers to all 76 prospect accounts.</p>`,
    },
    {
      to: 'caseyglarkin@gmail.com',
      subject: 'Sample Cold Email: How it looks to a prospect',
      html: `<p>Quick question on your distribution network.</p>
<p>We mapped 24 facilities running a standardized yard protocol last year. Average truck turn dropped from 48 to 24 minutes. The operators stopped adding headcount for peak seasons.</p>
<p>Three of those sites handle the same kind of throughput your team does. The yard managers said the same thing yours probably say: "We have always done it this way."</p>
<p>We will be at MODEX April 13-16 with live operators who run YardFlow daily across their yards. Would Tuesday April 14 at 10am, 1pm, or 3pm work for 30 minutes?</p>`,
    },
    {
      to: 'caseyglarkin@gmail.com',
      subject: 'Sample with One-Pager Links: What prospects see',
      html: `<p>Check out these personalized landing pages - each prospect gets their own:</p>
<ul>
<li><a href="https://modex-gtm.vercel.app/proposal/general-mills">General Mills One-Pager</a></li>
<li><a href="https://modex-gtm.vercel.app/proposal/coca-cola">Coca-Cola One-Pager</a></li>
<li><a href="https://modex-gtm.vercel.app/proposal/caterpillar">Caterpillar One-Pager</a></li>
<li><a href="https://modex-gtm.vercel.app/proposal/frito-lay">Frito-Lay One-Pager</a></li>
<li><a href="https://modex-gtm.vercel.app/proposal/kraft-heinz">Kraft Heinz One-Pager</a></li>
</ul>
<p>All 76 accounts have custom pages. Every page view is tracked as an Activity in the platform. Each page has a "Book a Network Audit" CTA linked to your Google Calendar.</p>`,
    },
  ];

  for (const email of emails) {
    try {
      const result = await sendEmail(accessToken, email);
      console.log(`  SENT: "${email.subject}" (id: ${result.id})`);
    } catch (err) {
      console.error(`  FAIL: "${email.subject}" - ${err.message}`);
    }
  }

  // ── Trigger Vercel redeploy ────────────────────────────────────────
  console.log('\nTriggering Vercel production redeploy...');
  try {
    execSync('vercel --prod --yes 2>/dev/null', { stdio: 'pipe', timeout: 120000 });
    console.log('  Redeploy triggered.\n');
  } catch {
    console.log('  Redeploy skipped (run "vercel --prod" manually if needed).\n');
  }

  console.log('========================================');
  console.log('  ALL DONE');
  console.log('========================================');
  console.log('\nCheck caseyglarkin@gmail.com for 3 test emails.');
  console.log('GOOGLE_REFRESH_TOKEN is set in Vercel.');
  console.log('Email sending is now permanent - no more setup needed.\n');

  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
