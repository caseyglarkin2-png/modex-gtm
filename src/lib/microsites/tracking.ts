import { z } from 'zod';

export const micrositeTrackEventTypes = [
  'page_view',
  'section_view',
  'cta_click',
  'variant_switch',
] as const;

export const micrositeTrackEventSchema = z.object({
  sessionId: z.string().min(1).max(120),
  accountSlug: z.string().min(1).max(120),
  accountName: z.string().min(1).max(160),
  personSlug: z.string().min(1).max(120).optional(),
  personName: z.string().min(1).max(160).optional(),
  path: z.string().min(1).max(300),
  eventType: z.enum(micrositeTrackEventTypes),
  sectionId: z.string().min(1).max(120).optional(),
  ctaId: z.string().min(1).max(120).optional(),
  variantSlug: z.string().min(1).max(120).optional(),
  scrollDepthPct: z.number().int().min(0).max(100).optional(),
  durationSeconds: z.number().int().min(0).max(86_400).optional(),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const micrositeTrackingSnapshotSchema = z.object({
  sessionId: z.string().min(1).max(120),
  accountSlug: z.string().min(1).max(120),
  accountName: z.string().min(1).max(160),
  personSlug: z.string().min(1).max(120).optional(),
  personName: z.string().min(1).max(160).optional(),
  path: z.string().min(1).max(300),
  sectionsViewed: z.array(z.string().min(1).max(120)).default([]),
  ctaIds: z.array(z.string().min(1).max(120)).default([]),
  variantHistory: z.array(z.string().min(1).max(120)).default([]),
  scrollDepthPct: z.number().int().min(0).max(100).default(0),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
  variantSlug: z.string().min(1).max(120).optional(),
  lastCtaId: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type MicrositeTrackEventType = (typeof micrositeTrackEventTypes)[number];
export type MicrositeTrackEvent = z.infer<typeof micrositeTrackEventSchema>;
export type MicrositeTrackingSnapshot = z.infer<typeof micrositeTrackingSnapshotSchema>;

export function dedupeTrackingSnapshot(snapshot: MicrositeTrackingSnapshot): string {
  return JSON.stringify({
    sessionId: snapshot.sessionId,
    accountSlug: snapshot.accountSlug,
    accountName: snapshot.accountName,
    personSlug: snapshot.personSlug,
    personName: snapshot.personName,
    path: snapshot.path,
    sectionsViewed: [...snapshot.sectionsViewed].sort(),
    ctaIds: [...snapshot.ctaIds].sort(),
    variantHistory: [...snapshot.variantHistory].sort(),
    scrollDepthPct: snapshot.scrollDepthPct,
    durationSeconds: snapshot.durationSeconds,
    variantSlug: snapshot.variantSlug,
    lastCtaId: snapshot.lastCtaId,
  });
}