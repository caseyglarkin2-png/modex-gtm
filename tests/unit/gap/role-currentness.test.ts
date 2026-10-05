/**
 * ROLE CURRENTNESS (owner resolution, 2026-10-05). Employment currentness is necessary, not sufficient. Walmart
 * pattern: the CRM holds "Sr Director - West Transportation Command Center"; a colleague's own public post says they
 * were promoted and congratulates the person on their own promotion. They are still at the account (employment
 * current) while the stored role is no longer theirs and the new title is unknown. Two explainable dimensions, never
 * a number. Patterns, never people.
 */
import { describe, expect, it } from 'vitest';
import { crmEvidence, readEmployment, type EmploymentEvidence } from '@/lib/gap/people/employment';
import { evidenceFromFields } from '@/lib/gap/people/employment-store';
import { CONFLICT_WINDOW_DAYS, RECENT_DAYS, ROLE_LABEL, readRole, roleBlocksRanking, sameRole, type RoleRead } from '@/lib/gap/people/role-currentness';

const NOW = new Date('2026-10-05T12:00:00Z');
const ACCOUNT = 'Walmart Inc.';
const STORED = 'Sr Director - West Transportation Command Center';
const crm = (title = STORED) => crmEvidence({ company: 'Walmart', title, email: 'x@walmart.com', lastModifiedAt: '2026-09-30T00:00:00Z' });
const read = (evidence: EmploymentEvidence[], over: Partial<Parameters<typeof readRole>[0]> = {}): RoleRead => readRole({ accountName: ACCOUNT, storedTitle: STORED, evidence, now: NOW, ...over });
const profile = (over: Partial<EmploymentEvidence>): EmploymentEvidence => ({ kind: 'profile', tier: 'strong', company: ACCOUNT, title: STORED, at: '2026-09-20T00:00:00Z', source: 'LinkedIn profile', url: 'https://www.linkedin.com/in/x', ...over });

describe('(1) same employer, same role: ROLE_CURRENT_CONFIRMED and usable', () => {
  it('a recent strong source naming the stored role confirms it; the verified title is the effective title', () => {
    const r = read([...crm(), profile({ title: 'Senior Director, West Transportation Command Center' })]);
    expect(r.state).toBe('ROLE_CURRENT_CONFIRMED');
    expect(r.usableForRanking).toBe(true);
    expect(r.effectiveTitle).toBe('Senior Director, West Transportation Command Center');
    expect(r.titleSource).toBe('verified');
    expect(r.storedTitle).toBe(STORED);
    expect(r.priorTitle).toBeNull();
    expect(r.verifyNeeded).toBe(false);
    expect(r.decidedBy[0].kind).toBe('profile');
    expect(r.why).not.toMatch(/—/);
  });
  it('the same strong source older than RECENT_DAYS is likely, not confirmed', () => {
    const r = read([...crm(), profile({ at: '2025-09-01T00:00:00Z' })]);
    expect(r.state).toBe('ROLE_CURRENT_LIKELY');
    expect(r.usableForRanking).toBe(true);
    expect(r.why).toMatch(new RegExp(`older than ${RECENT_DAYS} days`));
  });
});

describe('(2) same employer, verified promotion, new role unknown: ROLE_CHANGED_CONFIRMED, no effective title, not usable', () => {
  const promoted: EmploymentEvidence = { kind: 'profile', tier: 'strong', company: ACCOUNT, title: null, at: '2026-10-05T00:00:00Z', source: 'LinkedIn post', url: 'https://www.linkedin.com/in/colleague/', roleChanged: true, note: 'A colleague was promoted into the role and congratulates them on their own promotion.' };
  it('reads the Walmart pattern: still here, role changed, title null, verify the current remit', () => {
    const r = read([...crm(), promoted]);
    expect(r.state).toBe('ROLE_CHANGED_CONFIRMED');
    expect(r.effectiveTitle).toBeNull();
    expect(r.titleSource).toBe('unknown');
    expect(r.priorTitle).toBe(STORED);
    expect(r.usableForRanking).toBe(false);
    expect(r.verifyNeeded).toBe(true);
    expect(r.why).toMatch(/verify current remit/i);
    expect(r.why).toMatch(/still at Walmart/i);
    expect(r.decidedBy).toContain(promoted);
  });
  it('employment stays current: the same evidence through readEmployment is not a departure', () => {
    const e = readEmployment({ accountName: ACCOUNT, evidence: [...crm(), promoted], now: NOW });
    expect(e.state).toBe('CURRENT_CONFIRMED');
  });
  it('a newer strong source that names the new title resolves it: changed, with the new title, usable', () => {
    const r = read([...crm(), promoted, profile({ title: 'Vice President, Transportation', at: '2026-10-05T06:00:00Z' })]);
    expect(r.state).toBe('ROLE_CHANGED_CONFIRMED');
    expect(r.effectiveTitle).toBe('Vice President, Transportation');
    expect(r.usableForRanking).toBe(true);
  });
  it('an older titled source does not resolve a newer promotion', () => {
    const r = read([...crm(), promoted, profile({ at: '2026-09-01T00:00:00Z' })]);
    expect(r.state).toBe('ROLE_CHANGED_CONFIRMED');
    expect(r.effectiveTitle).toBeNull();
  });
});

describe('(3) same employer, verified new title: ROLE_CHANGED_CONFIRMED with the new title, usable', () => {
  it('a strong source naming a different remit changes the role and keeps the prior title', () => {
    const r = read([...crm(), profile({ title: 'Vice President, Supply Chain Operations' })]);
    expect(r.state).toBe('ROLE_CHANGED_CONFIRMED');
    expect(r.effectiveTitle).toBe('Vice President, Supply Chain Operations');
    expect(r.titleSource).toBe('verified');
    expect(r.priorTitle).toBe(STORED);
    expect(r.usableForRanking).toBe(true);
    expect(roleBlocksRanking(r.state)).toBe(false);
    expect(r.why).toMatch(/changed/);
  });
  it('a roleChanged row that carries the new title is the same answer', () => {
    const r = read([...crm(), profile({ title: 'Vice President, Supply Chain Operations', roleChanged: true })]);
    expect(r).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: 'Vice President, Supply Chain Operations', usableForRanking: true });
  });
});

describe('(4) a human role correction beats later supporting automation', () => {
  const human = (over: Partial<EmploymentEvidence>): EmploymentEvidence => ({ kind: 'human', tier: 'strong', company: ACCOUNT, title: 'Vice President, Transportation', at: '2026-10-01T00:00:00Z', source: 'Casey', roleChanged: true, ...over });
  it('Casey recorded the new title; a later Apollo title_updated with the old title does not reopen it', () => {
    const r = read([...crm(), human({}), { kind: 'apollo', tier: 'supporting', company: ACCOUNT, title: STORED, at: '2026-10-04T00:00:00Z', source: 'Apollo employment check', note: 'Title refreshed by Apollo.' }]);
    expect(r.state).toBe('ROLE_CHANGED_CONFIRMED');
    expect(r.effectiveTitle).toBe('Vice President, Transportation');
    expect(r.titleSource).toBe('human');
    expect(r.usableForRanking).toBe(true);
    expect(r.decidedBy).toEqual([expect.objectContaining({ kind: 'human' })]);
  });
  it('Casey said the role changed without a title: changed, not usable, verify', () => {
    const r = read([...crm(), human({ title: null })]);
    expect(r).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: null, usableForRanking: false, verifyNeeded: true });
  });
  it('Casey confirmed the role with a title: confirmed, even against a later strong source elsewhere in remit', () => {
    const r = read([...crm(), human({ roleChanged: false }), profile({ title: 'Director of Stores', at: '2026-10-04T00:00:00Z' })]);
    expect(r).toMatchObject({ state: 'ROLE_CURRENT_CONFIRMED', effectiveTitle: 'Vice President, Transportation', titleSource: 'human', usableForRanking: true });
  });
  it('Casey confirmed them current without a title: the stored title stands as ROLE_UNVERIFIED unless strong evidence confirms it', () => {
    expect(read([...crm(), human({ roleChanged: false, title: null })])).toMatchObject({ state: 'ROLE_UNVERIFIED', effectiveTitle: STORED, titleSource: 'stored' });
    expect(read([...crm(), human({ roleChanged: false, title: null }), profile({})]).state).toBe('ROLE_CURRENT_CONFIRMED');
    // Supporting automation does not raise a conflict over Casey's word.
    expect(read([...crm(), human({ roleChanged: false, title: null }), { kind: 'apollo', tier: 'supporting', company: ACCOUNT, title: 'Director of Stores', at: '2026-10-04T00:00:00Z', source: 'Apollo' }]).state).toBe('ROLE_UNVERIFIED');
  });
  it('Casey marked them as left: the stored role is not theirs here; not usable', () => {
    const r = read([...crm(), human({ roleChanged: false, left: true, company: 'Target', title: 'VP' })]);
    expect(r).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: null, usableForRanking: false, priorTitle: STORED });
  });
});

describe('(5) the CRM alone, however recently modified, is ROLE_UNVERIFIED', () => {
  it('a CRM row with a last-modified date yesterday and a company email proves nothing about the role', () => {
    const r = read(crmEvidence({ company: 'Walmart', title: STORED, email: 'x@walmart.com', lastModifiedAt: '2026-10-04T00:00:00Z' }));
    expect(r.state).toBe('ROLE_UNVERIFIED');
    expect(r.effectiveTitle).toBe(STORED);
    expect(r.titleSource).toBe('stored');
    expect(r.usableForRanking).toBe(true);
    expect(r.verifyNeeded).toBe(false);
    expect(r.why).toMatch(/not proof/);
    expect(r.decidedBy.map((e) => e.kind)).toEqual(['crm']);
  });
  it('weak rows alone, and an empty record, are unverified; no stored title reads unknown', () => {
    const weak: EmploymentEvidence[] = [{ kind: 'crm_modified', tier: 'weak', company: ACCOUNT, title: 'Chief Executive Officer', at: '2026-10-04T00:00:00Z', source: 'HubSpot last modified' }];
    expect(read(weak).state).toBe('ROLE_UNVERIFIED');
    expect(read([])).toMatchObject({ state: 'ROLE_UNVERIFIED', effectiveTitle: STORED, titleSource: 'stored' });
    expect(read([], { storedTitle: null })).toMatchObject({ state: 'ROLE_UNVERIFIED', effectiveTitle: null, titleSource: 'unknown' });
    expect(read([], { storedTitle: null, crmTitle: 'Director' })).toMatchObject({ state: 'ROLE_UNVERIFIED', effectiveTitle: 'Director', titleSource: 'crm' });
  });
  it('supporting evidence with the same title is likely; with a different title it is a conflict', () => {
    const apollo = (title: string): EmploymentEvidence => ({ kind: 'apollo', tier: 'supporting', company: ACCOUNT, title, at: '2026-09-11T00:00:00Z', source: 'Apollo employment check', note: 'Title refreshed by Apollo.' });
    expect(read([...crm(), apollo('Senior Director, West Transportation Command Center')])).toMatchObject({ state: 'ROLE_CURRENT_LIKELY', usableForRanking: true, effectiveTitle: STORED });
    const c = read([...crm(), apollo('Director, Transportation Command Center')]);
    expect(c.state).toBe('ROLE_CONFLICT');
    expect(c.usableForRanking).toBe(false);
    expect(c.verifyNeeded).toBe(true);
    expect(roleBlocksRanking(c.state)).toBe(true);
    // The CRM's own title differing from the stored title is the same conflict.
    expect(read(crm('Director, Transportation Command Center')).state).toBe('ROLE_CONFLICT');
  });
});

describe('(6) two strong sources disagreeing within a month: ROLE_CONFLICT', () => {
  it('a profile and an employer page within CONFLICT_WINDOW_DAYS naming different remits conflict; a flagged conflict row conflicts', () => {
    const r = read([...crm(), profile({ at: '2026-09-20T00:00:00Z' }), { kind: 'employer_page', tier: 'strong', company: ACCOUNT, title: 'Vice President, Stores', at: '2026-09-28T00:00:00Z', source: 'walmart.com leadership' }]);
    expect(r.state).toBe('ROLE_CONFLICT');
    expect(r.usableForRanking).toBe(false);
    expect(r.verifyNeeded).toBe(true);
    expect(r.decidedBy).toHaveLength(2);
    expect(r.why).toMatch(/disagree/);
    expect(CONFLICT_WINDOW_DAYS).toBe(30);
    const flagged = read([...crm(), { kind: 'web', tier: 'supporting', company: ACCOUNT, title: null, at: '2026-10-01T00:00:00Z', source: 'verified at news.example', conflict: true }]);
    expect(flagged).toMatchObject({ state: 'ROLE_CONFLICT', usableForRanking: false, verifyNeeded: true });
  });
  it('two strong sources months apart: the newest decides, no conflict', () => {
    const r = read([...crm(), profile({ at: '2026-03-01T00:00:00Z' }), { kind: 'employer_page', tier: 'strong', company: ACCOUNT, title: 'Vice President, Stores', at: '2026-09-28T00:00:00Z', source: 'walmart.com leadership' }]);
    expect(r).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: 'Vice President, Stores', usableForRanking: true });
  });
  it('strong evidence placing them at another employer says nothing about the role here', () => {
    expect(read([...crm(), profile({ company: 'Target', title: 'VP Transportation' })]).state).toBe('ROLE_UNVERIFIED');
  });
});

describe('(7) the Walmart pattern end to end through evidenceFromFields', () => {
  it('a derived role_changed row with a null title and a linkedin.com/in source reads ROLE_CHANGED_CONFIRMED, not usable; employment stays current', () => {
    const fields = [
      { field_name: 'employment_status', field_value: 'role_changed', source: 'derived', source_timestamp: new Date('2026-10-05T00:00:00Z'), confidence: 0.9, last_writer: 'employment_verify:casey' },
      { field_name: 'employment_company', field_value: ACCOUNT, source: 'derived', source_timestamp: null, confidence: null, last_writer: null },
      { field_name: 'employment_title', field_value: null, source: 'derived', source_timestamp: null, confidence: null, last_writer: null },
      { field_name: 'employment_source_url', field_value: 'https://www.linkedin.com/in/christian-burton-57161518b/', source: 'derived', source_timestamp: null, confidence: null, last_writer: null },
      { field_name: 'employment_note', field_value: 'A colleague was promoted into the role.', source: 'derived', source_timestamp: null, confidence: null, last_writer: null },
    ];
    const evidence = [...crm(), ...evidenceFromFields(fields, ACCOUNT)];
    expect(evidence.find((e) => e.roleChanged)).toMatchObject({ kind: 'profile', tier: 'strong', title: null, company: ACCOUNT });
    const role = read(evidence);
    expect(role).toMatchObject({ state: 'ROLE_CHANGED_CONFIRMED', effectiveTitle: null, usableForRanking: false, priorTitle: STORED });
    expect(readEmployment({ accountName: ACCOUNT, evidence, now: NOW }).state).toBe('CURRENT_CONFIRMED');
  });
  it('a derived conflict row reads ROLE_CONFLICT and says nothing about the company', () => {
    const fields = [
      { field_name: 'employment_status', field_value: 'conflict', source: 'derived', source_timestamp: new Date('2026-10-05T00:00:00Z'), confidence: 0.6, last_writer: 'employment_verify:casey' },
      { field_name: 'employment_source_url', field_value: 'https://news.example/story', source: 'derived', source_timestamp: null, confidence: null, last_writer: null },
    ];
    const evidence = [...crm(), ...evidenceFromFields(fields, ACCOUNT)];
    expect(evidence.find((e) => e.conflict)).toBeTruthy();
    expect(read(evidence).state).toBe('ROLE_CONFLICT');
    expect(readEmployment({ accountName: ACCOUNT, evidence, now: NOW }).state).toBe('CURRENT_UNVERIFIED');
  });
  it('a manual role_changed row carries the flag and the human kind', () => {
    const fields = [
      { field_name: 'employment_status', field_value: 'role_changed', source: 'manual', source_timestamp: new Date('2026-10-05T00:00:00Z'), confidence: 1, last_writer: 'casey' },
      { field_name: 'employment_title', field_value: 'VP Transportation', source: 'manual', source_timestamp: null, confidence: null, last_writer: null },
    ];
    expect(evidenceFromFields(fields, ACCOUNT)[0]).toMatchObject({ kind: 'human', roleChanged: true, title: 'VP Transportation', company: ACCOUNT });
  });
});

describe('sameRole: a normalized title comparison', () => {
  it.each([
    ['Sr Director - West Transportation Command Center', 'Senior Director, West Transportation Command Center'],
    ['VP Transportation & Logistics', 'Vice President of Transportation and Logistics'],
    ['Director of Transportation, FedEx', 'Director of Transportation'],
    ['Director of Transportation at FedEx', 'director of transportation'],
    ['SVP Supply Chain', 'Senior Vice President, Supply Chain'],
    ['Sr. Mgr, Yard Ops', 'Senior Manager Yard Operations'],
  ])('"%s" is the same role as "%s"', (a, b) => {
    expect(sameRole(a, b)).toBe(true);
    expect(sameRole(b, a)).toBe(true);
  });
  it.each([
    ['Director of Transportation', 'Director of Logistics'],
    ['Sr Director - West Transportation Command Center', 'Vice President, Transportation'],
    ['Director, Transportation', 'Director, Stores'],
    ['Manager, Yard Operations', 'Director, Yard Operations'],
  ])('"%s" differs from "%s" (a different function or remit)', (a, b) => {
    expect(sameRole(a, b)).toBe(false);
  });
  it('null or empty never matches, and the labels carry no em dash', () => {
    expect(sameRole(null, 'Director')).toBe(false);
    expect(sameRole('', '')).toBe(false);
    expect(sameRole(undefined, undefined)).toBe(false);
    expect(Object.values(ROLE_LABEL).join(' ')).not.toMatch(/—/);
    expect(Object.keys(ROLE_LABEL).sort()).toEqual(['ROLE_CHANGED_CONFIRMED', 'ROLE_CONFLICT', 'ROLE_CURRENT_CONFIRMED', 'ROLE_CURRENT_LIKELY', 'ROLE_UNVERIFIED']);
  });
});
