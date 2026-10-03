/**
 * V2 ONE TASK AUTHORITY: GAP's NEXT is the next step for the accounts GAP manages. The legacy Work Queue's
 * outbound-shaped items for those accounts (drip "send a touch" tasks, operator actions, microsite-intent nudges)
 * collapse into ONE labelled row that opens the GAP account. Nothing is hidden; ops items are untouched; a heat
 * score or a recommended action never rides along. Conflicting cases pinned.
 */
import { describe, expect, it } from 'vitest';
import { applyGapAuthority, buildWorkQueueItems } from '@/lib/work-queue';
import { restrictionForName } from '@/lib/gap/policy/restriction';

const at = (d: string) => new Date(d);
const activity = (id: number, account: string, next: string, over: Record<string, unknown> = {}) => ({ id, account_name: account, activity_type: 'Follow-up', owner: 'Casey', outcome: null, next_step: next, next_step_due: at('2026-09-30'), notes: null, created_at: at(`2026-09-${10 + id}`), campaign: null, ...over });
const items = () =>
  buildWorkQueueItems({
    activities: [
      activity(1, 'Dannon', 'Send first touch using trade_show_follow_up', { notes: 'Campaign drip automation - touch 1 - modex' }),
      activity(2, 'Dannon', 'Send touch 2 with angle: yard visibility'),
      activity(3, 'Acme Foods', 'Call back about the pilot'),
      activity(4, 'Unmanaged Co', 'Send first touch'),
    ] as never,
    captures: [],
    approvals: [{ id: 'ap1', type: 'approval', account_name: 'Dannon', subject: 'Approve send', preview: null, read: false, created_at: at('2026-09-20') }] as never,
    generationJobs: [],
    sendJobs: [],
    micrositeIntent: [{ accountName: 'Dannon', accountSlug: 'dannon', primarySignal: 'Deep ROI read', recommendedAction: 'Send the ROI follow-up now', engagementScore: 88, highIntentSessions: 3, ctaSessions: 2, lastViewedAt: at('2026-09-25') }] as never,
    outcomeAudits: [],
    messageEvolutions: [],
  } as never);

describe('applyGapAuthority', () => {
  const managed = new Set(['Acme Foods']);
  const isGap = (n: string) => managed.has(n) || !!restrictionForName(n);

  it('Dannon (warm intro only): drip "send a touch" tasks and the microsite nudge collapse into ONE GAP row; nothing is lost', () => {
    const out = applyGapAuthority(items(), isGap);
    const dannon = out.filter((i) => i.accountName === 'Dannon');
    const gap = dannon.find((i) => i.itemType === 'gap-next')!;
    expect(gap).toMatchObject({ title: 'GAP decides the next step', quickActions: { accountHref: '/gap/accounts/dannon' } });
    expect(gap.detail).toMatch(/^3 legacy items on this account \(newest: Send touch 2 with angle: yard visibility\)\. They are not the next step; open the account in GAP\.$/);
    expect(dannon.filter((i) => i.itemType === 'follow-up' || i.itemType === 'microsite-intent')).toHaveLength(0);
    // Ops items stay as they were.
    expect(dannon.filter((i) => i.itemType === 'approval')).toHaveLength(1);
  });
  it('a microsite heat score or recommendation never rides along', () => {
    const out = applyGapAuthority(items(), isGap);
    expect(JSON.stringify(out.filter((i) => i.accountName === 'Dannon'))).not.toMatch(/Send the ROI follow-up now|High intent|88/);
  });
  it('a GAP-managed account gets one row; an unmanaged account keeps its legacy items untouched', () => {
    const out = applyGapAuthority(items(), isGap);
    expect(out.filter((i) => i.accountName === 'Acme Foods').map((i) => i.itemType)).toEqual(['gap-next']);
    expect(out.filter((i) => i.accountName === 'Unmanaged Co').map((i) => i.itemType)).toEqual(['follow-up']);
  });
  it('with nothing GAP-managed, the queue is unchanged', () => {
    const before = items();
    expect(applyGapAuthority(before, () => false)).toEqual(before);
  });
});
