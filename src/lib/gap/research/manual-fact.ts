/**
 * A PUBLIC fact Casey types by hand (Phase 2 A1, 2026-09-28).
 *
 * Before this, a hand-added public fact was registered as `source_kind
 * manual` and the evidence gate refused every one of them as operator
 * knowledge, while the form called it "Quotable". Now it goes through THE
 * verification contract research uses (research/run.ts verifyCandidate):
 * re-fetch the URL, find the sentence verbatim, require a publication date and
 * a physical-network change, and require the page to name the account.
 *
 *   verified   stored through storeVerifiedFact exactly like a research fact
 *              (EvidenceRecord + evidence_record signal with the verified
 *              stamp). It may satisfy the evidence gate.
 *   refused    kept as CONTEXT: the old `manual` signal, which the gate always
 *              refuses for outbound, with the reason saying why.
 *
 * There is no other path to the verified stamp. Operator knowledge (the other
 * form mode) never comes here and is never quotable. Nothing here edits,
 * approves or activates a hypothesis; linking stays a separate human step.
 */
import { createHash } from 'node:crypto';
import { createResearchRun } from '@/lib/source-backed/evidence';
import { registerSignal } from '../signals/registry';
import { freshnessExpiresAt } from '../signals/freshness';
import { clip, type ProspectingSignalInput } from '../signals/projection';
import type { SignalType } from '../taxonomy';
import type { Candidate, FetchText } from './providers';
import { storeVerifiedFact, verificationContext, verifyCandidate } from './run';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface PublicFactInput {
  accountName: string;
  personaId: number | null;
  hubspotCompanyId?: string | null;
  url: string;
  title?: string | null;
  excerpt?: string | null;
  /** The source's publication date as Casey gave it; null when he gave none (then it cannot be verified). */
  publishedAt: Date | null;
  type?: SignalType;
  actor: string;
  now: Date;
}

export type PublicFactResult =
  | { verified: true; signalId: string; created: boolean; runId: string }
  | { verified: false; reason: string; signalId: string; created: boolean; runId: string };

export const MANUAL_FACT_AUDIT = 'research.manual_fact' as const;
const PUBLIC_CONFIDENCE = 60;
const TITLE_MAX = 120;

const sha1 = (v: string) => createHash('sha1').update(v).digest('hex');
const trimOrNull = (v: string | null | undefined) => {
  const t = (v ?? '').trim();
  return t ? t : null;
};

/** The unverified CONTEXT signal (source_kind manual): never quotable, the evidence gate always refuses it. */
export function publicContextSignalInput(input: PublicFactInput): ProspectingSignalInput {
  const type: SignalType = input.type ?? 'manual_research';
  const observedAt = input.publishedAt ?? input.now;
  return {
    accountName: input.accountName.trim(),
    hubspotCompanyId: trimOrNull(input.hubspotCompanyId),
    personaId: input.personaId ?? null,
    sourceKind: 'manual',
    // Keyed on account + url (R2-9): one story cited for two accounts is two facts.
    sourceId: `manual:${sha1(`${input.accountName.trim()}\n${input.url}`)}`,
    type,
    title: trimOrNull(input.title) ?? clip(input.url, TITLE_MAX),
    summary: null,
    sourceType: 'public_secondary',
    evidenceUrl: input.url,
    evidenceText: trimOrNull(input.excerpt),
    claimClass: null,
    externalOk: true,
    observedAt,
    confidence: PUBLIC_CONFIDENCE,
    freshnessExpiresAt: freshnessExpiresAt(type, observedAt),
    metadata: { by: input.actor },
    registeredBy: input.actor,
  };
}

function sourceTypeOf(url: string): Candidate['sourceType'] {
  try {
    return new URL(url).hostname.toLowerCase().endsWith('sec.gov') ? 'public_primary' : 'public_secondary';
  } catch {
    return 'public_secondary';
  }
}

export async function verifyPublicFact(prisma: PrismaLike, input: PublicFactInput, deps: { fetchText?: FetchText } = {}): Promise<PublicFactResult> {
  const accountName = input.accountName.trim();
  const candidate: Candidate = {
    provider: 'manual',
    url: input.url,
    title: trimOrNull(input.title) ?? clip(input.url, TITLE_MAX),
    publishedAt: input.publishedAt,
    excerpt: (input.excerpt ?? '').trim(),
    sourceType: sourceTypeOf(input.url),
  };
  const run = await createResearchRun(prisma, {
    accountName,
    personaId: input.personaId,
    status: 'succeeded',
    runKey: `gap_manual_fact:${accountName}:${sha1(input.url)}:${input.now.toISOString()}`,
    providerStatus: { purpose: 'gap_manual_fact', url: input.url },
    errorMap: {},
    startedAt: input.now,
    completedAt: input.now,
  });

  const v = await verifyCandidate(candidate, verificationContext(accountName, deps.fetchText));
  let result: PublicFactResult;
  if (v.ok) {
    const fact = await storeVerifiedFact(prisma, { runId: run.id, accountName, personaId: input.personaId, candidate: { ...candidate, publishedAt: v.publishedAt }, actor: input.actor, now: input.now });
    result = { verified: true, signalId: fact.signalId, created: true, runId: run.id };
  } else {
    const ctx = await registerSignal(prisma, publicContextSignalInput(input));
    result = { verified: false, reason: v.reason, signalId: ctx.id, created: ctx.created, runId: run.id };
  }

  await prisma.researchRun.update({
    where: { id: run.id },
    data: { provider_status: { purpose: 'gap_manual_fact', url: input.url, outcome: result.verified ? 'verified' : 'context_only', reason: result.verified ? null : result.reason, signalId: result.signalId } },
  });
  await prisma.gapAuditEvent.create({
    data: {
      kind: MANUAL_FACT_AUDIT,
      actor: input.actor,
      subject_type: 'research_run',
      subject_id: run.id,
      payload: { accountName, url: input.url, verified: result.verified, reason: result.verified ? null : result.reason, signalId: result.signalId },
    },
  });
  return result;
}

export { manualFactRefusalCopy } from './manual-fact-copy';
