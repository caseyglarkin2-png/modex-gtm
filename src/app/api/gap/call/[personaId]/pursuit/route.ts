/**
 * GET /api/gap/call/[personaId]/pursuit   the account's pursuit state for call prep (UX-06)
 *
 * The SAME state NOW shows, read for the person's account (lib/gap/replies/call-pursuit.ts). A second, slower
 * request beside the brief, so the brief renders at once and the opener stays hidden until the state is known.
 * `{ pursuit: null }` when it could not be read in time (the page then offers no opener). Session or header token,
 * like the brief.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { callPursuit } from '@/lib/gap/replies/call-pursuit';

export const dynamic = 'force-dynamic';

function isGapAgentRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('x-gap-token') === secret) return true;
    if (request.headers.get('authorization') === `Bearer ${secret}`) return true;
    if (request.headers.get('x-cron-secret') === secret) return true;
  }
  return isAuthorizedQueueAgent(request);
}

export async function GET(request: NextRequest, context: { params: Promise<{ personaId: string }> }) {
  const skip = assertGapEnabled();
  if (skip) return NextResponse.json(skip, { status: 404 });
  const session = await auth();
  const email = session?.user?.email;
  if (!(typeof email === 'string' && email.length > 0) && !isGapAgentRequest(request)) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { personaId } = await context.params;
  const raw = decodeURIComponent(personaId ?? '').trim();
  if (!/^\d+$/.test(raw)) return NextResponse.json({ error: 'invalid_query', field: 'personaId' }, { status: 400 });
  const persona: { account_name: string } | null = await prisma.persona.findUnique({ where: { id: Number(raw) }, select: { account_name: true } });
  if (!persona) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const pursuit = await callPursuit(prisma, persona.account_name);
  return NextResponse.json({ pursuit });
}
