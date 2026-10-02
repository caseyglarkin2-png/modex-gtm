/**
 * V2 (RevOps M1-M3, S1): ONE restriction authority, read by GAP motion, the GAP action-time check, the legacy send
 * guards, the Outbox writers and the drip. Dannon is warm-intro only through Mark Shaughnessy.
 */
import { describe, expect, it } from 'vitest';
import { restrictionFor, restrictionForAccount, restrictionForEmail, restrictionForName } from '@/lib/gap/policy/restriction';
import { isWarmIntroOnlyAccount, assertColdOutreachAllowed } from '@/lib/studio/guardrails';
import { decideApproach, type ApproachInput } from '@/lib/gap/motion/approach';

const intro = { introducer: 'Mark Shaughnessy', route: 'the Danone CSCO office' };

describe('restriction authority', () => {
  it('matches whole name words, aliases and owned domains (fail closed)', () => {
    expect(restrictionForName('Dannon')?.introducer).toBe('Mark Shaughnessy');
    expect(restrictionForName('Danone North America')?.account).toBe('Dannon');
    expect(restrictionForName('DANONE, S.A.')?.account).toBe('Dannon');
    expect(restrictionForEmail('heiko@danone.com')?.account).toBe('Dannon');
    expect(restrictionForEmail('a.b@us.danone.com')?.account).toBe('Dannon');
    expect(restrictionFor({ name: 'DNA Group', aliases: ['Danone Waters'] })?.account).toBe('Dannon');
    expect(restrictionFor({ name: 'Some Shell', domains: ['dannon.com'] })?.account).toBe('Dannon');
  });
  it('does not trip on a name that merely contains the letters', () => {
    expect(restrictionForName('Dannonville Freight')).toBeNull();
    expect(restrictionForName('PepsiCo')).toBeNull();
    expect(restrictionForEmail('x@notdanone.com')).toBeNull();
    expect(restrictionForEmail('')).toBeNull();
  });
  it('reads GAP aliases both ways and throws when the alias read fails (callers fail closed)', async () => {
    const db = (rows: Array<{ alias: string; account_name: string }>) => ({ gapAccountAlias: { findMany: async () => rows } });
    expect((await restrictionForAccount(db([{ alias: 'Danone US', account_name: 'Shell Co' }]), 'Shell Co'))?.account).toBe('Dannon');
    expect(await restrictionForAccount(db([]), 'Kroger')).toBeNull();
    await expect(restrictionForAccount({ gapAccountAlias: { findMany: async () => { throw new Error('db down'); } } }, 'Shell Co')).rejects.toThrow('db down');
  });
  it('the Studio guardrail delegates to it', () => {
    expect(isWarmIntroOnlyAccount('Danone North America')).toBe(true);
    expect(isWarmIntroOnlyAccount('Dannonville Freight')).toBe(false);
    expect(() => assertColdOutreachAllowed('Dannon')).toThrow(/Mark Shaughnessy/);
  });
});

describe('INTRO_ONLY motion', () => {
  const base: ApproachInput = { deal: 'CLEAR', contradicted: false, conversation: null, touchHold: null, verifiedFact: true, reachable: true, source: null };
  it('beats a verified fact and fires with nobody reachable (it sits before the reachability gate)', () => {
    expect(decideApproach({ ...base, restriction: intro }).kind).toBe('INTRO_ONLY');
    const a = decideApproach({ ...base, reachable: false, verifiedFact: false, restriction: intro });
    expect(a.kind).toBe('INTRO_ONLY');
    expect(a.why).toMatch(/Mark Shaughnessy/);
    expect(a.why).toMatch(/current state/);
    expect(decideApproach({ ...base, touchHold: 'In motion', restriction: intro }).kind).toBe('INTRO_ONLY');
  });
  it('never outranks a deal, a family hold, a buyer "no" or a live conversation', () => {
    expect(decideApproach({ ...base, deal: 'ACTIVE', restriction: intro }).kind).toBe('IN_DEAL');
    expect(decideApproach({ ...base, deal: 'UNKNOWN', restriction: intro }).kind).toBe('NO_GOOD_MOTION');
    expect(decideApproach({ ...base, relatedHold: 'family deal', restriction: intro }).kind).toBe('NO_GOOD_MOTION');
    expect(decideApproach({ ...base, conversation: { who: 'Heiko', responseClass: 'not_priority', at: '2026-09-01' }, restriction: intro }).kind).toBe('NO_GOOD_MOTION');
    expect(decideApproach({ ...base, conversation: { who: 'Heiko', responseClass: 'request_information', at: '2026-09-01' }, restriction: intro }).kind).toBe('FOLLOW_UP');
  });
});
