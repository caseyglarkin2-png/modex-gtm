/** Shared by the work-intake API routes: the flag gate and the session (no token path). */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertGapEnabled } from '@/lib/gap/flags';

export async function intakeGuard(): Promise<{ email: string } | { response: NextResponse }> {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return { response: NextResponse.json(skip, { status: 404 }) };
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return { response: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) };
  return { email };
}

export const badBody = (issues: Array<{ path: PropertyKey[] }>) => NextResponse.json({ error: 'invalid_body', field: issues[0]?.path.join('.') || 'body' }, { status: 400 });
