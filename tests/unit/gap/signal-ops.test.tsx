/**
 * GAP Signal Intelligence A: Signal Inbox ops and the share surfaces. Every
 * action writes the signal row only; wrong account un-resolves; research
 * needs a resolved account and a link; the share page pre-fills from a
 * shared URL; saving needs only the link.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { applySignalOp, listSignals, toView } from '@/lib/gap/signals/ops';
import { sharedUrlOf } from '@/lib/gap/signals/shared-url';
import { SignalShare } from '@/components/gap/signal-share';
import { SignalInbox } from '@/components/gap/signal-inbox';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const base = { url: 'https://supplychaindive.com/a', title: 'PepsiCo expands Gatik program', source_name: 'Supply Chain Dive', source_class: 'news', published_at: null, created_at: NOW, origin: 'casey_share', note: null, account_hint: null, account_name: 'PepsiCo', candidates: null, resolution: 'resolved', research_status: 'none', relevance: 'outreach_evidence_candidate', categories: ['autonomy'], event_id: 's1', feedback: null };

function db(rows: Array<Record<string, unknown>>) {
  return {
    gapSignal: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => rows.find((r) => r.id === where.id) ?? null),
      findMany: vi.fn(async () => rows),
      count: vi.fn(async ({ where }: { where: { event_id: string } }) => rows.filter((r) => r.event_id === where.event_id).length),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => Object.assign(rows.find((r) => r.id === where.id)!, data)),
    },
    account: { findFirst: vi.fn(async ({ where }: { where: { name: { equals: string } } }) => (where.name.equals.toLowerCase() === 'pepsico' ? { name: 'PepsiCo' } : null)) },
    gapAuditEvent: { create: vi.fn(async () => ({})) },
    prospectingHypothesis: { update: vi.fn(), create: vi.fn() },
    hypothesisSignal: { create: vi.fn() },
    pounceTrigger: { create: vi.fn() },
  };
}

describe('applySignalOp', () => {
  it('assign: Casey names the account; a shared link then goes to research', async () => {
    const rows = [{ ...base, id: 's1', account_name: null, resolution: 'needs_account' }];
    const p = db(rows);
    const r = await applySignalOp(p, { id: 's1', actor: 'casey', now: NOW, op: 'assign', accountName: 'pepsico' });
    expect(r.ok).toBe(true);
    expect(rows[0]).toMatchObject({ account_name: 'PepsiCo', resolution: 'resolved', resolution_basis: 'human', research_status: 'queued' });
    expect(await applySignalOp(p, { id: 's1', actor: 'casey', now: NOW, op: 'assign', accountName: 'Nobody Inc' })).toEqual({ ok: false, reason: 'account_not_found' });
  });

  // Batch item 10 (R25): the dead letter can be researched again (Casey's Research press requeues it), and says so.
  it('a dead-lettered signal (research failed three times) is offered Research and the press requeues it', async () => {
    const rows = [{ ...base, id: 'd1', research_status: 'research_failed' }];
    const p = db(rows);
    expect(await applySignalOp(p, { id: 'd1', actor: 'casey', now: NOW, op: 'research' })).toMatchObject({ ok: true });
    expect(rows[0].research_status).toBe('queued');
    render(<SignalInbox items={[toView({ ...base, id: 'd2', research_status: 'research_failed' })]} />);
    expect(screen.getByText('Research failed')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Research/ })).toBeTruthy();
  });

  it('research needs a resolved account and a link', async () => {
    const p = db([{ ...base, id: 'a', resolution: 'ambiguous', account_name: null }, { ...base, id: 'b', url: null }]);
    expect(await applySignalOp(p, { id: 'a', actor: 'c', now: NOW, op: 'research' })).toEqual({ ok: false, reason: 'needs_account' });
    expect(await applySignalOp(p, { id: 'b', actor: 'c', now: NOW, op: 'research' })).toEqual({ ok: false, reason: 'no_link' });
  });

  it('wrong account un-resolves it (back to Casey); no action touches a hypothesis, evidence or a trigger', async () => {
    const rows = [{ ...base, id: 's1', research_status: 'queued' }];
    const p = db(rows);
    await applySignalOp(p, { id: 's1', actor: 'casey', now: NOW, op: 'feedback', value: 'wrong_account' });
    // Review A P1: it comes BACK to Casey (Needs you, still listed), never hidden.
    expect(rows[0]).toMatchObject({ account_name: null, resolution: 'needs_account', research_status: 'none', feedback: null });
    await applySignalOp(p, { id: 's1', actor: 'casey', now: NOW, op: 'ignore' });
    expect(p.prospectingHypothesis.update).not.toHaveBeenCalled();
    expect(p.hypothesisSignal.create).not.toHaveBeenCalled();
    expect(p.pounceTrigger.create).not.toHaveBeenCalled();
    expect(p.gapAuditEvent.create).toHaveBeenCalledTimes(2);
  });
});

describe('the inbox: one row per event, Casey-shared first, sources never lost', () => {
  it('groups sources of one event and counts the others', async () => {
    const rows = [
      { ...base, id: 's2', origin: 'discovery', event_id: 's1', created_at: new Date('2026-09-28T14:00:00Z') },
      { ...base, id: 's1', origin: 'discovery', event_id: 's1' },
      { ...base, id: 's3', origin: 'discovery', event_id: 's3', resolution: 'needs_account', account_name: null, title: 'Unknown story' },
      { ...base, id: 's4', origin: 'casey_share', event_id: 's4', title: 'Casey link' },
    ];
    const items = await listSignals(db(rows));
    expect(items.map((i) => i.id)).toEqual(['s4', 's3', 's1']);
    expect(items.find((i) => i.id === 's1')!.alsoCoveredBy).toBe(1);
  });

  it('good context stays listed; ignored and irrelevant do not (the query says so)', async () => {
    const p = db([]);
    await listSignals(p);
    expect(p.gapSignal.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: [{ feedback: null }, { feedback: { in: ['good_context', 'use'] } }] }) }));
  });

  it('a view never exposes Pounce diagnostics and says why it may matter', () => {
    const v = toView({ ...base, id: 's1' });
    expect(v.why).toBe('It may describe a physical-network change GAP can verify at the source. Themes: autonomy.');
    expect(Object.keys(v)).not.toContain('score');
  });
});

describe('share surfaces', () => {
  afterEach(() => vi.restoreAllMocks());

  it('a shared page arrives as ?url= or inside ?text= (Web Share Target)', () => {
    expect(sharedUrlOf({ url: 'https://a.com/x' })).toBe('https://a.com/x');
    expect(sharedUrlOf({ title: 'PepsiCo news', text: 'Look at this https://b.com/y?z=1 wow' })).toBe('https://b.com/y?z=1');
    expect(sharedUrlOf({})).toBe('');
    expect(sharedUrlOf({ text: 'Read this (https://c.com/z).' })).toBe('https://c.com/z');
  });

  it('the link alone is enough to Share to GAP; the result says what GAP will do', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ created: true, signal: toView({ ...base, id: 's1', research_status: 'queued' }) }), { status: 201 }));
    render(<SignalShare initialUrl="https://supplychaindive.com/a" />);
    expect(screen.getByTestId('signal-url')).toHaveValue('https://supplychaindive.com/a');
    fireEvent.click(screen.getByTestId('signal-save'));
    await waitFor(() => expect(screen.getByTestId('signal-saved-status')).toHaveTextContent('Researching: Queued for evidence research.'));
    const call = f.mock.calls.find((c) => String(c[0]) === '/api/gap/signal-intake')!;
    expect(JSON.parse(String((call[1] as RequestInit).body))).toEqual({ url: 'https://supplychaindive.com/a', account: null, note: null, kind: 'link' });
  });

  it('a conference note that sounds like buyer words points to Buyer Truth Capture instead', () => {
    render(<SignalShare />);
    fireEvent.click(screen.getByTestId('signal-mode-conference'));
    fireEvent.change(screen.getByTestId('signal-note'), { target: { value: 'VP Ops said trailer visibility is still site-by-site.' } });
    expect(screen.getByTestId('signal-buyer-words')).toHaveTextContent('capture them as buyer truth');
  });

  it('an ambiguous signal offers its candidates to assign', () => {
    render(<SignalInbox items={[toView({ ...base, id: 's9', resolution: 'ambiguous', account_name: null, candidates: [{ name: 'PepsiCo', why: 'named in the source title' }, { name: 'Frito-Lay', why: 'named in the source title' }] })]} />);
    expect(screen.getByTestId('signal-status')).toHaveTextContent('Needs you');
    expect(screen.getByRole('combobox', { name: 'Account' })).toHaveTextContent('Frito-Lay');
  });
});
