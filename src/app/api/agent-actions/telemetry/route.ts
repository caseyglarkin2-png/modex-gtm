import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const TelemetrySchema = z.object({
  accountName: z.string().min(1).optional(),
  action: z.string().min(1).optional(),
  event: z.string().min(1),
  provider: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  email: z.string().email().optional(),
  message: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = TelemetrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid telemetry payload' }, { status: 400 });
  }

  const payload = parsed.data;

  if (payload.accountName) {
    await prisma.activity.create({
      data: {
        account_name: payload.accountName,
        activity_type: 'Agent Workflow',
        owner: 'Codex',
        outcome: `${payload.action ?? 'agent'}:${payload.event}`.slice(0, 240),
        notes: JSON.stringify(payload),
        activity_date: new Date(),
      },
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
