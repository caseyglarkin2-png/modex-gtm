// @vitest-environment node
/**
 * R5 review (finding 3): the send gate's account-reply hold (replies/account-reply.ts accountRepliedRecently) cleared
 * only on a Capture disposition (source inbound_message or hubspot_engagement). A DONE by email records the reply as
 * source email_command with the reply on inbound_message_id, and settles it with the C35 row: the gate ignored both,
 * so after a DONE the account stayed held and the pursuit kept saying the proposed first touch was paused.
 * Pinned here over the shared in-memory ledger: the hold, the hold read Work and the account page use
 * (motion/load.ts loadReplyHolds), the motion and the pursuit state's paused sentences.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { accountRepliedRecently } from '@/lib/gap/replies/account-reply';
import { loadReplyHolds } from '@/lib/gap/motion/load';
import { computeAccountMotion } from '@/lib/gap/motion/account-motion';
import { projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';
import { REPLY_RESOLVED } from '@/lib/gap/work/recorded-replies';
import { REPLY_SUBJECT_TYPE } from '@/lib/gap/execution/draft-ledger';

const NOW = new Date('2026-10-10T14:00:00Z');
const CRAIG = 'craig.morrison@kencogroup.com';
const PAT = 'pat.lee@kencogroup.com';
const WORDS = 'Can you send the two-site comparison?';

function world() {
  const db = ledgerDb(
    {
      accounts: ['Kenco'],
      personas: [
        { id: 11, name: 'Craig Morrison', email: CRAIG, account_name: 'Kenco' },
        { id: 14, name: 'Pat Lee', email: PAT, account_name: 'Kenco' },
      ],
      inbound: [{ id: 'm-craig', from_email: CRAIG, subject: 'Re: yards', received_at: new Date('2026-10-09T15:00:00Z'), snippet: WORDS, body_text: WORDS }],
    },
    NOW,
  );
  return db;
}

const pursuit = (motion: PursuitInput['motion']): ReturnType<typeof projectPursuitState> =>
  projectPursuitState({
    accountName: 'Kenco',
    now: NOW,
    motionType: 'FACT_LED',
    opportunity: { status: 'CLEAR', detail: '', deals: [] },
    restriction: null,
    familyHold: null,
    motion,
    choice: null,
    activePersona: null,
    replies: [],
    lastOutbound: null,
    outstandingDraft: null,
    followUpDue: null,
    eligible: [{ key: 'gap:14', personaId: 14, name: 'Pat Lee', title: 'Director Transportation' }],
  });

async function heldState(c: unknown) {
  const holds = await loadReplyHolds(c, new Map([['Kenco', PAT]]), NOW);
  const motion = computeAccountMotion({ accountName: 'Kenco', readyEmailCards: [], choice: null, firstTouches: [], replyHold: holds.get('Kenco') ?? null, now: NOW });
  return { holds, motion, state: pursuit(motion as unknown as PursuitInput['motion']) };
}

describe('the send gate clears on a DONE by email (R5 review, finding 3)', () => {
  it('before: Craig wrote and nobody recorded it: a first touch to Pat is held and the pursuit says the first touch is paused', async () => {
    const db = world();
    expect(await accountRepliedRecently(db.client(), PAT, NOW, { accountName: 'Kenco' })).toMatchObject({ id: 'm-craig', from_email: CRAIG });
    const s = await heldState(db.client());
    expect(s.motion.state).toBe('paused_reply');
    expect(s.state.paused?.proposed).toEqual({ kind: 'first_touch', to: 'Pat Lee' });
    expect(s.state.blocker).toContain('The proposed first touch to Pat Lee is paused by the send gate');
  });

  it('after a DONE (an email_command disposition on the reply): the account is not held, and the paused sentence is gone', async () => {
    const db = world();
    db.store.conversationDisposition.push({ id: 'd-done', source_kind: 'email_command', source_id: 'cmd-1', inbound_message_id: 'm-craig', human_confirmed: true, account_name: 'Kenco', contact_email: CRAIG, response_class: 'request_information', created_at: NOW });
    expect(await accountRepliedRecently(db.client(), PAT, NOW, { accountName: 'Kenco' })).toBeNull();
    const s = await heldState(db.client());
    expect(s.holds.size).toBe(0);
    expect(s.motion.state).not.toBe('paused_reply');
    expect(s.state.paused ?? null).toBeNull();
    expect(`${s.state.stateLine} ${s.state.blocker ?? ''}`).not.toMatch(/paused/i);
  });

  it('the C35 resolution row on the reply (a DONE settled it) clears the hold too; an unconfirmed (AI) row or another message does not', async () => {
    const settled = world();
    settled.store.gapAuditEvent.push({ id: 'a-1', kind: REPLY_RESOLVED, actor: 'casey@freightroll.com', subject_type: REPLY_SUBJECT_TYPE, subject_id: 'm-craig', payload: { reason: 'DONE by email: answered' }, created_at: NOW });
    expect(await accountRepliedRecently(settled.client(), PAT, NOW, { accountName: 'Kenco' })).toBeNull();

    const ai = world();
    ai.store.conversationDisposition.push({ id: 'd-ai', source_kind: 'email_command', source_id: 'cmd-2', inbound_message_id: 'm-craig', human_confirmed: false, account_name: 'Kenco', created_at: NOW });
    ai.store.conversationDisposition.push({ id: 'd-other', source_kind: 'email_command', source_id: 'cmd-3', inbound_message_id: 'm-other', human_confirmed: true, account_name: 'Kenco', created_at: NOW });
    expect(await accountRepliedRecently(ai.client(), PAT, NOW, { accountName: 'Kenco' })).toMatchObject({ id: 'm-craig' });
  });
});
