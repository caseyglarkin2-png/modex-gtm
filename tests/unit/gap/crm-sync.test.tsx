/**
 * R54 (GAP OS execution recovery): bounded, recoverable CRM sync. A HubSpot note, task or deal field GAP would write is
 * a proposal shown EXACTLY and approved with one explicit click (`crm.sync_proposed` -> `crm.sync_approved`, recorded
 * whether or not the write may run); the write runs only with GAP_HUBSPOT_MIRROR_ENABLED on. Retries are idempotent
 * (a stable external id, read before write, the mirror row), pending and failed states are visible, the origin is
 * tracked, a newer human value is never overwritten, and a CRM outage loses neither the text nor a local completion.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { ledgerDb } from './fixtures/ledger-db';
import { approveCrmChange, discardCrmChange, loadCrmSync, proposeCrmChange, crmWritesEnabled } from '@/lib/gap/deals/crm-sync';
import { changeText, crmCandidates, crmStateLine, externalIdFor, proposalIdFor, type CrmChange, type CrmOrigin } from '@/lib/gap/deals/crm-model';
import type { CrmWriter } from '@/lib/gap/deals/crm-writer';
import { ensureCommitment, loadCommitment, transitionCommitment } from '@/lib/gap/work/commitments';
import { CrmSyncPanel } from '@/components/gap/crm-sync';

const holder = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return holder.client; } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const NOW = new Date('2026-10-06T19:00:00Z');
const ACTOR = 'casey@freightroll.com';
const ACCOUNT = 'Kroger Scratch Co';
const DEAL = '70001';
const ON = () => ({ ok: true as const });
const OFF = () => ({ ok: false as const, reason: 'GAP_HUBSPOT_MIRROR_ENABLED is off' });
const ALLOW = () => undefined;

/** A controlled HubSpot (the external boundary): records every call, can fail, can lose the answer after a write. */
function fakeHubSpot(over: { mode?: 'ok' | 'down' | 'lose_answer'; property?: { value: string | null; modifiedAt: string | null; source: string | null } } = {}) {
  const state = { mode: over.mode ?? 'ok', notes: [] as Array<{ id: string; dealId: string; body: string }>, tasks: [] as Array<{ id: string; dealId: string; subject: string; body: string; dueAt: string | null }>, updates: [] as Array<{ dealId: string; property: string; value: string }>, calls: [] as string[], property: over.property ?? { value: 'Pilot scope call with Ann', modifiedAt: '2026-10-01T00:00:00.000Z', source: 'CRM_UI' } };
  let n = 900;
  const create = <T extends { id: string }>(list: T[], o: T) => {
    if (state.mode === 'down') throw new Error('HubSpot 503: unavailable');
    list.push(o);
    if (state.mode === 'lose_answer') throw new Error('HubSpot 504: no answer');
    return o.id;
  };
  const writer: CrmWriter = {
    async findByMarker(type, marker) {
      state.calls.push(`find:${type}`);
      if (state.mode === 'down') throw new Error('HubSpot 503: unavailable');
      const hit = (type === 'notes' ? state.notes : state.tasks).find((o) => o.body.includes(marker));
      return hit ? hit.id : null;
    },
    async createNote(dealId, body) {
      state.calls.push('createNote');
      return create(state.notes, { id: String((n += 1)), dealId, body });
    },
    async createTask(dealId, t) {
      state.calls.push('createTask');
      return create(state.tasks, { id: String((n += 1)), dealId, ...t });
    },
    async readDealProperty() {
      state.calls.push('readDealProperty');
      if (state.mode === 'down') throw new Error('HubSpot 503: unavailable');
      return state.property;
    },
    async updateDealProperty(dealId, property, value) {
      state.calls.push('updateDealProperty');
      if (state.mode === 'down') throw new Error('HubSpot 503: unavailable');
      state.updates.push({ dealId, property, value });
      state.property = { value, modifiedAt: NOW.toISOString(), source: 'INTEGRATION' };
    },
  };
  return { state, writer };
}

const NOTE: CrmChange = { kind: 'note', objectType: 'deal', objectId: DEAL, body: 'Hi Ann,\n\nHere is what I heard, in your words:\n- "Trailers sit two hours before a door opens." (Ann Scratch)' };
const RECAP: CrmOrigin = { kind: 'recap', id: `${DEAL}:abc`, label: 'the agreed recap prepared in GAP' };
const propose = (p: unknown, change: CrmChange = NOTE, origin: CrmOrigin = RECAP) => proposeCrmChange(p, { accountName: ACCOUNT, dealId: DEAL, dealName: 'YardFlow - Kroger', change, origin, actor: ACTOR, now: NOW });

beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_ROUTING_ENABLED = 'true';
  delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
});

describe('a proposal, an explicit approval, and the write only when allowed (R54)', () => {
  it('the exact change is recorded once (its id is its origin, kind and content) and shown with its external id', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const a = await propose(db.client());
    const b = await propose(db.client());
    expect(a).toMatchObject({ ok: true, created: true });
    expect(b).toMatchObject({ ok: true, created: false });
    const id = proposalIdFor(RECAP, NOTE);
    expect(a.ok && a.item).toMatchObject({ proposalId: id, externalId: externalIdFor(id), state: 'proposed', origin: RECAP });
    expect(db.store.gapAuditEvent.filter((r) => r.kind === 'crm.sync_proposed')).toHaveLength(1);
    expect(changeText({ change: NOTE, dealName: 'YardFlow - Kroger', dealId: DEAL, externalId: externalIdFor(id) })).toBe(`Add a note to the HubSpot deal "YardFlow - Kroger":\n${NOTE.body}\n\nGAP reference ${externalIdFor(id)}`);
    expect(await propose(db.client(), { ...NOTE, objectId: 'Kroger' } as CrmChange)).toMatchObject({ ok: false, reason: 'bad_change' });
  });

  it('writes OFF (production): the approval is recorded and stands, the state says not written and why, HubSpot is never called', async () => {
    expect(crmWritesEnabled()).toEqual({ ok: false, reason: 'GAP_HUBSPOT_MIRROR_ENABLED is off' });
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const hs = fakeHubSpot();
    const p = await propose(db.client());
    const r = await approveCrmChange(db.client(), { proposalId: p.ok ? p.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: hs.writer, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item).toMatchObject({ state: 'off', approvedBy: ACTOR, detail: 'GAP_HUBSPOT_MIRROR_ENABLED is off' });
    expect(r.ok && crmStateLine(r.item)).toBe('Approved by casey@freightroll.com, not written: HubSpot writes are off here (GAP_HUBSPOT_MIRROR_ENABLED is off). Nothing reached HubSpot.');
    expect(hs.state.calls).toEqual([]);
    expect(db.store.gapAuditEvent.map((x) => x.kind)).toEqual(['crm.sync_proposed', 'crm.sync_approved', 'crm.sync_attempt', 'crm.sync_result']);
  });

  it('writes ON: written once; a retry or a second approval makes no second call (the mirror row)', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const hs = fakeHubSpot();
    const p = await propose(db.client());
    const id = p.ok ? p.item.proposalId : '';
    const r = await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item).toMatchObject({ state: 'written', objectRef: '901' });
    expect(hs.state.notes).toHaveLength(1);
    expect(hs.state.notes[0].body).toBe(`${NOTE.body}\n\nGAP reference ${externalIdFor(id)}`);
    const again = await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: new Date(NOW.getTime() + 120_000), retry: true }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(again.ok && again.item.state).toBe('written');
    expect(hs.state.calls).toEqual(['find:notes', 'createNote']);
    expect(db.store.gapHubSpotMirror.map((m) => [m.key, m.note_id, m.error])).toEqual([[`gap:crm:${id}`, '901', null]]);
  });

  it('each idempotency layer holds on its own: a written result with no mirror row, and a mirror row with no result (a crash between them), both make no call', async () => {
    // The ledger says written, the mirror row was never saved: the claim answers written.
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = await propose(db.client());
    const id = p.ok ? p.item.proposalId : '';
    for (const [n, kind, extra] of [[1, 'crm.sync_approved', {}], [2, 'crm.sync_attempt', {}], [3, 'crm.sync_result', { outcome: 'written', objectRef: '777' }]] as const) {
      db.store.gapAuditEvent.push({ id: `w${n}`, kind, actor: ACTOR, subject_type: 'crm_sync', subject_id: id, payload: { proposalId: id, accountName: ACCOUNT, ...extra }, created_at: new Date(NOW.getTime() + n * 1000) });
    }
    const hs = fakeHubSpot();
    const a = await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: new Date(NOW.getTime() + 600_000), retry: true }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(a.ok && a.item).toMatchObject({ state: 'written', objectRef: '777' });
    expect(hs.state.calls).toEqual([]);
    // The mirror row was saved, the result row was not (the process died): the mirror answers written, no call.
    const db2 = ledgerDb({ accounts: [ACCOUNT], mirror: [{ key: `gap:crm:${id}`, object_type: 'deal', object_id: DEAL, note_id: '888', written_at: NOW, error: null }] });
    await propose(db2.client());
    const hs2 = fakeHubSpot();
    const b = await approveCrmChange(db2.client(), { proposalId: id, actor: ACTOR, now: NOW }, { writer: hs2.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(b.ok && b.item).toMatchObject({ state: 'written', objectRef: '888', detail: 'already written' });
    expect(hs2.state.calls).toEqual([]);
  });

  it('HubSpot down: failed, visible, the text kept; the retry once it answers writes exactly one note', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const hs = fakeHubSpot({ mode: 'down' });
    const p = await propose(db.client());
    const id = p.ok ? p.item.proposalId : '';
    const r = await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item).toMatchObject({ state: 'failed', detail: 'HubSpot 503: unavailable' });
    expect(r.ok && r.item.change).toEqual(NOTE);
    expect((await loadCrmSync(db.client(), ACCOUNT))[0]).toMatchObject({ state: 'failed', change: NOTE });
    hs.state.mode = 'ok';
    const retry = await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: new Date(NOW.getTime() + 600_000), retry: true }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(retry.ok && retry.item.state).toBe('written');
    expect(hs.state.notes).toHaveLength(1);
  });

  it('the answer lost after HubSpot accepted the write: the retry FINDS it by its external id and never creates a second', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const hs = fakeHubSpot({ mode: 'lose_answer' });
    const task: CrmChange = { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'Send Ann the dock schedule template', body: 'Send Ann the dock schedule template\nFrom GAP: an obligation recorded in GAP.', dueAt: '2026-10-09T13:00:00.000Z' };
    const origin: CrmOrigin = { kind: 'commitment', id: 'capture:n1:k1', label: 'the GAP obligation "Send Ann the dock schedule template"' };
    const p = await propose(db.client(), task, origin);
    const id = p.ok ? p.item.proposalId : '';
    expect((await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).ok).toBe(true);
    expect(hs.state.tasks).toHaveLength(1);
    hs.state.mode = 'ok';
    const retry = await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: new Date(NOW.getTime() + 600_000), retry: true }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(retry.ok && retry.item).toMatchObject({ state: 'written', objectRef: hs.state.tasks[0].id, detail: 'found in HubSpot by its GAP reference' });
    expect(hs.state.tasks).toHaveLength(1);
  });

  it('a deal field: a newer human value in HubSpot is never overwritten; an unchanged one is updated', async () => {
    const change: CrmChange = { kind: 'deal_property', objectType: 'deal', objectId: DEAL, property: 'hs_next_step', from: 'Pilot scope call with Ann', to: 'Pilot at Columbus: two weeks (by 2026-10-20)' };
    const origin: CrmOrigin = { kind: 'plan', id: `plan:${DEAL}:pilot`, label: 'the next agreed milestone in the plan' };
    const human = fakeHubSpot({ property: { value: 'Ann is out until Oct 12', modifiedAt: '2026-10-06T20:00:00.000Z', source: 'CRM_UI' } });
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = await propose(db.client(), change, origin);
    const r = await approveCrmChange(db.client(), { proposalId: p.ok ? p.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: human.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item).toMatchObject({ state: 'conflict', detail: '"Ann is out until Oct 12", changed 2026-10-06 by CRM_UI' });
    expect(human.state.calls).toEqual(['readDealProperty']);
    // The same value, edited by a person AFTER the proposal: still never overwritten.
    const touched = fakeHubSpot({ property: { value: 'Pilot scope call with Ann', modifiedAt: '2026-10-06T21:00:00.000Z', source: 'CRM_UI' } });
    const db2 = ledgerDb({ accounts: [ACCOUNT] });
    const p2 = await propose(db2.client(), change, origin);
    expect((await approveCrmChange(db2.client(), { proposalId: p2.ok ? p2.item.proposalId : '', actor: ACTOR, now: new Date('2026-10-06T22:00:00Z') }, { writer: touched.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).ok && touched.state.updates).toEqual([]);
    // Unchanged since the seller saw it: written.
    const clean = fakeHubSpot();
    const db3 = ledgerDb({ accounts: [ACCOUNT] });
    const p3 = await propose(db3.client(), change, origin);
    const w = await approveCrmChange(db3.client(), { proposalId: p3.ok ? p3.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: clean.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(w.ok && w.item.state).toBe('written');
    expect(clean.state.updates).toEqual([{ dealId: DEAL, property: 'hs_next_step', value: 'Pilot at Columbus: two weeks (by 2026-10-20)' }]);
  });

  it('a double click while an attempt is in flight answers "in progress"; discard drops an unwritten proposal and blocks its approval', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = await propose(db.client());
    const id = p.ok ? p.item.proposalId : '';
    db.store.gapAuditEvent.push({ id: 'zz1', kind: 'crm.sync_approved', actor: ACTOR, subject_type: 'crm_sync', subject_id: id, payload: { proposalId: id, accountName: ACCOUNT }, created_at: new Date(NOW.getTime() - 10_000) });
    db.store.gapAuditEvent.push({ id: 'zz2', kind: 'crm.sync_attempt', actor: ACTOR, subject_type: 'crm_sync', subject_id: id, payload: { proposalId: id, accountName: ACCOUNT }, created_at: new Date(NOW.getTime() - 5_000) });
    const hs = fakeHubSpot();
    expect(await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).toMatchObject({ ok: false, reason: 'in_progress' });
    expect(hs.state.calls).toEqual([]);
    expect((await discardCrmChange(db.client(), { proposalId: id, reason: 'not needed', actor: ACTOR, now: NOW })).ok).toBe(true);
    expect(await approveCrmChange(db.client(), { proposalId: id, actor: ACTOR, now: new Date(NOW.getTime() + 120_000) }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).toMatchObject({ ok: false, reason: 'discarded' });
  });

  it('a CRM outage never loses the local completion receipt: the obligation stays done, the proposed task keeps its text', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    const made = await ensureCommitment(p, { accountName: ACCOUNT, kind: 'deliverable', title: 'Send Ann the dock schedule template', dealId: DEAL, source: { kind: 'seller', id: 's1' } }, { actor: ACTOR, now: NOW });
    const cid = made.ok ? made.commitment.commitmentId : '';
    await transitionCommitment(p, { commitmentId: cid, to: 'done', proof: { kind: 'seller', note: 'sent it' }, actor: ACTOR, now: NOW });
    const task: CrmChange = { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'Send Ann the dock schedule template', body: 'Done in GAP: sent it.', dueAt: null };
    const prop = await propose(p, task, { kind: 'commitment', id: cid, label: 'the GAP obligation' });
    const r = await approveCrmChange(p, { proposalId: prop.ok ? prop.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: fakeHubSpot({ mode: 'down' }).writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item.state).toBe('failed');
    expect((await loadCommitment(db.client(), cid))?.status).toBe('done');
    expect((await loadCrmSync(db.client(), ACCOUNT))[0].change).toEqual(task);
  });
});

describe('the candidates, the route and the view (R54)', () => {
  it('candidates: the ready recap as a note, a task per open seller obligation on the deal (at most three), the next step only when it differs', () => {
    const c = crmCandidates({
      deal: { id: DEAL, name: 'YardFlow - Kroger', nextStep: 'Pilot scope call with Ann' },
      recap: { text: 'Hi Ann, ...', ready: true },
      commitments: [1, 2, 3, 4].map((n) => ({ commitmentId: `c${n}`, kind: 'deliverable', title: `Send item ${n}`, basis: null, dueAt: null, status: 'open' })).concat([{ commitmentId: 'c5', kind: 'buyer_promise', title: 'Their volumes', basis: null, dueAt: null, status: 'waiting' }]),
      nextMilestone: { commitmentId: `plan:${DEAL}:pilot`, title: 'Pilot at Columbus', dueDay: '2026-10-20' },
    });
    expect(c.map((x) => [x.change.kind, x.origin.kind, x.origin.id])).toEqual([['note', 'recap', `${DEAL}:${c[0].origin.id.split(':')[1]}`], ['task', 'commitment', 'c1'], ['task', 'commitment', 'c2'], ['task', 'commitment', 'c3'], ['deal_property', 'plan', `plan:${DEAL}:pilot`]]);
    expect(c[4].change).toEqual({ kind: 'deal_property', objectType: 'deal', objectId: DEAL, property: 'hs_next_step', from: 'Pilot scope call with Ann', to: 'Pilot at Columbus (by 2026-10-20)' });
    expect(crmCandidates({ deal: { id: DEAL, name: null, nextStep: 'Pilot at Columbus' }, recap: { text: 'x', ready: false }, commitments: [], nextMilestone: { commitmentId: 'm', title: 'Pilot at Columbus', dueDay: null } })).toEqual([]);
  });

  it('the real route: approve records the pair and, with writes off, answers "not written"; an origin GAP does not hold is refused', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    holder.client = db.client();
    const { POST, GET } = await import('@/app/api/gap/crm-sync/route');
    const post = (b: unknown) => POST(new NextRequest('http://localhost/api/gap/crm-sync', { method: 'POST', body: JSON.stringify(b), headers: { 'content-type': 'application/json' } }));
    const res = await post({ op: 'approve', accountName: ACCOUNT, dealId: DEAL, dealName: 'YardFlow - Kroger', change: NOTE, origin: RECAP });
    const body = (await res.json()) as { item: { state: string } };
    expect(res.status).toBe(200);
    expect(body.item.state).toBe('off');
    expect(db.store.gapAuditEvent.map((x) => x.kind)).toEqual(['crm.sync_proposed', 'crm.sync_approved', 'crm.sync_attempt', 'crm.sync_result']);
    const bad = await post({ op: 'approve', accountName: ACCOUNT, dealId: DEAL, change: { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'x', body: '', dueAt: null }, origin: { kind: 'commitment', id: 'seller:nope', label: 'x' } });
    expect([bad.status, ((await bad.json()) as { error: string }).error]).toEqual([400, 'bad_origin']);
    const otherDeal = await post({ op: 'approve', accountName: ACCOUNT, dealId: DEAL, change: NOTE, origin: { kind: 'recap', id: '70002:abc', label: 'x' } });
    expect(otherDeal.status).toBe(400);
    const field = await post({ op: 'approve', accountName: ACCOUNT, dealId: DEAL, change: { kind: 'deal_property', objectType: 'deal', objectId: DEAL, property: 'amount', from: null, to: '1' }, origin: RECAP });
    expect(field.status).toBe(400);
    const list = (await (await GET(new NextRequest(`http://localhost/api/gap/crm-sync?account=${encodeURIComponent(ACCOUNT)}`))).json()) as { items: Array<{ state: string }> };
    expect(list.items.map((i) => i.state)).toEqual(['off']);
  });

  it('the view shows the exact change and one approval click; a recorded one shows its state and a retry', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, item: { state: 'off', detail: 'GAP_HUBSPOT_MIRROR_ENABLED is off', approvedBy: ACTOR, objectRef: null } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<CrmSyncPanel accountName={ACCOUNT} dealId={DEAL} dealName="YardFlow - Kroger" candidates={[{ change: NOTE, origin: RECAP }]} items={[]} />);
    expect(screen.getByTestId('crm-proposal-text').textContent).toBe(changeText({ change: NOTE, dealName: 'YardFlow - Kroger', dealId: DEAL, externalId: externalIdFor(proposalIdFor(RECAP, NOTE)) }));
    fireEvent.click(screen.getByTestId('crm-approve'));
    await waitFor(() => expect(screen.getByTestId('crm-status').textContent).toMatch(/not written: HubSpot writes are off here/));
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body));
    expect(sent).toMatchObject({ op: 'approve', dealId: DEAL, change: NOTE, origin: RECAP });
    vi.unstubAllGlobals();
  });
});
