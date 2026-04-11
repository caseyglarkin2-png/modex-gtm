import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/notifications — list notifications (newest first). Query: ?unread=true&limit=20 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  const notifications = await prisma.notification.findMany({
    where: unreadOnly ? { read: false } : undefined,
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({ where: { read: false } });

  return NextResponse.json({ notifications, unreadCount });
}

const patchSchema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  read: z.boolean(),
});

/** PATCH /api/notifications — mark notification(s) as read/unread */
export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await prisma.notification.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: { read: parsed.data.read },
  });

  return NextResponse.json({ success: true, updated: parsed.data.ids.length });
}
