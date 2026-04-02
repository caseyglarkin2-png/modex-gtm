/**
 * Admin-only endpoint to retrieve the Google refresh token.
 * Reads from DB (saved automatically during Google OAuth sign-in).
 * DELETE this endpoint after you've set GOOGLE_REFRESH_TOKEN in Vercel.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ADMINS = [
  'casey@freightroll.com',
  'caseyglarkin2@gmail.com',
];

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated. Sign in with Google first.' }, { status: 401 });
  }

  if (!ADMINS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Read the refresh token saved to DB during Google sign-in
  const record = await prisma.generatedContent.findFirst({
    where: { account_name: '__system__', content_type: 'google_refresh_token' },
  });

  const refreshToken = record?.content ?? null;

  // If we have the token, try to set it as an env var and send a test email
  if (refreshToken) {
    // Set it in process.env so the Gmail sender can use it immediately
    process.env.GOOGLE_REFRESH_TOKEN = refreshToken;

    // Try sending a test email
    let emailResult = 'not attempted';
    try {
      const { sendViaGmail } = await import('@/lib/email/gmail-sender');
      await sendViaGmail({
        to: 'caseyglarkin2@gmail.com',
        subject: 'YardFlow Email System - Live Test',
        html: `<p>Casey,</p>
<p>This is an automated test from the Modex RevOps OS. If you're reading this, the Gmail API send pipeline is fully operational.</p>
<p>From: casey@freightroll.com<br/>Sent via: Gmail API (OAuth2)<br/>Timestamp: ${new Date().toISOString()}</p>
<p>Next step: set GOOGLE_REFRESH_TOKEN in Vercel env vars to make this permanent.</p>`,
      });
      emailResult = 'SUCCESS - check caseyglarkin2@gmail.com';
    } catch (err) {
      emailResult = `FAILED: ${err instanceof Error ? err.message : String(err)}`;
    }

    return NextResponse.json({
      email: session.user.email,
      hasRefreshToken: true,
      GOOGLE_REFRESH_TOKEN: refreshToken,
      testEmailResult: emailResult,
      note: 'Copy GOOGLE_REFRESH_TOKEN value and add to Vercel env vars to make email permanent.',
    });
  }

  return NextResponse.json({
    email: session.user.email,
    hasRefreshToken: false,
    GOOGLE_REFRESH_TOKEN: null,
    note: 'No refresh token saved yet. Sign OUT, then sign back in with Google to capture it.',
  });
}
