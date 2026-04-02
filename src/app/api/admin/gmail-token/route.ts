/**
 * Admin-only endpoint to retrieve the Google refresh token from the current session JWT.
 * Used to bootstrap GOOGLE_REFRESH_TOKEN in Vercel env vars.
 * Only accessible to ADMIN users (casey@freightroll.com, casey@yardflow.ai, caseyglarkin@gmail.com).
 * DELETE this endpoint after you've set GOOGLE_REFRESH_TOKEN in Vercel.
 */
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const ADMINS = [
  'casey@freightroll.com',
  'casey@yardflow.ai',
  'caseyglarkin@gmail.com',
];

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const email = token.email as string | undefined;
  if (!email || !ADMINS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const refreshToken = (token as Record<string, unknown>).refreshToken as string | undefined;
  const accessToken = (token as Record<string, unknown>).accessToken as string | undefined;

  return NextResponse.json({
    email,
    hasRefreshToken: !!refreshToken,
    hasAccessToken: !!accessToken,
    // Only show tokens if they exist - copy GOOGLE_REFRESH_TOKEN to Vercel env vars
    GOOGLE_REFRESH_TOKEN: refreshToken ?? null,
    note: refreshToken
      ? 'Copy GOOGLE_REFRESH_TOKEN to Vercel env vars, then this endpoint can be deleted.'
      : 'No refresh token found. You must sign in with Google OAuth (not Credentials) to get a refresh token. Log out and sign back in with your Google account (casey@freightroll.com preferred).',
  });
}
