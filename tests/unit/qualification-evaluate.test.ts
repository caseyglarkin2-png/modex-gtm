import { describe, it, expect } from 'vitest';
import { buildDiff } from '@/lib/revops/qualification/evaluate';
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
});
