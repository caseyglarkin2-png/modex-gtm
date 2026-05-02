import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isWritebackApplyEnabled } from '@/lib/enrichment/config';
import {
  consumeWritebackApprovalToken,
  loadWritebackPreview,
} from '@/lib/enrichment/writeback-approval';

export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  personaId: z.number().int().positive(),
  previewChecksum: z.string().length(64),
  approvalToken: z.string().min(1),
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

  const { personaId, previewChecksum, approvalToken } = parsed.data;
  if (!isWritebackApplyEnabled()) {
    return NextResponse.json(
      { error: 'WRITEBACK_DISABLED', message: 'Writeback apply is disabled in this environment.' },
      { status: 409 },
    );
  }

  const preview = await loadWritebackPreview(personaId, previewChecksum);
  if (!preview) {
    return NextResponse.json(
      { error: 'PREVIEW_NOT_FOUND', message: 'Preview checksum is missing or expired.' },
      { status: 404 },
    );
  }

  const approved = await consumeWritebackApprovalToken({
    token: approvalToken,
    personaId,
    checksum: previewChecksum,
  });
  if (!approved) {
    return NextResponse.json(
      { error: 'APPROVAL_INVALID', message: 'Approval token invalid, expired, or checksum mismatch.' },
      { status: 409 },
    );
  }

  const accepted = preview.preview.filter((item) => item.decision === 'accept_candidate');
  const enrichment = await prisma.contactEnrichment.upsert({
    where: { persona_id: personaId },
    update: {
      last_enriched_at: new Date(),
    },
    create: {
      persona_id: personaId,
      merge_version: 'v1',
      last_enriched_at: new Date(),
    },
  });

  for (const item of accepted) {
    await prisma.contactEnrichmentField.upsert({
      where: {
        contact_enrichment_id_field_name: {
          contact_enrichment_id: enrichment.id,
          field_name: item.field,
        },
      },
      update: {
        field_value: item.candidateValue,
        source: item.candidateSource,
        source_timestamp: new Date(),
        confidence: null,
        last_writer: 'writeback_apply',
      },
      create: {
        contact_enrichment_id: enrichment.id,
        field_name: item.field,
        field_value: item.candidateValue,
        source: item.candidateSource,
        source_timestamp: new Date(),
        confidence: null,
        last_writer: 'writeback_apply',
      },
    });
  }

  return NextResponse.json({
    personaId,
    previewChecksum,
    appliedFieldCount: accepted.length,
    appliedFields: accepted.map((item) => item.field),
  });
}
