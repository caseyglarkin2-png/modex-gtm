/**
 * Per-person rendering for GAP sequence copy (S3-T12, R3-4).
 *
 * Three placeholders. `{{first_name}}` and `{{account}}` are the per-person
 * values. `{{observation}}` is the slot the seed families
 * (src/lib/gap/sequences/families.ts) leave where the step-0 observation
 * sentence goes: it is filled from the HYPOTHESIS observation, whose
 * `[S:<signal id>]` citation tokens (hypothesis/observation.ts) become
 * `[[SRC:<signal id>]]` markers, so the compiler's C01 resolves every cited
 * sentence against the hypothesis's own linked signals. A template never
 * carries a prospect fact of its own; the hypothesis does.
 *
 * One render yields two copies (`renderStepCopy`):
 *   marked   the rendered text WITH its markers. This is what `compile()`
 *            judges, in the enroll service (step 0) and in the sequence
 *            runtime (every later step).
 *   queued   the same text with every marker stripped. This is what the
 *            Draft Queue holds and sends. A marker must never reach a
 *            prospect; the strip is `stripSourceMarkers` from
 *            src/lib/source-backed/attribution.ts (the existing `[[SRC:id]]`
 *            helper), followed by the `[S:id]` form for any token the slot
 *            did not convert, and the space a marker leaves before
 *            punctuation. The strip runs AFTER the compiler has judged the
 *            marked text; the queued body is what the compile row's
 *            `inputs_snapshot.body` was, minus markers.
 *
 * `unrenderedPlaceholder` is the refusal predicate: a body or subject that
 * still carries `{{anything}}` after rendering (an empty observation leaves
 * `{{observation}}` in place on purpose) must never be queued. The runtime
 * audits `schedule.unrendered_placeholder` with the token and schedules
 * nothing; the enroll service refuses `unrendered_placeholder:<token>`.
 *
 * The hypothesis signals become compile evidence refs through the compiler's
 * own `evidenceRefsFromSignals` (src/lib/gap/compiler/evidence-from-signals.ts);
 * only the Prisma select that loads its `SignalRow` shape lives here, shared
 * by the enroll service and the runtime. Voice: no em dashes.
 */
import { stripSourceMarkers } from '@/lib/source-backed/attribution';
import type { SignalRow } from '@/lib/gap/compiler/evidence-from-signals';

export interface RenderValues {
  firstName: string;
  account: string;
}

export interface RenderCopyValues extends RenderValues {
  /** The hypothesis observation with its `[S:id]` tokens; null or empty leaves `{{observation}}` unrendered. */
  observation?: string | null;
}

export interface StepCopy {
  subject: string;
  body: string;
}

export interface RenderedCopy {
  /** Rendered, markers kept: the compiler's input. */
  marked: StepCopy;
  /** Rendered, markers stripped: the queue's copy. */
  queued: StepCopy;
  /** The first `{{token}}` still present in the marked subject or body, or null. */
  unrendered: string | null;
}

export const PLACEHOLDER_FIRST_NAME = '{{first_name}}';
export const PLACEHOLDER_ACCOUNT = '{{account}}';
export const PLACEHOLDER_OBSERVATION = '{{observation}}';

/** Fallback greeting when a persona has no usable name. */
export const FALLBACK_FIRST_NAME = 'there';

const PLACEHOLDER_RE = /\{\{\s*([A-Za-z0-9_.-]*)\s*\}\}/;
/** The hypothesis observation citation token (hypothesis/observation.ts). */
const OBSERVATION_TOKEN_RE = /\[S:([A-Za-z0-9_-]+)\]/g;

/** The first word of a display name, or the fallback when there is none. */
export function firstNameOf(name: string | null | undefined): string {
  const n = (name ?? '').trim();
  return n ? n.split(/\s+/)[0] : FALLBACK_FIRST_NAME;
}

/** Replace every `{{first_name}}` and `{{account}}`; nothing else is touched. */
export function renderPlaceholders(text: string, values: RenderValues): string {
  return text.replaceAll(PLACEHOLDER_FIRST_NAME, values.firstName).replaceAll(PLACEHOLDER_ACCOUNT, values.account);
}

/** `[S:id]` -> `[[SRC:id]]`, so the observation's citations are markers the compiler resolves. */
export function observationToMarkers(observation: string): string {
  return observation.replace(OBSERVATION_TOKEN_RE, '[[SRC:$1]]');
}

/**
 * Fill `{{observation}}` with the marked observation. An empty or missing
 * observation leaves the slot in place so `unrenderedPlaceholder` refuses it.
 */
export function renderObservationSlot(text: string, observation: string | null | undefined): string {
  const obs = (observation ?? '').trim();
  if (!obs) return text;
  return text.replaceAll(PLACEHOLDER_OBSERVATION, observationToMarkers(obs));
}

/**
 * Strip every citation marker for the queue: `[[SRC:id]]` through the
 * attribution helper, then any `[S:id]` token, then the space a marker
 * leaves before punctuation ("years ." -> "years.").
 */
export function stripCitationMarkers(text: string): string {
  return stripSourceMarkers(text)
    .replace(OBSERVATION_TOKEN_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+(?=[.,!?;:])/g, '');
}

/** The name of the first `{{token}}` still present, or null when the text is fully rendered. */
export function unrenderedPlaceholder(text: string): string | null {
  const m = PLACEHOLDER_RE.exec(text);
  if (!m) return null;
  return m[1] || 'empty';
}

/** Render one step's templates into the marked copy (for the compiler) and the queued copy (for the queue). */
export function renderStepCopy(templates: StepCopy, values: RenderCopyValues): RenderedCopy {
  const fill = (text: string) => renderPlaceholders(renderObservationSlot(text, values.observation), values);
  const marked: StepCopy = { subject: fill(templates.subject), body: fill(templates.body) };
  const queued: StepCopy = { subject: stripCitationMarkers(marked.subject), body: stripCitationMarkers(marked.body) };
  return { marked, queued, unrendered: unrenderedPlaceholder(marked.subject) ?? unrenderedPlaceholder(marked.body) };
}

// ---------------------------------------------------------------------------
// Hypothesis signals -> the compiler's SignalRow
// ---------------------------------------------------------------------------

/** The ProspectingSignal columns `evidenceRefsFromSignals` reads (the compiler's `SignalRow`). */
export type EvidenceSignalRow = SignalRow;

/** The select that loads exactly `EvidenceSignalRow` through a HypothesisSignal link. */
export const EVIDENCE_SIGNAL_SELECT = {
  id: true,
  title: true,
  evidence_url: true,
  external_ok: true,
  observed_at: true,
  freshness_expires_at: true,
  source_type: true,
  metadata: true,
} as const;
