/**
 * Per-person placeholder rendering for GAP sequence copy (S3-T12).
 *
 * The seeded families (src/lib/gap/sequences/families.ts) carry exactly two
 * placeholders in their templates, `{{first_name}}` and `{{account}}`. The
 * enroll service renders them when it creates the step-0 Draft Queue item,
 * and the sequence runtime renders them again when it schedules every later
 * step from the pinned version, so the two paths share this one rule.
 * families.ts keeps its own `renderSeedPlaceholders` for its tests; the
 * behavior is identical and a test pins that.
 *
 * `unrenderedPlaceholder` is the refusal predicate: a body that still carries
 * `{{anything}}` after rendering must never be queued, because the queue
 * sends what it holds. The runtime audits `schedule.unrendered_placeholder`
 * with the token name and schedules nothing. Voice: no em dashes.
 */

export interface RenderValues {
  firstName: string;
  account: string;
}

export const PLACEHOLDER_FIRST_NAME = '{{first_name}}';
export const PLACEHOLDER_ACCOUNT = '{{account}}';

/** Fallback greeting when a persona has no usable name. */
export const FALLBACK_FIRST_NAME = 'there';

const PLACEHOLDER_RE = /\{\{\s*([A-Za-z0-9_.-]*)\s*\}\}/;

/** The first word of a display name, or the fallback when there is none. */
export function firstNameOf(name: string | null | undefined): string {
  const n = (name ?? '').trim();
  return n ? n.split(/\s+/)[0] : FALLBACK_FIRST_NAME;
}

/** Replace every `{{first_name}}` and `{{account}}`; nothing else is touched. */
export function renderPlaceholders(text: string, values: RenderValues): string {
  return text.replaceAll(PLACEHOLDER_FIRST_NAME, values.firstName).replaceAll(PLACEHOLDER_ACCOUNT, values.account);
}

/** The name of the first `{{token}}` still present, or null when the text is fully rendered. */
export function unrenderedPlaceholder(text: string): string | null {
  const m = PLACEHOLDER_RE.exec(text);
  if (!m) return null;
  return m[1] || 'empty';
}
