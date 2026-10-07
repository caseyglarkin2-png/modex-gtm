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
import { approveCrmChange, discardCrmChange, loadCrmOffApprovals, loadCrmSync, proposeCrmChange, crmWritesEnabled } from '@/lib/gap/crm-sync';
import { changeText, crmCandidates, crmStateLine, externalIdFor, proposalIdFor, stableHash, taskExternalIdFor, withMarker, type CrmChange, type CrmOrigin } from '@/lib/gap/deals/crm-model';
import { completionsOf } from '@/lib/gap/deals/workspace';
import { taskDueTime } from '@/lib/gap/crm-writer';
import type { CrmWriter } from '@/lib/gap/crm-writer';
import { ensureCommitment, loadCommitment, transitionCommitment } from '@/lib/gap/work/commitments';
import { CrmOffApprovals, CrmSyncPanel } from '@/components/gap/crm-sync';

const holder = vi.hoisted(() => ({ client: null as unknown, inDeals: null as unknown, freshInDeals: null as unknown }));
vi.mock('@/lib/gap/deals/in-deals', () => ({ loadInDealsSummary: async (_p: unknown, o?: { fresh?: boolean }) => (o?.fresh && holder.freshInDeals ? holder.freshInDeals : holder.inDeals) }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return holder.client; } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const NOW = new Date('2026-10-06T19:00:00Z');
const ACTOR = 'casey@freightroll.com';
const ACCOUNT = 'Kroger Scratch Co';
const DEAL = '70001';
const ON = () => ({ ok: true as const });
const ALLOW = () => undefined;

/** A controlled HubSpot (the external boundary): records every call, can fail, can lose the answer after a write. */
function fakeHubSpot(over: { mode?: 'ok' | 'down' | 'lose_answer'; property?: { value: string | null; modifiedAt: string | null; source: string | null } } = {}) {
  const state = { mode: over.mode ?? 'ok', notes: [] as Array<{ id: string; dealId: string; body: string }>, tasks: [] as Array<{ id: string; dealId: string; subject: string; body: string; dueAt: string | null; ownerId?: string | null; status?: string }>, updates: [] as Array<{ dealId: string; property: string; value: string }>, calls: [] as string[], property: over.property ?? { value: 'Pilot scope call with Ann', modifiedAt: '2026-10-01T00:00:00.000Z', source: 'CRM_UI' } };
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
    async updateTask(taskId, t) {
      state.calls.push('updateTask');
      if (state.mode === 'down') throw new Error('HubSpot 503: unavailable');
      Object.assign(state.tasks.find((x) => x.id === taskId)!, t);
    },
    async completeTask(taskId) {
      state.calls.push('completeTask');
      if (state.mode === 'down') throw new Error('HubSpot 503: unavailable');
      state.tasks.find((x) => x.id === taskId)!.status = 'COMPLETED';
    },
    async ownerIdFor(email) {
      state.calls.push('ownerIdFor');
      return email === 'casey@freightroll.com' ? '85093129' : null;
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
const RECAP: CrmOrigin = { kind: 'recap', id: `${DEAL}:${stableHash(NOTE.body)}`, label: 'the agreed recap prepared in GAP' };
const propose = (p: unknown, change: CrmChange = NOTE, origin: CrmOrigin = RECAP) => proposeCrmChange(p, { accountName: ACCOUNT, dealId: DEAL, dealName: 'YardFlow - Kroger', change, origin, actor: ACTOR, now: NOW });

beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_ROUTING_ENABLED = 'true';
  delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
  delete process.env.GAP_CRM_APPROVED_WRITES_ENABLED;
  holder.inDeals = { status: 'complete', count: 1, accounts: [{ accountName: ACCOUNT, alsoRecordedAs: [], deals: [{ id: DEAL, name: 'YardFlow - Kroger', stage: 'Appointment scheduled', lastActivityAt: null }], dealContacts: 1, people: [], known: 0 }], unresolved: [], checkedAt: NOW.toISOString(), openDeals: 1 };
});

/** An obligation GAP holds on the deal (the origin a task or a next step must come from). */
const obligation = (p: unknown, source: { kind: 'capture' | 'plan' | 'seller'; id: string }, title = 'Send Ann the dock schedule template', kind: 'deliverable' | 'deal_step' = 'deliverable') =>
  ensureCommitment(p, { accountName: ACCOUNT, kind, title, dealId: DEAL, source }, { actor: ACTOR, now: NOW });

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
    // Sprint 5 exit: the page shows the approved text and says the reference line in words (never the internal id);
    // the writer still puts the reference line on the HubSpot record (withMarker).
    expect(changeText({ change: NOTE, dealName: 'YardFlow - Kroger', dealId: DEAL, externalId: externalIdFor(id) })).toBe(`Add a note to the HubSpot deal "YardFlow - Kroger":\n${NOTE.body}\n(HubSpot also keeps a short GAP reference line on it, so a retry never adds a second one.)`);
    expect(withMarker(NOTE.body, externalIdFor(id))).toBe(`${NOTE.body}\n\nGAP reference ${externalIdFor(id)}`);
    expect(await propose(db.client(), { ...NOTE, objectId: 'Kroger' } as CrmChange)).toMatchObject({ ok: false, reason: 'bad_change' });
  });

  it('writes OFF (production): the approval is recorded and stands, the state says not written and why, HubSpot is never called', async () => {
    expect(crmWritesEnabled()).toEqual({ ok: false, reason: 'approved HubSpot writes are turned off here' });
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const hs = fakeHubSpot();
    const p = await propose(db.client());
    const r = await approveCrmChange(db.client(), { proposalId: p.ok ? p.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: hs.writer, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item).toMatchObject({ state: 'off', approvedBy: ACTOR, detail: 'approved HubSpot writes are turned off here' });
    // Sprint 5 exit: in seller words, no flag name, no internal id.
    expect(r.ok && crmStateLine(r.item)).toBe('Approved by casey@freightroll.com, not written: approved HubSpot writes are turned off here. Nothing reached HubSpot.');
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
    await obligation(db.client(), { kind: 'capture', id: 'n1:k1' });
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
    for (const d of [db]) await obligation(d.client(), { kind: 'plan', id: `${DEAL}:pilot` }, 'Pilot at Columbus: two weeks', 'deal_step');
    const p = await propose(db.client(), change, origin);
    const r = await approveCrmChange(db.client(), { proposalId: p.ok ? p.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: human.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item).toMatchObject({ state: 'conflict', detail: '"Ann is out until Oct 12", changed 2026-10-06 by CRM_UI' });
    expect(human.state.calls).toEqual(['readDealProperty']);
    // The same value, edited by a person AFTER the proposal: still never overwritten.
    const touched = fakeHubSpot({ property: { value: 'Pilot scope call with Ann', modifiedAt: '2026-10-06T21:00:00.000Z', source: 'CRM_UI' } });
    const db2 = ledgerDb({ accounts: [ACCOUNT] });
    await obligation(db2.client(), { kind: 'plan', id: `${DEAL}:pilot` }, 'Pilot at Columbus: two weeks', 'deal_step');
    const p2 = await propose(db2.client(), change, origin);
    expect((await approveCrmChange(db2.client(), { proposalId: p2.ok ? p2.item.proposalId : '', actor: ACTOR, now: new Date('2026-10-06T22:00:00Z') }, { writer: touched.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).ok && touched.state.updates).toEqual([]);
    // Unchanged since the seller saw it: written.
    const clean = fakeHubSpot();
    const db3 = ledgerDb({ accounts: [ACCOUNT] });
    await obligation(db3.client(), { kind: 'plan', id: `${DEAL}:pilot` }, 'Pilot at Columbus: two weeks', 'deal_step');
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
    const made = await obligation(p, { kind: 'seller', id: 's1' });
    const cid = made.ok ? made.commitment.commitmentId : '';
    const task: CrmChange = { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'Send Ann the dock schedule template', body: 'Send Ann the dock schedule template', dueAt: null };
    const prop = await propose(p, task, { kind: 'commitment', id: cid, label: 'the GAP obligation' });
    const r = await approveCrmChange(p, { proposalId: prop.ok ? prop.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: fakeHubSpot({ mode: 'down' }).writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item.state).toBe('failed');
    await transitionCommitment(p, { commitmentId: cid, to: 'done', proof: { kind: 'seller', note: 'sent it' }, actor: ACTOR, now: NOW });
    expect((await loadCommitment(db.client(), cid))?.status).toBe('done');
    expect((await loadCrmSync(db.client(), ACCOUNT))[0].change).toEqual(task);
  });
});

describe('batch item 9: approved HubSpot changes are bounded to live work', () => {
  it('an "off" approval retried after writes turn on, for an obligation since done or skipped, answers origin_closed and calls nothing', async () => {
    for (const end of ['done', 'skipped'] as const) {
      const db = ledgerDb({ accounts: [ACCOUNT] });
      const p = db.client();
      const made = await obligation(p, { kind: 'seller', id: `s-${end}` });
      const cid = made.ok ? made.commitment.commitmentId : '';
      const task: CrmChange = { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'Send Ann the dock schedule template', body: 'x', dueAt: null };
      const prop = await propose(p, task, { kind: 'commitment', id: cid, label: 'the GAP obligation' });
      const id = prop.ok ? prop.item.proposalId : '';
      expect((await approveCrmChange(p, { proposalId: id, actor: ACTOR, now: NOW })).ok && (await loadCrmSync(p, ACCOUNT))[0].state).toBe('off');
      await transitionCommitment(p, end === 'done' ? { commitmentId: cid, to: 'done', proof: { kind: 'seller', note: 'sent it' }, actor: ACTOR, now: NOW } : { commitmentId: cid, to: 'skipped', reason: 'not needed', actor: ACTOR, now: NOW });
      const rows = db.store.gapAuditEvent.length;
      const hs = fakeHubSpot();
      const retry = await approveCrmChange(p, { proposalId: id, actor: ACTOR, now: new Date(NOW.getTime() + 120_000), retry: true }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
      expect(retry).toMatchObject({ ok: false, reason: 'origin_closed', detail: `the obligation "Send Ann the dock schedule template" is ${end} in GAP: nothing is written for it` });
      expect(hs.state.calls).toEqual([]);
      expect(db.store.gapAuditEvent.length).toBe(rows);
    }
  });

  it('a recap whose origin does not match its own text is refused bad_origin (a recap id is never free text)', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    const prop = await propose(p, NOTE, { ...RECAP, id: `${DEAL}:${stableHash('a different recap')}` });
    const hs = fakeHubSpot();
    expect(await approveCrmChange(p, { proposalId: prop.ok ? prop.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).toMatchObject({ ok: false, reason: 'bad_origin', detail: 'the recap does not match its own text' });
    expect(hs.state.calls).toEqual([]);
  });

  it('a deal the closure ledger says closed answers origin_closed at approve and at retry, the recap included', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    const prop = await propose(p);
    db.store.gapAuditEvent.push({ id: 'ds1', kind: 'deal.state', actor: 'gap:deals', subject_type: 'account', subject_id: ACCOUNT, created_at: new Date(NOW.getTime() - 60_000), payload: { dealId: DEAL, state: 'won' } });
    const hs = fakeHubSpot();
    expect(await approveCrmChange(p, { proposalId: prop.ok ? prop.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).toMatchObject({ ok: false, reason: 'origin_closed', detail: expect.stringMatching(/^the deal closed \(won\)/) });
    expect(hs.state.calls).toEqual([]);
  });

  it('an amended obligation keeps ONE task: the newer text revises the proposal (approve again); once written, the task is updated, never created twice', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    const made = await obligation(p, { kind: 'seller', id: 'amend' });
    const origin: CrmOrigin = { kind: 'commitment', id: made.ok ? made.commitment.commitmentId : '', label: 'the GAP obligation' };
    const v1: CrmChange = { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'Send Ann the dock schedule template', body: 'v1', dueAt: null };
    const v2: CrmChange = { ...v1, subject: 'Send Ann the dock and gate schedule template', body: 'v2', dueAt: '2026-10-09T13:00:00.000Z' };
    expect(proposalIdFor(origin, v1)).toBe(proposalIdFor(origin, v2));
    const a = await propose(p, v1, origin);
    const hs = fakeHubSpot();
    const id = a.ok ? a.item.proposalId : '';
    expect((await approveCrmChange(p, { proposalId: id, actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).ok).toBe(true);
    expect(hs.state.tasks).toHaveLength(1);
    // The owner is the approver's HubSpot owner; an undated obligation is due the next business day, never "now".
    expect(hs.state.tasks[0]).toMatchObject({ ownerId: '85093129', dueAt: null });
    expect(taskDueTime(null, NOW)).toBe('2026-10-07T13:00:00.000Z');
    const b = await propose(p, v2, origin);
    expect(b.ok && b.item).toMatchObject({ proposalId: id, state: 'proposed', change: v2, objectRef: hs.state.tasks[0].id });
    expect(b.ok && crmStateLine(b.item)).toBe('Updated in GAP since it was written: approve again to update the task in HubSpot.');
    const w = await approveCrmChange(p, { proposalId: id, actor: ACTOR, now: new Date(NOW.getTime() + 120_000) }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(w.ok && w.item).toMatchObject({ state: 'written', detail: 'the task is updated in HubSpot' });
    expect(hs.state.tasks).toHaveLength(1);
    expect(hs.state.tasks[0]).toMatchObject({ subject: 'Send Ann the dock and gate schedule template', dueAt: '2026-10-09T13:00:00.000Z' });
    expect(hs.state.calls.filter((c) => c === 'createTask')).toHaveLength(1);
  });

  it('a done obligation proposes completing its task; the approval completes the task found by its GAP reference', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    const made = await obligation(p, { kind: 'seller', id: 'finish' });
    const cid = made.ok ? made.commitment.commitmentId : '';
    const origin: CrmOrigin = { kind: 'commitment', id: cid, label: 'the GAP obligation' };
    const task: CrmChange = { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'Send Ann the dock schedule template', body: 'x', dueAt: null };
    const hs = fakeHubSpot();
    const t = await propose(p, task, origin);
    await approveCrmChange(p, { proposalId: t.ok ? t.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(hs.state.tasks[0].body).toContain(taskExternalIdFor(origin, DEAL));
    await transitionCommitment(p, { commitmentId: cid, to: 'done', proof: { kind: 'seller', note: 'sent it' }, actor: ACTOR, now: NOW });
    const items = await loadCrmSync(p, ACCOUNT);
    const completions = completionsOf(items, [{ commitmentId: cid, status: 'done', title: 'Send Ann the dock schedule template' }], DEAL);
    expect(completions).toEqual([{ commitmentId: cid, title: 'Send Ann the dock schedule template' }]);
    const c = crmCandidates({ deal: { id: DEAL, name: 'YardFlow - Kroger', nextStep: null }, recap: null, commitments: [], nextMilestone: null, completions });
    expect(c).toEqual([{ change: { kind: 'task_complete', objectType: 'deal', objectId: DEAL, subject: 'Send Ann the dock schedule template' }, origin: { kind: 'commitment', id: cid, label: 'the GAP obligation "Send Ann the dock schedule template", done in GAP' } }]);
    const done = await propose(p, c[0].change, c[0].origin);
    const r = await approveCrmChange(p, { proposalId: done.ok ? done.item.proposalId : '', actor: ACTOR, now: new Date(NOW.getTime() + 120_000) }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    expect(r.ok && r.item).toMatchObject({ state: 'written', objectRef: hs.state.tasks[0].id, detail: 'the task is completed in HubSpot' });
    expect(hs.state.tasks[0].status).toBe('COMPLETED');
    // An open obligation cannot be marked complete in HubSpot.
    const open = await obligation(p, { kind: 'seller', id: 'still-open' });
    const premature = await propose(p, { kind: 'task_complete', objectType: 'deal', objectId: DEAL, subject: 'x' }, { kind: 'commitment', id: open.ok ? open.commitment.commitmentId : '', label: 'x' });
    expect(await approveCrmChange(p, { proposalId: premature.ok ? premature.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: hs.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).toMatchObject({ ok: false, reason: 'bad_origin' });
  });

  it('after a conflict the next step can be proposed again from HubSpot’s newer value (a new proposal, never the stuck one)', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    await obligation(p, { kind: 'plan', id: `${DEAL}:pilot` }, 'Pilot at Columbus: two weeks', 'deal_step');
    const origin: CrmOrigin = { kind: 'plan', id: `plan:${DEAL}:pilot`, label: 'the next agreed milestone in the plan' };
    const seen: CrmChange = { kind: 'deal_property', objectType: 'deal', objectId: DEAL, property: 'hs_next_step', from: 'Pilot scope call with Ann', to: 'Pilot at Columbus: two weeks' };
    const human = fakeHubSpot({ property: { value: 'Ann is out until Oct 12', modifiedAt: '2026-10-06T20:00:00.000Z', source: 'CRM_UI' } });
    const first = await propose(p, seen, origin);
    expect((await approveCrmChange(p, { proposalId: first.ok ? first.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: human.writer, writesEnabled: ON, assertWriteAllowed: ALLOW })).ok).toBe(true);
    const again = crmCandidates({ deal: { id: DEAL, name: 'YardFlow - Kroger', nextStep: 'Ann is out until Oct 12' }, recap: null, commitments: [], nextMilestone: { commitmentId: `plan:${DEAL}:pilot`, title: 'Pilot at Columbus: two weeks', dueDay: null } });
    expect(proposalIdFor(again[0].origin, again[0].change)).not.toBe(first.ok ? first.item.proposalId : '');
    const second = await propose(p, again[0].change, again[0].origin);
    expect(second).toMatchObject({ ok: true, created: true, item: { state: 'proposed' } });
  });

  it('approved writes have their own flag: the mirror flag alone writes nothing, and the approved-writes flag alone does not turn the mirror on', async () => {
    process.env.HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN ?? '';
    process.env.GAP_HUBSPOT_MIRROR_ENABLED = 'true';
    expect(crmWritesEnabled()).toEqual({ ok: false, reason: 'approved HubSpot writes are turned off here' });
    delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
    process.env.GAP_CRM_APPROVED_WRITES_ENABLED = 'true';
    expect(crmWritesEnabled().ok === true || crmWritesEnabled().reason !== 'approved HubSpot writes are turned off here').toBe(true);
    const { gapFlag } = await import('@/lib/gap/flags');
    expect(gapFlag('GAP_HUBSPOT_MIRROR_ENABLED')).toBe(false);
  });
});

describe('batch item 9 (R54 f): approvals standing "not written" are listed across accounts', () => {
  it('every off approval at every account, oldest first; a written or merely proposed one is not listed; the route and the list say so with a Retry each', async () => {
    const db = ledgerDb({ accounts: [ACCOUNT, 'Pepsi Scratch Co'] });
    const p = db.client();
    const a = await propose(p);
    await approveCrmChange(p, { proposalId: a.ok ? a.item.proposalId : '', actor: ACTOR, now: NOW });
    const otherNote: CrmChange = { ...NOTE, objectId: '80001', body: 'Pepsi recap' };
    const b = await proposeCrmChange(p, { accountName: 'Pepsi Scratch Co', dealId: '80001', dealName: 'Pepsi pilot', change: otherNote, origin: { kind: 'recap', id: `80001:${stableHash('Pepsi recap')}`, label: 'x' }, actor: ACTOR, now: NOW });
    await approveCrmChange(p, { proposalId: b.ok ? b.item.proposalId : '', actor: ACTOR, now: new Date(NOW.getTime() + 60_000) });
    const written = await proposeCrmChange(p, { accountName: 'Pepsi Scratch Co', dealId: '80001', dealName: 'Pepsi pilot', change: { ...otherNote, body: 'Written one' }, origin: { kind: 'recap', id: `80001:${stableHash('Written one')}`, label: 'x' }, actor: ACTOR, now: NOW });
    await approveCrmChange(p, { proposalId: written.ok ? written.item.proposalId : '', actor: ACTOR, now: NOW }, { writer: fakeHubSpot().writer, writesEnabled: ON, assertWriteAllowed: ALLOW });
    await proposeCrmChange(p, { accountName: ACCOUNT, dealId: DEAL, dealName: null, change: { ...NOTE, body: 'only proposed' }, origin: { kind: 'recap', id: `${DEAL}:${stableHash('only proposed')}`, label: 'x' }, actor: ACTOR, now: NOW });
    const off = await loadCrmOffApprovals(p);
    expect(off.map((it) => [it.accountName, it.state])).toEqual([[ACCOUNT, 'off'], ['Pepsi Scratch Co', 'off']]);
    holder.client = p;
    const { GET } = await import('@/app/api/gap/crm-sync/route');
    const listed = (await (await GET(new NextRequest('http://localhost/api/gap/crm-sync?state=off'))).json()) as { items: Array<{ accountName: string }> };
    expect(listed.items.map((i) => i.accountName)).toEqual([ACCOUNT, 'Pepsi Scratch Co']);
    render(<CrmOffApprovals items={off} />);
    expect(screen.getAllByTestId('crm-off-item').map((li) => li.getAttribute('data-account'))).toEqual([ACCOUNT, 'Pepsi Scratch Co']);
    expect(screen.getAllByTestId('crm-retry')).toHaveLength(2);
  });
});

describe('the write path stays bounded (R54)', () => {
  it('the writer never touches a deal stage, pipeline or lifecycle; the only proposable field is the next step; the mirror and the deals surface stay as they were', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const src = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8');
    expect(src('src/lib/gap/crm-writer.ts')).not.toMatch(/dealstage|hs_pipeline|lifecyclestage|hs_is_closed/i);
    const { CRM_DEAL_PROPERTIES } = await import('@/lib/gap/deals/crm-model');
    expect(CRM_DEAL_PROPERTIES).toEqual(['hs_next_step']);
    expect(src('src/lib/gap/hubspot-mirror.ts')).not.toMatch(/crm-writer|crm-sync/);
    for (const f of fs.readdirSync(path.join(process.cwd(), 'src/lib/gap/deals'))) expect(src(`src/lib/gap/deals/${f}`), f).not.toMatch(/crm-writer|getHubSpotClient|basicApi\.(create|update)/);
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
    // Batch item 9: a deal that is not one of the account's open deals, an unreadable open-deal list, a done obligation.
    const notMine = await post({ op: 'approve', accountName: ACCOUNT, dealId: '70009', change: { ...NOTE, objectId: '70009' }, origin: { ...RECAP, id: `70009:${stableHash(NOTE.body)}` } });
    expect([notMine.status, await notMine.json()]).toEqual([400, { error: 'bad_origin', detail: `deal 70009 is not an open deal of ${ACCOUNT}` }]);
    holder.inDeals = { status: 'unavailable', count: null, accounts: [], unresolved: [], checkedAt: NOW.toISOString(), openDeals: 0 };
    const unverified = await post({ op: 'approve', accountName: ACCOUNT, dealId: DEAL, change: NOTE, origin: RECAP });
    expect([unverified.status, ((await unverified.json()) as { error: string }).error]).toEqual([409, 'deal_unverified']);
    holder.inDeals = { status: 'complete', count: 1, accounts: [{ accountName: ACCOUNT, alsoRecordedAs: [], deals: [{ id: DEAL, name: 'YardFlow - Kroger', stage: 'x', lastActivityAt: null }], dealContacts: 1, people: [], known: 0 }], unresolved: [], checkedAt: NOW.toISOString(), openDeals: 1 };
    const doneOne = await obligation(holder.client, { kind: 'seller', id: 'route-done' });
    const doneId = doneOne.ok ? doneOne.commitment.commitmentId : '';
    await transitionCommitment(holder.client, { commitmentId: doneId, to: 'done', proof: { kind: 'seller', note: 'sent it' }, actor: ACTOR, now: NOW });
    const closed = await post({ op: 'approve', accountName: ACCOUNT, dealId: DEAL, change: { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'Send Ann the dock schedule template', body: 'x', dueAt: null }, origin: { kind: 'commitment', id: doneId, label: 'x' } });
    expect([closed.status, ((await closed.json()) as { error: string }).error]).toEqual([409, 'origin_closed']);
    // A deal opened since the cached In Deals read is read fresh once, never refused on a stale list.
    holder.freshInDeals = holder.inDeals;
    holder.inDeals = { status: 'complete', count: 0, accounts: [], unresolved: [], checkedAt: NOW.toISOString(), openDeals: 0 };
    const fresh = await post({ op: 'propose', accountName: ACCOUNT, dealId: DEAL, change: { ...NOTE, body: `${NOTE.body} (fresh)` }, origin: { ...RECAP, id: `${DEAL}:${stableHash(`${NOTE.body} (fresh)`)}` } });
    expect(fresh.status).toBe(200);
    holder.freshInDeals = null;
    const otherDeal = await post({ op: 'approve', accountName: ACCOUNT, dealId: DEAL, change: NOTE, origin: { kind: 'recap', id: '70002:abc', label: 'x' } });
    expect(otherDeal.status).toBe(400);
    const field = await post({ op: 'approve', accountName: ACCOUNT, dealId: DEAL, change: { kind: 'deal_property', objectType: 'deal', objectId: DEAL, property: 'amount', from: null, to: '1' }, origin: RECAP });
    expect(field.status).toBe(400);
    const list = (await (await GET(new NextRequest(`http://localhost/api/gap/crm-sync?account=${encodeURIComponent(ACCOUNT)}`))).json()) as { items: Array<{ state: string }> };
    // The approved recap (off) and the fresh-read proposal above (proposed), newest first.
    expect(list.items.map((i) => i.state)).toEqual(['proposed', 'off']);
  });

  it('batch item 9, the view: an amended obligation is offered as an update of its one task; a refusal says why and never claims a write', async () => {
    const origin: CrmOrigin = { kind: 'commitment', id: 'seller:s9', label: 'the GAP obligation' };
    const v1: CrmChange = { kind: 'task', objectType: 'deal', objectId: DEAL, subject: 'Send the template', body: 'v1', dueAt: null };
    const v2: CrmChange = { ...v1, subject: 'Send the dock and gate template', body: 'v2' };
    const id = proposalIdFor(origin, v1);
    const written = { proposalId: id, accountName: ACCOUNT, dealId: DEAL, dealName: 'YardFlow - Kroger', change: v1, externalId: externalIdFor(id), origin, proposedAt: NOW.toISOString(), proposedBy: ACTOR, state: 'written' as const, approvedBy: ACTOR, approvedAt: NOW.toISOString(), objectRef: '901', detail: null, attempts: 1, lastAttemptAt: NOW.toISOString() };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: 'origin_closed', detail: 'the obligation "Send the template" is done in GAP: nothing is written for it', item: written }), { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<CrmSyncPanel accountName={ACCOUNT} dealId={DEAL} dealName="YardFlow - Kroger" candidates={[{ change: v1, origin }, { change: v2, origin }]} items={[written]} />);
    const offered = screen.getAllByTestId('crm-proposal');
    expect(offered).toHaveLength(1);
    expect(offered[0].textContent).toContain('The obligation changed: this updates its one task.');
    fireEvent.click(screen.getByTestId('crm-approve'));
    await waitFor(() => expect(screen.getByTestId('crm-status').textContent).toBe('Not done: the obligation "Send the template" is done in GAP: nothing is written for it.'));
    vi.unstubAllGlobals();
  });

  it('the view shows the exact change and one approval click; a recorded one shows its state and a retry', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, item: { state: 'off', detail: 'approved HubSpot writes are turned off here', approvedBy: ACTOR, objectRef: null } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<CrmSyncPanel accountName={ACCOUNT} dealId={DEAL} dealName="YardFlow - Kroger" candidates={[{ change: NOTE, origin: RECAP }]} items={[]} />);
    expect(screen.getByTestId('crm-proposal-text').textContent).toBe(changeText({ change: NOTE, dealName: 'YardFlow - Kroger', dealId: DEAL, externalId: externalIdFor(proposalIdFor(RECAP, NOTE)) }));
    fireEvent.click(screen.getByTestId('crm-approve'));
    await waitFor(() => expect(screen.getByTestId('crm-status').textContent).toMatch(/not written: approved HubSpot writes are turned off here/));
    // Sprint 5 exit: the proposal never shows the internal reference id; it says the reference line in words.
    expect(screen.getByTestId('crm-proposal-text').textContent).not.toMatch(/gapcrm/);
    expect(screen.getByTestId('crm-proposal-text').textContent).toContain('(HubSpot also keeps a short GAP reference line on it, so a retry never adds a second one.)');
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, { body: string }])[1].body));
    expect(sent).toMatchObject({ op: 'approve', dealId: DEAL, change: NOTE, origin: RECAP });
    vi.unstubAllGlobals();
  });
});
