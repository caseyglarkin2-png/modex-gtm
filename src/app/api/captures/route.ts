import { NextRequest, NextResponse } from 'next/server';
import { CaptureSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CaptureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const capture = await prisma.mobileCapture.create({
      data: {
        account_name: parsed.data.account,
        persona_name: parsed.data.contact,
        notes: parsed.data.notes,
        interest: parsed.data.interest,
        urgency: parsed.data.urgency,
        influence: parsed.data.influence,
        fit: parsed.data.fit,
        heat_score: parsed.data.heat_score,
        due_date: parsed.data.due_date ? new Date(parsed.data.due_date) : null,
        followup_status: parsed.data.status ?? 'Open',
      },
    });
    return NextResponse.json({ success: true, capture }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const captures = await prisma.mobileCapture.findMany({
      orderBy: { due_date: 'asc' },
    });
    return NextResponse.json(captures);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
