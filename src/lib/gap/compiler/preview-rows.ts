/**
 * GAP preview page: the two GapCompile row queries (R3-5, 2026-09-23). Pure.
 *
 * The preview report and the shadow enroll button read rows compiled FOR the
 * hypothesis under review: `sequence_version_id` and `hypothesis_id` both
 * pinned, no null branch. Template-level rows (a compile of the version's
 * template copy with `template: true` on POST /api/gap/compile, stored with
 * `hypothesis_id` null) are a separate query and render in their own
 * labelled block; they never contribute to `compileIds` or to "every step
 * cleared". Before this change one query admitted both with an OR.
 */

export interface HypothesisCompileWhere {
  sequence_version_id: string;
  hypothesis_id: string;
}

export interface TemplateCompileWhere {
  sequence_version_id: string;
  hypothesis_id: null;
}

/** Rows compiled for this hypothesis on this version. Exact match on both keys. */
export function hypothesisCompileWhere(versionId: string, hypothesisId: string): HypothesisCompileWhere {
  return { sequence_version_id: versionId, hypothesis_id: hypothesisId };
}

/** Template-level rows for this version: shadow-only evidence, never a gate input. */
export function templateCompileWhere(versionId: string): TemplateCompileWhere {
  return { sequence_version_id: versionId, hypothesis_id: null };
}
