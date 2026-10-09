// @vitest-environment node
/**
 * C35 (the commercial-context audit, 2026-10-08): an owed answer stays owed until it is resolved explicitly. The
 * reader asks by status, not by a 14-day window and not by one 100-row page: a confirmed, unanswered reply aged 15
 * days stays owed, the 101st reply stays owed, and resolution is a sent row or the seller's explicit resolution.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ledgerDb } from './fixtures/ledger-db';
import { ANSWERS_OWED_PAGE, REPLY_RESOLVED, loadAnswersOwed, loadResolvedReplyIds, resolveAnswerOwed } from '@/lib/gap/work/recorded-replies';

const NOW = new Date('2026-10-08T22:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const msg = (id: string, receivedAt: Date) => ({ id, thread_id: `t-${id}`, from_email: `${id}@nfi-scratch.example.com`, from_name: `Person ${id}`, subject: 'Re: trailer turns', snippet: 'Can you send the case study?', body_text: 'Can you send the case study by Friday?', received_at: receivedAt });
const disp = (source_id: string, createdAt: Date) => ({ id: `d-${source_id}`, source_kind: 'inbound_message', source_id, account_name: 'Nfi Scratch', persona_id: null, contact_email: 'x', response_class: 'problem_confirmed', human_confirmed: true, created_at: createdAt });

describe('C35: owed until resolved, queried by status', () => {
  it('a confirmed, unanswered reply aged 15 days stays owed; the 101st reply stays owed; both leave only on a sent row or an explicit resolution', async () => {
    const inbound = [msg('old15', days(15)), msg('old40', days(40))];
    const dispositions = [disp('old15', days(15)), disp('old40', days(40))];
    for (let i = 0; i < ANSWERS_OWED_PAGE + 1; i += 1) {
      inbound.push(msg(`r${String(i).padStart(3, '0')}`, days(1)));
      dispositions.push(disp(`r${String(i).padStart(3, '0')}`, new Date(days(1).getTime() + i * 1000)));
    }
    const d = ledgerDb({ inbound, dispositions }, NOW);
    const owed = await loadAnswersOwed(d.client(), NOW);
    expect(owed).toHaveLength(ANSWERS_OWED_PAGE + 3);
    const ids = new Set(owed.map((o) => o.id));
    expect(ids.has('old15')).toBe(true);
    expect(ids.has('old40')).toBe(true);
    expect(ids.has('r000')).toBe(true);
    expect(ids.has('r100')).toBe(true);
    expect(owed[0].receivedAt >= owed[owed.length - 1].receivedAt).toBe(true);
    // The answer going out resolves one; the seller's explicit resolution resolves another; the rest stay.
    d.store.gapAuditEvent.push({ id: 'e1', kind: 'execution.reply_sent', subject_type: 'inbound_message', subject_id: 'old40', actor: 'cron:gap-mailbox', payload: { reconciledFromSent: true }, created_at: NOW });
    expect(await resolveAnswerOwed(d.client(), { messageId: 'old15', actor: 'casey@freightroll.com', reason: 'Called them Tuesday; nothing to write', now: NOW })).toMatchObject({ ok: true });
    expect([...(await loadResolvedReplyIds(d.client(), ['old15', 'old40']))]).toEqual(['old15']);
    expect(d.store.gapAuditEvent.find((r) => r.kind === REPLY_RESOLVED)).toMatchObject({ subject_type: 'inbound_message', subject_id: 'old15', payload: { reason: 'Called them Tuesday; nothing to write' } });
    const after = await loadAnswersOwed(d.client(), NOW);
    expect(after).toHaveLength(ANSWERS_OWED_PAGE + 1);
    expect(after.some((o) => o.id === 'old15' || o.id === 'old40')).toBe(false);
    // A copy is still not an answer (X14).
    d.store.gapAuditEvent.push({ id: 'e3', kind: 'execution.reply_copied', subject_type: 'inbound_message', subject_id: 'r100', actor: 'casey@freightroll.com', payload: {}, created_at: NOW });
    expect((await loadAnswersOwed(d.client(), NOW)).some((o) => o.id === 'r100')).toBe(true);
  });

  it('resolution needs a message and a reason; an unreadable ledger reads none resolved', async () => {
    const d = ledgerDb({}, NOW);
    expect(await resolveAnswerOwed(d.client(), { messageId: '', actor: 'c', reason: 'x' })).toEqual({ ok: false, reason: 'no_message' });
    expect(await resolveAnswerOwed(d.client(), { messageId: 'm1', actor: 'c', reason: '  ' })).toEqual({ ok: false, reason: 'no_reason' });
    expect(await resolveAnswerOwed({}, { messageId: 'm1', actor: 'c', reason: 'x' })).toEqual({ ok: false, reason: 'not_stored' });
    expect((await loadResolvedReplyIds({}, ['m1'])).size).toBe(0);
    expect(d.store.gapAuditEvent).toHaveLength(0);
  });

  it('no age window and no single-page take remain in the reader', () => {
    const src = readFileSync('src/lib/gap/work/recorded-replies.ts', 'utf8');
    expect(src).not.toMatch(/ANSWER_OWED_DAYS/);
    expect(src).not.toMatch(/take:\s*100\b/);
    expect(src).not.toMatch(/created_at:\s*\{\s*gte/);
  });
});
