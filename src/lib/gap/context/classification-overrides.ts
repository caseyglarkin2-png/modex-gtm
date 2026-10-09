/**
 * CLASSIFICATION OVERRIDES (C12 of the commercial-context audit, 2026-10-08). Server only, append-only.
 *
 * A seller's correction of a purpose or a relationship is a durable, explainable fact: one `conversation.classified`
 * row in the existing GAP audit ledger (gapAuditEvent, append-only) with the SOURCE id it is about (one thread or one
 * message, never a domain), the rationale, the version (one more than the rows before it on the same source) and
 * the machine suggestion it replaced. Readers apply the newest version to the one conversation it names and keep
 * the machine suggestion beside it, so a later agent run honours the correction and a reviewer can still see what
 * the classifier said. Correcting one media thread never touches another thread from the same domain.
 */
import type { Purpose, Relationship } from './commercial-context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const CLASSIFIED_KIND = 'conversation.classified';
export const CLASSIFIED_SUBJECT_TYPE = 'conversation';

export type OverrideScope = 'message' | 'thread';

export interface MachineSuggestion {
  purpose: Purpose | null;
  relationship: Relationship | null;
}

export interface ClassificationOverride {
  /** The ledger row id; null when the row was built from an unstored input. */
  id: string | null;
  /** The thread id (scope thread) or the stored message id (scope message). */
  sourceId: string;
  scope: OverrideScope;
  purpose: Purpose | null;
  relationship: Relationship | null;
  rationale: string;
  version: number;
  actor: string;
  at: string;
  /** What the classifier said when the seller corrected it; kept beside the correction. */
  machine: MachineSuggestion | null;
}

export interface OverrideInput {
  sourceId: string;
  scope: OverrideScope;
  purpose?: Purpose | null;
  relationship?: Relationship | null;
  rationale: string;
  actor: string;
  machine?: MachineSuggestion | null;
  now?: Date;
}

export type OverrideRefusal = 'scope_not_allowed' | 'no_source' | 'no_rationale' | 'nothing_to_set' | 'not_stored';

const PURPOSES: ReadonlySet<string> = new Set(['buyer_conversation', 'customer_support', 'vendor_solicitation', 'partner_referral', 'media', 'internal', 'calendar', 'automated', 'suspicious', 'unknown']);
const RELATIONSHIPS: ReadonlySet<string> = new Set(['active_opportunity', 'customer', 'prospect', 'partner', 'vendor', 'media', 'internal', 'mixed', 'unknown']);

/**
 * Append one correction. Refuses a scope other than one message or one thread (a domain is never a scope), an empty
 * source id, an empty rationale, and a correction that sets nothing. The version is one more than the rows already
 * on that source, so a reader applies the newest and history stays.
 */
export async function recordOverride(prisma: PrismaLike, input: OverrideInput): Promise<{ ok: true; id: string; version: number } | { ok: false; reason: OverrideRefusal }> {
  if (input.scope !== 'message' && input.scope !== 'thread') return { ok: false, reason: 'scope_not_allowed' };
  const sourceId = (input.sourceId ?? '').trim();
  if (!sourceId) return { ok: false, reason: 'no_source' };
  const rationale = (input.rationale ?? '').trim();
  if (!rationale) return { ok: false, reason: 'no_rationale' };
  const purpose = input.purpose && PURPOSES.has(input.purpose) ? input.purpose : null;
  const relationship = input.relationship && RELATIONSHIPS.has(input.relationship) ? input.relationship : null;
  if (!purpose && !relationship) return { ok: false, reason: 'nothing_to_set' };
  if (typeof prisma?.gapAuditEvent?.create !== 'function' || typeof prisma?.gapAuditEvent?.count !== 'function') return { ok: false, reason: 'not_stored' };
  const prior: number = await prisma.gapAuditEvent.count({ where: { kind: CLASSIFIED_KIND, subject_type: CLASSIFIED_SUBJECT_TYPE, subject_id: sourceId } });
  const version = prior + 1;
  const at = (input.now ?? new Date()).toISOString();
  const payload = { sourceId, scope: input.scope, purpose, relationship, rationale, version, at, machine: input.machine ? { purpose: input.machine.purpose ?? null, relationship: input.machine.relationship ?? null } : null };
  const row = await prisma.gapAuditEvent.create({ data: { kind: CLASSIFIED_KIND, actor: input.actor, subject_type: CLASSIFIED_SUBJECT_TYPE, subject_id: sourceId, payload }, select: { id: true } });
  return { ok: true, id: String(row.id), version };
}

function fromRow(row: { id?: string; subject_id: string; actor: string; payload: unknown; created_at: Date | string }): ClassificationOverride | null {
  const p = row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : null;
  if (!p) return null;
  const scope = p.scope === 'thread' ? 'thread' : p.scope === 'message' ? 'message' : null;
  if (!scope) return null;
  const machine = p.machine && typeof p.machine === 'object' ? (p.machine as Record<string, unknown>) : null;
  return {
    id: row.id ? String(row.id) : null,
    sourceId: row.subject_id,
    scope,
    purpose: typeof p.purpose === 'string' && PURPOSES.has(p.purpose) ? (p.purpose as Purpose) : null,
    relationship: typeof p.relationship === 'string' && RELATIONSHIPS.has(p.relationship) ? (p.relationship as Relationship) : null,
    rationale: typeof p.rationale === 'string' ? p.rationale : '',
    version: typeof p.version === 'number' ? p.version : 1,
    actor: row.actor,
    at: typeof p.at === 'string' ? p.at : new Date(row.created_at).toISOString(),
    machine: machine ? { purpose: typeof machine.purpose === 'string' ? (machine.purpose as Purpose) : null, relationship: typeof machine.relationship === 'string' ? (machine.relationship as Relationship) : null } : null,
  };
}

/** The newest override per source id among `ids` (thread ids and message ids alike). Soft: an unreadable ledger reads none. */
export async function loadOverrides(prisma: PrismaLike, ids: readonly string[]): Promise<Map<string, ClassificationOverride>> {
  const want = [...new Set(ids.map((s) => (s ?? '').trim()).filter(Boolean))];
  const out = new Map<string, ClassificationOverride>();
  if (!want.length || typeof prisma?.gapAuditEvent?.findMany !== 'function') return out;
  let rows: Array<{ id?: string; subject_id: string; actor: string; payload: unknown; created_at: Date | string }> = [];
  try {
    rows = await prisma.gapAuditEvent.findMany({ where: { kind: CLASSIFIED_KIND, subject_type: CLASSIFIED_SUBJECT_TYPE, subject_id: { in: want } }, orderBy: { created_at: 'asc' }, select: { id: true, subject_id: true, actor: true, payload: true, created_at: true } });
  } catch {
    return out;
  }
  for (const r of rows) {
    const o = fromRow(r);
    if (!o) continue;
    const prev = out.get(o.sourceId);
    if (!prev || o.version > prev.version || (o.version === prev.version && o.at >= prev.at)) out.set(o.sourceId, o);
  }
  return out;
}

export interface Overridable {
  id: string;
  providerIds: readonly string[];
  threadId?: string | null;
  purpose: Purpose | null;
}

export type Overridden<E extends Overridable> = E & {
  /** The classifier's suggestion, kept beside the correction. */
  machinePurpose: Purpose | null;
  override: ClassificationOverride | null;
};

/** The override that names this one event: by its id or a provider id (scope message), or by its thread (scope thread). */
export function overrideFor<E extends Overridable>(event: E, overrides: ReadonlyMap<string, ClassificationOverride>): ClassificationOverride | null {
  const direct = overrides.get(event.id) ?? event.providerIds.map((p) => overrides.get(p)).find((o): o is ClassificationOverride => !!o) ?? null;
  if (direct && direct.scope === 'message') return direct;
  if (event.threadId) {
    const t = overrides.get(event.threadId);
    if (t && t.scope === 'thread') return t;
  }
  return direct;
}

/** Apply the newest override to the events it names and keep the machine suggestion; every other event is untouched. */
export function applyOverrides<E extends Overridable>(events: readonly E[], overrides: ReadonlyMap<string, ClassificationOverride>): Array<Overridden<E>> {
  return events.map((e) => {
    const o = overrideFor(e, overrides);
    if (!o || !o.purpose) return { ...e, machinePurpose: e.purpose, override: o };
    return { ...e, purpose: o.purpose, machinePurpose: e.purpose, override: o };
  });
}

/** The relationship a seller settled for one conversation, when one was recorded; null otherwise. */
export function relationshipOverride(threadId: string | null | undefined, overrides: ReadonlyMap<string, ClassificationOverride>): Relationship | null {
  if (!threadId) return null;
  const o = overrides.get(threadId);
  return o && o.scope === 'thread' ? o.relationship : null;
}
