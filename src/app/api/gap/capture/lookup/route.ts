/**
 * GET /api/gap/capture/lookup?q=...          accounts and people matching the text (Phase 2 D1)
 * GET /api/gap/capture/lookup?account=Name   that account's people and current hypotheses
 *
 * Read only, session only. Matching is a plain case-insensitive contains:
 * the capture page shows the matches and Casey picks; nothing is guessed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const skip = assertGapEnabled('GAP_HYPOTHESIS_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = (await auth())?.user?.email;
  if (typeof email !== 'string' || !email.includes('@')) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const url = request.nextUrl;
  const account = url.searchParams.get('account')?.trim();
  if (account) {
    const [people, hypotheses] = await Promise.all([
      prisma.persona.findMany({ where: { account_name: account }, select: { id: true, name: true, title: true, email: true }, orderBy: { id: 'asc' }, take: 100 }),
      prisma.prospectingHypothesis.findMany({
        where: { account_name: account, status: { in: ['draft', 'review_required', 'approved', 'active'] }, superseded_by: null },
        select: { id: true, status: true, problem_family: true, primary_persona_id: true },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
    ]);
    return NextResponse.json({ account, people, hypotheses });
  }
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ accounts: [], people: [] });
  const [accounts, people] = await Promise.all([
    prisma.account.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { name: true }, orderBy: { name: 'asc' }, take: 8 }),
    prisma.persona.findMany({
      where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, name: true, title: true, account_name: true },
      take: 8,
    }),
  ]);
  return NextResponse.json({ accounts: accounts.map((a) => a.name), people });
}
