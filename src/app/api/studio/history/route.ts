import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const account = searchParams.get('account');

  if (!account) {
    return NextResponse.json({ history: [] });
  }

  const history = await prisma.generatedContent.findMany({
    where: { account_name: account },
    orderBy: { created_at: 'desc' },
    take: 50,
    select: {
      id: true,
      content_type: true,
      persona_name: true,
      created_at: true,
      content: true,
    },
  });

  return NextResponse.json({
    history: history.map((item) => ({
      id: item.id,
      type: item.content_type,
      persona: item.persona_name,
      createdAt: item.created_at.toISOString(),
      content: item.content,
    })),
  });
}
