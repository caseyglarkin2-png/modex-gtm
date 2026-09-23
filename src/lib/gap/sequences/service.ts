/**
 * S3-T11: the sequence service. Turns a SequenceVersion whose every step has
 * a passing GapCompile row into a runtime `Sequence` row (prisma model
 * Sequence, `steps Json` in the legacy `{stepIndex, delayDays, ...}` shape
 * the modex Draft Queue runtime schedules from).
 *
 * Why the input carries compile ids: a version is a SHAPE, and a shape is
 * only send-eligible once the compiler has passed each step of it. The
 * caller names the GapCompile rows it is relying on; the service verifies,
 * through prisma, that every one exists, belongs to this version, is bound
 * to the hypothesis being enrolled (R3-3: `hypothesis_id === hypothesisId`;
 * a template-level row with a null hypothesis never counts here, because
 * materialize is a live act), and that
 * for every step of the version the NEWEST named row is a `pass`. Version
 * status is not the gate here: a draft with four passes may materialize,
 * a frozen version too; a retired version is refused because it blocks new
 * enrollments (spec 4.5). Nothing here sends anything.
 *
 * Step mapping is `toLegacySteps` from src/lib/gap/sequence/resolve-steps.ts
 * (S3-T5), the same function the runtime uses to read a pinned version, so
 * the materialized row and the pin agree on every field. The `delayUnit`
 * that mapping adds is kept on the row: the legacy runtime ignores unknown
 * keys and the GAP runtime routes business-day delays through it.
 *
 * Idempotent on the row name `<family name> v<version>`: a second call finds
 * the existing row, compares its stored steps with `toLegacySteps(version)`
 * by value, and answers `existing: true` without writing; a row of that name
 * whose steps differ is refused `sequence_name_collision` (S11), because a
 * run stamped with that Sequence id would schedule copy the compile rows
 * never judged. The audit
 * kind `sequence.materialized` is not yet in GapAuditKind (src/lib/gap/audit.ts
 * belongs to another ticket); it is cast here and the union should gain it.
 *
 * House conventions: `prisma: any` glue, refusal objects `{ ok: false, reason }`.
 * Voice: no em dashes.
 */
import { audit, type AuditResult, type GapAuditKind } from '@/lib/gap/audit';
import { toLegacySteps, type ResolvedStep } from '@/lib/gap/sequence/resolve-steps';
import { parseSteps } from '@/lib/gap/sequence/steps';

export const MATERIALIZED_AUDIT_KIND: GapAuditKind = 'sequence.materialized';

export interface MaterializeInput {
  versionId: string;
  /** The hypothesis every named compile row must be bound to (R3-3). */
  hypothesisId: string;
  /** The GapCompile row ids the caller relies on; every step needs one whose newest verdict is pass. */
  compileIds: string[];
}

export interface MaterializeOptions {
  /** Owner column of the Sequence row; defaults to the actor. */
  owner?: string;
  now?: () => Date;
}

export type MaterializeRefusal =
  | 'version_not_found'
  | 'version_retired'
  | 'no_compile_ids'
  | `invalid_version_steps:${string}`
  | `compile_not_found:${string}`
  | `compile_wrong_version:${string}`
  | `compile_wrong_hypothesis:${string}`
  | `compile_template_only:${string}`
  | `step_not_compiled:${number}`
  | `step_not_passed:${number}`
  | 'sequence_name_collision';

export type MaterializeResult =
  | { ok: true; sequenceId: number; name: string; existing: boolean; steps: ResolvedStep[]; audit?: AuditResult }
  | { ok: false; reason: MaterializeRefusal };

interface CompileRowLike {
  id: string;
  sequence_version_id: string | null;
  step_index: number | null;
  verdict: string;
  created_at: Date | string;
  hypothesis_id?: string | null;
}

/** Key-order-independent JSON for a by-value comparison of stored steps against the mapping. */
function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.keys(v as Record<string, unknown>)
          .sort()
          .map((k) => [k, sort((v as Record<string, unknown>)[k])]),
      );
    }
    return v;
  };
  return JSON.stringify(sort(value));
}

/** True when the stored `sequences.steps` Json equals the mapping by value. */
export function storedStepsMatch(stored: unknown, expected: ResolvedStep[]): boolean {
  if (!Array.isArray(stored)) return false;
  return canonicalJson(stored) === canonicalJson(expected);
}

export function sequenceNameFor(familyName: string | null | undefined, version: number): string {
  const base = (familyName ?? '').trim() || 'GAP family';
  return `${base} v${version}`;
}

/**
 * Pure: for each step index, the newest compile row among `rows` must be a
 * pass. Returns the first refusal in step order, or null.
 */
export function verifyStepCompiles(stepCount: number, rows: readonly CompileRowLike[]): MaterializeRefusal | null {
  for (let i = 0; i < stepCount; i += 1) {
    const forStep = rows
      .filter((r) => r.step_index === i)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (forStep.length === 0) return `step_not_compiled:${i}`;
    if (forStep[0].verdict !== 'pass') return `step_not_passed:${i}`;
  }
  return null;
}

export async function materializeSequence(
  prisma: any,
  input: MaterializeInput,
  actor: string,
  opts: MaterializeOptions = {},
): Promise<MaterializeResult> {
  const compileIds = Array.from(new Set((input.compileIds ?? []).filter((id) => typeof id === 'string' && id.length > 0)));
  if (compileIds.length === 0) return { ok: false, reason: 'no_compile_ids' };

  const version = await prisma.sequenceVersion.findUnique({
    where: { id: input.versionId },
    select: { id: true, version: true, status: true, steps: true, family: { select: { id: true, name: true } } },
  });
  if (!version) return { ok: false, reason: 'version_not_found' };
  if (version.status === 'retired') return { ok: false, reason: 'version_retired' };

  const parsed = parseSteps(version.steps);
  if (!parsed.ok) return { ok: false, reason: `invalid_version_steps:${parsed.reason}` };

  const rows: CompileRowLike[] = await prisma.gapCompile.findMany({
    where: { id: { in: compileIds } },
    select: { id: true, sequence_version_id: true, step_index: true, verdict: true, created_at: true, hypothesis_id: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const id of compileIds) {
    const row = byId.get(id);
    if (!row) return { ok: false, reason: `compile_not_found:${id}` };
    if (row.sequence_version_id !== version.id) return { ok: false, reason: `compile_wrong_version:${id}` };
    const boundTo = row.hypothesis_id ?? null;
    if (boundTo === null) return { ok: false, reason: `compile_template_only:${id}` };
    if (boundTo !== input.hypothesisId) return { ok: false, reason: `compile_wrong_hypothesis:${id}` };
  }
  const refusal = verifyStepCompiles(parsed.steps.steps.length, rows);
  if (refusal) return { ok: false, reason: refusal };

  const name = sequenceNameFor(version.family?.name, version.version);
  const steps = toLegacySteps(parsed.steps);

  const existing = await prisma.sequence.findFirst({
    where: { name },
    orderBy: { created_at: 'asc' },
    select: { id: true, steps: true },
  });
  if (existing) {
    if (!storedStepsMatch(existing.steps, steps)) return { ok: false, reason: 'sequence_name_collision' };
    return { ok: true, sequenceId: existing.id, name, existing: true, steps };
  }

  const created = await prisma.sequence.create({
    data: { name, owner: opts.owner ?? actor, steps },
    select: { id: true },
  });

  const now = opts.now ?? (() => new Date());
  const auditResult = await audit(prisma, {
    kind: MATERIALIZED_AUDIT_KIND,
    actor,
    subjectType: 'sequence',
    subjectId: String(created.id),
    payload: {
      sequenceId: created.id,
      name,
      versionId: version.id,
      familyId: version.family?.id ?? null,
      version: version.version,
      compileIds,
      stepCount: steps.length,
      materializedAt: now().toISOString(),
    },
  });

  return { ok: true, sequenceId: created.id, name, existing: false, steps, audit: auditResult };
}
