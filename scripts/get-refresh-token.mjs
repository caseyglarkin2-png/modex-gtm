/**
 * Codespace-friendly Gmail OAuth token getter.
 * 
 * 1. Prints a Google consent URL - open it in your browser
 * 2. After you approve, Google redirects to localhost (which won't load - that's fine)
 * 3. Copy the "code" parameter from the URL bar
 * 4. Paste it when prompted
 * 5. Script exchanges it for refresh token, saves to .env.local + Vercel
 *
 * Usage: node --env-file=.env.local scripts/get-refresh-token.mjs
 */

import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local');
  process.exit(1);
}

// Use a redirect URI that's likely already authorized (localhost)
const REDIRECT_URI = 'http://localhost:8976/callback';

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
console.log('  Gmail Refresh Token Setup');
console.log('========================================\n');
console.log('Step 1: Open this URL in your browser:\n');
console.log(authUrl);
console.log('\nStep 2: Sign in with casey@freightroll.com and approve access.');
console.log('\nStep 3: It will redirect to localhost which will fail to load.');
console.log('        That\'s OK! Look at the URL in your browser address bar.');
console.log('        Find the "code=" parameter and copy everything after it');
console.log('        (up to the next & or end of URL).\n');

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the authorization code here: ', async (rawCode) => {
  rl.close();
  
  const code = decodeURIComponent(rawCode.trim());
  if (!code) {
    console.error('No code provided. Exiting.');
    process.exit(1);
  }

  console.log('\nExchanging code for tokens...');
  
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
    console.error('Token exchange failed:', JSON.stringify(data, null, 2));
    if (data.error === 'invalid_grant') {
      console.error('\nThe code may have expired or been used already.');
      console.error('Go to https://myaccount.google.com/permissions');
      console.error('Remove "modex-gtm" or your OAuth app, then try again.');
    }
    process.exit(1);
  }

  console.log('Access token: received');
  
  if (!data.refresh_token) {
    console.error('\nNo refresh token returned!');
    console.error('Google only gives refresh tokens on first consent or after revoking.');
    console.error('Go to https://myaccount.google.com/permissions');
    console.error('Remove app access, then run this script again.');
    process.exit(1);
  }

  console.log('Refresh token: received');

  // Save to .env.local
  const envPath = '.env.local';
  try {
    let envContent = readFileSync(envPath, 'utf-8');
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, `GOOGLE_REFRESH_TOKEN="${data.refresh_token}"`);
    } else {
      envContent += `\nGOOGLE_REFRESH_TOKEN="${data.refresh_token}"\n`;
    }
    writeFileSync(envPath, envContent);
    console.log('\nSaved to .env.local');
  } catch (e) {
    console.error('Failed to write .env.local:', e.message);
    console.log(`\nManually add to .env.local:\nGOOGLE_REFRESH_TOKEN="${data.refresh_token}"`);
  }

  // Set in Vercel
  try {
    try { execSync('vercel env rm GOOGLE_REFRESH_TOKEN production --yes 2>/dev/null', { stdio: 'pipe' }); } catch {}
    execSync(`printf '%s' '${data.refresh_token}' | vercel env add GOOGLE_REFRESH_TOKEN production`, { stdio: 'pipe' });
    console.log('Saved to Vercel (production)');
  } catch (e) {
    console.log('Could not save to Vercel:', e.message);
  }

  // Quick test - verify the token works
  console.log('\nTesting Gmail API access...');
  try {
    const testRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/casey@freightroll.com/profile', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const profile = await testRes.json();
    if (testRes.ok) {
      console.log(`Gmail API working! Logged in as: ${profile.emailAddress}`);
      console.log(`Messages total: ${profile.messagesTotal}`);
    } else {
      console.log('Gmail API test failed:', profile);
    }
  } catch (e) {
    console.log('Gmail API test error:', e.message);
  }

  console.log('\n========================================');
  console.log('  Setup complete! You can now run:');
  console.log('  npx tsx scripts/wave1-resend-gmail.ts');
  console.log('========================================\n');
});
