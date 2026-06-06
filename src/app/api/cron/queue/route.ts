import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { rateLimit } from '@/lib/rate-limit';
import { addOne } from '@/app/discovery/queue-actions';
import { QueueAddBatchSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

const DEFAULT_OWNER = 'casey@freightroll.com';

/**
 * POST /api/cron/queue — Clawd bulk-add into the Draft Queue.
 *
 * Lives under /api/cron so middleware NextAuth exempts it (cookieless bearer
 * call). Authenticates with the DEDICATED QUEUE_AGENT_SECRET via bearer header
 * only — the ?secret= query form is rejected so the secret never hits logs.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorizedQueueAgent(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ok } = rateLimit('queue-agent');
  if (!ok) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = QueueAddBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let added = 0;
  const skipped: Array<{ toEmail: string; reason: string }> = [];

  // Sequential by design: dedup does DB lookups but batches are ≤200 and this
  // is a background agent call, so simplicity wins over concurrency.
  for (const item of parsed.data.items) {
    const owner = item.owner ?? DEFAULT_OWNER;
    const r = await addOne({ ...item, source: 'clawd' }, owner);
    if (r.ok) {
      added++;
    } else {
      skipped.push({ toEmail: item.toEmail, reason: r.reason });
    }
  }

  return NextResponse.json({ added, skipped });
}
