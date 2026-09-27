import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * The approver is the signed-in session, never the request body. An approved
 * row here opens the GAP compile gate (src/lib/gap/compiler/approval.ts), so a
 * client-chosen `approved_by` would let anyone sign as Casey. A body `actor`
 * is stripped by the schema and ignored.
 */

const UpdateApprovalSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['approve', 'reject', 'comment']),
  comment: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const actor = (await auth())?.user?.email;
  if (typeof actor !== 'string' || !actor.includes('@')) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

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
      approved_by: payload.action === 'approve' ? actor : undefined,
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
