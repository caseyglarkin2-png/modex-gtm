import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { rateLimit } from '@/lib/rate-limit';
import { sendQueueItem } from '@/lib/queue/send';
import { prodSendDeps } from '@/lib/queue/send-deps';
import { onSendOutcome } from '@/lib/queue/sequence-runtime';
import { isOutreachPaused } from '@/lib/feature-flags';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/queue/:id/send — Clawd sends one queued item by id.
 *
 * Lives under /api/cron so middleware NextAuth exempts it (cookieless bearer
 * call). Authenticates with the DEDICATED QUEUE_AGENT_SECRET via bearer header
 * only — the ?secret= query form is rejected so the secret never hits logs.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedQueueAgent(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Kill-switch: refuse to send while the automated motion is paused. The item
  // is left untouched ('approved'), not marked skipped/failed, so it sends on
  // resume. Manual /discovery sends are unaffected (this gates only the cron).
  if (isOutreachPaused()) {
    return NextResponse.json({ skipped: true, paused: true }, { status: 200 });
  }

  const { ok } = rateLimit('queue-agent-send');
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const result = await sendQueueItem(numericId, { deps: prodSendDeps(prisma) });
  // Sequence follow-through: schedule next step on sent, cancel run on reply/opt-out.
  const item = await prisma.draftQueueItem.findUnique({ where: { id: numericId } });
  if (item) await onSendOutcome(prisma, item, result);
  return NextResponse.json(result);
}
