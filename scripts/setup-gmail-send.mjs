/**
 * One-shot OAuth + Email Test Script
 * 
 * This script:
 * 1. Starts a local HTTP server for the OAuth redirect
 * 2. Opens the Google consent URL in your browser
 * 3. Captures the authorization code
 * 4. Exchanges it for a refresh token
 * 5. Sets GOOGLE_REFRESH_TOKEN in Vercel
 * 6. Sends test emails to caseyglarkin2@gmail.com
 * 
 * Usage: node --env-file=.env.local scripts/setup-gmail-send.mjs
 */

import http from 'node:http';
import { execSync } from 'node:child_process';
import { URL, URLSearchParams } from 'node:url';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const PORT = 8976;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set.');
  console.error('Run: node --env-file=.env.local scripts/setup-gmail-send.mjs');
  process.exit(1);
}

// ── Step 1: Start local server and open consent URL ──────────────────

const SCOPES = [
  'openid',
  'email', 
  'profile',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.insert',
].join(' ');

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPES,
  access_type: 'offline',
  prompt: 'consent',
  login_hint: 'casey@freightroll.com',
}).toString();

console.log('\n========================================');
console.log('  Gmail OAuth Setup + Test Email Sender');
console.log('========================================\n');

// Check if this redirect URI is authorized
console.log('IMPORTANT: You need to add this redirect URI to your Google Cloud Console:');
console.log(`  ${REDIRECT_URI}`);
console.log('\nGo to: https://console.cloud.google.com/apis/credentials');
console.log('Edit your OAuth client > Add Authorized redirect URI > Save\n');
console.log('If already done, opening browser...\n');

function base64url(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildMimeMessage({ to, subject, html }) {
  const from = 'Casey Larkin - YardFlow <casey@freightroll.com>';
  const plain = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
  const boundary = `b_${Date.now()}`;
  return [
    `From: ${from}`, `To: ${to}`, `Subject: ${subject}`,
    'MIME-Version: 1.0', `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '', `--${boundary}`, 'Content-Type: text/plain; charset="UTF-8"', '', plain,
    `--${boundary}`, 'Content-Type: text/html; charset="UTF-8"', '', html, `--${boundary}--`,
  ].join('\r\n');
}

async function exchangeCodeForTokens(code) {
  console.log('Exchanging authorization code for tokens...');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error('Token exchange failed:', data);
    process.exit(1);
  }
  return data;
}

async function sendTestEmail(accessToken, { to, subject, html }) {
  const raw = base64url(buildMimeMessage({ to, subject, html }));
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/casey@freightroll.com/messages/send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gmail send failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

async function setVercelEnv(name, value) {
  try {
    // Remove if exists (ignore error)
    try { execSync(`vercel env rm ${name} production --yes 2>/dev/null`, { stdio: 'pipe' }); } catch {}
    // Add new
    execSync(`printf '%s' '${value}' | vercel env add ${name} production`, { stdio: 'pipe' });
    console.log(`  Set ${name} in Vercel (production)`);
    return true;
  } catch (e) {
    console.error(`  Failed to set ${name} in Vercel:`, e.message);
    return false;
  }
}

// ── HTTP server to capture the OAuth redirect ──────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<h1>Authorization failed</h1><p>${error}</p>`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>No authorization code received</h1>');
    return;
  }

  // Send immediate response to browser
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html><body style="font-family:system-ui;max-width:600px;margin:40px auto;text-align:center;">
    <h1 style="color:#22d3ee;">Gmail Connected</h1>
    <p>Authorization code received. Check your terminal for progress.</p>
    <p>Test emails are being sent to caseyglarkin2@gmail.com now.</p>
    <p style="color:#666;">You can close this tab.</p>
    </body></html>
  `);

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    console.log('\nTokens received!');
    console.log('  Access token: yes');
    console.log('  Refresh token:', tokens.refresh_token ? 'yes' : 'NO (problem!)');

    if (!tokens.refresh_token) {
      console.error('\nNo refresh token! Google only gives refresh tokens on first consent.');
      console.error('Go to https://myaccount.google.com/permissions and remove modex-gtm.vercel.app access, then try again.');
      server.close();
      process.exit(1);
    }

    // Set in Vercel
    console.log('\nSetting GOOGLE_REFRESH_TOKEN in Vercel...');
    await setVercelEnv('GOOGLE_REFRESH_TOKEN', tokens.refresh_token);

    // Save to DB too
    console.log('\nSaving to database...');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.generatedContent.deleteMany({ where: { account_name: '__system__', content_type: 'google_refresh_token' } });
        await prisma.generatedContent.create({ data: { account_name: '__system__', content_type: 'google_refresh_token', content: tokens.refresh_token, tone: 'system' } });
        await prisma.$disconnect();
        console.log('  Saved to DB');
      } catch (e) {
        console.error('  DB save failed:', e.message);
      }
    }

    // Send test emails
    console.log('\n========================================');
    console.log('  Sending Test Emails');
    console.log('========================================\n');

    const testEmails = [
      {
        to: 'caseyglarkin2@gmail.com',
        subject: 'Test 1: YardFlow Email Pipeline - System Check',
        html: `<p>Casey,</p>
<p>This is an automated system test from the Modex RevOps OS.</p>
<p><strong>If you're reading this, the Gmail API send pipeline is fully operational.</strong></p>
<p>From: casey@freightroll.com<br>
Sent via: Gmail API (OAuth2)<br>
Timestamp: ${new Date().toISOString()}</p>
<p>The platform can now send personalized cold outreach, follow-ups, and one-pagers to all 76 prospect accounts.</p>`,
      },
      {
        to: 'caseyglarkin2@gmail.com',
        subject: 'Re: Yard network across your DC footprint',
        html: `<p>Quick question on your distribution network.</p>
<p>We mapped 24 facilities running a standardized yard protocol last year. Average truck turn dropped from 48 to 24 minutes. The operators stopped adding headcount for peak seasons.</p>
<p>Three of those sites are in your vertical. The yard managers there said the same thing yours probably say: "We've always done it this way."</p>
<p>We'll be at MODEX April 13-16, walking live networks with operators who run YardFlow daily. Would Tuesday April 14 at 10am, 1pm, or 3pm work for 30 minutes?</p>`,
      },
      {
        to: 'caseyglarkin2@gmail.com',
        subject: 'Test 3: One-Pager Link Demo',
        html: `<p>This is what prospects receive - a personalized landing page:</p>
<p><a href="https://modex-gtm.vercel.app/proposal/general-mills">General Mills One-Pager</a></p>
<p><a href="https://modex-gtm.vercel.app/proposal/coca-cola">Coca-Cola One-Pager</a></p>
<p><a href="https://modex-gtm.vercel.app/proposal/caterpillar">Caterpillar One-Pager</a></p>
<p>Each of the 76 accounts has a custom page. Every page view is tracked as an Activity in the platform.</p>`,
      },
    ];

    for (const email of testEmails) {
      try {
        const result = await sendTestEmail(tokens.access_token, email);
        console.log(`  SENT: "${email.subject}" → ${email.to} (id: ${result.id})`);
      } catch (err) {
        console.error(`  FAIL: "${email.subject}" → ${err.message}`);
      }
    }

    console.log('\n========================================');
    console.log('  DONE');
    console.log('========================================');
    console.log('\nCheck caseyglarkin2@gmail.com for 3 test emails.');
    console.log('GOOGLE_REFRESH_TOKEN has been set in Vercel.');
    console.log('Run "vercel --prod" to redeploy with the new token.\n');

  } catch (err) {
    console.error('Error:', err.message);
  }

  server.close();
});

server.listen(PORT, () => {
  console.log(`Local OAuth server listening on port ${PORT}`);
  console.log(`\nOpening browser for Google authorization...\n`);
  console.log(`If browser doesn't open, visit this URL:\n`);
  console.log(authUrl);
  console.log('');
  
  // Try to open browser
  try {
    execSync(`"$BROWSER" "${authUrl}" 2>/dev/null || xdg-open "${authUrl}" 2>/dev/null || open "${authUrl}" 2>/dev/null`, { stdio: 'pipe' });
  } catch {
    // Browser open failed, user can copy URL manually
  }
});
