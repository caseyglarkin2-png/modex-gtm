/**
 * Phase 2 E1: the six-line brief. KNOW is verified facts only; THINK is
 * labelled inference; LEARN is one discovery objective; WHY YOU is the
 * human-owned angle (a suggestion is labelled); HISTORY is the real state and
 * live HubSpot truth; WRONG IF is falsification, not persuasion.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { buildBrief, historyLines, knowOf, loadBriefHistory } from '@/lib/gap/execution/six-line-brief';
import { SixLineBriefView } from '@/components/gap/six-line-brief';
import { DIRECT_SENT } from '@/lib/gap/execution/draft-ledger';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const verifiedFact = {
  id: 'sig-1',
  account_name: 'PepsiCo',
  source_kind: 'evidence_record',
  source_type: 'public_secondary',
  title: 'PepsiCo expands autonomous freight',
  evidence_text: 'PepsiCo will expand its autonomous freight program to a new distribution center in Texas this year.',
  evidence_url: 'https://news.example/pep',
  external_ok: true,
  observed_at: new Date('2026-08-26T00:00:00Z'),
  metadata: { verified: 'excerpt_found_at_source' },
};
const keywordHit = { ...verifiedFact, id: 'sig-kw', source_kind: 'pounce_trigger', evidence_text: null, metadata: {} };
const hypothesis = (signals: unknown[]) => ({
  account_name: 'PepsiCo',
  problem_hypothesis: 'Scheduled autonomous linehaul may move variability into the DC gate and yard.',
  falsification_questions: ['How are trailers staged when autonomous arrivals bunch up?', 'Does receiving ever wait on a trailer?'],
  what_a_no_means: 'Their receiving and yard flow already absorb arrival variability without dwell.',
  signals,
});
const clearHistory = { personTouches: { count: 0, lastAt: null }, colleagueTouches: [], accountReply: null, lastResponse: null, opportunity: { status: 'CLEAR' as const, detail: '', checkedAt: NOW.toISOString() } };

describe('buildBrief', () => {
  it('reads KNOW / THINK / LEARN / WHY YOU / HISTORY / WRONG IF in that model', () => {
    const b = buildBrief({ hypothesis: hypothesis([{ role: 'primary', signal: verifiedFact }]), firstName: 'Jordan', angle: 'Owns the NA beverage DC network.', suggestedAngle: 'x', history: clearHistory });
    expect(b.know).toMatchObject({ verified: true, supporting: 0, fact: { title: 'PepsiCo expands autonomous freight', quote: verifiedFact.evidence_text } });
    expect(b.think).toBe('Scheduled autonomous linehaul may move variability into the DC gate and yard.');
    expect(b.learn).toBe('How are trailers staged when autonomous arrivals bunch up?');
    expect(b.whyYou).toEqual({ text: 'Owns the NA beverage DC network.', owned: true });
    expect(b.history).toEqual(['No GAP touches to Jordan yet', 'No one else at PepsiCo contacted in 30 days', 'No account reply waiting', 'No open HubSpot deal, checked moments ago']);
    expect(b.historyState).toBe('clear');
    expect(b.wrongIf).toBe('Their receiving and yard flow already absorb arrival variability without dwell.');
  });

  it('KNOW is verified facts only: a keyword hit is never shown as known', () => {
    expect(knowOf(hypothesis([{ role: 'primary', signal: keywordHit }]))).toEqual({ fact: null, reason: 'No verified fact: what is linked is a keyword hit or unverified context.' });
  });

  it('WHY YOU: a suggestion is never presented as Casey’s own', () => {
    const b = buildBrief({ hypothesis: hypothesis([]), firstName: 'Jordan', angle: null, suggestedAngle: 'Runs distribution at PepsiCo.', history: clearHistory });
    expect(b.whyYou).toEqual({ text: 'Runs distribution at PepsiCo.', owned: false });
  });

  it('HISTORY: an open deal, UNKNOWN truth or an untriaged account reply turns it blocked; a colleague in motion is caution', () => {
    expect(historyLines('J', 'PepsiCo', { ...clearHistory, opportunity: { status: 'ACTIVE', detail: '"YardFlow - PepsiCo"', checkedAt: '' } }).state).toBe('blocked');
    expect(historyLines('J', 'PepsiCo', { ...clearHistory, opportunity: { status: 'UNKNOWN', detail: 'check HubSpot before contacting', checkedAt: '' } }).lines.at(-1)).toBe('HubSpot could not be checked: check HubSpot before contacting');
    expect(historyLines('J', 'PepsiCo', { ...clearHistory, accountReply: { from: 'a@pepsico.com', receivedAt: NOW.toISOString() } }).state).toBe('blocked');
    const c = historyLines('J', 'PepsiCo', { ...clearHistory, colleagueTouches: [{ recipient: 'vp@pepsico.com', sentAt: NOW.toISOString(), outstanding: false }] });
    expect(c.state).toBe('caution');
    expect(c.lines[1]).toMatch(/^vp@pepsico.com got a first touch/);
  });

  it('unreadable history says so instead of pretending all is clear', () => {
    const b = buildBrief({ hypothesis: hypothesis([]), firstName: 'J', angle: null, suggestedAngle: null, history: null });
    expect(b.history).toEqual(['History could not be read. Every send still checks it at the click.']);
    expect(b.historyState).toBe('caution');
  });
});

describe('loadBriefHistory', () => {
  const prisma = {
    routingDecision: { findMany: vi.fn(async () => [{ id: 'dec-vp', account_name: 'PepsiCo' }]) },
    gapAuditEvent: { findMany: vi.fn(async () => [{ kind: DIRECT_SENT, subject_id: 'dec-vp', payload: { accountName: 'PepsiCo', personaId: 1, recipient: 'vp@pepsico.com', stepIndex: 0, sentAt: '2026-09-27T12:00:00.000Z' }, created_at: NOW }]) },
    persona: { findMany: vi.fn(async () => []) },
    unsubscribedEmail: { findMany: vi.fn(async () => []) },
    inboundMessage: { findMany: vi.fn(async () => []) },
    conversationDisposition: { findFirst: vi.fn(async () => ({ response_class: 'problem_partially_confirmed', created_at: new Date('2026-09-20') })), findMany: vi.fn(async () => []) },
  };

  it('reads the real state: this person, colleagues in motion, the last buyer response, and HubSpot moments ago', async () => {
    const h = await loadBriefHistory(prisma, { accountName: 'PepsiCo', personaId: 2, email: 'dir@pepsico.com', sent: [], now: NOW }, { opportunity: async () => ({ status: 'CLEAR', companyIds: ['c'] }) });
    expect(h).toMatchObject({ personTouches: { count: 0 }, colleagueTouches: [{ recipient: 'vp@pepsico.com', outstanding: false }], lastResponse: { responseClass: 'problem_partially_confirmed' }, opportunity: { status: 'CLEAR' } });
  });

  it('never throws: a failed read is null (the brief then says history could not be read)', async () => {
    const broken = { ...prisma, routingDecision: { findMany: vi.fn(async () => { throw new Error('db down'); }) } };
    expect(await loadBriefHistory(broken, { accountName: 'PepsiCo', personaId: 2, email: 'dir@pepsico.com', sent: [], now: NOW }, { opportunity: async () => ({ status: 'CLEAR', companyIds: [] }) })).toBeNull();
  });
});

describe('<SixLineBriefView>', () => {
  it('renders the six rows, marks KNOW verified and THINK as inference, and stacks at phone width', () => {
    const b = buildBrief({ hypothesis: hypothesis([{ role: 'primary', signal: verifiedFact }]), firstName: 'Jordan', angle: null, suggestedAngle: 'Runs distribution at PepsiCo.', history: clearHistory });
    render(<SixLineBriefView brief={b} personaId={7} accountName="PepsiCo" />);
    for (const id of ['brief-know', 'brief-think', 'brief-learn', 'brief-why-you', 'brief-history', 'brief-wrong-if']) expect(screen.getByTestId(id)).toBeInTheDocument();
    expect(screen.getByTestId('brief-know')).toHaveTextContent('✓ verified');
    expect(screen.getByTestId('brief-think')).toHaveTextContent('What we think is happening (our read):');
    expect(screen.getByTestId('brief-why-you')).toHaveTextContent('Suggested (not yours yet): Runs distribution at PepsiCo.');
    // One column below sm (no horizontal scroll on a phone), a label column from sm up.
    expect(screen.getByTestId('brief-know').className).toContain('grid-cols-1');
    expect(screen.getByTestId('brief-know').className).toContain('sm:grid-cols-[6rem_1fr]');
  });
});

describe('review E P1: the brief never overstates what it knows', () => {
  it('an expired verified fact is KNOWN with its date (I06); a superseded fact is not, and the brief says why', () => {
    const expired = { ...verifiedFact, freshness_expires_at: new Date('2026-09-01T00:00:00Z') };
    expect(knowOf(hypothesis([{ role: 'primary', signal: expired }]), NOW)).toMatchObject({ fact: expect.objectContaining({ publishedAt: expect.any(String) }), verified: true });
    const superseded = { ...verifiedFact, metadata: { ...(verifiedFact.metadata as Record<string, unknown>), superseded: true } };
    expect(knowOf(hypothesis([{ role: 'primary', signal: superseded }]), NOW)).toEqual({ fact: null, reason: 'Research marked this fact superseded by a newer one: it is not quoted. It cannot be quoted to a buyer. Find another verified fact.' });
    const fresh = { ...verifiedFact, freshness_expires_at: new Date('2026-12-01T00:00:00Z') };
    expect(knowOf(hypothesis([{ role: 'primary', signal: fresh }]), NOW).fact).not.toBeNull();
  });

  const base = {
    routingDecision: { findMany: vi.fn(async () => []) },
    gapAuditEvent: { findMany: vi.fn(async () => []) },
    unsubscribedEmail: { findMany: vi.fn(async () => []) },
    conversationDisposition: { findFirst: vi.fn(async () => null), findMany: vi.fn(async () => []) },
  };
  const clear = { opportunity: async () => ({ status: 'CLEAR' as const, companyIds: ['c'] }) };

  it('no company address at the account: reply status is UNKNOWN (caution), never "no reply waiting"', async () => {
    const prisma = { ...base, persona: { findMany: vi.fn(async () => [{ email: 'someone@gmail.com' }]) }, inboundMessage: { findMany: vi.fn(async () => []) } };
    const h = await loadBriefHistory(prisma, { accountName: 'PepsiCo', personaId: 3, email: null, sent: [], now: NOW }, clear);
    expect(h?.accountReply).toBe('unknown');
    const lines = historyLines('Sam', 'PepsiCo', h!);
    expect(lines.lines[2]).toBe('Account reply status unknown (no company email at PepsiCo to check)');
    expect(lines.state).toBe('caution');
  });

  it('a call-only person: the account reply check uses a colleague company address and finds the untriaged reply', async () => {
    const prisma = {
      ...base,
      persona: { findMany: vi.fn(async () => [{ email: 'vp@pepsico.com' }]) },
      inboundMessage: { findMany: vi.fn(async () => [{ id: 'm1', from_email: 'assistant@pepsico.com', subject: 'Re: yards', received_at: new Date('2026-09-27T12:00:00Z') }]) },
    };
    const h = await loadBriefHistory(prisma, { accountName: 'PepsiCo', personaId: 3, email: null, sent: [], now: NOW }, clear);
    expect(h?.accountReply).toMatchObject({ from: 'assistant@pepsico.com' });
    expect(historyLines('Sam', 'PepsiCo', h!).state).toBe('blocked');
  });
});

