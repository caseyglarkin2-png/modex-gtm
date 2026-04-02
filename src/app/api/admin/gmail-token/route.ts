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
  'casey@yardflow.ai',
  'caseyglarkin@gmail.com',
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

  return NextResponse.json({
    email: session.user.email,
    hasRefreshToken: !!refreshToken,
    GOOGLE_REFRESH_TOKEN: refreshToken,
    note: refreshToken
      ? 'Copy GOOGLE_REFRESH_TOKEN to Vercel env vars, then delete this endpoint.'
      : 'No refresh token saved yet. Sign OUT, then sign back in with Google to capture it.',
  });
}
