import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { selectDue } from '@/lib/queue/schedule';
import { STATUS } from '@/lib/queue/types';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/queue/due — Clawd polls the items ripe to send now.
 *
 * Lives under /api/cron so middleware NextAuth exempts it (cookieless bearer
 * call). Authenticates with the DEDICATED QUEUE_AGENT_SECRET via bearer header
 * only — the ?secret= query form is rejected so the secret never hits logs.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedQueueAgent(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await prisma.draftQueueItem.findMany({
    where: { status: STATUS.approved, scheduled_for: { lte: new Date() } },
    take: 25,
    orderBy: { scheduled_for: 'asc' },
  });

  const due = selectDue(rows, new Date());

  return NextResponse.json({
    items: due.map((r) => ({ id: r.id, to_email: r.to_email, scheduled_for: r.scheduled_for })),
  });
}
