import { describe, it, expect } from 'vitest';
import { buildDiff, dedupeByContact } from '@/lib/revops/qualification/evaluate';
import { ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT } from '@/lib/revops/qualification/model';
import type { QualCompany, QualContact } from '@/lib/revops/qualification/types';

const NOW = Date.parse('2026-07-20T12:00:00Z');
const recentIntent = new Date(NOW - 2 * 86_400_000).toISOString();

const co: QualCompany = { id: 'c1', name: 'Acme', icpScore: 90, tam: 'in', tier: '1' };
const mk = (over: Partial<QualContact>): QualContact => ({
  id: 'x', email: 'a@acme.com', firstname: 'A', lastname: 'B', jobtitle: '', lifecyclestage: 'lead',
  hs_seniority: '', hs_role: '', yardflow_qual_verdict: 'none', intent_score: '', last_intent_at: '',
  last_intent_source: '', hs_sales_email_last_replied: '', hs_email_open: '', hs_email_replied: '',
  engagements_last_meeting_booked: '', ...over,
});

describe('buildDiff', () => {
  it('flags an MQL change for an ops director with no current verdict', () => {
    const rows = buildDiff([{ company: co, contact: mk({ hs_seniority: 'director', hs_role: 'operations' }) }]);
    expect(rows[0].newVerdict).toBe('mql');
    expect(rows[0].changed).toBe(true);
  });
  it('marks unchanged when current verdict already matches', () => {
    const rows = buildDiff([{ company: co, contact: mk({ hs_seniority: 'director', yardflow_qual_verdict: 'mql' }) }]);
    expect(rows[0].changed).toBe(false);
  });
  it('produces sql with intent', () => {
    const rows = buildDiff([{ company: co, contact: mk({ hs_seniority: 'vp', intent_score: '3' }) }]);
    expect(rows[0].newVerdict).toBe('sql');
  });
  it('does not crash on an unexpected current verdict value', () => {
    const rows = buildDiff([{ company: co, contact: mk({ hs_seniority: 'vp', yardflow_qual_verdict: 'legacy_hot' }) }]);
    expect(rows[0].newVerdict).toBe('mql');
    expect(rows[0].changed).toBe(true);
  });
});

describe('per-account account-intent SQL cap (blast-radius guard)', () => {
  const CAP = ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT;
  const hotCo: QualCompany = { id: 'hot', name: 'HotCo', icpScore: 90, tam: 'in', tier: '1', intentScore: 90, lastIntentAt: recentIntent };

  it('caps account-only SQL promotions per account to the top-N seniors', () => {
    // CAP+3 role-gated committee members, none with personal engagement
    const pairs = Array.from({ length: CAP + 3 }, (_, i) => ({
      company: hotCo,
      contact: mk({ id: `p${i}`, email: `p${i}@hot.com`, hs_seniority: i < 4 ? 'executive' : 'director', hs_role: 'operations' }),
    }));
    const rows = buildDiff(pairs, NOW);
    const sqls = rows.filter((r) => r.newVerdict === 'sql');
    const mqls = rows.filter((r) => r.newVerdict === 'mql');
    expect(sqls).toHaveLength(CAP);        // only the top-N promote on account heat
    expect(mqls).toHaveLength(3);          // the rest stay MQL, not SQL
    // executives (rank 5) survive the cap over plain directors
    expect(sqls.every((r) => r.seniority === 'executive' || r.seniority === 'director')).toBe(true);
    expect(sqls.filter((r) => r.seniority === 'executive')).toHaveLength(4);
  });

  it('NEVER caps a person-intent SQL (individually earned), even past the cap', () => {
    const pairs = [
      // CAP account-only SQLs fill the cap
      ...Array.from({ length: CAP }, (_, i) => ({
        company: hotCo, contact: mk({ id: `a${i}`, email: `a${i}@hot.com`, hs_seniority: 'director', hs_role: 'operations' }),
      })),
      // one more contact who personally replied — must stay SQL despite the cap
      { company: hotCo, contact: mk({ id: 'earned', email: 'earned@hot.com', hs_seniority: 'director', hs_sales_email_last_replied: '2026-07-19' }) },
    ];
    const rows = buildDiff(pairs, NOW);
    const earned = rows.find((r) => r.email === 'earned@hot.com')!;
    expect(earned.newVerdict).toBe('sql');
    expect(rows.filter((r) => r.newVerdict === 'sql')).toHaveLength(CAP + 1); // cap + the earned one
  });

  it('does not cap when the account is not hot (normal MQL behavior)', () => {
    const coolCo: QualCompany = { ...hotCo, intentScore: 10 };
    const pairs = Array.from({ length: CAP + 3 }, (_, i) => ({
      company: coolCo, contact: mk({ id: `q${i}`, email: `q${i}@hot.com`, hs_seniority: 'director' }),
    }));
    const rows = buildDiff(pairs, NOW);
    expect(rows.every((r) => r.newVerdict === 'mql')).toBe(true); // no SQLs to cap
  });
});

describe('anti-flap: never un-qualify an existing SQL on cooled account heat', () => {
  const CAP = ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT;
  it('a currently-SQL committee member stays SQL when the account drops below threshold', () => {
    const cooled: QualCompany = { id: 'cool', name: 'Cool', icpScore: 80, tam: 'in', tier: '1', intentScore: 30, lastIntentAt: recentIntent };
    const rows = buildDiff([
      { company: cooled, contact: mk({ id: 's1', hs_seniority: 'director', hs_role: 'operations', yardflow_qual_verdict: 'sql' }) },
    ], NOW);
    expect(rows[0].newVerdict).toBe('sql');   // sticky: not demoted to mql
    expect(rows[0].changed).toBe(false);
  });
  it('an already-SQL contact does not consume a cap slot (only NEW promotions are capped)', () => {
    const hotCo2: QualCompany = { id: 'h2', name: 'H2', icpScore: 90, tam: 'in', tier: '1', intentScore: 90, lastIntentAt: recentIntent };
    const pairs = [
      // CAP brand-new account-only promotions
      ...Array.from({ length: CAP }, (_, i) => ({
        company: hotCo2, contact: mk({ id: `n${i}`, email: `n${i}@h2.com`, hs_seniority: 'director', hs_role: 'operations' }),
      })),
      // one already-SQL contact: must stay SQL AND not push a new one below the cut
      { company: hotCo2, contact: mk({ id: 'old', email: 'old@h2.com', hs_seniority: 'director', hs_role: 'operations', yardflow_qual_verdict: 'sql' }) },
    ];
    const rows = buildDiff(pairs, NOW);
    expect(rows.filter((r) => r.newVerdict === 'sql')).toHaveLength(CAP + 1); // all CAP new + the existing one
  });
});

describe('dedupeByContact', () => {
  const lowMql: QualCompany = { id: 'lo', name: 'Low', icpScore: 75, tam: 'in', tier: '2' };
  const highSql: QualCompany = { id: 'hi', name: 'High', icpScore: 95, tam: 'in', tier: '1' };

  it('collapses a contact at two companies to one row, keeping the higher verdict', () => {
    // same contactId at two TAM companies: mql via Low (no intent), sql via High (intent)
    const diff = buildDiff([
      { company: lowMql, contact: mk({ id: 'dup', hs_seniority: 'director' }) },
      { company: highSql, contact: mk({ id: 'dup', hs_seniority: 'director', intent_score: '2' }) },
    ]);
    const deduped = dedupeByContact(diff);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].newVerdict).toBe('sql');
  });
  it('breaks verdict ties by higher ICP company', () => {
    const diff = buildDiff([
      { company: lowMql, contact: mk({ id: 'dup', hs_seniority: 'director' }) },
      { company: highSql, contact: mk({ id: 'dup', hs_seniority: 'director' }) },
    ]);
    const deduped = dedupeByContact(diff);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].icpScore).toBe(95);
  });
});
