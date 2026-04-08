export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveMicrositeProposalBrief } from '@/lib/microsites/proposal';

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const proposal = resolveMicrositeProposalBrief(slug);

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET');
  headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  if (proposal) {
    return NextResponse.json(
      {
        account: {
          name: proposal.accountName,
          vertical: proposal.vertical,
          tier: proposal.tier,
          priority_band: proposal.band,
        },
        mode: 'microsite-brief',
        content: proposal,
      },
      { headers },
    );
  }

  const accountName = slugToName(slug);

  // Try exact, then case-insensitive
  let account = await prisma.account.findUnique({
    where: { name: accountName },
    select: { name: true, vertical: true, tier: true, priority_band: true },
  });
  if (!account) {
    account = await prisma.account.findFirst({
      where: { name: { equals: accountName, mode: 'insensitive' } },
      select: { name: true, vertical: true, tier: true, priority_band: true },
    });
  }

  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const record = await prisma.generatedContent.findFirst({
    where: { account_name: account.name, content_type: 'one_pager' },
    orderBy: { created_at: 'desc' },
  });

  let content = null;
  if (record?.content) {
    try {
      content = JSON.parse(record.content);
    } catch {
      // invalid JSON
    }
  }

  return NextResponse.json(
    { account, mode: 'generated-one-pager', content },
    { headers }
  );
}
