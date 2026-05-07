import { prisma } from '@/lib/prisma';
import { parseDomainFromEmail, normalizeName, normalizeTitle, scoreContactQuality } from '@/lib/contact-standard';
import { computeRecipientReadiness } from '@/lib/revops/recipient-readiness';
import type { AgentActionResult } from '@/lib/agent-actions/types';
import { importExternalContact } from '@/lib/contacts/external-contact-import';
import type { Prisma } from '@prisma/client';

export type ContactCandidateState = 'staged' | 'promoted' | 'replaced' | 'deferred';

export type AccountContactCandidateView = {
  id: number;
  accountName: string;
  candidateKey: string;
  fullName: string;
  title: string | null;
  email: string | null;
  emailValid: boolean;
  companyDomain: string | null;
  linkedinUrl: string | null;
  source: string | null;
  sourceProvider: string | null;
  confidenceScore: number;
  qualityScore: number;
  recommended: boolean;
  recommendationReason: string | null;
  state: ContactCandidateState;
  promotedPersonaId: number | null;
  replacedPersonaId: number | null;
  deferredReason: string | null;
  lastSeenAt: string;
  readiness: {
    score: number;
    tier: 'high' | 'medium' | 'low';
    stale: boolean;
    freshness_days: number | null;
    reasons: string[];
  };
};

type NormalizedCandidate = {
  candidateKey: string;
  fullName: string;
  normalizedName: string;
  title: string | null;
  email: string | null;
  emailValid: boolean;
  emailConfidence: number;
  companyDomain: string | null;
  linkedinUrl: string | null;
  source: string | null;
  sourceAction: string;
  sourceProvider: string | null;
  sourceContactId: string | null;
  sourcePayload: Record<string, unknown>;
  confidenceScore: number;
  qualityScore: number;
  readinessScore: number;
  readinessTier: 'high' | 'medium' | 'low';
  readinessDetails: Record<string, unknown>;
  recommended: boolean;
  recommendationReason: string;
};

function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : null;
}

function cleanEmail(value: string | null) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function isValidEmail(value: string | null) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function extractRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(Boolean) as Array<Record<string, unknown>> : [];
}

function extractCompanyContactRecords(result: AgentActionResult) {
  const data = result.data as Record<string, unknown>;
  const directContacts = extractRecords(data.contacts);
  const salesContacts = extractRecords(data.salesContacts);
  const decisionMakers = extractRecords(data.decisionMakers);
  const nestedDecisionMakers = extractRecords(((data.salesAgent as Record<string, unknown> | undefined)?.decisionMakers as Record<string, unknown> | undefined)?.decision_makers);

  return [
    ...directContacts.map((record) => ({ record, source: 'company_contacts', recommended: true })),
    ...salesContacts.map((record) => ({ record, source: 'sales_contacts', recommended: false })),
    ...decisionMakers.map((record) => ({ record, source: 'decision_makers', recommended: false })),
    ...nestedDecisionMakers.map((record) => ({ record, source: 'decision_makers', recommended: false })),
  ];
}

export function normalizeDiscoveredContactCandidates(
  accountName: string,
  result: AgentActionResult,
): NormalizedCandidate[] {
  const seen = new Set<string>();
  const company = ((result.data.company ?? result.data.account ?? {}) as Record<string, unknown>);
  const companyDomainHint = safeString(company.domain) || safeString(company.website).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

  return extractCompanyContactRecords(result)
    .map(({ record, source, recommended }, index) => {
      const fullName = safeString(record.name) || safeString(record.full_name) || safeString(record.first_name);
      const email = cleanEmail(safeString(record.email) || null);
      const emailValid = isValidEmail(email);
      const title = safeString(record.title) || safeString(record.job_title) || null;
      const linkedinUrl = safeString(record.linkedin_url) || safeString(record.linkedin) || null;
      const companyDomain = safeString(record.company_domain)
        || safeString(record.domain)
        || parseDomainFromEmail(email)
        || companyDomainHint
        || null;
      const sourceContactId = safeString(record.id) || safeString(record.contact_id) || safeString(record.person_id) || null;
      const quality = scoreContactQuality({
        name: fullName || email || 'Unknown Contact',
        title,
        accountName,
        email,
        companyDomain,
        linkedinUrl,
        sourceUrl: linkedinUrl,
        sourceEvidenceCount: 2,
      });
      const readiness = computeRecipientReadiness({
        email_confidence: safeNumber(record.confidence) ?? quality.emailConfidence,
        quality_score: quality.score,
        title,
        role_in_deal: null,
        last_enriched_at: null,
      });
      const recommendationReason = recommended
        ? 'Surfaced directly by live contact discovery.'
        : quality.isReady
          ? 'Strong follow-on candidate from live discovery.'
          : 'Worth reviewing, but likely needs enrichment or replacement context.';
      const candidateKey = [
        sourceContactId || email || normalizeName(fullName || title || `${source}-${index}`),
        normalizeTitle(title || ''),
      ].filter(Boolean).join('::');

      return {
        candidateKey,
        fullName: fullName || email || 'Unknown Contact',
        normalizedName: normalizeName(fullName || email || 'unknown contact'),
        title,
        email,
        emailValid,
        emailConfidence: safeNumber(record.confidence) ?? quality.emailConfidence,
        companyDomain,
        linkedinUrl,
        source,
        sourceAction: 'company_contacts',
        sourceProvider: result.provider,
        sourceContactId,
        sourcePayload: record,
        confidenceScore: safeNumber(record.confidence) ?? (recommended ? 85 : 70),
        qualityScore: quality.score,
        readinessScore: readiness.score,
        readinessTier: readiness.tier,
        readinessDetails: {
          breakdown: readiness.breakdown,
          reasons: readiness.reasons,
          freshness_days: readiness.freshness_days,
        },
        recommended: recommended || index === 0,
        recommendationReason,
      } satisfies NormalizedCandidate;
    })
    .filter((candidate) => {
      const dedupeKey = (candidate.email || candidate.normalizedName).toLowerCase();
      if (!dedupeKey || seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    })
    .sort((left, right) => {
      if (right.recommended !== left.recommended) return Number(right.recommended) - Number(left.recommended);
      if (right.readinessScore !== left.readinessScore) return right.readinessScore - left.readinessScore;
      return left.fullName.localeCompare(right.fullName);
    });
}

export async function upsertAccountContactCandidates(
  accountName: string,
  result: AgentActionResult,
) {
  const candidates = normalizeDiscoveredContactCandidates(accountName, result);
  const saved: AccountContactCandidateView[] = [];

  for (const candidate of candidates) {
    const row = await prisma.accountContactCandidate.upsert({
      where: {
        account_name_candidate_key: {
          account_name: accountName,
          candidate_key: candidate.candidateKey,
        },
      },
      update: {
        full_name: candidate.fullName,
        normalized_name: candidate.normalizedName,
        title: candidate.title,
        email: candidate.email,
        email_valid: candidate.emailValid,
        email_confidence: candidate.emailConfidence,
        company_domain: candidate.companyDomain,
        linkedin_url: candidate.linkedinUrl,
        source: candidate.source,
        source_action: candidate.sourceAction,
        source_provider: candidate.sourceProvider,
        source_contact_id: candidate.sourceContactId,
        source_payload: candidate.sourcePayload as Prisma.InputJsonValue,
        confidence_score: candidate.confidenceScore,
        quality_score: candidate.qualityScore,
        readiness_score: candidate.readinessScore,
        readiness_tier: candidate.readinessTier,
        readiness_details: candidate.readinessDetails as Prisma.InputJsonValue,
        recommended: candidate.recommended,
        recommendation_reason: candidate.recommendationReason,
        state: 'staged',
        last_seen_at: new Date(),
      },
      create: {
        account_name: accountName,
        candidate_key: candidate.candidateKey,
        full_name: candidate.fullName,
        normalized_name: candidate.normalizedName,
        title: candidate.title,
        email: candidate.email,
        email_valid: candidate.emailValid,
        email_confidence: candidate.emailConfidence,
        company_domain: candidate.companyDomain,
        linkedin_url: candidate.linkedinUrl,
        source: candidate.source,
        source_action: candidate.sourceAction,
        source_provider: candidate.sourceProvider,
        source_contact_id: candidate.sourceContactId,
        source_payload: candidate.sourcePayload as Prisma.InputJsonValue,
        confidence_score: candidate.confidenceScore,
        quality_score: candidate.qualityScore,
        readiness_score: candidate.readinessScore,
        readiness_tier: candidate.readinessTier,
        readiness_details: candidate.readinessDetails as Prisma.InputJsonValue,
        recommended: candidate.recommended,
        recommendation_reason: candidate.recommendationReason,
        state: 'staged',
      },
    });
    saved.push(toAccountContactCandidateView(row));
  }

  return saved;
}

export async function listAccountContactCandidates(accountNames: string[]) {
  const rows = await prisma.accountContactCandidate.findMany({
    where: { account_name: { in: accountNames } },
    orderBy: [{ recommended: 'desc' }, { readiness_score: 'desc' }, { updated_at: 'desc' }],
  });
  return rows.map(toAccountContactCandidateView);
}

export async function deferAccountContactCandidate(candidateId: number, reason?: string | null) {
  const row = await prisma.accountContactCandidate.update({
    where: { id: candidateId },
    data: {
      state: 'deferred',
      deferred_reason: reason?.trim() || 'Deferred by operator',
    },
  });
  return toAccountContactCandidateView(row);
}

/**
 * Reverses a prior promote/defer/replace by resetting the candidate row back
 * to a staged state. Used by the toast-with-undo affordance on the candidates
 * panel — does NOT delete the imported persona created by `promote`/`replace`,
 * just unlinks the candidate row so the operator can re-decide.
 */
export async function restageAccountContactCandidate(candidateId: number) {
  const row = await prisma.accountContactCandidate.update({
    where: { id: candidateId },
    data: {
      state: 'staged',
      promoted_persona_id: null,
      replaced_persona_id: null,
      deferred_reason: null,
    },
  });
  return toAccountContactCandidateView(row);
}

export async function promoteAccountContactCandidate(candidateId: number, replacementPersonaId?: number | null) {
  const candidate = await prisma.accountContactCandidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) {
    throw new Error('Candidate not found.');
  }

  const importResult = await importExternalContact({
    source: 'manual',
    sourceContactId: candidate.source_contact_id,
    email: candidate.email,
    name: candidate.full_name,
    title: candidate.title,
    companyName: candidate.account_name,
    companyDomain: candidate.company_domain,
    linkedinUrl: candidate.linkedin_url,
    confidence: candidate.confidence_score,
    optedOut: false,
  });

  if (importResult.status === 'blocked' || importResult.status === 'skipped') {
    throw new Error(`Unable to promote candidate: ${importResult.reason}`);
  }

  if (replacementPersonaId) {
    const replacementTarget = await prisma.persona.findUnique({
      where: { id: replacementPersonaId },
      select: { id: true, account_name: true, name: true, next_step: true },
    });
    if (replacementTarget) {
      await prisma.persona.update({
        where: { id: replacementTarget.id },
        data: {
          persona_status: 'Needs Review',
          next_step: `Replaced by ${candidate.full_name} from staged contact discovery.`,
        },
      });
    }
  }

  const row = await prisma.accountContactCandidate.update({
    where: { id: candidateId },
    data: {
      state: replacementPersonaId ? 'replaced' : 'promoted',
      promoted_persona_id: importResult.personaId,
      replaced_persona_id: replacementPersonaId ?? null,
      deferred_reason: null,
    },
  });

  return {
    candidate: toAccountContactCandidateView(row),
    importResult,
  };
}

export function toAccountContactCandidateView(row: {
  id: number;
  account_name: string;
  candidate_key: string;
  full_name: string;
  title: string | null;
  email: string | null;
  email_valid: boolean;
  company_domain: string | null;
  linkedin_url: string | null;
  source: string | null;
  source_provider: string | null;
  confidence_score: number;
  quality_score: number;
  recommended: boolean;
  recommendation_reason: string | null;
  state: string;
  promoted_persona_id: number | null;
  replaced_persona_id: number | null;
  deferred_reason: string | null;
  last_seen_at: Date;
  readiness_score: number;
  readiness_tier: string;
  readiness_details: unknown;
}): AccountContactCandidateView {
  const details = (row.readiness_details ?? {}) as Record<string, unknown>;
  const reasons = Array.isArray(details.reasons) ? details.reasons.filter((item): item is string => typeof item === 'string') : [];
  const freshnessDays = typeof details.freshness_days === 'number' ? details.freshness_days : null;

  return {
    id: row.id,
    accountName: row.account_name,
    candidateKey: row.candidate_key,
    fullName: row.full_name,
    title: row.title,
    email: row.email,
    emailValid: row.email_valid,
    companyDomain: row.company_domain,
    linkedinUrl: row.linkedin_url,
    source: row.source,
    sourceProvider: row.source_provider,
    confidenceScore: row.confidence_score,
    qualityScore: row.quality_score,
    recommended: row.recommended,
    recommendationReason: row.recommendation_reason,
    state: row.state as ContactCandidateState,
    promotedPersonaId: row.promoted_persona_id,
    replacedPersonaId: row.replaced_persona_id,
    deferredReason: row.deferred_reason,
    lastSeenAt: row.last_seen_at.toISOString(),
    readiness: {
      score: row.readiness_score,
      tier: (row.readiness_tier as 'high' | 'medium' | 'low') || 'low',
      stale: reasons.includes('Stale or missing enrichment'),
      freshness_days: freshnessDays,
      reasons,
    },
  };
}
