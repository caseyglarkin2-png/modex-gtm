/**
 * UX-06 regression: the governed copy for an UNCHANGED hypothesis is byte-identical before and after the outreach
 * anchor (Option A touches which thesis the pack opens on, never the renderer, the compiler or the approval). The
 * expected strings are literal: any change to a seed family's step 0, the greeting, the sign-off or the observation
 * slot fails here on purpose.
 */
import { describe, expect, it } from 'vitest';
import { SEED_FAMILIES, SIGNATURE } from '@/lib/gap/sequences/families';
import { renderStepCopy } from '@/lib/gap/sequence/render';

const OBSERVATION = 'PepsiCo is building a 1.2 million square foot distribution center in Denver, opening in 2027 [S:f-denver].';

describe('unchanged-copy bytes', () => {
  it('every seed family renders step 0 for the same observation to the same bytes (greeting, slot, sign-off)', () => {
    for (const family of SEED_FAMILIES) {
      const step = family.steps.steps[0];
      const r = renderStepCopy({ subject: step.templates?.subjectTemplate ?? '', body: step.templates?.bodyTemplate ?? '' }, { observation: OBSERVATION, firstName: 'Karen', account: 'PepsiCo' });
      expect(r.queued.body.startsWith('Hi Karen,\n')).toBe(true);
      expect(r.queued.body.endsWith(`\n\n${SIGNATURE}`)).toBe(true);
      expect(r.queued.body).toContain('PepsiCo is building a 1.2 million square foot distribution center in Denver, opening in 2027.');
      expect(r.marked.body).toContain('[[SRC:f-denver]]');
      expect(r.queued.body).not.toMatch(/\[\[SRC:|\[S:/);
      expect(r.queued.body).not.toMatch(/\u2014/);
    }
  });
  it('the first seed family\'s step 0 is these exact bytes', () => {
    const family = SEED_FAMILIES[0];
    const step = family.steps.steps[0];
    const r = renderStepCopy({ subject: step.templates?.subjectTemplate ?? '', body: step.templates?.bodyTemplate ?? '' }, { observation: OBSERVATION, firstName: 'Karen', account: 'PepsiCo' });
    const expectedBody = `Hi Karen,\n${step.templates!.bodyTemplate!.replace(/^Hi \{\{first_name\}\},\n/, '').replace('{{observation}}', 'PepsiCo is building a 1.2 million square foot distribution center in Denver, opening in 2027.').replaceAll('{{account}}', 'PepsiCo').replaceAll('{{first_name}}', 'Karen')}`;
    expect(r.queued.body).toBe(expectedBody);
    expect(r.queued.subject).toBe((step.templates?.subjectTemplate ?? '').replaceAll('{{account}}', 'PepsiCo').replaceAll('{{first_name}}', 'Karen'));
  });
});
