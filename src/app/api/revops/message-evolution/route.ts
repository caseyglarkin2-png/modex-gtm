import { NextRequest, NextResponse } from 'next/server';
import { MessageEvolutionUpdateSchema } from '@/lib/validations';
import {
  computeLearningReviewSlaDueAt,
  nextLearningReviewStatus,
  type LearningReviewStatus,
} from '@/lib/revops/engagement-learning';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = MessageEvolutionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const existing = await prisma.messageEvolutionRegistry.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      status: true,
      previous_generated_content_id: true,
      generated_content_id: true,
      account_name: true,
      created_at: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Message evolution entry not found' }, { status: 404 });
  }

  const nextStatus = nextLearningReviewStatus(existing.status as LearningReviewStatus, payload.action);
  if (!nextStatus) {
    return NextResponse.json({ error: `Invalid transition from ${existing.status} via ${payload.action}` }, { status: 409 });
  }

  const now = new Date();
  const updated = await prisma.messageEvolutionRegistry.update({
    where: { id: existing.id },
    data: {
      status: nextStatus,
      reviewed_by: payload.actor ?? 'Casey',
      reviewed_at: ['approved', 'rejected', 'in-review'].includes(nextStatus) ? now : undefined,
      deployed_at: nextStatus === 'deployed' ? now : undefined,
      rollback_link:
        nextStatus === 'deployed' && existing.previous_generated_content_id
          ? `/generated-content?account=${encodeURIComponent(existing.account_name)}&version=${existing.previous_generated_content_id}`
          : nextStatus === 'rolled-back'
            ? `/generated-content?account=${encodeURIComponent(existing.account_name)}&version=${existing.previous_generated_content_id ?? existing.generated_content_id}`
            : undefined,
      sla_due_at: computeLearningReviewSlaDueAt(existing.created_at, nextStatus),
    },
    select: {
      id: true,
      status: true,
      sla_due_at: true,
      reviewed_by: true,
      reviewed_at: true,
      deployed_at: true,
      rollback_link: true,
    },
  });

  return NextResponse.json({ success: true, entry: updated });
}
