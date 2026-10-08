/**
 * Sprint 5 review, SHOULD 4 (R54): a stale approved-but-unwritten recap stayed retryable beside a new one and would
 * land twice with writes on (the origin check only compared the recap with its own text). Now a new recap retires
 * every earlier unwritten recap on the deal (discarded, with the reason); a recorded recap a newer one replaced is
 * refused at approval and at retry and never offered on Coverage; on the page, a recap that is no longer the deal's
 * current recap shows as replaced, with no Retry.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ledgerDb } from './fixtures/ledger-db';
import { approveCrmChange, loadCrmOffApprovals, loadCrmSync, proposeCrmChange } from '@/lib/gap/crm-sync';
import { CRM_PROPOSED, CRM_SUBJECT, externalIdFor, proposalIdFor, RECAP_CHANGED, RECAP_REPLACED, replacedRecaps, stableHash, type CrmChange, type CrmOrigin, type CrmProposal } from '@/lib/gap/deals/crm-model';
import type { CrmWriter } from '@/lib/gap/crm-writer';
import { CrmSyncPanel } from '@/components/gap/crm-sync';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const NOW = new Date('2026-10-07T15:00:00Z');
const LATER = new Date('2026-10-07T16:00:00Z');
const ACTOR = 'casey@freightroll.com';
const ACCOUNT = 'Kroger Scratch Co';
const DEAL = '392057001';
const note = (body: string): CrmChange => ({ kind: 'note', objectType: 'deal', objectId: DEAL, body });
const recap = (body: string): CrmOrigin => ({ kind: 'recap', id: `${DEAL}:${stableHash(body)}`, label: 'the agreed recap prepared in GAP' });
const OLD = 'Hi Ann, here is what I heard: the gate cameras requirement.';
const NEW = 'Hi Ann, here is what I heard: the gate cameras requirement, and the pilot dates.';
const ON = () => ({ ok: true as const });
const ALLOW = () => undefined;
const calls: string[] = [];
const writer = { findByMarker: async () => (calls.push('find'), null), createNote: async () => (calls.push('createNote'), '901') } as unknown as CrmWriter;
const propose = (p: unknown, body: string, now: Date) => proposeCrmChange(p, { accountName: ACCOUNT, dealId: DEAL, dealName: 'YardFlow - Kroger Scratch Co', change: note(body), origin: recap(body), actor: ACTOR, now });

beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  calls.length = 0;
});

describe('Sprint 5 review: an outdated recap is never written beside the current one', () => {
  it('a new recap retires the earlier unwritten recap on the deal, with the reason; a written recap is left as it is', async () => {
    const p = ledgerDb({ accounts: [ACCOUNT] }).client();
    const old = await propose(p, OLD, NOW);
    await approveCrmChange(p, { proposalId: old.ok ? old.item.proposalId : '', actor: ACTOR, now: NOW });
    expect((await loadCrmSync(p, ACCOUNT)).map((it) => it.state)).toEqual(['off']);
    await propose(p, NEW, LATER);
    const items = await loadCrmSync(p, ACCOUNT);
    expect(items.map((it) => [it.change.kind === 'note' ? it.change.body : '', it.state, it.detail])).toEqual([[NEW, 'proposed', null], [OLD, 'discarded', RECAP_REPLACED]]);
    // Retrying the retired one writes nothing, even with writes on.
    const retry = await approveCrmChange(p, { proposalId: old.ok ? old.item.proposalId : '', actor: ACTOR, now: LATER, retry: true }, { writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(retry).toMatchObject({ ok: false, reason: 'discarded' });
    expect(calls).toEqual([]);
  });

  it('a recorded recap a newer one replaced (recorded before this rule) is refused at retry, writes nothing, and is not offered on Coverage', async () => {
    const p = ledgerDb({ accounts: [ACCOUNT] }).client() as { gapAuditEvent: { create: (q: unknown) => Promise<unknown> } };
    const old = await propose(p, OLD, NOW);
    const oldId = old.ok ? old.item.proposalId : '';
    await approveCrmChange(p, { proposalId: oldId, actor: ACTOR, now: NOW });
    // The newer recap as an older build recorded it: proposed, and no retirement of the first.
    const newerId = proposalIdFor(recap(NEW), note(NEW));
    const proposal: CrmProposal = { proposalId: newerId, accountName: ACCOUNT, dealId: DEAL, dealName: 'YardFlow - Kroger Scratch Co', change: note(NEW), externalId: externalIdFor(newerId), origin: recap(NEW), proposedAt: LATER.toISOString(), proposedBy: ACTOR };
    await p.gapAuditEvent.create({ data: { kind: CRM_PROPOSED, actor: ACTOR, subject_type: CRM_SUBJECT, subject_id: newerId, payload: { proposalId: newerId, accountName: ACCOUNT, proposal } } });
    expect((await loadCrmSync(p, ACCOUNT)).find((it) => it.proposalId === oldId)?.state).toBe('off');
    const retry = await approveCrmChange(p, { proposalId: oldId, actor: ACTOR, now: LATER, retry: true }, { writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(retry).toMatchObject({ ok: false, reason: 'origin_closed', detail: 'a newer recap for this deal replaced it: nothing is written for this one' });
    expect(calls).toEqual([]);
    expect((await loadCrmOffApprovals(p)).map((it) => it.proposalId)).not.toContain(oldId);
  });

  it('on the page: an unwritten recap that is not the current recap shows as replaced, with no Retry', () => {
    const id = proposalIdFor(recap(OLD), note(OLD));
    const item = { proposalId: id, accountName: ACCOUNT, dealId: DEAL, dealName: 'YardFlow - Kroger Scratch Co', change: note(OLD), externalId: externalIdFor(id), origin: recap(OLD), proposedAt: NOW.toISOString(), proposedBy: ACTOR, state: 'off' as const, approvedBy: ACTOR, approvedAt: NOW.toISOString(), objectRef: null, detail: 'approved HubSpot writes are turned off here', attempts: 1, lastAttemptAt: NOW.toISOString() };
    expect(replacedRecaps([item], new Map([[DEAL, recap(NEW).id]]))).toEqual(new Map([[id, RECAP_CHANGED]]));
    expect(replacedRecaps([item], new Map([[DEAL, recap(OLD).id]]))).toEqual(new Map());
    render(<CrmSyncPanel accountName={ACCOUNT} dealId={DEAL} dealName="YardFlow - Kroger Scratch Co" candidates={[{ change: note(NEW), origin: recap(NEW) }]} items={[{ ...item, replaced: RECAP_CHANGED }]} />);
    expect(screen.getByTestId('crm-sync-state')).toHaveTextContent('Not written: the recap has changed since. Approve the current recap instead; this one is never retried.');
    expect(screen.queryByTestId('crm-retry')).toBeNull();
  });
});
