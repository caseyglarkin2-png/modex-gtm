/**
 * THE INTELLIGENCE IMPORT (intelligence wiring, IW02, 2026-10-09). Server only; side-effect free beyond the rows.
 *
 * A producer's batch of IntelligenceRecordInput records becomes `gap_signals` rows (origin `report_import`), one
 * per stable identity (producer + item id, hashed into `url_hash`):
 *   - a new identity is ACCEPTED: the account is resolved conservatively from the hint, the title and the first
 *     source url (the existing resolver; never a fetch), the relevance and themes come from the deterministic
 *     classifier, research stays `none` (display needs no verification), and a source url already captured from
 *     elsewhere groups the row into that event (every source kept)
 *   - the same identity with the same content hash is a DUPLICATE: nothing changes
 *   - the same identity with a different content hash is a REVISION: the substance is replaced and the previous hash
 *     is kept under `revisions`; Casey's dispositions (feedback, a human resolution) are never touched
 *   - an INVALID record is reported by index and reason; its neighbours still land
 *   - one `intelligence.imported` ledger row per producer per call records the run, the counts and the cursor, so
 *     the continuing sync is visible (IW13)
 * Nothing here posts to Slack, writes HubSpot, queues research, fetches a page or calls a model.
 */
import { classifySignal, normalizeSignalUrl, resolveSignalAccount, signalUrlHash, type Resolution } from './intake';
import { INTEL_IMPORTED_EVENT, REPORT_ARCHIVE_CLASS, REPORT_IMPORT_ORIGIN, REPORT_ITEM_CLASS, importOf, intelligenceContentHash, intelligenceIdentityHash, validateIntelligenceRecord, type IntelligenceRecord } from './intelligence-record';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type ImportOutcome = 'accepted' | 'duplicate' | 'revised' | 'invalid';
export interface ImportItemResult {
  index: number;
  producer: string | null;
  producerItemId: string | null;
  outcome: ImportOutcome;
  id?: string;
  reason?: string;
}
export interface ImportResult {
  accepted: number;
  duplicates: number;
  revised: number;
  invalid: number;
  items: ImportItemResult[];
  /** The ledger rows written, one per producer in the batch. */
  runs: Array<{ producer: string; runId: string | null; ledgerId: string | null }>;
}

export interface ImportInput {
  records: unknown[];
  actor: string;
  now: Date;
  /** The producer's own run id for the batch (else each record's); the cursor it reached (a paged export). */
  runId?: string | null;
  cursor?: string | null;
  /** The batch's producer when every record is from one (a check: a record from another is invalid). */
  producer?: string | null;
  /** The producer's own account of the run (a failure or a partial read), recorded on the ledger row. */
  producerState?: { status: 'ok' | 'partial' | 'failed'; detail?: string | null } | null;
}

export const IMPORT_BATCH_MAX = 500;

const dateOnly = (d: string) => new Date(`${d}T00:00:00.000Z`);

export async function importIntelligenceBatch(prisma: PrismaLike, input: ImportInput): Promise<ImportResult> {
  const items: ImportItemResult[] = [];
  const perProducer = new Map<string, { accepted: number; duplicates: number; revised: number; invalid: number; runIds: Set<string>; reportedOn: Set<string> }>();
  const tally = (producer: string) => {
    let t = perProducer.get(producer);
    if (!t) { t = { accepted: 0, duplicates: 0, revised: 0, invalid: 0, runIds: new Set(), reportedOn: new Set() }; perProducer.set(producer, t); }
    return t;
  };
  const records = (input.records ?? []).slice(0, IMPORT_BATCH_MAX);
  for (let index = 0; index < records.length; index += 1) {
    const v = validateIntelligenceRecord(records[index]);
    if (!v.ok) {
      const raw = (records[index] ?? {}) as Record<string, unknown>;
      const producer = typeof raw.producer === 'string' ? raw.producer : input.producer ?? null;
      if (producer) tally(producer).invalid += 1;
      items.push({ index, producer, producerItemId: typeof raw.producerItemId === 'string' ? raw.producerItemId : null, outcome: 'invalid', reason: v.reason });
      continue;
    }
    const r = v.record;
    if (input.producer && r.producer !== input.producer) {
      tally(r.producer).invalid += 1;
      items.push({ index, producer: r.producer, producerItemId: r.producerItemId, outcome: 'invalid', reason: 'producer_mismatch' });
      continue;
    }
    const t = tally(r.producer);
    t.runIds.add(r.producerRunId);
    t.reportedOn.add(r.reportedOn);
    const identity = intelligenceIdentityHash(r.producer, r.producerItemId);
    const contentHash = intelligenceContentHash(r);
    try {
      const existing: { id: string; metadata: unknown; resolution: string } | null = await prisma.gapSignal.findUnique({ where: { url_hash: identity }, select: { id: true, metadata: true, resolution: true } });
      if (existing) {
        const prev = importOf(existing.metadata);
        if (prev && prev.contentHash === contentHash) {
          t.duplicates += 1;
          items.push({ index, producer: r.producer, producerItemId: r.producerItemId, outcome: 'duplicate', id: existing.id });
          continue;
        }
        const meta = (existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}) as Record<string, unknown>;
        const record: IntelligenceRecord = { ...r, importedAt: prev?.importedAt ?? input.now.toISOString(), contentHash, revisions: [...(prev?.revisions ?? []), ...(prev ? [{ contentHash: prev.contentHash, replacedAt: input.now.toISOString() }] : [])] };
        // A revision may now name an account where the row still needs one; a human or settled resolution stands.
        const reResolved = existing.resolution !== 'resolved' && (r.accountHint || r.title) ? await resolveSafely(prisma, r) : null;
        const firstUrl = r.sources.find((s) => s.url)?.url ?? null;
        await prisma.gapSignal.update({
          where: { id: existing.id },
          data: {
            title: r.title,
            url: firstUrl,
            published_at: dateOnly(r.eventDate ?? r.reportedOn),
            ...(r.kind === 'report' ? {} : { ...classification(r, reResolved?.accountName ?? null) }),
            ...(reResolved?.resolution === 'resolved' ? { account_name: reResolved.accountName, resolution: 'resolved', resolution_basis: reResolved.basis, candidates: undefined } : {}),
            metadata: { ...meta, normalizedUrl: firstUrl ? normalizeSignalUrl(firstUrl) : null, import: record },
          },
        });
        t.revised += 1;
        items.push({ index, producer: r.producer, producerItemId: r.producerItemId, outcome: 'revised', id: existing.id });
        continue;
      }
      const firstUrl = r.sources.find((s) => s.url)?.url ?? null;
      const normalized = firstUrl ? normalizeSignalUrl(firstUrl) : null;
      const res = r.kind === 'report' ? ({ resolution: 'needs_account', accountName: null, basis: null, candidates: [] } as Resolution) : await resolveSafely(prisma, r);
      // The same source url captured from elsewhere (a Casey share, discovery): this row joins that event.
      const twin: { id: string; event_id: string | null } | null = normalized ? await prisma.gapSignal.findUnique({ where: { url_hash: signalUrlHash(normalized) }, select: { id: true, event_id: true } }).catch(() => null) : null;
      const record: IntelligenceRecord = { ...r, importedAt: input.now.toISOString(), contentHash, revisions: [] };
      let row: { id: string };
      try {
        row = await prisma.gapSignal.create({
          data: {
            url: firstUrl,
            url_hash: identity,
            title: r.title,
            source_name: r.producerLabel,
            published_at: dateOnly(r.eventDate ?? r.reportedOn),
            origin: REPORT_IMPORT_ORIGIN,
            source_class: r.kind === 'report' ? REPORT_ARCHIVE_CLASS : REPORT_ITEM_CLASS,
            note: null,
            account_hint: r.accountHint,
            account_name: res.accountName,
            candidates: res.candidates.length ? res.candidates : undefined,
            resolution: res.resolution,
            resolution_basis: res.basis,
            research_status: 'none',
            ...(r.kind === 'report' ? { relevance: 'research_lead', score: null, categories: [] } : classification(r, res.accountName)),
            event_id: twin ? (twin.event_id ?? twin.id) : null,
            submitted_by: `import:${r.producer}`,
            metadata: { normalizedUrl: normalized, import: record },
          },
          select: { id: true },
        });
      } catch (e) {
        if ((e as { code?: string })?.code === 'P2002') {
          const winner: { id: string } | null = await prisma.gapSignal.findUnique({ where: { url_hash: identity }, select: { id: true } });
          t.duplicates += 1;
          items.push({ index, producer: r.producer, producerItemId: r.producerItemId, outcome: 'duplicate', id: winner?.id });
          continue;
        }
        throw e;
      }
      if (!twin) await prisma.gapSignal.update({ where: { id: row.id }, data: { event_id: row.id } });
      t.accepted += 1;
      items.push({ index, producer: r.producer, producerItemId: r.producerItemId, outcome: 'accepted', id: row.id });
    } catch (e) {
      t.invalid += 1;
      items.push({ index, producer: r.producer, producerItemId: r.producerItemId, outcome: 'invalid', reason: `write_failed: ${(e instanceof Error ? e.message : String(e)).slice(0, 160)}` });
    }
  }
  const runs: ImportResult['runs'] = [];
  for (const [producer, t] of perProducer) {
    const runId = input.runId ?? (t.runIds.size === 1 ? [...t.runIds][0] : null);
    const reportedOn = [...t.reportedOn].sort();
    const payload = {
      runId,
      runIds: [...t.runIds].slice(0, 50),
      cursor: input.cursor ?? null,
      accepted: t.accepted,
      duplicates: t.duplicates,
      revised: t.revised,
      invalid: t.invalid,
      reportedOnFrom: reportedOn[0] ?? null,
      reportedOnTo: reportedOn[reportedOn.length - 1] ?? null,
      producerState: input.producerState ?? { status: 'ok' },
      at: input.now.toISOString(),
    };
    const ledger: { id: string } | null = typeof prisma?.gapAuditEvent?.create === 'function' ? await prisma.gapAuditEvent.create({ data: { kind: INTEL_IMPORTED_EVENT, actor: input.actor, subject_type: 'producer', subject_id: producer, payload }, select: { id: true } }).catch(() => null) : null;
    runs.push({ producer, runId, ledgerId: ledger?.id ?? null });
  }
  return {
    accepted: items.filter((i) => i.outcome === 'accepted').length,
    duplicates: items.filter((i) => i.outcome === 'duplicate').length,
    revised: items.filter((i) => i.outcome === 'revised').length,
    invalid: items.filter((i) => i.outcome === 'invalid').length,
    items,
    runs,
  };
}

/** The deterministic class and themes for a record: the title with the start of its passage (keywords only; no model). */
function classification(r: { title: string; text: string }, accountName: string | null): { relevance: string; score: number | null; categories: string[] } {
  const c = classifySignal(`${r.title}. ${r.text.slice(0, 400)}`, accountName);
  return { relevance: c.relevance, score: c.score, categories: c.categories };
}

async function resolveSafely(prisma: PrismaLike, r: { accountHint: string | null; title: string; sources: Array<{ url: string | null }> }): Promise<Resolution> {
  try {
    return await resolveSignalAccount(prisma, { accountHint: r.accountHint, title: r.title, url: r.sources.find((s) => s.url)?.url ?? null });
  } catch {
    return { resolution: 'needs_account', accountName: null, basis: null, candidates: [] } as Resolution;
  }
}
