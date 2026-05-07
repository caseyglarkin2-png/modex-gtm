import { z } from 'zod';
import type { GenerationInputContract } from '@/lib/agent-actions/generation-input';

const SOURCE_MARKER_RE = /\[\[SRC:([a-zA-Z0-9_-]+)\]\]/g;

export const SourceBackedEvidenceRefSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  claim: z.string().min(1),
  source_type: z.enum(['signal', 'proof', 'contact', 'manual']),
  provider: z.string().min(1).default('generation_input'),
});

export const SourceBackedAngleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  rationale: z.string().min(1),
  evidence_ref_ids: z.array(z.string().min(1)).min(1),
});

export const SourceBackedContractV1Schema = z.object({
  contract: z.literal('source_backed_contract_v1'),
  account_wedge: z.string().min(1),
  person_wedge: z.string().optional().nullable(),
  angles: z.array(SourceBackedAngleSchema).min(1),
  evidence_refs: z.array(SourceBackedEvidenceRefSchema).min(1),
  citation_count: z.number().int().min(0),
  citation_threshold: z.number().int().min(0).default(1),
});

export type SourceBackedContractV1 = z.infer<typeof SourceBackedContractV1Schema>;

type EvidenceCatalogRef = z.infer<typeof SourceBackedEvidenceRefSchema>;

function dedupe<T>(values: T[]) {
  return Array.from(new Set(values));
}

function normalizeParagraphs(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function extractSourceMarkers(content: string): string[] {
  const matches = Array.from(content.matchAll(SOURCE_MARKER_RE)).map((match) => match[1]).filter(Boolean);
  return dedupe(matches);
}

export function stripSourceMarkers(content: string): string {
  return content
    .replace(SOURCE_MARKER_RE, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildEvidenceCatalog(input?: GenerationInputContract | null): EvidenceCatalogRef[] {
  if (!input) return [];
  const signalRefs = input.signals.map((claim, index) => ({
    id: `signal_${index + 1}`,
    label: `Signal ${index + 1}`,
    claim,
    source_type: 'signal' as const,
    provider: 'generation_input',
  }));
  const proofRefs = input.proof_context.map((claim, index) => ({
    id: `proof_${index + 1}`,
    label: `Proof ${index + 1}`,
    claim,
    source_type: 'proof' as const,
    provider: 'generation_input',
  }));
  const contactRefs = input.recommended_contacts.map((contact, index) => ({
    id: `contact_${index + 1}`,
    label: `Contact ${index + 1}`,
    claim: `Recommended contact: ${contact}`,
    source_type: 'contact' as const,
    provider: 'generation_input',
  }));

  return [...signalRefs, ...proofRefs, ...contactRefs];
}

function buildAnglesFromContent(
  content: string,
  evidenceRefs: EvidenceCatalogRef[],
  markerIds: string[],
): Array<z.infer<typeof SourceBackedAngleSchema>> {
  const paragraphMarkerMap = normalizeParagraphs(content).slice(0, 3).map((paragraph) => ({
    paragraph,
    markers: extractSourceMarkers(paragraph),
  }));
  const fallbackEvidenceIds = markerIds.length > 0
    ? markerIds
    : evidenceRefs.slice(0, 2).map((entry) => entry.id);

  const angles = paragraphMarkerMap.map((entry, index) => ({
    id: `angle_${index + 1}`,
    label: index === 0 ? 'Primary angle' : `Angle ${index + 1}`,
    rationale: stripSourceMarkers(entry.paragraph).slice(0, 600),
    evidence_ref_ids: entry.markers.length > 0 ? entry.markers : fallbackEvidenceIds,
  })).filter((entry) => entry.rationale.length > 0 && entry.evidence_ref_ids.length > 0);

  if (angles.length > 0) return angles;
  if (!content.trim() || fallbackEvidenceIds.length === 0) return [];

  return [{
    id: 'angle_1',
    label: 'Primary angle',
    rationale: stripSourceMarkers(content).slice(0, 600),
    evidence_ref_ids: fallbackEvidenceIds,
  }];
}

export function buildSourceBackedContractFromGeneratedText(input: {
  content: string;
  accountName: string;
  personaName?: string | null;
  generationInput?: GenerationInputContract | null;
  citationThreshold?: number;
}): SourceBackedContractV1 | null {
  const evidenceCatalog = buildEvidenceCatalog(input.generationInput);
  if (evidenceCatalog.length === 0) return null;

  const markerIds = extractSourceMarkers(input.content);
  const validatedMarkerIds = markerIds.filter((marker) => evidenceCatalog.some((ref) => ref.id === marker));
  const angles = buildAnglesFromContent(input.content, evidenceCatalog, validatedMarkerIds);
  if (angles.length === 0) return null;

  const evidenceRefIdsUsed = dedupe(angles.flatMap((angle) => angle.evidence_ref_ids));
  const evidenceRefs = evidenceCatalog.filter((entry) => evidenceRefIdsUsed.includes(entry.id));
  if (evidenceRefs.length === 0) return null;

  const accountWedge = input.generationInput?.angle?.trim()
    || input.generationInput?.account_brief?.trim()
    || `Prioritize ${input.accountName} with a source-backed first touch.`;
  const personWedge = input.personaName?.trim()
    ? `Tailor the message to ${input.personaName} with lane-specific evidence.`
    : null;

  return SourceBackedContractV1Schema.parse({
    contract: 'source_backed_contract_v1',
    account_wedge: accountWedge,
    person_wedge: personWedge,
    angles,
    evidence_refs: evidenceRefs,
    citation_count: validatedMarkerIds.length,
    citation_threshold: input.citationThreshold ?? 1,
  });
}

export function assertMinimumCitationThreshold(input: {
  attribution: SourceBackedContractV1 | null;
  requireAttribution: boolean;
  citationThreshold?: number;
}): { ok: true } | { ok: false; reason: string; details: Record<string, unknown> } {
  if (!input.requireAttribution) return { ok: true };
  if (!input.attribution) {
    return {
      ok: false,
      reason: 'SOURCE_ATTRIBUTION_REQUIRED',
      details: { citationThreshold: input.citationThreshold ?? 1, citationCount: 0 },
    };
  }
  const threshold = input.citationThreshold ?? input.attribution.citation_threshold ?? 1;
  if (input.attribution.citation_count < threshold) {
    return {
      ok: false,
      reason: 'SOURCE_ATTRIBUTION_REQUIRED',
      details: {
        citationThreshold: threshold,
        citationCount: input.attribution.citation_count,
      },
    };
  }
  return { ok: true };
}

export function readSourceBackedContractFromMetadata(versionMetadata: unknown): {
  contract: SourceBackedContractV1 | null;
  legacyFallback: boolean;
} {
  if (!versionMetadata || typeof versionMetadata !== 'object') {
    return { contract: null, legacyFallback: true };
  }
  const metadata = versionMetadata as Record<string, unknown>;
  const candidate = metadata.source_backed_contract_v1 ?? metadata.source_attribution;
  const parsed = SourceBackedContractV1Schema.safeParse(candidate);
  if (!parsed.success) {
    return { contract: null, legacyFallback: true };
  }
  return { contract: parsed.data, legacyFallback: false };
}
