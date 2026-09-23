import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CALL_ONLY_RESPONSE_CLASSES,
  DISPOSITION_EFFECTS,
  LANE_KEY_MAP,
  NO_EFFECTS,
  OBJECTION_REQUIRED_RESPONSE_CLASSES,
  QUOTE_REQUIRED_RESPONSE_CLASSES,
  RESOLVING_RESPONSE_CLASSES,
  dispositionEffects,
  validateDisposition,
  type DispositionEffects,
  type DispositionInput,
} from '@/lib/gap/disposition/model';
import { DISPOSITION_OUTCOMES } from '@/lib/gap/hypothesis/machine';
import {
  CHANNELS,
  NON_STOPPING_RESPONSE_CLASSES,
  REPLY_HANDLING_KEYS,
  REPLY_HANDLING_TO_RESPONSE_CLASS,
  RESPONSE_CLASSES,
  ROUTING_ACTIONS,
  type ResponseClass,
} from '@/lib/gap/taxonomy';

type Row = Pick<DispositionEffects, 'stopsRun' | 'resolves' | 'writesDnc' | 'nextAction'>;

/** The spec's section 7 table, written out by hand so a change to the module must be a change here too. */
const EXPECTED: Record<ResponseClass, Row> = {
  problem_confirmed: { stopsRun: true, resolves: 'confirmed', writesDnc: false, nextAction: 'call_now' },
  problem_partially_confirmed: { stopsRun: true, resolves: 'partially_confirmed', writesDnc: false, nextAction: 'call_now' },
  problem_rejected: { stopsRun: true, resolves: 'rejected', writesDnc: false, nextAction: 'nurture' },
  wrong_person: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'research_required' },
  referral: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'research_required' },
  not_priority: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'nurture' },
  timing: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'nurture' },
  existing_solution: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'nurture' },
  request_information: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'one_off_email' },
  meeting_accepted: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'none' },
  meeting_declined: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'nurture' },
  do_not_contact: { stopsRun: true, resolves: null, writesDnc: true, nextAction: 'do_not_contact' },
  bounce: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'none' },
  out_of_office: { stopsRun: false, resolves: null, writesDnc: false, nextAction: 'none' },
  no_signal: { stopsRun: true, resolves: null, writesDnc: false, nextAction: 'one_off_email' },
  no_answer: { stopsRun: false, resolves: null, writesDnc: false, nextAction: 'none' },
  voicemail: { stopsRun: false, resolves: null, writesDnc: false, nextAction: 'none' },
  gatekeeper: { stopsRun: false, resolves: null, writesDnc: false, nextAction: 'none' },
};

describe('DISPOSITION_EFFECTS table', () => {
  it('has exactly one row per taxonomy class, no extras', () => {
    expect(Object.keys(DISPOSITION_EFFECTS).sort()).toEqual([...RESPONSE_CLASSES].sort());
    expect(Object.keys(DISPOSITION_EFFECTS)).toHaveLength(18);
  });

  it.each(RESPONSE_CLASSES)('%s matches the section 7 row', (cls) => {
    const row = DISPOSITION_EFFECTS[cls];
    const expected = EXPECTED[cls];
    expect(row.stopsRun, `${cls}.stopsRun`).toBe(expected.stopsRun);
    expect(row.resolves, `${cls}.resolves`).toBe(expected.resolves);
    expect(row.writesDnc, `${cls}.writesDnc`).toBe(expected.writesDnc);
    expect(row.nextAction, `${cls}.nextAction`).toBe(expected.nextAction);
    expect(row.keepsSequence, `${cls}.keepsSequence`).toBe(!expected.stopsRun);
    expect(row.why.trim().length, `${cls}.why documents the row`).toBeGreaterThan(20);
  });

  it('stops the run for every class except the four non-stopping ones', () => {
    const keeping = RESPONSE_CLASSES.filter((c) => !DISPOSITION_EFFECTS[c].stopsRun);
    expect(keeping.sort()).toEqual([...NON_STOPPING_RESPONSE_CLASSES].sort());
    expect(keeping).toHaveLength(4);
  });

  it('resolves only for the three problem_* classes, agreeing with the machine', () => {
    const resolving = RESPONSE_CLASSES.filter((c) => DISPOSITION_EFFECTS[c].resolves !== null);
    expect(resolving.sort()).toEqual(Object.keys(DISPOSITION_OUTCOMES).sort());
    expect(resolving).toHaveLength(3);
    for (const cls of resolving) {
      expect(DISPOSITION_EFFECTS[cls].resolves).toBe(DISPOSITION_OUTCOMES[cls]);
    }
    expect([...RESOLVING_RESPONSE_CLASSES].sort()).toEqual(resolving.sort());
  });

  it('exactly one class writes do-not-contact, and it is do_not_contact', () => {
    const writers = RESPONSE_CLASSES.filter((c) => DISPOSITION_EFFECTS[c].writesDnc);
    expect(writers).toEqual(['do_not_contact']);
    expect(writers).toHaveLength(1);
  });

  it('never keeps a sequence while stopping it', () => {
    for (const cls of RESPONSE_CLASSES) {
      expect(DISPOSITION_EFFECTS[cls].keepsSequence, cls).toBe(!DISPOSITION_EFFECTS[cls].stopsRun);
    }
  });

  it('routes only to a taxonomy action or none', () => {
    const allowed = new Set<string>([...ROUTING_ACTIONS, 'none']);
    for (const cls of RESPONSE_CLASSES) {
      expect(allowed.has(DISPOSITION_EFFECTS[cls].nextAction), `${cls}.nextAction`).toBe(true);
    }
  });

  it('is frozen', () => {
    expect(Object.isFrozen(DISPOSITION_EFFECTS)).toBe(true);
    expect(Object.isFrozen(DISPOSITION_EFFECTS.do_not_contact)).toBe(true);
    expect(Object.isFrozen(NO_EFFECTS)).toBe(true);
  });

  it('carries no em dash in the source', () => {
    const source = readFileSync(path.resolve(__dirname, '../../../src/lib/gap/disposition/model.ts'), 'utf8');
    expect(source.includes(String.fromCharCode(0x2014))).toBe(false);
  });
});

describe('dispositionEffects', () => {
  it.each(RESPONSE_CLASSES)('%s unconfirmed has NO effects', (cls) => {
    const effects = dispositionEffects({ responseClass: cls, humanConfirmed: false });
    expect(effects).toBe(NO_EFFECTS);
    expect(effects.stopsRun).toBe(false);
    expect(effects.resolves).toBeNull();
    expect(effects.writesDnc).toBe(false);
    expect(effects.nextAction).toBe('none');
    expect(effects.keepsSequence).toBe(true);
  });

  it.each(RESPONSE_CLASSES)('%s confirmed returns the table row', (cls) => {
    expect(dispositionEffects({ responseClass: cls, humanConfirmed: true })).toBe(DISPOSITION_EFFECTS[cls]);
  });

  it('an unconfirmed do_not_contact never writes DNC', () => {
    expect(dispositionEffects({ responseClass: 'do_not_contact', humanConfirmed: false }).writesDnc).toBe(false);
  });

  it('an unknown class has no effects even when confirmed (fail closed)', () => {
    expect(dispositionEffects({ responseClass: 'problem_denied', humanConfirmed: true })).toBe(NO_EFFECTS);
  });
});

describe('LANE_KEY_MAP', () => {
  it('covers the ten lane keys and agrees with the taxonomy map', () => {
    expect(Object.keys(LANE_KEY_MAP).sort()).toEqual([...REPLY_HANDLING_KEYS].sort());
    for (const key of REPLY_HANDLING_KEYS) {
      expect(LANE_KEY_MAP[key].classes).toEqual(REPLY_HANDLING_TO_RESPONSE_CLASS[key]);
    }
  });

  it('positive_interest and not_now fan out and the human picks', () => {
    expect(LANE_KEY_MAP.positive_interest.classes).toEqual(['problem_confirmed', 'request_information']);
    expect(LANE_KEY_MAP.positive_interest.humanPicks).toBe(true);
    expect(LANE_KEY_MAP.not_now.classes).toEqual(['timing', 'not_priority']);
    expect(LANE_KEY_MAP.not_now.humanPicks).toBe(true);
    const single = REPLY_HANDLING_KEYS.filter((k) => k !== 'positive_interest' && k !== 'not_now');
    for (const key of single) {
      expect(LANE_KEY_MAP[key].classes, key).toHaveLength(1);
      expect(LANE_KEY_MAP[key].humanPicks, key).toBe(false);
    }
  });

  it('only the two existing_solution keys carry an objection', () => {
    expect(LANE_KEY_MAP.already_have_yms.classes).toEqual(['existing_solution']);
    expect(LANE_KEY_MAP['3pl_runs_it'].classes).toEqual(['existing_solution']);
    expect(LANE_KEY_MAP.already_have_yms.objection).toMatch(/yard management system/i);
    expect(LANE_KEY_MAP['3pl_runs_it'].objection).toMatch(/3PL runs the yards/);
    const withObjection = REPLY_HANDLING_KEYS.filter((k) => LANE_KEY_MAP[k].objection !== null);
    expect(withObjection.sort()).toEqual(['3pl_runs_it', 'already_have_yms']);
  });

  it('maps the lane one-to-one keys as the spec lists them', () => {
    expect(LANE_KEY_MAP.referral.classes).toEqual(['referral']);
    expect(LANE_KEY_MAP.wrong_person.classes).toEqual(['wrong_person']);
    expect(LANE_KEY_MAP.out_of_office.classes).toEqual(['out_of_office']);
    expect(LANE_KEY_MAP.bounce.classes).toEqual(['bounce']);
    expect(LANE_KEY_MAP.opt_out.classes).toEqual(['do_not_contact']);
    expect(LANE_KEY_MAP.substantive_rejection.classes).toEqual(['problem_rejected']);
  });
});

describe('validateDisposition', () => {
  const base: DispositionInput = {
    contactEmail: 'Ops.Lead@Example.com',
    channel: 'email',
    responseClass: 'timing',
  };

  it('accepts a valid row and lowercases the email', () => {
    const result = validateDisposition({ ...base, buyerLanguage: '  back to us in Q1  ' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      contactEmail: 'ops.lead@example.com',
      channel: 'email',
      responseClass: 'timing',
      rootCauseClass: null,
      impactClass: null,
      objection: null,
      buyerLanguage: 'back to us in Q1',
    });
  });

  it('refuses a class outside the taxonomy, naming the field', () => {
    expect(validateDisposition({ ...base, responseClass: 'problem_denied' })).toEqual({
      ok: false,
      field: 'responseClass',
      reason: 'unknown_response_class',
    });
  });

  it('refuses a channel outside the four', () => {
    expect(validateDisposition({ ...base, channel: 'sms' })).toEqual({ ok: false, field: 'channel', reason: 'unknown_channel' });
    for (const channel of CHANNELS) {
      expect(validateDisposition({ ...base, channel }).ok, channel).toBe(true);
    }
  });

  it.each(CALL_ONLY_RESPONSE_CLASSES)('%s is refused on every channel but call', (cls) => {
    for (const channel of CHANNELS.filter((c) => c !== 'call')) {
      expect(validateDisposition({ ...base, channel, responseClass: cls })).toEqual({
        ok: false,
        field: 'responseClass',
        reason: 'call_only_class',
      });
    }
    expect(validateDisposition({ ...base, channel: 'call', responseClass: cls }).ok).toBe(true);
  });

  it('refuses an empty or malformed email', () => {
    expect(validateDisposition({ ...base, contactEmail: '   ' })).toEqual({
      ok: false,
      field: 'contactEmail',
      reason: 'empty_contact_email',
    });
    expect(validateDisposition({ ...base, contactEmail: 'nobody' })).toEqual({
      ok: false,
      field: 'contactEmail',
      reason: 'invalid_contact_email',
    });
    expect(validateDisposition({ ...base, contactEmail: '@example.com' })).toEqual({
      ok: false,
      field: 'contactEmail',
      reason: 'invalid_contact_email',
    });
  });

  it('allows root cause and impact classes only with a problem_* class', () => {
    expect(validateDisposition({ ...base, rootCauseClass: 'Gate waiting' })).toEqual({
      ok: false,
      field: 'rootCauseClass',
      reason: 'requires_problem_class',
    });
    expect(validateDisposition({ ...base, impactClass: 'Fewer turns' })).toEqual({
      ok: false,
      field: 'impactClass',
      reason: 'requires_problem_class',
    });
    for (const cls of RESOLVING_RESPONSE_CLASSES) {
      const result = validateDisposition({
        ...base,
        responseClass: cls,
        rootCauseClass: 'Gate waiting',
        impactClass: 'Fewer turns',
        buyerLanguage: 'we lose an hour a shift at the gate',
      });
      expect(result.ok, cls).toBe(true);
      if (result.ok) {
        expect(result.value.rootCauseClass).toBe('Gate waiting');
        expect(result.value.impactClass).toBe('Fewer turns');
      }
    }
  });

  it.each(QUOTE_REQUIRED_RESPONSE_CLASSES)('%s must quote the buyer', (cls) => {
    expect(validateDisposition({ ...base, responseClass: cls })).toEqual({
      ok: false,
      field: 'buyerLanguage',
      reason: 'quote_required',
    });
    expect(validateDisposition({ ...base, responseClass: cls, buyerLanguage: '   ' })).toEqual({
      ok: false,
      field: 'buyerLanguage',
      reason: 'quote_required',
    });
    expect(validateDisposition({ ...base, responseClass: cls, buyerLanguage: 'yes, that is our Tuesday' }).ok).toBe(true);
  });

  it('problem_rejected does not need a quote', () => {
    expect(validateDisposition({ ...base, responseClass: 'problem_rejected' }).ok).toBe(true);
  });

  it.each(OBJECTION_REQUIRED_RESPONSE_CLASSES)('%s must name the objection', (cls) => {
    expect(validateDisposition({ ...base, responseClass: cls })).toEqual({
      ok: false,
      field: 'objection',
      reason: 'objection_required',
    });
    expect(validateDisposition({ ...base, responseClass: cls, objection: LANE_KEY_MAP.already_have_yms.objection }).ok).toBe(true);
  });

  it.each(RESPONSE_CLASSES)('%s validates on a legal channel with the fields it needs', (cls) => {
    const channel = (CALL_ONLY_RESPONSE_CLASSES as readonly string[]).includes(cls) ? 'call' : 'email';
    const result = validateDisposition({
      ...base,
      channel,
      responseClass: cls,
      buyerLanguage: 'their words',
      objection: 'they run a 3PL',
    });
    expect(result.ok, cls).toBe(true);
  });
});
