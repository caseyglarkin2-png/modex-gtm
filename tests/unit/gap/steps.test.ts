/**
 * S3-T2: steps.v2 schema, legacy conversion, the lane scaffold, canonical
 * hashing and the per-step claims hook. The scaffold and hash must agree with
 * what external-sync (S2-T4) already writes into SequenceVersion.steps.
 */
import { describe, expect, it, vi } from 'vitest';

import {
  canonicalJson as externalCanonicalJson,
  stepsHash as externalStepsHash,
} from '@/lib/gap/sequence/external-sync';
import {
  StepsV2Schema,
  canonicalJson,
  fromLaneScaffold,
  fromLegacyModexSteps,
  parseSteps,
  stepsHash,
  validateStepsForVersion,
  type StepsV2,
} from '@/lib/gap/sequence/steps';
import { LANE_PURPOSES, LANE_PURPOSE_MAP } from '@/lib/gap/taxonomy';

const TEMPLATE_IDS = { '1': 't-1', '2': 't-2', '3': 't-3', '4': 't-4' };
const DELAYS = [0, 4, 5, 6];

/** Inline copy of external-sync's private scaffoldSteps output for the same plan. */
function inlineExternalScaffold() {
  return LANE_PURPOSES.map((sourcePurpose, i) => ({
    index: i,
    delay: { value: DELAYS[i] ?? 0, unit: 'business_days' },
    purpose: LANE_PURPOSE_MAP[sourcePurpose],
    sourcePurpose,
    condition: null,
    askType: null,
    productProofAllowed: i > 0,
    requiredEvidenceTypes: [] as string[],
    claimsUsed: [] as string[],
    templates: { hubspotTemplateId: TEMPLATE_IDS[String(i + 1) as keyof typeof TEMPLATE_IDS] ?? null },
  }));
}

function minimal(overrides: Partial<StepsV2> = {}): StepsV2 {
  return {
    schema: 'steps.v2',
    steps: [
      {
        index: 0,
        delay: { value: 0, unit: 'business_days' },
        purpose: 'intrigue',
        productProofAllowed: false,
        requiredEvidenceTypes: [],
        claimsUsed: [],
      },
      {
        index: 1,
        delay: { value: 4, unit: 'business_days' },
        purpose: 'root_cause',
        askType: 'question',
        productProofAllowed: true,
        requiredEvidenceTypes: ['public_primary'],
        claimsUsed: ['claim_a'],
      },
    ],
    ...overrides,
  };
}

function fail(input: unknown): string {
  const r = parseSteps(input);
  if (r.ok) throw new Error('expected refusal');
  return r.reason;
}

describe('parseSteps', () => {
  it('accepts the lane scaffold as external-sync writes it (a bare array) and wraps it', () => {
    const r = parseSteps(inlineExternalScaffold());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.steps.schema).toBe('steps.v2');
    expect(r.steps.steps).toHaveLength(4);
    expect(r.steps.steps[0].productProofAllowed).toBe(false);
    expect(r.steps.steps[3].purpose).toBe('close_loop');
  });

  it('accepts the envelope form and round-trips the steps unchanged', () => {
    const input = minimal();
    const r = parseSteps(input);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.steps).toEqual(input);
    expect(StepsV2Schema.safeParse(input).success).toBe(true);
  });

  it('refuses an index gap with invalid_steps:steps', () => {
    const m = minimal();
    m.steps[1].index = 2;
    expect(fail(m)).toBe('invalid_steps:steps');
  });

  it('refuses out-of-order indices', () => {
    const m = minimal();
    m.steps = [m.steps[1], m.steps[0]];
    expect(fail(m)).toBe('invalid_steps:steps');
  });

  it('refuses product proof on step 0 with first_touch_proof', () => {
    const m = minimal();
    m.steps[0].productProofAllowed = true;
    expect(fail(m)).toBe('first_touch_proof');
  });

  it('allows product proof on step 0 only under firstTouchProofOverride', () => {
    const m = minimal({ firstTouchProofOverride: true });
    m.steps[0].productProofAllowed = true;
    expect(parseSteps(m).ok).toBe(true);
    const off = minimal({ firstTouchProofOverride: false });
    off.steps[0].productProofAllowed = true;
    expect(fail(off)).toBe('first_touch_proof');
  });

  it('refuses a negative or fractional delay by path', () => {
    const m = minimal();
    m.steps[1].delay.value = -1;
    expect(fail(m)).toBe('invalid_steps:steps.1.delay.value');
    const f = minimal();
    f.steps[1].delay.value = 1.5;
    expect(fail(f)).toBe('invalid_steps:steps.1.delay.value');
  });

  it('refuses a non-zero delay on step 0 with first_touch_delay', () => {
    const m = minimal();
    m.steps[0].delay.value = 2;
    expect(fail(m)).toBe('first_touch_delay');
  });

  it('refuses an empty step list, an unknown purpose, unit, askType and schema tag', () => {
    expect(fail({ schema: 'steps.v2', steps: [] })).toBe('invalid_steps:steps');
    const p = minimal();
    (p.steps[0] as { purpose: string }).purpose = 'pitch';
    expect(fail(p)).toBe('invalid_steps:steps.0.purpose');
    const u = minimal();
    (u.steps[1].delay as { unit: string }).unit = 'weeks';
    expect(fail(u)).toBe('invalid_steps:steps.1.delay.unit');
    const a = minimal();
    (a.steps[1] as { askType: string }).askType = 'demo';
    expect(fail(a)).toBe('invalid_steps:steps.1.askType');
    expect(fail({ schema: 'steps.v1', steps: minimal().steps })).toBe('invalid_steps:schema');
    expect(fail(null)).toBe('invalid_steps:root');
    expect(fail('nope')).toBe('invalid_steps:root');
  });
});

describe('fromLegacyModexSteps', () => {
  it('converts the modex queue shape exactly, by index order, calendar days, proof off on step 0', () => {
    const out = fromLegacyModexSteps([
      { stepIndex: 1, delayDays: 3, subjectTemplate: 'Re: {{first}}', bodyTemplate: 'follow up' },
      { stepIndex: 0, delayDays: 0, subjectTemplate: 'Hi {{first}}', bodyTemplate: 'hello' },
      { stepIndex: 2, delayDays: 5 },
      { stepIndex: 3, delayDays: 7, bodyTemplate: 'last' },
      { stepIndex: 4, delayDays: 9 },
    ]);
    expect(out).toEqual({
      schema: 'steps.v2',
      steps: [
        {
          index: 0,
          delay: { value: 0, unit: 'calendar_days' },
          purpose: 'intrigue',
          sourcePurpose: null,
          condition: null,
          askType: null,
          productProofAllowed: false,
          requiredEvidenceTypes: [],
          claimsUsed: [],
          templates: { subjectTemplate: 'Hi {{first}}', bodyTemplate: 'hello', hubspotTemplateId: null },
        },
        {
          index: 1,
          delay: { value: 3, unit: 'calendar_days' },
          purpose: 'root_cause',
          sourcePurpose: null,
          condition: null,
          askType: null,
          productProofAllowed: true,
          requiredEvidenceTypes: [],
          claimsUsed: [],
          templates: { subjectTemplate: 'Re: {{first}}', bodyTemplate: 'follow up', hubspotTemplateId: null },
        },
        {
          index: 2,
          delay: { value: 5, unit: 'calendar_days' },
          purpose: 'value_offer',
          sourcePurpose: null,
          condition: null,
          askType: null,
          productProofAllowed: true,
          requiredEvidenceTypes: [],
          claimsUsed: [],
          templates: { subjectTemplate: null, bodyTemplate: null, hubspotTemplateId: null },
        },
        {
          index: 3,
          delay: { value: 7, unit: 'calendar_days' },
          purpose: 'close_loop',
          sourcePurpose: null,
          condition: null,
          askType: null,
          productProofAllowed: true,
          requiredEvidenceTypes: [],
          claimsUsed: [],
          templates: { subjectTemplate: null, bodyTemplate: 'last', hubspotTemplateId: null },
        },
        {
          index: 4,
          delay: { value: 9, unit: 'calendar_days' },
          purpose: 'close_loop',
          sourcePurpose: null,
          condition: null,
          askType: null,
          productProofAllowed: true,
          requiredEvidenceTypes: [],
          claimsUsed: [],
          templates: { subjectTemplate: null, bodyTemplate: null, hubspotTemplateId: null },
        },
      ],
    });
    expect(parseSteps(out).ok).toBe(true);
  });

  it('a one-step legacy send converts to a valid single-step version', () => {
    const out = fromLegacyModexSteps([{ stepIndex: 0, delayDays: 0 }]);
    expect(out.steps).toHaveLength(1);
    expect(parseSteps(out).ok).toBe(true);
  });

  it('a legacy step 0 with a stray delay is normalized to 0 (the queue sends step 0 immediately)', () => {
    const out = fromLegacyModexSteps([{ stepIndex: 0, delayDays: 2 }, { stepIndex: 1, delayDays: 2 }]);
    expect(out.steps[0].delay.value).toBe(0);
    expect(out.steps[1].delay.value).toBe(2);
  });
});

describe('fromLaneScaffold', () => {
  it('builds the four-step Top100 scaffold exactly as external-sync does', () => {
    const out = fromLaneScaffold(DELAYS, TEMPLATE_IDS);
    expect(out.schema).toBe('steps.v2');
    expect(out.steps).toEqual(inlineExternalScaffold());
  });

  it('fills a missing delay with 0 and a missing template id with null', () => {
    const out = fromLaneScaffold([0, 4], { '1': 'only' });
    expect(out.steps.map((s) => s.delay.value)).toEqual([0, 4, 0, 0]);
    expect(out.steps.map((s) => s.templates?.hubspotTemplateId)).toEqual(['only', null, null, null]);
  });
});

describe('canonicalJson and stepsHash', () => {
  it('sorts keys at every depth, keeps arrays in order, emits no whitespace', () => {
    expect(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }, 'z'] })).toBe('{"a":[{"c":3,"d":2},"z"],"b":1}');
    expect(canonicalJson({ b: 1, a: [{ d: 2, c: 3 }] })).toBe(externalCanonicalJson({ b: 1, a: [{ d: 2, c: 3 }] }));
  });

  it('is stable across key order and whitespace and changes on any value change', () => {
    const a = minimal();
    const reversed = {
      steps: a.steps.map((s) => Object.fromEntries(Object.entries(s).reverse())),
      schema: 'steps.v2',
    };
    expect(stepsHash(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(stepsHash(reversed)).toBe(stepsHash(a));
    expect(stepsHash(JSON.parse(JSON.stringify(a, null, 2)))).toBe(stepsHash(a));
    const c = minimal();
    c.steps[1].delay.value = 5;
    expect(stepsHash(c)).not.toBe(stepsHash(a));
  });

  it('hashes the step array, so the envelope and the bare array agree, and equals external-sync for the scaffold', () => {
    const scaffold = inlineExternalScaffold();
    const ours = fromLaneScaffold(DELAYS, TEMPLATE_IDS);
    expect(stepsHash(ours)).toBe(externalStepsHash(scaffold));
    expect(stepsHash(ours.steps)).toBe(externalStepsHash(scaffold));
    expect(stepsHash(scaffold)).toBe(externalStepsHash(scaffold));
    const parsed = parseSteps(scaffold);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(stepsHash(parsed.steps)).toBe(externalStepsHash(scaffold));
  });
});

describe('validateStepsForVersion', () => {
  it('runs the structural rules first and reports their reason', () => {
    const claims = vi.fn(() => ({ ok: true }));
    const m = minimal();
    m.steps[0].productProofAllowed = true;
    const r = validateStepsForVersion(m, { claims });
    expect(r).toEqual({ ok: false, reason: 'first_touch_proof' });
    expect(claims).not.toHaveBeenCalled();
  });

  it('calls the claims validator per step with the step claims and stepIsQuestion', () => {
    const claims = vi.fn(() => ({ ok: true }));
    const m = minimal();
    const r = validateStepsForVersion(m, { claims });
    expect(r.ok).toBe(true);
    expect(claims.mock.calls).toEqual([
      [[], false],
      [['claim_a'], true],
    ]);
  });

  it('surfaces a claims refusal with the refusing step index and its reason', () => {
    const claims = vi.fn((ids: string[]) =>
      ids.includes('claim_a') ? { ok: false, reason: 'claim_unverified:claim_a' } : { ok: true },
    );
    const r = validateStepsForVersion(minimal(), { claims });
    expect(r).toEqual({ ok: false, reason: 'claim_unverified:claim_a', stepIndex: 1 });
  });

  it('a refusal without a reason still names the step', () => {
    const claims = vi.fn((ids: string[]) => (ids.length ? { ok: false } : { ok: true }));
    const r = validateStepsForVersion(minimal(), { claims });
    expect(r).toEqual({ ok: false, reason: 'claims_refused', stepIndex: 1 });
  });

  it('accepts the bare scaffold array like parseSteps does', () => {
    const claims = vi.fn(() => ({ ok: true }));
    const r = validateStepsForVersion(inlineExternalScaffold(), { claims });
    expect(r.ok).toBe(true);
    expect(claims).toHaveBeenCalledTimes(4);
  });
});
