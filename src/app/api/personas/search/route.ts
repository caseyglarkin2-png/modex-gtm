import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/personas/search?q= — contactable personas matching name/email/account. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) {
    return NextResponse.json({ personas: [] });
  }

  const personas = await prisma.persona.findMany({
    where: {
      do_not_contact: false,
      email: { not: null },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { account_name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { name: true, email: true, title: true, account_name: true },
    take: 12,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ personas });
}
