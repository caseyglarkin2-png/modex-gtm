import { NextRequest, NextResponse } from 'next/server';
import { MeetingSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const meeting = await prisma.meeting.create({
      data: {
        account_name: parsed.data.account,
        persona: parsed.data.attendees,
        meeting_date: new Date(parsed.data.date),
        meeting_time: parsed.data.time,
        location: parsed.data.location,
        notes: parsed.data.notes,
        objective: parsed.data.objective,
        owner: parsed.data.owner ?? 'Jake',
        meeting_status: parsed.data.status ?? 'Scheduled',
      },
    });
    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { meeting_date: 'desc' },
    });
    return NextResponse.json(meetings);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const meeting = await prisma.meeting.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json({ success: true, meeting });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await prisma.meeting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
