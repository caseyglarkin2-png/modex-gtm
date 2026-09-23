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
 * next call retries; when that row already carries a `note_id` the note
 * landed and only the property update is redone, so a retry never posts a
 * second note. Failures are recorded on the row and NEVER thrown to the
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
import { createCompanyNote as realCreateCompanyNote, createNote as realCreateNote } from '@/lib/hubspot/notes';
import { updateCompanyProperties as realUpdateCompanyProperties } from '@/lib/hubspot/companies';
import { updateContactProperties as realUpdateContactProperties } from '@/lib/hubspot/contacts';
import {
  ensureGapProperties as realEnsureGapProperties,
  GAP_PROPERTY_NAMES,
  type GapStatusOption,
} from '@/lib/hubspot/properties';
import { PRIVATE_INTENT_COPY_PATTERNS } from './routing/explain';
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

  // A prior failed attempt may have landed the note before the property
  // update failed. That note is on the company timeline already: reuse its
  // id and redo only the property update, or the retry posts a second note.
  let noteId: string | null = existing?.note_id ?? null;
  try {
    assertWriteAllowed();
    await ensure();
    if (!noteId) {
      noteId = await createNote(
        companyId,
        hypothesisNoteBody({ key, action: event.action, hypothesis: event.hypothesis, evidence: event.evidence }),
      );
      if (!noteId) throw new Error('note_not_created');
    }
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

// ---------------------------------------------------------------------------
// S4-T6: contact-level mirror for dispositions (section 7 and section 9).
//
// On a confirmed disposition this writes ONE timeline Note on the CONTACT
// (machine marker `gap:disp:<id>` plus a one-line summary: class, channel,
// hypothesis title; never the buyer's raw language, never private intent)
// and stamps `yardflow_gap_last_disposition` and
// `yardflow_gap_last_disposition_at`. It never touches pipeline stages or
// lifecycle, and it never throws to the disposition service.
//
// Idempotency and retries use the same row encoding as mirrorHypothesisEvent:
//   - row with error null           => already mirrored, ZERO HubSpot calls
//   - row with error non-null       => a recorded failure, the next call retries
//   - row with error and a note_id  => the note landed, only the property
//                                      stamp is redone (never a second note)
// The note is written FIRST because it is the non-idempotent half; the
// property stamp is idempotent (same values) and is the last external step,
// so a successful stamp is never repeated: it is immediately followed by the
// success row. A null note id from the fail-open writer is recorded as
// `note_id_missing` with note_id null and no properties written, so the
// retry redoes both halves.
//
// Recency guard (section 9, `_at` properties): when a NEWER human-confirmed
// disposition exists for the same contact, the property stamp is skipped so an
// out-of-order retry never overwrites the freshest class and timestamp. The
// note still lands and the row is recorded (status `written`, with
// `propertiesSkipped`).
// ---------------------------------------------------------------------------

export interface MirrorDispositionInput {
  dispositionId: string;
  hubspotContactId: string | null;
  responseClass: string;
  confirmedAt: Date;
  hypothesisId: string;
  accountName: string;
  /**
   * One line built by the caller from class, channel and hypothesis title.
   * Never the buyer's raw language (`buyer_language`) and never private
   * intent; the note builder withholds it when a private-intent token slips in.
   */
  summary: string;
  channel?: string;
  hypothesisTitle?: string;
}

export interface MirrorDispositionDeps {
  /** Returns the HubSpot note id, or null when the writer failed open. */
  createContactNote?: (contactId: string, body: string) => Promise<string | null>;
  updateContactProperties?: (contactId: string, properties: Record<string, string>) => Promise<unknown>;
  ensureGapProperties?: () => Promise<void>;
  /** Defaults to HUBSPOT_SYNC_ENABLED. */
  syncEnabled?: () => boolean;
  /** Defaults to assertExternalWriteAllowed('hubspot', ...). Must THROW to block. */
  assertWriteAllowed?: () => void;
  now?: () => Date;
}

export type DispositionSkipReason =
  | 'gap_disabled'
  | 'gap_mirror_disabled'
  | 'hubspot_sync_disabled'
  | 'no_contact_id'
  | 'already_mirrored';

export type DispositionMirrorStatus = 'written' | `skipped:${DispositionSkipReason}` | `error:${string}`;

export interface DispositionMirrorResult {
  status: DispositionMirrorStatus;
  /** The GapHubSpotMirror key (`gap:disp:<id>`); present once a row exists for it. */
  mirrorId?: string;
  /** Set when the note landed (also on an error after the note). */
  noteId?: string | null;
  /** Set when the recency guard withheld the property stamp. */
  propertiesSkipped?: 'newer_disposition_exists';
}

const DISPOSITION_GUARD_OPERATION = 'gap.mirrorDisposition';
const WITHHELD = '(withheld: private intent token)';

/** The idempotency key and note marker for one disposition. */
export function dispositionMirrorKey(dispositionId: string): string {
  return `gap:disp:${dispositionId}`;
}

/** Text that trips the copy-safe private-intent floor is withheld from the note. */
function withholdPrivateIntent(text: string): string {
  return PRIVATE_INTENT_COPY_PATTERNS.some(({ pattern }) => pattern.test(text)) ? WITHHELD : text;
}

/**
 * Pure note body builder for a disposition: HTML, machine marker in the last
 * line, no em dashes. Only the fields listed here can reach HubSpot; the
 * buyer's raw language is not an input.
 */
export function dispositionNoteBody(input: {
  key: string;
  responseClass: string;
  channel?: string;
  accountName: string;
  hypothesisId: string;
  hypothesisTitle?: string;
  summary: string;
  confirmedAt: Date;
}): string {
  const { key, responseClass, channel, accountName, hypothesisId, hypothesisTitle, summary, confirmedAt } = input;
  const hypothesis = hypothesisTitle ? withholdPrivateIntent(hypothesisTitle) : hypothesisId;
  return [
    `<b>GAP · DISPOSITION ${escapeHtml(responseClass.toUpperCase())}</b> <i>(${escapeHtml(channel ?? 'unknown channel')}, ${confirmedAt.toISOString()})</i>`,
    `Account: ${escapeHtml(accountName)}`,
    `Hypothesis: ${escapeHtml(hypothesis)}`,
    `Summary: ${escapeHtml(withholdPrivateIntent(summary))}`,
    `<span style="color:#888">${escapeHtml(key)}</span>`,
  ].join('<br>');
}

/**
 * Mirror one confirmed disposition onto its HubSpot contact. Never throws.
 */
export async function mirrorDisposition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- house prisma glue convention (see audit.ts)
  prisma: any,
  input: MirrorDispositionInput,
  deps: MirrorDispositionDeps = {},
): Promise<DispositionMirrorResult> {
  const syncEnabled = deps.syncEnabled ?? (() => HUBSPOT_SYNC_ENABLED);
  const assertWriteAllowed =
    deps.assertWriteAllowed ?? (() => assertExternalWriteAllowed('hubspot', DISPOSITION_GUARD_OPERATION));
  const ensure = deps.ensureGapProperties ?? (() => realEnsureGapProperties());
  const createNote = deps.createContactNote ?? ((contactId, body) => realCreateNote({ contactId, body }));
  const updateProps = deps.updateContactProperties ?? realUpdateContactProperties;
  const now = deps.now ?? (() => new Date());

  if (!isGapOsEnabled()) return { status: 'skipped:gap_disabled' };
  if (!gapFlag('GAP_HUBSPOT_MIRROR_ENABLED')) return { status: 'skipped:gap_mirror_disabled' };
  if (!syncEnabled()) return { status: 'skipped:hubspot_sync_disabled' };
  const contactId = input.hubspotContactId;
  if (!contactId) return { status: 'skipped:no_contact_id' };

  const key = dispositionMirrorKey(input.dispositionId);

  let existing: { error?: string | null; note_id?: string | null } | null = null;
  try {
    existing = await prisma.gapHubSpotMirror.findUnique({ where: { key } });
  } catch (err) {
    return { status: `error:${errorMessage(err)}` };
  }
  if (existing && existing.error === null) {
    return { status: 'skipped:already_mirrored', mirrorId: key, noteId: existing.note_id ?? null };
  }

  // A prior failed attempt may have landed the note before the property stamp
  // failed. Reuse its id and redo only the stamp, or the retry posts a second note.
  let noteId: string | null = existing?.note_id ?? null;
  let propertiesSkipped: DispositionMirrorResult['propertiesSkipped'];
  try {
    assertWriteAllowed();
    await ensure();
    if (!noteId) {
      noteId = await createNote(
        contactId,
        dispositionNoteBody({
          key,
          responseClass: input.responseClass,
          channel: input.channel,
          accountName: input.accountName,
          hypothesisId: input.hypothesisId,
          hypothesisTitle: input.hypothesisTitle,
          summary: input.summary,
          confirmedAt: input.confirmedAt,
        }),
      );
      if (!noteId) throw new Error('note_id_missing');
    }

    const newer = await prisma.conversationDisposition.findFirst({
      where: {
        hubspot_contact_id: contactId,
        human_confirmed: true,
        confirmed_at: { gt: input.confirmedAt },
        id: { not: input.dispositionId },
      },
      select: { id: true },
    });
    if (newer) {
      propertiesSkipped = 'newer_disposition_exists';
    } else {
      await updateProps(contactId, {
        [GAP_PROPERTY_NAMES.contactLastDisposition]: input.responseClass,
        [GAP_PROPERTY_NAMES.contactLastDispositionAt]: input.confirmedAt.toISOString(),
      });
    }

    await recordContactRow(prisma, key, contactId, noteId, now(), null);
    return { status: 'written', mirrorId: key, noteId, ...(propertiesSkipped ? { propertiesSkipped } : {}) };
  } catch (err) {
    const reason = errorMessage(err);
    try {
      await recordContactRow(prisma, key, contactId, noteId, now(), reason);
    } catch {
      // The mirror table is unreachable too; the result already carries the reason.
    }
    return { status: `error:${reason}`, mirrorId: key, noteId };
  }
}

async function recordContactRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- house prisma glue convention (see audit.ts)
  prisma: any,
  key: string,
  contactId: string,
  noteId: string | null,
  writtenAt: Date,
  error: string | null,
): Promise<void> {
  const fields = {
    object_type: 'contact',
    object_id: contactId,
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
