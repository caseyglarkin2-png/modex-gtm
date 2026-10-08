/**
 * R62 final pass (acceptB, intermittent): an approval's attempt row and its result row ("off": HubSpot writes are turned
 * off here) can share a millisecond. Read result first, the fold applied the result and then the attempt, so the item
 * read "approved" and dropped off Coverage and GET /api/gap/crm-sync?state=off while the deal brief still said writes
 * are off. The fold is deterministic: one millisecond folds in lifecycle order, then by id, whatever order it is read in.
 */
import { describe, expect, it } from 'vitest';
import { CRM_APPROVED, CRM_ATTEMPT, CRM_PROPOSED, CRM_RESULT, foldCrmSync, type CrmProposal, type CrmRow } from '@/lib/gap/deals/crm-model';
import { loadCrmOffApprovals } from '@/lib/gap/crm-sync';

const ACTOR = 'casey@freightroll.com';
const proposal: CrmProposal = {
  proposalId: 'crm-tie-1',
  accountName: 'Kroger Scratch Co r62',
  dealId: '70001',
  dealName: 'YardFlow - Kroger Scratch Co r62',
  change: { kind: 'deal_property', objectType: 'deal', objectId: '70001', property: 'hs_next_step', from: null, to: 'Pilot scope call with Ann' },
  externalId: 'gap-crm-tie-1',
  origin: { kind: 'plan', id: 'plan:70001:pilot', label: 'the plan: Pilot' },
  proposedAt: '2026-10-07T18:00:00.000Z',
  proposedBy: ACTOR,
};
const SAME_MS = '2026-10-07T18:05:00.123Z';
const row = (id: string, kind: string, at: string, extra: Record<string, unknown> = {}): CrmRow => ({ id, kind, actor: ACTOR, created_at: at, payload: { proposalId: proposal.proposalId, accountName: proposal.accountName, ...extra } });
const proposed = row('a1', CRM_PROPOSED, '2026-10-07T18:00:00.000Z', { proposal });
const approved = row('a2', CRM_APPROVED, '2026-10-07T18:04:00.000Z');
// The result's id sorts before the attempt's (cuids are not a sequence): only the lifecycle order folds it right.
const attempt = row('z9', CRM_ATTEMPT, SAME_MS);
const result = row('a0', CRM_RESULT, SAME_MS, { outcome: 'off', detail: 'HubSpot writes are turned off here' });

describe('R62 final pass: an attempt and its result in one millisecond', () => {
  it('fold to "approved, not written" (off) in either read order', () => {
    for (const order of [[proposed, approved, attempt, result], [proposed, approved, result, attempt], [result, attempt, approved, proposed]]) {
      const [it] = foldCrmSync(order);
      expect(it).toMatchObject({ state: 'off', attempts: 1, approvedBy: ACTOR, detail: 'HubSpot writes are turned off here' });
    }
  });

  it('the Coverage list keeps it when the database returns the result first (newest first, one millisecond)', async () => {
    const rows = [result, attempt, approved, proposed];
    const prisma = { gapAuditEvent: { findMany: async () => rows } };
    const off = await loadCrmOffApprovals(prisma);
    expect(off.map((x) => [x.proposalId, x.state])).toEqual([['crm-tie-1', 'off']]);
  });
});
