import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runCanonicalBackfill } from '@/lib/revops/account-identity-backfill';

export const dynamic = 'force-dynamic';

const SyncSchema = z.object({
  accountNames: z.array(z.string().min(1)).optional(),
  personaIds: z.array(z.number().int().positive()).optional(),
});

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  const providedSecret = req.headers.get('x-canonical-sync-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!configuredSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured.' }, { status: 503 });
  }
  if (providedSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = SyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await runCanonicalBackfill(parsed.data);
  return NextResponse.json({ success: true, ...result });
}
