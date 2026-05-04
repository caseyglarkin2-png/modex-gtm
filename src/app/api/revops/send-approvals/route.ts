import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const UpdateApprovalSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['approve', 'reject', 'comment']),
  actor: z.string().optional().default('Casey'),
  comment: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = UpdateApprovalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload = parsed.data;

  const existing = await prisma.sendApprovalRequest.findUnique({
    where: { id: payload.id },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Approval request not found.' }, { status: 404 });
  }

  const nextStatus = payload.action === 'approve'
    ? 'approved'
    : payload.action === 'reject'
      ? 'rejected'
      : existing.status;
  const updated = await prisma.sendApprovalRequest.update({
    where: { id: payload.id },
    data: {
      status: nextStatus,
      approved_by: payload.action === 'approve' ? payload.actor : undefined,
      comment: payload.comment ?? undefined,
      resolved_at: payload.action === 'comment' ? undefined : new Date(),
    },
    select: {
      id: true,
      status: true,
      approved_by: true,
      comment: true,
      resolved_at: true,
      updated_at: true,
    },
  });

  return NextResponse.json({ success: true, approval: updated });
}
