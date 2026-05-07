import { z } from 'zod';

export const SOURCE_BACKED_REASON_CODES = [
  'APPROVAL_REQUIRED',
  'MIXED_ACCOUNT_PAYLOAD',
  'SIDECAR_UNAVAILABLE',
] as const;

export type SourceBackedReasonCode = (typeof SOURCE_BACKED_REASON_CODES)[number];

export const SourceBackedReasonCodeSchema = z.enum(SOURCE_BACKED_REASON_CODES);

export const SourceEvidenceSchema = z.object({
  accountName: z.string().min(1),
  personaName: z.string().min(1).optional().nullable(),
  claim: z.string().min(4),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(1).optional().nullable(),
  sourceType: z.enum(['local', 'sidecar', 'web', 'crm', 'operator']),
  provider: z.string().min(1),
  observedAt: z.coerce.date(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  deterministicKey: z.string().min(8),
});

export type SourceEvidence = z.infer<typeof SourceEvidenceSchema>;

export const EvidenceFreshnessSchema = z.enum(['fresh', 'aging', 'stale']);
export type EvidenceFreshness = z.infer<typeof EvidenceFreshnessSchema>;

export const SidecarHealthSchema = z.object({
  provider: z.string().min(1),
  status: z.enum(['healthy', 'degraded', 'unavailable']),
  message: z.string().optional().nullable(),
  checkedAt: z.coerce.date(),
});

export type SidecarHealth = z.infer<typeof SidecarHealthSchema>;
