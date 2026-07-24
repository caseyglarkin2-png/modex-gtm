import { describe, it, expect, vi } from 'vitest';

// -------------------------------------------------------------------------
// Epic 5: the per-account SQL cap (accountIntentSqlCap) can only demote when it
// SEES the whole committee in one batch. On a later day the incremental path (a)
// loads only the individually-modified contacts of a still-hot account whose
// company row was NOT re-modified inside the window (intent persists 30d), so the
// cap saw a sub-cap slice, demoted nobody, and classifyContact promoted the whole
// bumped batch to SQL on account heat alone. This test drives evaluateIncremental
// end to end (HubSpot mocked) and proves the committee-cap-integrity expansion now
// pulls the full roster so the cap demotes the over-cap account-only promotions.
// -------------------------------------------------------------------------
const h = vi.hoisted(() => {
  const rawContact = (id: string, verdict: string) => ({
    id,
    properties: {
      email: `${id}@hot.com`, firstname: id, lastname: 'X', jobtitle: '',
      lifecyclestage: 'lead', hs_seniority: 'director', hs_role: 'operations',
      yardflow_qual_verdict: verdict, intent_score: '', last_intent_at: '',
      last_intent_source: '', hs_sales_email_last_replied: '', hs_email_open: '',
      hs_email_replied: '', engagements_last_meeting_booked: '',
    },
  });
  const alreadySql = Array.from({ length: 10 }, (_, i) => rawContact(`sql${i}`, 'sql'));
  const mqlPool = Array.from({ length: 12 }, (_, i) => rawContact(`mql${i}`, 'mql'));
  const committee = [...alreadySql, ...mqlPool];
  const committeeById = new Map(committee.map((c) => [c.id, c]));
  const rosterIds = committee.map((c) => c.id);
  // Only 4 of the 12 account-only MQL contacts were individually modified this
  // window; the hot company row was NOT re-modified (companies search returns []).
  const bumped = mqlPool.slice(0, 4);
  const recentIntent = new Date(Date.now() - 2 * 86_400_000).toISOString();
  const client = {
    crm: {
      contacts: {
        searchApi: { doSearch: async () => ({ results: bumped }) },
        batchApi: {
          read: async ({ inputs }: { inputs: { id: string }[] }) => ({
            results: inputs.map((i) => committeeById.get(i.id)).filter(Boolean),
          }),
        },
      },
      companies: {
        // company not re-modified inside the window -> path (b) is empty, so only
        // the committee-cap-integrity expansion can restore the full roster.
        searchApi: { doSearch: async () => ({ results: [] }) },
        batchApi: {
          read: async ({ inputs }: { inputs: { id: string }[] }) => ({
            results: inputs.map((i) => ({
              id: i.id,
              properties: {
                name: 'HotCo', yardflow_tam: 'in', tam_tier: '1',
                intent_score: '90', trigger_score: '0',
                last_intent_at: recentIntent, last_intent_source: 'demo',
              },
            })),
          }),
        },
      },
      associations: {
        v4: {
          batchApi: {
            getPage: async (
              _from: string,
              _to: string,
              { inputs }: { inputs: { id: string }[] },
            ) => ({
              results: inputs.map((i) => ({ from: { id: i.id }, to: [{ toObjectId: 'hot' }] })),
            }),
          },
          basicApi: {
            getPage: async () => ({ results: rosterIds.map((id) => ({ toObjectId: id })) }),
          },
        },
      },
    },
  };
  return { client };
});

vi.mock('@/lib/hubspot/client', () => ({
  getHubSpotClient: () => h.client,
  isHubSpotConfigured: () => true,
  withHubSpotRetry: async (fn: () => unknown) => fn(),
}));

import { evaluateIncremental } from '@/lib/revops/qualification/incremental';
import { ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT } from '@/lib/revops/qualification/model';

describe('evaluateIncremental committee-cap integrity (Epic 5)', () => {
  it('expands a still-hot account whose company was not re-modified so the SQL cap sees the full committee', async () => {
    const CAP = ACCOUNT_INTENT_SQL_CAP_PER_ACCOUNT; // default 10
    const result = await evaluateIncremental(26);

    // The full 22-member committee is evaluated, not just the 4 bumped contacts:
    // without the expansion the incremental run would have produced only 4 rows.
    expect(result.diff).toHaveLength(22);

    const sql = result.diff.filter((d) => d.newVerdict === 'sql');
    const mql = result.diff.filter((d) => d.newVerdict === 'mql');

    // 10 already-SQL stay SQL (anti-flap / not counted against the cap). Of the 12
    // account-only MQL contacts the cap keeps CAP and demotes the overflow back to
    // MQL. Overflow = 12 - CAP = 2. Before the fix the cap saw only the 4 bumped
    // contacts (4 <= CAP) and demoted 0, leaking the batch to SQL.
    expect(mql).toHaveLength(12 - CAP); // 2 demoted, not 0
    expect(sql).toHaveLength(10 + CAP); // 10 existing + CAP freshly promoted
  });
});