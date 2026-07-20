import { describe, it, expect } from 'vitest';
import {
  hasRoleGate, hasIntent, hasAccountIntent, classifyContact, seniorityRank,
  ACCOUNT_INTENT_SQL_THRESHOLD, ACCOUNT_TRIGGER_SQL_THRESHOLD, ACCOUNT_INTENT_MAX_AGE_DAYS,
} from '../../src/lib/revops/qualification/model';
import type { QualContact, QualCompany } from '../../src/lib/revops/qualification/types';

const NOW = Date.parse('2026-07-20T12:00:00Z');
const recent = new Date(NOW - 3 * 86_400_000).toISOString();   // 3 days ago (fresh)
const stale = new Date(NOW - 120 * 86_400_000).toISOString();  // 120 days ago (cold)

const base = { hs_seniority: '', hs_role: '', jobtitle: '' };

const noIntent = {
  intent_score: '', last_intent_at: '', last_intent_source: '',
  hs_sales_email_last_replied: '', hs_email_open: '', hs_email_replied: '',
  engagements_last_meeting_booked: '',
};

const tam: QualCompany = { id: 'c1', name: 'Acme', icpScore: 85, tam: 'in', tier: '1' };
const offTam: QualCompany = { id: 'c2', name: 'Tiny', icpScore: 40, tam: 'out', tier: '' };
const opsDir = { ...noIntent, hs_seniority: 'director', hs_role: 'operations', jobtitle: 'Director of Operations' } as QualContact;

describe('hasRoleGate', () => {
  it('includes senior leaders of any function', () => {
    expect(hasRoleGate({ ...base, hs_seniority: 'vp' })).toBe(true);
    expect(hasRoleGate({ ...base, hs_seniority: 'director' })).toBe(true);
    expect(hasRoleGate({ ...base, hs_seniority: 'executive' })).toBe(true);
  });
  it('includes structured operations role', () => {
    expect(hasRoleGate({ ...base, hs_role: 'operations' })).toBe(true);
  });
  it('includes ops job titles even at manager level', () => {
    expect(hasRoleGate({ ...base, jobtitle: 'Supply Chain Manager' })).toBe(true);
    expect(hasRoleGate({ ...base, jobtitle: 'Director of Yard Operations' })).toBe(true);
    expect(hasRoleGate({ ...base, jobtitle: 'Logistics Coordinator' })).toBe(true);
  });
  it('excludes junior off-function people', () => {
    expect(hasRoleGate({ ...base, hs_seniority: 'entry', hs_role: 'information_technology', jobtitle: 'IT Analyst' })).toBe(false);
    expect(hasRoleGate({ ...base, hs_seniority: 'employee', hs_role: 'marketing', jobtitle: 'Marketing Associate' })).toBe(false);
  });
});

describe('hasIntent', () => {
  it('false with no signals', () => { expect(hasIntent(noIntent)).toBe(false); });
  it('true on intent_score >= 1', () => { expect(hasIntent({ ...noIntent, intent_score: '1' })).toBe(true); });
  it('true on a reply', () => { expect(hasIntent({ ...noIntent, hs_sales_email_last_replied: '2026-06-01' })).toBe(true); });
  it('true on a booked meeting', () => { expect(hasIntent({ ...noIntent, engagements_last_meeting_booked: '2026-06-01' })).toBe(true); });
  it('true on demo visit source', () => { expect(hasIntent({ ...noIntent, last_intent_source: '/demo/acme' })).toBe(true); });
  it('true on 2 opens + 1 click', () => { expect(hasIntent({ ...noIntent, hs_email_open: '2', hs_email_replied: '1' })).toBe(true); });
  it('false on opens without reply', () => { expect(hasIntent({ ...noIntent, hs_email_open: '5' })).toBe(false); });
});

describe('hasAccountIntent (the keystone join, guardrailed)', () => {
  it('false when the company has no account heat', () => {
    expect(hasAccountIntent(tam, NOW)).toBe(false);
  });
  it('true when RECENT web/demo intent clears the SQL threshold', () => {
    expect(hasAccountIntent({ ...tam, intentScore: ACCOUNT_INTENT_SQL_THRESHOLD, lastIntentAt: recent }, NOW)).toBe(true);
    expect(hasAccountIntent({ ...tam, intentScore: 100, lastIntentAt: recent }, NOW)).toBe(true);
  });
  it('false on a weak single-view score below the threshold', () => {
    expect(hasAccountIntent({ ...tam, intentScore: 40, lastIntentAt: recent }, NOW)).toBe(false);
  });
  it('STALE: a high score with an old lastIntentAt is not hot (no decay guard)', () => {
    expect(hasAccountIntent({ ...tam, intentScore: 100, lastIntentAt: stale }, NOW)).toBe(false);
  });
  it('a high score with NO lastIntentAt is not hot (unknown recency = not fresh)', () => {
    expect(hasAccountIntent({ ...tam, intentScore: 100 }, NOW)).toBe(false);
  });
  it('true when external trigger heat clears its threshold (its own decay upstream)', () => {
    expect(hasAccountIntent({ ...tam, triggerScore: ACCOUNT_TRIGGER_SQL_THRESHOLD }, NOW)).toBe(true);
  });
  it('null company is never hot', () => {
    expect(hasAccountIntent(null, NOW)).toBe(false);
  });
  it('max-age boundary is inclusive', () => {
    const at = new Date(NOW - ACCOUNT_INTENT_MAX_AGE_DAYS * 86_400_000).toISOString();
    expect(hasAccountIntent({ ...tam, intentScore: 80, lastIntentAt: at }, NOW)).toBe(true);
  });
});

describe('seniorityRank (per-account cap ordering)', () => {
  it('ranks executives above VPs above directors above ops-role above title-only', () => {
    expect(seniorityRank({ hs_seniority: 'executive', hs_role: '', jobtitle: '' })).toBeGreaterThan(
      seniorityRank({ hs_seniority: 'vp', hs_role: '', jobtitle: '' }));
    expect(seniorityRank({ hs_seniority: 'director', hs_role: '', jobtitle: '' })).toBeGreaterThan(
      seniorityRank({ hs_seniority: '', hs_role: 'operations', jobtitle: '' }));
    expect(seniorityRank({ hs_seniority: '', hs_role: 'operations', jobtitle: '' })).toBeGreaterThan(
      seniorityRank({ hs_seniority: '', hs_role: '', jobtitle: 'Logistics Coordinator' }));
  });
});

describe('classifyContact', () => {
  it('none when account is not in TAM', () => {
    expect(classifyContact(offTam, opsDir)).toBe('none');
  });
  it('none when no company', () => {
    expect(classifyContact(null, opsDir)).toBe('none');
  });
  it('none for off-role at TAM account', () => {
    expect(classifyContact(tam, { ...noIntent, hs_seniority: 'entry', hs_role: 'finance', jobtitle: 'Accountant' } as QualContact)).toBe('none');
  });
  it('mql for ops director at TAM, no intent', () => {
    expect(classifyContact(tam, opsDir)).toBe('mql');
  });
  it('sql for ops director at TAM with personal intent', () => {
    expect(classifyContact(tam, { ...opsDir, intent_score: '2' }, NOW)).toBe('sql');
  });
  it('KEYSTONE: sql for a role-gated committee member at a RECENTLY hot account, zero personal engagement', () => {
    const hotAccount: QualCompany = { ...tam, intentScore: 100, lastIntentAt: recent };
    expect(classifyContact(hotAccount, opsDir, NOW)).toBe('sql');
  });
  it('KEYSTONE: a hot account does NOT promote an off-role contact past the role gate', () => {
    const hotAccount: QualCompany = { ...tam, intentScore: 100, lastIntentAt: recent };
    const junior = { ...noIntent, hs_seniority: 'entry', hs_role: 'finance', jobtitle: 'Accountant' } as QualContact;
    expect(classifyContact(hotAccount, junior, NOW)).toBe('none');
  });
  it('a STALE-hot account leaves its committee at mql (no promote on old heat)', () => {
    const staleHot: QualCompany = { ...tam, intentScore: 100, lastIntentAt: stale };
    expect(classifyContact(staleHot, opsDir, NOW)).toBe('mql');
  });
  it('a lukewarm account (below threshold) leaves its committee at mql', () => {
    const warm: QualCompany = { ...tam, intentScore: 40, lastIntentAt: recent };
    expect(classifyContact(warm, opsDir, NOW)).toBe('mql');
  });
});
