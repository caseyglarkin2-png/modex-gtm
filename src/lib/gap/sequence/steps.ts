/**
 * S3-T2: the steps.v2 shape of a SequenceVersion, its canonical hash, and the
 * two importers (legacy modex queue steps, the Top100 lane scaffold).
 *
 * Shape rules (spec section 4.5):
 * - indices are 0..n-1 in array order, at least one step;
 * - step 0 sends at enrollment, so its delay is 0 (`first_touch_delay`);
 * - step 0 never allows product proof unless the version carries an explicit
 *   `firstTouchProofOverride: true` (`first_touch_proof`);
 * - delays are non-negative integers in business or calendar days.
 *
 * Hashing: `stepsHash` is sha256 hex over the canonical JSON (sorted keys,
 * no whitespace, arrays in order) of the STEP ARRAY, never the envelope.
 * external-sync (S2-T4) stores the scaffold as a bare array in
 * `SequenceVersion.steps` and hashes that array with its own copy of the same
 * two functions; hashing the array here keeps both hashes equal for the same
 * steps. A later ticket should make external-sync import these. The override
 * flag is therefore not part of the hash: it only changes whether a step-0
 * `productProofAllowed: true`, which IS hashed, is accepted.
 *
 * `parseSteps` accepts either the envelope `{ schema: 'steps.v2', steps }` or
 * a bare step array (what external-sync writes today) and always returns the
 * envelope.
 *
 * Voice: no em dashes.
 */
import { hash } from 'node:crypto';
import { z } from 'zod';

import type { SequenceStep as LegacyStep } from '@/lib/queue/sequence';
import { LANE_PURPOSES, LANE_PURPOSE_MAP, STEP_PURPOSES, type StepPurpose } from '@/lib/gap/taxonomy';

export type { LegacyStep };

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const DELAY_UNITS = ['business_days', 'calendar_days'] as const;
export type DelayUnit = (typeof DELAY_UNITS)[number];

export const ASK_TYPES = ['question', 'asset_offer', 'working_session', 'referral', 'close'] as const;
export type AskType = (typeof ASK_TYPES)[number];

export const STEPS_SCHEMA = 'steps.v2' as const;

/** Refinement reasons (the structural ones are `invalid_steps:<path>`). */
export const FIRST_TOUCH_PROOF = 'first_touch_proof';
export const FIRST_TOUCH_DELAY = 'first_touch_delay';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const TemplatesSchema = z
  .object({
    subjectTemplate: z.string().nullable().optional(),
    bodyTemplate: z.string().nullable().optional(),
    hubspotTemplateId: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

export const StepV2Schema = z.object({
  index: z.number().int().min(0),
  delay: z.object({
    value: z.number().int().min(0),
    unit: z.enum(DELAY_UNITS),
  }),
  purpose: z.enum(STEP_PURPOSES),
  sourcePurpose: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  askType: z.enum(ASK_TYPES).nullable().optional(),
  productProofAllowed: z.boolean(),
  requiredEvidenceTypes: z.array(z.string()),
  claimsUsed: z.array(z.string()),
  templates: TemplatesSchema,
});

export const StepsV2Schema = z
  .object({
    schema: z.literal(STEPS_SCHEMA),
    firstTouchProofOverride: z.boolean().optional(),
    steps: z.array(StepV2Schema).min(1),
  })
  .superRefine((value, ctx) => {
    // `.min(1)` has already refused an empty list; zod still runs this refinement.
    if (value.steps.length === 0) return;
    for (let i = 0; i < value.steps.length; i += 1) {
      if (value.steps[i].index !== i) {
        ctx.addIssue({ code: 'custom', message: 'invalid_steps:steps', path: ['steps'] });
        return;
      }
    }
    const first = value.steps[0];
    if (first.delay.value !== 0) {
      ctx.addIssue({ code: 'custom', message: FIRST_TOUCH_DELAY, path: ['steps', 0, 'delay', 'value'] });
    }
    if (first.productProofAllowed && value.firstTouchProofOverride !== true) {
      ctx.addIssue({ code: 'custom', message: FIRST_TOUCH_PROOF, path: ['steps', 0, 'productProofAllowed'] });
    }
  });

export type StepV2 = z.infer<typeof StepV2Schema>;
export type StepsV2 = z.infer<typeof StepsV2Schema>;

export type ParseStepsResult = { ok: true; steps: StepsV2 } | { ok: false; reason: string };

/**
 * Structural parse. Zod issues map to `invalid_steps:<dotted path>` (or
 * `invalid_steps:root` for a non-object input); the refinements report their
 * own reason (`first_touch_proof`, `first_touch_delay`). The first issue wins.
 */
export function parseSteps(input: unknown): ParseStepsResult {
  const candidate = Array.isArray(input) ? { schema: STEPS_SCHEMA, steps: input } : input;
  const result = StepsV2Schema.safeParse(candidate);
  if (result.success) return { ok: true, steps: result.data };
  const issue = result.error.issues[0];
  if (issue.code === 'custom') return { ok: false, reason: issue.message };
  const path = issue.path.map(String).join('.');
  return { ok: false, reason: `invalid_steps:${path === '' ? 'root' : path}` };
}

// ---------------------------------------------------------------------------
// Importers
// ---------------------------------------------------------------------------

/** Purpose by position for a legacy modex sequence: 0 intrigue, 1 root_cause, 2 value_offer, then close_loop. */
export function legacyPurposeForIndex(i: number): StepPurpose {
  if (i === 0) return 'intrigue';
  if (i === 1) return 'root_cause';
  if (i === 2) return 'value_offer';
  return 'close_loop';
}

/**
 * Convert the modex Draft Queue step shape ({stepIndex, delayDays,
 * subjectTemplate?, bodyTemplate?}) into steps.v2. Steps are sorted by
 * `stepIndex` and re-indexed 0..n-1 (the queue looks steps up by index, not
 * by array position). Delays are calendar days, as the queue schedules them.
 * Step 0 sends immediately in the queue whatever its `delayDays` says, so its
 * delay is normalized to 0.
 */
export function fromLegacyModexSteps(steps: LegacyStep[]): StepsV2 {
  const ordered = [...steps].sort((a, b) => a.stepIndex - b.stepIndex);
  return {
    schema: STEPS_SCHEMA,
    steps: ordered.map((s, i) => ({
      index: i,
      delay: { value: i === 0 ? 0 : s.delayDays, unit: 'calendar_days' as const },
      purpose: legacyPurposeForIndex(i),
      sourcePurpose: null,
      condition: null,
      askType: null,
      productProofAllowed: i > 0,
      requiredEvidenceTypes: [] as string[],
      claimsUsed: [] as string[],
      templates: {
        subjectTemplate: s.subjectTemplate ?? null,
        bodyTemplate: s.bodyTemplate ?? null,
        hubspotTemplateId: null,
      },
    })),
  };
}

/**
 * The four-step Top100 lane scaffold, mirrored key for key from
 * external-sync's private `scaffoldSteps` (the test pins equality with an
 * inline copy of that output). `templateIds` is keyed "1".."4" as the lane
 * manifest keys it. Step 0 never allows product proof; later steps default to
 * allowed and the compiler re-decides per step.
 */
export function fromLaneScaffold(delaysBusinessDays: number[], templateIds: Record<string, string>): StepsV2 {
  return {
    schema: STEPS_SCHEMA,
    steps: LANE_PURPOSES.map((sourcePurpose, i) => ({
      index: i,
      delay: { value: delaysBusinessDays[i] ?? 0, unit: 'business_days' as const },
      purpose: LANE_PURPOSE_MAP[sourcePurpose],
      sourcePurpose,
      condition: null,
      askType: null,
      productProofAllowed: i > 0,
      requiredEvidenceTypes: [] as string[],
      claimsUsed: [] as string[],
      templates: { hubspotTemplateId: templateIds[String(i + 1)] ?? null },
    })),
  };
}

// ---------------------------------------------------------------------------
// Canonical JSON and hashing
// ---------------------------------------------------------------------------

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

/** JSON with object keys sorted at every depth, no whitespace; arrays keep their order. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function isEnvelope(value: unknown): value is { steps: unknown } {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as { steps?: unknown }).steps);
}

/**
 * sha256 hex over the canonical JSON of the step array. Accepts the envelope
 * (hashes its `steps`) or a bare array, so it agrees with external-sync's
 * hash of the array it stores.
 */
export function stepsHash(steps: unknown): string {
  const array = isEnvelope(steps) ? steps.steps : steps;
  return hash('sha256', canonicalJson(array), 'hex');
}

// ---------------------------------------------------------------------------
// Version validation (structure + injected claims rule)
// ---------------------------------------------------------------------------

export interface ClaimsValidator {
  /** `ids` are the step's `claimsUsed`; `stepIsQuestion` is `askType === 'question'`. */
  claims: (ids: string[], stepIsQuestion: boolean) => { ok: boolean; reason?: string };
}

export type ValidateStepsResult =
  | { ok: true; steps: StepsV2 }
  | { ok: false; reason: string; stepIndex?: number };

/**
 * Structural rules first (a structural refusal carries no `stepIndex`), then
 * the injected claims validator once per step in order. The first refusing
 * step stops the walk and is reported with its index and the validator's
 * reason (`claims_refused` when the validator gave none).
 */
export function validateStepsForVersion(steps: unknown, ctx: ClaimsValidator): ValidateStepsResult {
  const parsed = parseSteps(steps);
  if (!parsed.ok) return parsed;
  for (const step of parsed.steps.steps) {
    const verdict = ctx.claims([...step.claimsUsed], step.askType === 'question');
    if (!verdict.ok) {
      return { ok: false, reason: verdict.reason ?? 'claims_refused', stepIndex: step.index };
    }
  }
  return { ok: true, steps: parsed.steps };
}
