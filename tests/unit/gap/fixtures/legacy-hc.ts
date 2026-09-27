/**
 * The pre-red-team-T7 Hidden Capacity seed, frozen as a TEST FIXTURE: four
 * steps at 0/4/5/6 business days whose steps 1-3 cite fixture facts about
 * other companies (e.g. Fontana). Production seeds are single-touch since T7;
 * this exists only to exercise the multi-touch cadence and the refusal of a
 * step that cites evidence that is not the hypothesis's own.
 */
import type { StepsV2 } from '@/lib/gap/sequence/steps';
import data from '../../../fixtures/gap/legacy-four-step-hidden-capacity.json';

export const LEGACY_HC = data as unknown as {
  key: string;
  name: string;
  problemFamily: string;
  persona: string;
  evidence: string[][];
  steps: StepsV2;
};
