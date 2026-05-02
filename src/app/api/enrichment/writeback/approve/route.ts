import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  issueWritebackApprovalToken,
  loadWritebackPreview,
} from '@/lib/enrichment/writeback-approval';

export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  personaId: z.number().int().positive(),
  previewChecksum: z.string().length(64),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { personaId, previewChecksum } = parsed.data;
  const preview = await loadWritebackPreview(personaId, previewChecksum);
  if (!preview) {
    return NextResponse.json(
      { error: 'PREVIEW_NOT_FOUND', message: 'Preview checksum is missing or expired.' },
      { status: 404 },
    );
  }

  const approval = await issueWritebackApprovalToken(personaId, previewChecksum, 30);
  return NextResponse.json({
    personaId,
    previewChecksum,
    approvalToken: approval.token,
    expiresAt: approval.expiresAt,
  });
}
