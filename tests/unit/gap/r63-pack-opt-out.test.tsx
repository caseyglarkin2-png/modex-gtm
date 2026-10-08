/**
 * R63-B S1: Walmart's pack page prepared an email to Doug, who replied "stop" on Oct 5: before it was recorded HISTORY
 * said "doug@... replied Oct 5, not triaged yet", after it said "Do not contact yet: doug@... answered "do not contact"
 * (2026-10-07)", and the EMAIL section showed "Hi Doug" both times. An opt-out on file (their reply, recorded or not, or
 * a recorded do not contact) now shows no draft at all, says it in words that are not temporary, and says what the
 * seller can do: record it; nothing goes to them.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/gap/motion/load', () => ({ loadAccountFirstTouches: vi.fn(async () => new Map()) }));
vi.mock('@/lib/gap/replies/account-reply', () => ({
  accountRepliedRecently: vi.fn(async (_p: unknown, email: string) => (email.startsWith('doug@') ? { from_email: email, received_at: new Date('2026-10-05T14:00:00Z') } : null)),
}));

import { emailSlot, historyLines, loadBriefHistory, optOutLine, type BriefHistory } from '@/lib/gap/execution/six-line-brief';
import { decideApproach } from '@/lib/gap/motion/approach';
import { OptedOutEmail } from '@/components/gap/opted-out-email';

const NOW = new Date('2026-10-07T15:00:00Z');
const DOUG = 'doug@walmart-scratch-co-r63.example.com';
const ACCOUNT = 'Walmart Scratch Co r63';
const reply = (body: string) => ({ subject: 'Re: trailer turns at your sites', snippet: body, body_text: body, from_email: DOUG, from_name: 'Doug Scratch', received_at: new Date('2026-10-05T14:00:00Z') });
const prismaWith = (messages: Array<ReturnType<typeof reply>>, dnc: { response_class: string; created_at: Date } | null = null) => ({
  persona: { findMany: async () => [] },
  conversationDisposition: { findFirst: async () => dnc },
  inboundMessage: { findMany: async () => messages },
});
const clear = async () => ({ status: 'CLEAR' as const, companyIds: ['c1'] });
const history = (p: unknown, doNotContact = false) => loadBriefHistory(p, { accountName: ACCOUNT, personaId: 7, email: DOUG, sent: [], now: NOW, name: 'Doug Scratch', doNotContact }, { opportunity: clear });

describe('R63-B S1: an opt-out on file makes the pack show no draft, in words that are not temporary', () => {
  it('unrecorded: HISTORY says their words and what to do (never "not triaged yet"), the slot is the opt-out, and no "Hi Doug" renders', async () => {
    const h = (await history(prismaWith([reply('stop')]))) as BriefHistory;
    expect(h.optOut).toEqual({ email: DOUG, name: 'Doug Scratch', said: 'stop', at: '2026-10-05T14:00:00.000Z', recorded: false });
    const { lines, state } = historyLines('Doug', ACCOUNT, h);
    expect(lines).toContain('Doug Scratch replied "stop" on Oct 5, 2026: an opt-out. Nothing goes to them from here; record it as do not contact from their reply.');
    expect(lines.join(' ')).not.toMatch(/not triaged yet/);
    expect(lines.filter((l) => /opt-out|not to be contacted|do not contact/.test(l) && /\byet\b/.test(l))).toEqual([]);
    expect(state).toBe('blocked');
    // The EMAIL slot: the opt-out, whatever the rendered copy would have been.
    expect(emailSlot({ optedOut: true, rendered: true, thesisHold: false })).toBe('opted_out');
    render(<OptedOutEmail line={optOutLine(h.optOut!)} recordHref="/gap/accounts/walmart-scratch-co-r63/#record-reply" />);
    expect(screen.getByRole('heading', { name: 'No email: they opted out' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Record it from their reply' }).getAttribute('href')).toBe('/gap/accounts/walmart-scratch-co-r63/#record-reply');
    expect(document.body.textContent).not.toMatch(/Hi Doug|Subject|Body/);
  });

  it('recorded: said once as recorded (no "yet", no repeated last response), and nothing to record', async () => {
    const h = (await history(prismaWith([reply('stop')], { response_class: 'do_not_contact', created_at: new Date('2026-10-07T13:00:00Z') }), true)) as BriefHistory;
    expect(h.optOut?.recorded).toBe(true);
    const { lines } = historyLines('Doug', ACCOUNT, { ...h, accountReply: null });
    expect(lines).toContain('Doug Scratch asked not to be contacted (Oct 5, 2026); it is recorded as do not contact. Nothing goes to them from here.');
    expect(lines.join(' ')).not.toMatch(/Last buyer response: do not contact/);
    expect(lines.filter((l) => /not to be contacted|do not contact/.test(l) && /\byet\b/.test(l))).toEqual([]);
    // The account's motion line says it as it is.
    const a = decideApproach({ deal: 'CLEAR', contradicted: false, conversation: { who: DOUG, responseClass: 'do_not_contact', at: '2026-10-07T13:00:00Z' }, touchHold: null, verifiedFact: true, reachable: true, source: null });
    expect(a).toEqual({ kind: 'NO_GOOD_MOTION', why: `Do not contact: ${DOUG} asked not to be contacted (Oct 7, 2026). Nothing goes to them from here.` });
  });

  it('a person\'s ordinary reply is not an opt-out: the email slot stays', async () => {
    const h = (await history(prismaWith([reply('Can you send the case study by Friday?')]))) as BriefHistory;
    expect(h.optOut).toBeNull();
    expect(emailSlot({ optedOut: false, rendered: true, thesisHold: false })).toBe('email');
    expect(historyLines('Doug', ACCOUNT, h).lines).toContain(`${DOUG} replied Oct 5, not triaged yet`);
  });
});
