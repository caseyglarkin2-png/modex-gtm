import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runReenrichContactsCron } from '@/lib/cron/reenrich-contacts';

export const dynamic = 'force-dynamic';

const HeaderSchema = z.object({
  authorization: z.string().refine(
    (v) => v === `Bearer ${process.env.CRON_SECRET}`,
    'Invalid CRON_SECRET',
  ),
});

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? '';
  const headerParse = HeaderSchema.safeParse({ authorization: authHeader });
  if (!headerParse.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runReenrichContactsCron();
  if (result.status === 'error') {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result);
}
