/**
 * GAP Prospecting OS signal registry (Sprint 1, S1-T5).
 *
 * Prisma glue for `prospecting_signals`. `prisma: any` follows the house
 * convention in `src/lib/queue/sequence-runtime.ts` so this compiles before
 * the client is regenerated and stays mockable in unit tests.
 *
 * Invariant: a signal is a frozen fact. Registration is idempotent on the
 * compound unique (source_kind, source_id) and NEVER updates an existing row.
 * A source that re-emits the same fact with different wording gets the
 * existing id back; a new fact needs a new source id.
 */

import type { ProjectionResult, ProspectingSignalInput } from './projection';

export interface RegisterResult {
  created: boolean;
  id: string;
}

export interface RegisterManyResult {
  created: number;
  existing: number;
  refused: Array<{ reason: string }>;
}

export interface FindSignalsOptions {
  /** Only rows whose freshness has not expired as of `now` (rows with no expiry always qualify). */
  fresh?: boolean;
  now?: Date;
}

/** camelCase input to the snake_case row Prisma expects. */
function toRow(input: ProspectingSignalInput) {
  return {
    account_name: input.accountName,
    hubspot_company_id: input.hubspotCompanyId ?? null,
    persona_id: input.personaId ?? null,
    source_kind: input.sourceKind,
    source_id: input.sourceId,
    type: input.type,
    title: input.title,
    summary: input.summary ?? null,
    source_type: input.sourceType,
    evidence_url: input.evidenceUrl ?? null,
    evidence_text: input.evidenceText ?? null,
    claim_class: input.claimClass ?? null,
    external_ok: input.externalOk ?? null,
    observed_at: input.observedAt,
    confidence: input.confidence,
    freshness_expires_at: input.freshnessExpiresAt ?? null,
    metadata: input.metadata ?? null,
    registered_by: input.registeredBy,
  };
}

function assertConfidence(confidence: number): void {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
    throw new Error(`prospecting signal confidence must be 0..100, got ${confidence}`);
  }
}

/**
 * Register one signal. Returns the existing row's id with `created: false`
 * when (source_kind, source_id) is already present; otherwise creates it.
 */
export async function registerSignal(
  prisma: any,
  input: ProspectingSignalInput,
): Promise<RegisterResult> {
  assertConfidence(input.confidence);

  const existing = await prisma.prospectingSignal.findUnique({
    where: {
      source_kind_source_id: { source_kind: input.sourceKind, source_id: input.sourceId },
    },
    select: { id: true },
  });
  if (existing) return { created: false, id: existing.id };

  const row = await prisma.prospectingSignal.create({ data: toRow(input) });
  return { created: true, id: row.id };
}

/**
 * Register a batch of adapter results in order. Refusals are counted and
 * skipped; they never reach the database.
 */
export async function registerMany(
  prisma: any,
  results: ProjectionResult[],
): Promise<RegisterManyResult> {
  const out: RegisterManyResult = { created: 0, existing: 0, refused: [] };
  for (const result of results) {
    if (!result.ok) {
      out.refused.push({ reason: result.reason });
      continue;
    }
    const registered = await registerSignal(prisma, result.signal);
    if (registered.created) out.created += 1;
    else out.existing += 1;
  }
  return out;
}

/** Every signal for an account, newest observation first. */
export async function findSignalsForAccount(
  prisma: any,
  accountName: string,
  options: FindSignalsOptions = {},
): Promise<any[]> {
  const where: Record<string, unknown> = { account_name: accountName };
  if (options.fresh) {
    const now = options.now ?? new Date();
    where.OR = [{ freshness_expires_at: null }, { freshness_expires_at: { gt: now } }];
  }
  return prisma.prospectingSignal.findMany({ where, orderBy: { observed_at: 'desc' } });
}
