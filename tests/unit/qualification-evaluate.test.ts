import { describe, it, expect } from 'vitest';
import { buildDiff, dedupeByContact } from '@/lib/revops/qualification/evaluate';
import type { QualCompany, QualContact } from '@/lib/revops/qualification/types';

const co: QualCompany = { id: 'c1', name: 'Acme', icpScore: 90 };
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

describe('dedupeByContact', () => {
  const lowMql: QualCompany = { id: 'lo', name: 'Low', icpScore: 75 };
  const highSql: QualCompany = { id: 'hi', name: 'High', icpScore: 95 };

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
