/**
 * GAP Prospecting OS: HubSpot mirror for hypothesis events (S1-T11).
 *
 * HubSpot stays the commercial system of record; rich hypothesis state lives
 * in modex Postgres. On each hypothesis lifecycle event this module writes one
 * timeline Note on the COMPANY (machine marker `gap:hyp:<id>:<event>` plus a
 * readable summary) and stamps `yardflow_gap_status` and
 * `yardflow_gap_problem_family` (docs/GAP_PROSPECTING_OS.md section 9).
 *
 * Idempotent via `GapHubSpotMirror` (table gap_hubspot_mirror): a row with a
 * null `error` means the event is already mirrored and the call makes ZERO
 * HubSpot calls. A row with a non-null `error` is a recorded failure and the
 * next call retries. Failures are recorded on the row and NEVER thrown to the
 * caller: mirroring must not break the hypothesis service.
 *
 * Gates, in order: GAP_OS_ENABLED (call-time), GAP_HUBSPOT_MIRROR_ENABLED
 * (call-time, default OFF), HUBSPOT_SYNC_ENABLED, a HubSpot company id, the
 * idempotency row, then assertExternalWriteAllowed. Both GAP flags must be on:
 * HUBSPOT_SYNC_ENABLED defaults ON in src/lib/feature-flags.ts, so without the
 * GAP-specific mirror flag a GAP-enabled deploy would write live notes and
 * properties with no switch of its own.
 *
 * Every HubSpot call goes through `deps` so tests stub them; the defaults are
 * the real src/lib/hubspot writers. House convention for DB glue: `prisma: any`.
 */

import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import { createCompanyNote as realCreateCompanyNote } from '@/lib/hubspot/notes';
import { updateCompanyProperties as realUpdateCompanyProperties } from '@/lib/hubspot/companies';
import {
  ensureGapProperties as realEnsureGapProperties,
  GAP_PROPERTY_NAMES,
  type GapStatusOption,
} from '@/lib/hubspot/properties';
import { gapFlag, isGapOsEnabled } from './flags';

export const MIRROR_ACTIONS = [
  'submitted',
  'approved',
  'activated',
  'resolved',
  'withdrawn',
  'expired',
  'closed_unresolved',
] as const;
export type MirrorAction = (typeof MIRROR_ACTIONS)[number];

export interface MirrorHypothesis {
  accountName: string;
  hubspotCompanyId: string | null;
  problemFamily: string;
  observation: string;
  problemHypothesis: string;
  whyNow: string | null;
  falsificationQuestions: string[];
  whatANoMeans: string | null;
  confidence: number;
  status: string;
  version?: number;
}

export interface MirrorEvidence {
  id: string;
  title: string;
  url: string | null;
}

export interface MirrorEvent {
  hypothesisId: string;
  action: MirrorAction;
  hypothesis: MirrorHypothesis;
  evidence: MirrorEvidence[];
}

export interface MirrorDeps {
  /** Returns the HubSpot note id, or null when the writer failed open. */
  createCompanyNote?: (companyId: string, body: string) => Promise<string | null>;
  updateCompanyProperties?: (companyId: string, properties: Record<string, string>) => Promise<unknown>;
  ensureGapProperties?: () => Promise<void>;
  /** Defaults to HUBSPOT_SYNC_ENABLED. */
  syncEnabled?: () => boolean;
  /** Defaults to assertExternalWriteAllowed('hubspot', ...). Must THROW to block. */
  assertWriteAllowed?: () => void;
  now?: () => Date;
}

export type MirrorSkipReason =
  | 'gap_disabled'
  | 'gap_mirror_disabled'
  | 'hubspot_sync_disabled'
  | 'no_company_id'
  | 'already_written';

/**
 * `written`: note + properties landed and the row was recorded.
 * `skipped`: one of MirrorSkipReason; `already_written` also carries the stored noteId.
 * `error`: `reason` is the recorded error message; `noteId` is set when the
 * note landed before a later step failed.
 */
export interface MirrorResult {
  status: 'written' | 'skipped' | 'error';
  reason?: MirrorSkipReason | string;
  noteId?: string | null;
}

const GUARD_OPERATION = 'gap.mirrorHypothesisEvent';

/** The idempotency key and note marker for one hypothesis event. */
export function mirrorKey(hypothesisId: string, action: MirrorAction): string {
  return `gap:hyp:${hypothesisId}:${action}`;
}

/** Map a lifecycle action (and the hypothesis status for resolutions) to yardflow_gap_status. */
export function statusForAction(action: MirrorAction, hypothesisStatus: string): GapStatusOption {
  switch (action) {
    case 'submitted':
      return 'hypothesis_proposed';
    case 'approved':
    case 'activated':
      return 'hypothesis_approved';
    case 'resolved':
      return hypothesisStatus === 'confirmed' || hypothesisStatus === 'partially_confirmed'
        ? 'resolved_confirmed'
        : 'resolved_rejected';
    case 'withdrawn':
    case 'expired':
    case 'closed_unresolved':
      return 'nurture';
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CITATION_TOKEN = /\[S:([A-Za-z0-9_.:-]+)\]/g;

/**
 * Escape the observation, then turn each `[S:<evidence id>]` token into a
 * numbered citation: `<a href="url">[n]</a>` when that evidence has a url,
 * plain `[n]` otherwise. `n` is the evidence's 1-based position in the
 * evidence list, so the same source keeps the same number everywhere. Tokens
 * whose id is not in the list are left visible so a reviewer sees the gap.
 */
function renderObservation(observation: string, evidence: MirrorEvidence[]): string {
  const index = new Map<string, number>();
  evidence.forEach((e, i) => {
    if (!index.has(e.id)) index.set(e.id, i + 1);
  });
  return escapeHtml(observation).replace(CITATION_TOKEN, (token, id: string) => {
    const n = index.get(id);
    if (n === undefined) return token;
    const url = evidence[n - 1]?.url;
    return url ? `<a href="${escapeHtml(url)}">[${n}]</a>` : `[${n}]`;
  });
}

/**
 * Pure note body builder: HTML with the machine marker (`key`) in the last
 * line. No em dashes. Testable with no client.
 */
export function hypothesisNoteBody(input: {
  key: string;
  action: MirrorAction;
  hypothesis: MirrorHypothesis;
  evidence: MirrorEvidence[];
}): string {
  const { key, action, hypothesis: h, evidence } = input;
  const wouldProveWrong = h.falsificationQuestions.filter(Boolean).join(' | ') || h.whatANoMeans || 'n/a';
  return [
    `<b>GAP · HYPOTHESIS ${escapeHtml(action.toUpperCase())} - ${escapeHtml(h.problemFamily)}</b> <i>(v${h.version ?? 1}, ${h.confidence}%)</i>`,
    `Observation: ${renderObservation(h.observation, evidence)}`,
    `Hypothesis: ${escapeHtml(h.problemHypothesis)}`,
    `Why now: ${escapeHtml(h.whyNow ?? 'n/a')}`,
    `Would prove wrong: ${escapeHtml(wouldProveWrong)}`,
    `<span style="color:#888">${escapeHtml(key)}</span>`,
  ].join('<br>');
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Mirror one hypothesis lifecycle event into HubSpot. Never throws.
 */
export async function mirrorHypothesisEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- house prisma glue convention (see audit.ts)
  prisma: any,
  event: MirrorEvent,
  deps: MirrorDeps = {},
): Promise<MirrorResult> {
  const syncEnabled = deps.syncEnabled ?? (() => HUBSPOT_SYNC_ENABLED);
  const assertWriteAllowed =
    deps.assertWriteAllowed ?? (() => assertExternalWriteAllowed('hubspot', GUARD_OPERATION));
  const ensure = deps.ensureGapProperties ?? (() => realEnsureGapProperties());
  const createNote =
    deps.createCompanyNote ?? ((companyId, body) => realCreateCompanyNote({ companyId, body }));
  const updateProps = deps.updateCompanyProperties ?? realUpdateCompanyProperties;
  const now = deps.now ?? (() => new Date());

  if (!isGapOsEnabled()) return { status: 'skipped', reason: 'gap_disabled' };
  if (!gapFlag('GAP_HUBSPOT_MIRROR_ENABLED')) return { status: 'skipped', reason: 'gap_mirror_disabled' };
  if (!syncEnabled()) return { status: 'skipped', reason: 'hubspot_sync_disabled' };
  const companyId = event.hypothesis.hubspotCompanyId;
  if (!companyId) return { status: 'skipped', reason: 'no_company_id' };

  const key = mirrorKey(event.hypothesisId, event.action);

  let existing: { error?: string | null; note_id?: string | null } | null = null;
  try {
    existing = await prisma.gapHubSpotMirror.findUnique({ where: { key } });
  } catch (err) {
    return { status: 'error', reason: errorMessage(err) };
  }
  if (existing && existing.error === null) {
    return { status: 'skipped', reason: 'already_written', noteId: existing.note_id ?? null };
  }

  let noteId: string | null = null;
  try {
    assertWriteAllowed();
    await ensure();
    noteId = await createNote(
      companyId,
      hypothesisNoteBody({ key, action: event.action, hypothesis: event.hypothesis, evidence: event.evidence }),
    );
    if (!noteId) throw new Error('note_not_created');
    await updateProps(companyId, {
      [GAP_PROPERTY_NAMES.companyStatus]: statusForAction(event.action, event.hypothesis.status),
      [GAP_PROPERTY_NAMES.companyProblemFamily]: event.hypothesis.problemFamily,
    });
    await recordRow(prisma, key, companyId, noteId, now(), null);
    return { status: 'written', noteId };
  } catch (err) {
    const reason = errorMessage(err);
    try {
      await recordRow(prisma, key, companyId, noteId, now(), reason);
    } catch {
      // The mirror table is unreachable too; the result already carries the reason.
    }
    return { status: 'error', reason, noteId };
  }
}

async function recordRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- house prisma glue convention (see audit.ts)
  prisma: any,
  key: string,
  companyId: string,
  noteId: string | null,
  writtenAt: Date,
  error: string | null,
): Promise<void> {
  const fields = {
    object_type: 'company',
    object_id: companyId,
    note_id: noteId,
    written_at: writtenAt,
    error,
  };
  await prisma.gapHubSpotMirror.upsert({
    where: { key },
    create: { key, ...fields },
    update: fields,
  });
}
