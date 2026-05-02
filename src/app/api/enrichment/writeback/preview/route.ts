import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getEnrichmentThresholds } from '@/lib/enrichment/config';
import { buildWritebackPreview } from '@/lib/enrichment/writeback-preview';
import type { MergeSource } from '@/lib/enrichment/merge-policy';
import { computePreviewChecksum, storeWritebackPreview } from '@/lib/enrichment/writeback-approval';

export const dynamic = 'force-dynamic';

const CandidateFieldSchema = z.object({
  value: z.string().nullable(),
  source: z.enum(['hubspot', 'apollo', 'manual']),
  confidence: z.number().min(0).max(1),
  updatedAt: z.string().datetime(),
});

const RequestSchema = z.object({
  personaId: z.number().int().positive(),
  candidate: z.record(z.string(), CandidateFieldSchema),
});

function toMergeSource(value: string): MergeSource | null {
  if (value === 'hubspot' || value === 'apollo' || value === 'manual') return value;
  return null;
}

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

  const { personaId, candidate } = parsed.data;
  const enrichment = await prisma.contactEnrichment.findUnique({
    where: { persona_id: personaId },
    include: { fields: true },
  });

  const existingMap: Record<string, { value: string | null; source: MergeSource | null; confidence: number | null; updatedAt: Date | null }> = {};
  for (const field of enrichment?.fields ?? []) {
    existingMap[field.field_name] = {
      value: field.field_value,
      source: toMergeSource(field.source),
      confidence: field.confidence,
      updatedAt: field.updated_at,
    };
  }

  const candidateMap = Object.fromEntries(
    Object.entries(candidate).map(([field, item]) => [
      field,
      {
        value: item.value,
        source: item.source,
        confidence: item.confidence,
        updatedAt: new Date(item.updatedAt),
      },
    ]),
  );

  const thresholds = getEnrichmentThresholds();
  const preview = buildWritebackPreview({
    existing: existingMap,
    candidate: candidateMap,
    minConfidenceForOverwrite: thresholds.minConfidenceForOverwrite,
  });
  const previewChecksum = computePreviewChecksum(preview);
  await storeWritebackPreview(personaId, previewChecksum, preview);

  return NextResponse.json({
    personaId,
    threshold: thresholds.minConfidenceForOverwrite,
    previewChecksum,
    preview,
  });
}
