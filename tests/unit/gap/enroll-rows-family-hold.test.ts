/** Red team (RevOps): the hand-enroll table runs the family check; a held or unreadable account enrolls nobody. */
import { describe, expect, it } from 'vitest';
import { holdRelatedAccountRows, type EnrollTable } from '@/lib/gap/routing/enroll-row';

const table = (): EnrollTable => ({
  rows: [
    { account: 'Frito-Lay', hubspotCompanyId: null, sequence: null, sendFrom: 'casey', contacts: [{ account: 'Frito-Lay', personaId: 1, hubspotContactId: null, name: 'Dana', email: 'd@fl.example', whatIKnow: null }], skips: [] },
    { account: 'Kroger', hubspotCompanyId: null, sequence: null, sendFrom: 'casey', contacts: [{ account: 'Kroger', personaId: 2, hubspotContactId: null, name: 'Lee', email: 'l@k.example', whatIKnow: null }], skips: [] },
    { account: 'Tyson', hubspotCompanyId: null, sequence: null, sendFrom: 'casey', contacts: [{ account: 'Tyson', personaId: 3, hubspotContactId: null, name: 'Sam', email: 's@t.example', whatIKnow: null }], skips: [] },
  ],
  skipped: [],
});

describe('hand-enroll table family hold', () => {
  it('holds a row with related activity, fails closed on a read error, leaves a clear row alone', async () => {
    const t = await holdRelatedAccountRows(table(), async (a) => {
      if (a === 'Frito-Lay') return { detail: 'Related account activity. PepsiCo: active opportunity.', unknown: false };
      if (a === 'Tyson') throw new Error('db down');
      return null;
    });
    expect(t.rows.map((r) => [r.account, r.contacts.length])).toEqual([['Frito-Lay', 0], ['Kroger', 1], ['Tyson', 0]]);
    expect(t.skipped.map((s) => s.reason)).toEqual([expect.stringMatching(/^related_account_activity: /), expect.stringMatching(/^related_account_unreadable: /)]);
  });
});
