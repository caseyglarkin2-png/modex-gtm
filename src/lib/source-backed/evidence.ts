import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const EVIDENCE_FRESH_TTL_MS = 48 * 60 * 60 * 1000;
export const EVIDENCE_AGING_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type EvidenceFreshnessStatus = 'fresh' | 'aging' | 'stale';

export type EvidenceSummary = {
  run: {
    total: number;
    succeeded: number;
    failed: number;
    partial: number;
    latestStatus: string | null;
    latestAt: string | null;
  };
  freshness: {
    fresh: number;
    aging: number;
    stale: number;
  };
  providerErrors: Record<string, string>;
  latestClaims: Array<{
    id: string;
    claim: string;
    sourceUrl: string;
    freshness: EvidenceFreshnessStatus;
    observedAt: string;
  }>;
};

export function evaluateEvidenceFreshness(observedAt: Date, now = new Date()): EvidenceFreshnessStatus {
  const age = now.getTime() - observedAt.getTime();
  if (age <= EVIDENCE_FRESH_TTL_MS) return 'fresh';
  if (age <= EVIDENCE_AGING_TTL_MS) return 'aging';
  return 'stale';
}

type EvidenceClaimInput = {
  accountName: string;
  personaId?: number | null;
  claim: string;
  claimHash: string;
  sourceUrl: string;
  sourceTitle?: string | null;
  sourceType: string;
  provider: string;
  observedAt: Date;
  deterministicKey: string;
  metadata?: Record<string, unknown> | null;
};

export async function createResearchRun(
  client: PrismaClient,
  input: {
    accountName: string;
    personaId?: number | null;
    status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'partial';
    runKey?: string | null;
    providerStatus?: Record<string, unknown> | null;
    errorMap?: Record<string, unknown> | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
  },
) {
  return client.researchRun.create({
    data: {
      account_name: input.accountName,
      persona_id: input.personaId ?? null,
      status: input.status ?? 'queued',
      run_key: input.runKey ?? null,
      provider_status: input.providerStatus ? JSON.parse(JSON.stringify(input.providerStatus)) : undefined,
      error_map: input.errorMap ? JSON.parse(JSON.stringify(input.errorMap)) : undefined,
      started_at: input.startedAt ?? undefined,
      completed_at: input.completedAt ?? undefined,
    },
    select: { id: true },
  });
}

export async function upsertEvidenceRecords(
  client: PrismaClient,
  researchRunId: string,
  claims: EvidenceClaimInput[],
) {
  for (const claim of claims) {
    const freshness = evaluateEvidenceFreshness(claim.observedAt);
    await client.evidenceRecord.upsert({
      where: {
        account_name_claim_hash_source_url_observed_at: {
          account_name: claim.accountName,
          claim_hash: claim.claimHash,
          source_url: claim.sourceUrl,
          observed_at: claim.observedAt,
        },
      },
      update: {
        research_run_id: researchRunId,
        persona_id: claim.personaId ?? null,
        claim: claim.claim,
        source_title: claim.sourceTitle ?? null,
        source_type: claim.sourceType,
        provider: claim.provider,
        freshness_status: freshness,
        fresh_until: freshness === 'fresh' ? new Date(claim.observedAt.getTime() + EVIDENCE_FRESH_TTL_MS) : null,
        deterministic_key: claim.deterministicKey,
        metadata: claim.metadata ? JSON.parse(JSON.stringify(claim.metadata)) : undefined,
      },
      create: {
        research_run_id: researchRunId,
        account_name: claim.accountName,
        persona_id: claim.personaId ?? null,
        claim: claim.claim,
        claim_hash: claim.claimHash,
        source_url: claim.sourceUrl,
        source_title: claim.sourceTitle ?? null,
        source_type: claim.sourceType,
        provider: claim.provider,
        observed_at: claim.observedAt,
        freshness_status: freshness,
        fresh_until: freshness === 'fresh' ? new Date(claim.observedAt.getTime() + EVIDENCE_FRESH_TTL_MS) : null,
        deterministic_key: claim.deterministicKey,
        metadata: claim.metadata ? JSON.parse(JSON.stringify(claim.metadata)) : undefined,
      },
    });
  }
}

export async function loadEvidenceSummaryByAccountScope(
  accountNames: string[],
  db: PrismaClient = prisma,
): Promise<EvidenceSummary | null> {
  if (accountNames.length === 0) return null;

  const [runs, evidenceRows] = await Promise.all([
    db.researchRun.findMany({
      where: { account_name: { in: accountNames } },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        status: true,
        created_at: true,
        error_map: true,
      },
    }),
    db.evidenceRecord.findMany({
      where: { account_name: { in: accountNames }, is_superseded: false },
      orderBy: [{ observed_at: 'desc' }, { updated_at: 'desc' }],
      take: 25,
      select: {
        id: true,
        claim: true,
        source_url: true,
        observed_at: true,
        freshness_status: true,
      },
    }),
  ]);

  if (runs.length === 0 && evidenceRows.length === 0) return null;

  const providerErrors = runs.reduce<Record<string, string>>((acc, run) => {
    if (!run.error_map || typeof run.error_map !== 'object') return acc;
    const entries = Object.entries(run.error_map as Record<string, unknown>);
    for (const [provider, message] of entries) {
      if (acc[provider]) continue;
      acc[provider] = String(message);
    }
    return acc;
  }, {});

  const freshness = evidenceRows.reduce(
    (acc, row) => {
      const status = row.freshness_status === 'fresh' || row.freshness_status === 'aging' || row.freshness_status === 'stale'
        ? row.freshness_status
        : evaluateEvidenceFreshness(row.observed_at);
      acc[status] += 1;
      return acc;
    },
    { fresh: 0, aging: 0, stale: 0 },
  );

  return {
    run: {
      total: runs.length,
      succeeded: runs.filter((run) => run.status === 'succeeded').length,
      failed: runs.filter((run) => run.status === 'failed').length,
      partial: runs.filter((run) => run.status === 'partial').length,
      latestStatus: runs[0]?.status ?? null,
      latestAt: runs[0]?.created_at?.toISOString() ?? null,
    },
    freshness,
    providerErrors,
    latestClaims: evidenceRows.slice(0, 6).map((row) => ({
      id: row.id,
      claim: row.claim,
      sourceUrl: row.source_url,
      freshness: row.freshness_status === 'fresh' || row.freshness_status === 'aging' || row.freshness_status === 'stale'
        ? row.freshness_status
        : evaluateEvidenceFreshness(row.observed_at),
      observedAt: row.observed_at.toISOString(),
    })),
  };
}
