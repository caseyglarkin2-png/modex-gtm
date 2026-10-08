/**
 * Sprint 5 exit: a deal stage is words wherever the seller reads it ("YardFlow - Kroger · appointmentscheduled"
 * showed the HubSpot stage id when the pipeline names could not be read).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CUSTOM_STAGE, stageLabel, stageName } from '@/lib/gap/deals/stage-label';
import { stageLabel as inDealsStageLabel } from '@/lib/gap/deals/in-deals';

describe('a deal stage in words', () => {
  it('a default HubSpot stage reads as words; a custom one says so, never its id', () => {
    expect(stageLabel('appointmentscheduled')).toBe('Appointment scheduled');
    expect(stageLabel('qualifiedtobuy')).toBe('Qualified to buy');
    expect(stageLabel('1417384082')).toBe(CUSTOM_STAGE);
    expect(CUSTOM_STAGE).not.toMatch(/\d/);
    expect(stageLabel(null)).toBe('Stage unknown');
  });
  it('the live pipeline name wins; with no live name the words above, never the id', () => {
    const live = new Map([['1417384082', 'Pilot scoping']]);
    expect(stageName('1417384082', live)).toBe('Pilot scoping');
    expect(stageName('appointmentscheduled', new Map())).toBe('Appointment scheduled');
    expect(stageName('1417384082', new Map())).toBe(CUSTOM_STAGE);
    expect(stageName(null, live)).toBeNull();
  });
  it('one rule: In Deals reads the same words', () => {
    expect(inDealsStageLabel).toBe(stageLabel);
  });
  it('the account page maps every open deal stage through it (a failed pipeline read never shows the id)', () => {
    const load = readFileSync('src/lib/gap/account-intel/load.ts', 'utf8');
    expect(load).toMatch(/stage: stageName\(d\.stage, labels\)/);
    expect(load).not.toMatch(/labels\.get\(d\.stage\) \?\? d\.stage/);
  });
  it('the stage module stays client safe (the deal list on the account page is a client render)', () => {
    expect(readFileSync('src/lib/gap/deals/stage-label.ts', 'utf8')).not.toMatch(/^import /m);
  });
});
