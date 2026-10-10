// @vitest-environment node
/**
 * THE DONE UNIFICATION (Casey, 2026-10-10, verbatim: "Unify DONE activity handling. Route email-reply DONE through the
 * same canonical activity recording and HubSpot mirror used by Capture. Reuse the existing service. Preserve progress
 * versus completion, activity type, person/account associations and provenance. Retries must not duplicate either
 * local activity or CRM records. A failed mirror must remain visible and retryable without claiming CRM success.")
 *
 * Pinned here, over the real command handler, the real disposition service and the real HubSpot mirror (only the
 * HubSpot client, the review feed, the enrollment stops and the consent writer's external half are stand-ins):
 *   - a completion DONE on a reply records ONE disposition through recordDisposition: source email_command keyed by
 *     the command's Gmail id, the person and account from the reply row, no thesis invented, provenance
 *     self-reported by email command, the seller's words never stored as the buyer's; one `disposition.recorded`
 *     activity row that completes the reply's plan item; one CRM note; the C35 settle row; the receipt on the applied row
 *   - the same Gmail command applied twice (sequentially, and after a lost ledger write) records once: one disposition,
 *     one activity row, one CRM note
 *   - a failed mirror: the answer says recorded in GAP and that the mirror failed and will be retried, never mirrored;
 *     the applied row carries recorded_not_mirrored with the reason; the retry ends mirrored with one CRM note; a mirror
 *     that keeps failing is tried three times and stays visible
 *   - an opt-out is recorded as do not contact through the one consent writer and settled; one the writer could not
 *     record stays on the list
 *   - a progress note never reaches the service; a reply recorded before (Capture) is not recorded twice; a non-reply
 *     DONE keeps the done outcome
 *   - the service: a disposition without a hypothesis only for an email command, on an account that exists, with the
 *     thesis steps skipped and said
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyCommand, COMMAND_APPLIED, COMMAND_REFUSED, DONE_RECEIPT, loadCommandContext, replyIdOf } from '@/lib/gap/replies/commands-apply';
import { classWords, doneReplyClass, mirrorReceiptOf, recordReplyDone, type ReplyDoneDeps } from '@/lib/gap/replies/done-reply';
import { DISPOSITION_SOURCE_KINDS, INTERNAL_DISPOSITION_SOURCE_KINDS, recordDisposition } from '@/lib/gap/disposition/service';
import { MIRROR_RETRY, MIRROR_RETRY_MAX, retryDispositionMirrors } from '@/lib/gap/disposition/mirror-retry';
import { MIRROR_IN_FLIGHT, mirrorDisposition } from '@/lib/gap/hubspot-mirror';
import { audit } from '@/lib/gap/audit';
import { projectActivity, type LedgerRow } from '@/lib/gap/work/activity';
import { COMMITMENT_EVENT } from '@/lib/gap/work/commitment-model';
import { loadWorkOutcomes } from '@/lib/gap/work/outcome';
import { REPLY_RESOLVED } from '@/lib/gap/work/recorded-replies';
import { sendAssignment } from '@/lib/gap/work/assignment';
import { planDay, type DayPlan } from '@/lib/gap/work/plan';
import type { WorkCard, WorkDay } from '@/lib/gap/work/list';
import type { SellerSettings } from '@/lib/gap/work/settings';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import type { GmailSendPayload } from '@/lib/email/gmail-sender';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Each world plans a day and sends its assignments through the real modules: seconds, not milliseconds, on this box.
vi.setConfig({ testTimeout: 30_000 });
const NOW = new Date('2026-10-10T14:00:00Z');
const SELLER = 'casey@freightroll.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SETTINGS: SellerSettings = { briefingTo: SELLER, briefingHourNy: 7, commandSenders: [SELLER], mode: 'review', targets: {} };
const AUTH_OK = 'mx.google.com; spf=pass smtp.mailfrom=casey@freightroll.com; dmarc=pass (p=NONE) header.from=freightroll.com';
const CRAIG = 'craig.morrison@kencogroup.com';
const TIM = 'timothy.cooper@walmart.com';
const BOB = 'bob.hale@acmefoods.example';

const prep = (messageId: string, from: string, fromName: string, snippet: string) =>
  ({ messageId, from, fromName, at: '2026-10-09T15:00:00.000Z', subject: 'Re: yards', snippet, kind: 'human', human: null, label: 'replied', copyFamily: null, answerable: true, noAnswerLine: null, notes: [], threadHref: '', record: null }) as unknown as WorkCard['reply'];
const card = (c: Partial<WorkCard> & Pick<WorkCard, 'accountName' | 'stateKind' | 'state'>): WorkCard => ({ href: `/gap/accounts/${c.accountName.toLowerCase()}`, lane: 'ready', why: '', person: null, next: null, blocker: null, index: 0, source: 'cockpit', ...c });

function day(extra: WorkCard[] = []): WorkDay {
  return {
    cards: [
      ...extra,
      card({ accountName: 'Kenco', stateKind: 'replied', state: 'Someone replied', tier: 'reply', lane: 'replies', person: { name: 'Craig Morrison', title: null }, reply: prep('m-craig', CRAIG, 'Craig Morrison', 'Can you send the two-site comparison?') }),
      card({ accountName: 'Walmart Inc.', stateKind: 'opted_out', state: 'Opted out', tier: 'admin', lane: 'replies', person: { name: 'Tim Cooper', title: null }, reply: prep('m-stop', TIM, 'Tim Cooper', 'stop') }),
      card({ accountName: 'Boston Beer', stateKind: 'in_deal', state: 'In a deal', tier: 'deal', lane: 'deals', dealNextStep: 'Send the four documents', move: 'Next step on the deal: Send the four documents' }),
    ],
    waiting: [],
    snoozed: [],
    counts: { needsYou: 3, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 },
  };
}

/** The reply as Capture's reader returns it (replies/list.ts loadReplyForCapture): the person and account from the row; no thesis. */
const REPLIES: Record<string, any> = {
  'm-craig': { item: { id: 'm-craig', source: { kind: 'inbound_message', id: 'm-craig' }, contactEmail: CRAIG, personaId: 11, accountName: 'Kenco', hypothesisId: '', hypothesisTitle: null, subject: 'Re: yards', snippet: 'Can you send the two-site comparison?', receivedAt: '2026-10-09T15:00:00.000Z', enrollmentId: null, enrollmentStatus: null }, text: 'Can you send the two-site comparison?', dispositionId: null },
  'm-bob': { item: { id: 'm-bob', source: { kind: 'inbound_message', id: 'm-bob' }, contactEmail: BOB, personaId: 13, accountName: 'Acme Foods', hypothesisId: '', hypothesisTitle: null, subject: 'Re: yards', snippet: 'Tell me more about the gate on a Monday.', receivedAt: '2026-10-08T15:00:00.000Z', enrollmentId: null, enrollmentStatus: null }, text: 'Tell me more about the gate on a Monday.', dispositionId: null },
  'm-stop': { item: { id: 'm-stop', source: { kind: 'inbound_message', id: 'm-stop' }, contactEmail: TIM, personaId: 12, accountName: 'Walmart Inc.', hypothesisId: '', hypothesisTitle: null, subject: 'Re: yards', snippet: 'stop', receivedAt: '2026-10-09T15:00:00.000Z', enrollmentId: null, enrollmentStatus: null }, text: 'stop', dispositionId: null },
};

let cmdSeq = 0;
function msg(threadId: string, bodyText: string): MailboxMessage {
  cmdSeq += 1;
  return { id: `cmd-${cmdSeq}`, threadId, rfcMessageId: '<cmd@mail>', fromEmail: SELLER, fromName: 'Casey', subject: 'Re: GAP', snippet: '', bodyText, rawText: bodyText, bodyHtml: '', deliveryStatus: null, labelIds: ['INBOX'], receivedAt: NOW, headers: { 'Authentication-Results': AUTH_OK } };
}

/**
 * The ledger stand-in plus what the disposition service reads that it lacks: a transaction (the same client), the
 * (source_kind, source_id) unique key (P2002 on a second create, the compound findUnique), and no live enrollments.
 */
function serviceClient(db: ReturnType<typeof ledgerDb>) {
  const base = db.client();
  const disp = base.conversationDisposition;
  const c: any = {
    ...base,
    sequenceEnrollment: { findMany: async () => [] },
    conversationDisposition: {
      ...disp,
      findUnique: async (q: any) => (q.where?.source_kind_source_id ? disp.findFirst({ where: q.where.source_kind_source_id, select: q.select }) : disp.findUnique(q)),
      create: async (q: any) => {
        if (db.store.conversationDisposition.some((r) => r.source_kind === q.data.source_kind && r.source_id === q.data.source_id)) throw Object.assign(new Error('Unique constraint failed on the fields: (`source_kind`,`source_id`)'), { code: 'P2002' });
        return disp.create(q);
      },
    },
  };
  c.$transaction = async (fn: (tx: any) => Promise<unknown>) => fn(c);
  return c;
}

async function world(opts: { noteFails?: number; unsubscribeOk?: boolean; cards?: WorkCard[] } = {}) {
  const db = ledgerDb(
    {
      accounts: ['Kenco', 'Walmart Inc.', 'Boston Beer', 'Acme Foods'],
      personas: [
        { id: 11, name: 'Craig Morrison', email: CRAIG, account_name: 'Kenco', hubspot_contact_id: 'hs-11' },
        { id: 12, name: 'Tim Cooper', email: TIM, account_name: 'Walmart Inc.', hubspot_contact_id: 'hs-12' },
        { id: 13, name: 'Bob Hale', email: BOB, account_name: 'Acme Foods', hubspot_contact_id: 'hs-13' },
      ],
    },
    NOW,
  );
  const c = serviceClient(db);
  const plan: DayPlan = await planDay(c, { now: NOW, load: async () => day(opts.cards) }, 'test');
  let n = 0;
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async (p) => {
    n += 1;
    return { provider: 'gmail', id: `gm-${n}`, threadId: p.threadId ?? `th-item-${n - 1}` };
  });
  const assignDeps = { send, askContext: vi.fn(async () => null), pack: vi.fn(async () => null) };
  for (const item of plan.items) await sendAssignment(c, { plan, item, revision: 0, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' }, assignDeps);
  send.mockClear();

  // HubSpot: one note per successful createContactNote call; the first `noteFails` calls fail.
  let failures = opts.noteFails ?? 0;
  const notes: string[] = [];
  const createContactNote = vi.fn(async (contactId: string, body: string) => {
    if (failures > 0) {
      failures -= 1;
      throw new Error('HubSpot 502 Bad Gateway');
    }
    notes.push(`${contactId}:${body.length}`);
    return `note-${notes.length}`;
  });
  const mirrorDeps = { createContactNote, updateContactProperties: vi.fn(async () => ({})), ensureGapProperties: async () => undefined, syncEnabled: () => true, assertWriteAllowed: () => undefined, now: () => NOW };
  const mirror = vi.fn((p: any, i: any) => mirrorDisposition(p, i, mirrorDeps));
  const recordUnsubscribe = vi.fn(async () => ({ ok: opts.unsubscribeOk ?? true, created: true, personaUpdated: 1, hubspot: 'skipped:disabled' }));
  const stopRuns = vi.fn(async () => 0);
  const loadReply = vi.fn(async (_p: any, id: string) => REPLIES[id] ?? null);
  const replyDeps: ReplyDoneDeps = {
    loadReply: loadReply as unknown as ReplyDoneDeps['loadReply'],
    disposition: { mirror, recordUnsubscribe: recordUnsubscribe as any, stopRuns: stopRuns as any, audit: (p: any, i: any) => audit(p, i, { postReview: async () => ({ ok: true }) as any }) },
  };
  const recordReply = vi.fn((p: any, i: any) => recordReplyDone(p, i, replyDeps));
  const deps = { ...assignDeps, recordReplyDone: recordReply };
  const ctx = await loadCommandContext(c, SETTINGS, NOW);
  // R5 review (finding 5b): a ledger write of this kind throws (the database drops mid-command), when set.
  const faults: { auditKind: string | null } = { auditKind: null };
  const faulty = () => {
    const sc = serviceClient(db);
    const create = sc.gapAuditEvent.create;
    sc.gapAuditEvent = { ...sc.gapAuditEvent, create: async (q: any) => {
      if (faults.auditKind && q?.data?.kind === faults.auditKind) throw new Error('database is down');
      return create(q);
    } };
    return sc;
  };
  const apply = (m: MailboxMessage) => applyCommand(faulty(), { m, ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox' }, deps);
  const thread = (key: string) => `th-item-${plan.items.findIndex((i) => i.key === key)}`;
  const kinds = (k: string) => db.store.gapAuditEvent.filter((e) => e.kind === k);
  return { db, c, plan, send, apply, thread, kinds, mirror, createContactNote, notes, mirrorDeps, recordUnsubscribe, recordReply, loadReply, stopRuns, faults };
}

beforeEach(() => {
  vi.stubEnv('GAP_OS_ENABLED', 'true');
  vi.stubEnv('GAP_HUBSPOT_MIRROR_ENABLED', 'true');
  vi.stubEnv('GAP_AGENT_TASKS_ENABLED', 'false');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('a completion DONE on a reply goes through the one disposition service, the way Capture records a reply', () => {
  it('Kenco: one disposition (email_command, no thesis invented, person and account from the reply), one activity row, one CRM note, the C35 settle, the receipt', async () => {
    const w = await world();
    const m = msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day');
    const r = await w.apply(m);
    expect(r).toMatchObject({ applied: true, command: 'done', effect: 'reply_settled', basis: 'self_reported' });

    expect(w.db.store.conversationDisposition).toHaveLength(1);
    const d = w.db.store.conversationDisposition[0];
    expect(d).toMatchObject({ source_kind: 'email_command', source_id: m.id, hypothesis_id: null, account_name: 'Kenco', persona_id: 11, contact_email: CRAIG, hubspot_contact_id: 'hs-11', inbound_message_id: 'm-craig', channel: 'email', response_class: 'request_information', human_confirmed: true, confirmed_by: SELLER, buyer_language: null });
    expect(d.metadata).toEqual({ provenance: { basis: 'self_reported', via: 'email_command', commandMessageId: m.id, note: 'answered Craig from Gmail the same day' } });

    // The canonical activity row: one, self-reported, said as the seller's DONE by email, completing the reply's item.
    const recorded = w.kinds('disposition.recorded');
    expect(recorded).toHaveLength(1);
    const ev = projectActivity(recorded[0] as unknown as LedgerRow)!;
    expect(ev).toMatchObject({ kind: 'conversation_completed', basis: 'self_reported', accountName: 'Kenco', who: CRAIG });
    expect(ev.completes).toContain('reply:m-craig');
    expect(ev.line).toBe(`Recorded ${CRAIG}'s answer (request information), by your DONE by email.`);

    // The HubSpot mirror Capture uses: one note on the contact, with the provenance and no thesis.
    expect(w.mirror).toHaveBeenCalledTimes(1);
    expect(w.mirror.mock.calls[0][1]).toMatchObject({ hypothesisId: null, accountName: 'Kenco', hubspotContactId: 'hs-11', responseClass: 'request_information', summary: 'request_information via email, self-reported by email command: "answered Craig from Gmail the same day"' });
    expect(w.notes).toHaveLength(1);
    expect(w.db.store.gapHubSpotMirror).toHaveLength(1);
    expect(w.db.store.gapHubSpotMirror[0]).toMatchObject({ error: null });

    // Settled by the C35 row once; no obligation created by DONE (no "Answer Craig's request").
    expect(w.kinds(REPLY_RESOLVED)).toHaveLength(1);
    expect(w.kinds(COMMITMENT_EVENT)).toEqual([]);
    const applied = w.kinds(COMMAND_APPLIED).find((e) => e.subject_id === 'reply:m-craig')!;
    expect(applied.payload).toMatchObject({ command: 'done', effect: 'reply_settled', replyMessageId: 'm-craig', dispositionId: d.id, responseClass: 'request_information', receipt: 'mirrored', basis: 'self_reported' });
    const said = w.send.mock.calls.find((call) => /Settled, by your word/.test(String(call[0].text)))![0].text;
    expect(said).toMatch(/^Settled, by your word: Craig Morrison's reply at Kenco\. Recorded: "answered Craig from Gmail the same day"\. It does not come back; a new message from them does\. Recorded in GAP as "They asked for something" \(a person wrote and you handled it; GAP's reading when the message says no more\), self-reported by your DONE, and mirrored to HubSpot as a note on the contact\./);
  });

  it('the same Gmail command applied twice records once: sequentially (duplicate_message), and after the applied row was lost (the source key)', async () => {
    const w = await world();
    const m = msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day');
    await w.apply(m);
    const second = await w.apply(m);
    expect(second).toMatchObject({ applied: false, reason: 'duplicate_message' });
    expect(w.recordReply).toHaveBeenCalledTimes(1);

    // A cron run that recorded the disposition and lost its applied row before writing it: the replay finds the row by the source key.
    const i = w.db.store.gapAuditEvent.findIndex((e) => e.kind === COMMAND_APPLIED && e.subject_id === 'reply:m-craig');
    w.db.store.gapAuditEvent.splice(i, 1);
    const replay = await w.apply(m);
    expect(replay).toMatchObject({ applied: true, effect: 'reply_settled' });
    expect(w.recordReply).toHaveBeenCalledTimes(2);

    expect(w.db.store.conversationDisposition, 'one disposition').toHaveLength(1);
    expect(w.kinds('disposition.recorded'), 'one activity row').toHaveLength(1);
    expect(w.mirror, 'one mirror call').toHaveBeenCalledTimes(1);
    expect(w.notes, 'one CRM record').toHaveLength(1);
    expect(w.kinds(REPLY_RESOLVED), 'one settle row').toHaveLength(1);
    const appliedRows = w.kinds(COMMAND_APPLIED).filter((e) => e.subject_id === 'reply:m-craig');
    expect(appliedRows).toHaveLength(1);
    expect(appliedRows[0].payload).toMatchObject({ dispositionId: w.db.store.conversationDisposition[0].id, replay: true, receipt: 'mirrored', resolvedBefore: true });
  });
});

describe('a failed mirror stays visible and is retried, never claimed', () => {
  it('the answer says recorded in GAP and the mirror failed with its reason and will be retried; the applied row is recorded_not_mirrored; the retry ends mirrored with ONE CRM note', async () => {
    const w = await world({ noteFails: 1 });
    const r = await w.apply(msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day'));
    expect(r).toMatchObject({ applied: true, effect: 'reply_settled' });
    expect(w.db.store.conversationDisposition).toHaveLength(1);
    const applied = w.kinds(COMMAND_APPLIED).find((e) => e.subject_id === 'reply:m-craig')!;
    expect(applied.payload).toMatchObject({ receipt: 'recorded_not_mirrored', mirrorReason: 'HubSpot 502 Bad Gateway', retryable: true });
    const said = w.send.mock.calls.find((call) => /Settled, by your word/.test(String(call[0].text)))![0].text;
    expect(said).toContain('Recorded in GAP as "They asked for something"');
    expect(said).toContain('; the HubSpot mirror failed: HubSpot 502 Bad Gateway; it will be retried.');
    expect(said, 'never claims CRM success').not.toMatch(/mirrored/i);
    expect(w.notes).toHaveLength(0);
    expect(w.db.store.gapHubSpotMirror[0]).toMatchObject({ error: 'HubSpot 502 Bad Gateway' });

    const later = new Date(NOW.getTime() + 3 * 60_000);
    const pass = await retryDispositionMirrors(w.c, { now: later }, { mirror: (p, i) => mirrorDisposition(p, i, w.mirrorDeps) });
    expect(pass).toEqual({ tried: 1, mirrored: 1, failed: 0, exhausted: [] });
    expect(w.notes, 'one CRM record').toHaveLength(1);
    expect(w.db.store.gapHubSpotMirror).toHaveLength(1);
    expect(w.db.store.gapHubSpotMirror[0]).toMatchObject({ error: null, note_id: 'note-1' });
    expect(w.kinds(MIRROR_RETRY).map((e) => e.payload)).toEqual([expect.objectContaining({ attempt: 1, receipt: 'mirrored', status: 'written' })]);
    // Mirrored is final: the next pass tries nothing.
    expect(await retryDispositionMirrors(w.c, { now: later }, { mirror: (p, i) => mirrorDisposition(p, i, w.mirrorDeps) })).toEqual({ tried: 0, mirrored: 0, failed: 0, exhausted: [] });
    expect(w.notes).toHaveLength(1);
  });

  it('R5 review (finding 4): two overlapping cron passes over one failed row post ONE note: the key is claimed before posting, released after', async () => {
    const w = await world({ noteFails: 1 });
    await w.apply(msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day'));
    expect(w.notes).toHaveLength(0);
    // HubSpot answers slowly, so both passes are in flight at once.
    const slow = { ...w.mirrorDeps, createContactNote: vi.fn(async (id: string, body: string) => {
      await new Promise((r) => setTimeout(r, 25));
      return w.mirrorDeps.createContactNote(id, body);
    }) };
    const pass = () => retryDispositionMirrors(w.c, { now: NOW }, { mirror: (p, i) => mirrorDisposition(p, i, slow) });
    const [a, b] = await Promise.all([pass(), pass()]);
    expect(slow.createContactNote, 'one post').toHaveBeenCalledTimes(1);
    expect(w.notes, 'one CRM note').toHaveLength(1);
    expect(a.mirrored + b.mirrored).toBe(1);
    expect(a.failed + b.failed, 'the pass that found the key claimed is not a failed attempt').toBe(0);
    expect(w.kinds(MIRROR_RETRY).map((e) => e.payload.receipt), 'one attempt recorded').toEqual(['mirrored']);
    expect(w.db.store.gapHubSpotMirror).toHaveLength(1);
    expect(w.db.store.gapHubSpotMirror[0]).toMatchObject({ error: null, note_id: 'note-1' });
  });

  it('R5 review (finding 4): a claim younger than ten minutes is honored (nothing posted, no attempt counted); an older one (a pass that died) is reclaimed', async () => {
    const w = await world({ noteFails: 1 });
    await w.apply(msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day'));
    const row = w.db.store.gapHubSpotMirror[0];
    Object.assign(row, { error: MIRROR_IN_FLIGHT, written_at: new Date(NOW.getTime() - 60_000) });
    const run = () => retryDispositionMirrors(w.c, { now: NOW }, { mirror: (p, i) => mirrorDisposition(p, i, w.mirrorDeps) });
    expect(await run()).toEqual({ tried: 0, mirrored: 0, failed: 0, exhausted: [] });
    expect(w.notes).toHaveLength(0);
    expect(w.kinds(MIRROR_RETRY)).toEqual([]);
    Object.assign(row, { written_at: new Date(NOW.getTime() - 11 * 60_000) });
    expect(await run()).toEqual({ tried: 1, mirrored: 1, failed: 0, exhausted: [] });
    expect(w.notes).toHaveLength(1);
    expect(row).toMatchObject({ error: null, note_id: 'note-1' });
  });

  it('a mirror that keeps failing is tried at most three times, each attempt recorded with its reason, then stays recorded_not_mirrored', async () => {
    const w = await world({ noteFails: 99 });
    await w.apply(msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day'));
    const down = (p: any, i: any) => mirrorDisposition(p, i, w.mirrorDeps);
    for (let k = 0; k < MIRROR_RETRY_MAX; k += 1) expect(await retryDispositionMirrors(w.c, { now: NOW }, { mirror: down })).toMatchObject({ tried: 1, mirrored: 0, failed: 1 });
    const last = await retryDispositionMirrors(w.c, { now: NOW }, { mirror: down });
    expect(last).toEqual({ tried: 0, mirrored: 0, failed: 0, exhausted: [w.db.store.conversationDisposition[0].id] });
    expect(w.kinds(MIRROR_RETRY).map((e) => [e.payload.attempt, e.payload.receipt, e.payload.reason])).toEqual([
      [1, 'recorded_not_mirrored', 'HubSpot 502 Bad Gateway'],
      [2, 'recorded_not_mirrored', 'HubSpot 502 Bad Gateway'],
      [3, 'recorded_not_mirrored', 'HubSpot 502 Bad Gateway'],
    ]);
    expect(w.notes).toHaveLength(0);
  });

  it('R5 review (finding 5b): a step that throws after the disposition is recorded: the answer says recorded in GAP and what failed, never "Nothing changed"; the receipt was written first, so the failed mirror is still retried', async () => {
    const w = await world({ noteFails: 1 });
    w.faults.auditKind = REPLY_RESOLVED;
    const m = msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day');
    const r = await w.apply(m);
    expect(r).toMatchObject({ applied: false, command: 'done', reason: 'recorded_then_failed', outcome: 'failed' });
    expect(w.db.store.conversationDisposition).toHaveLength(1);
    const d = w.db.store.conversationDisposition[0];
    const said = String(w.send.mock.calls.at(-1)![0].text);
    expect(said).toMatch(/^Recorded in GAP; settling the reply failed \(database is down\)\./);
    expect(said).toContain('; the HubSpot mirror failed: HubSpot 502 Bad Gateway; it will be retried.');
    expect(said).not.toMatch(/Nothing changed/);
    expect(said, 'never claims CRM success').not.toMatch(/mirrored to HubSpot/);
    // The receipt is durable and was written before the step that failed.
    const receipts = w.kinds(DONE_RECEIPT);
    expect(receipts).toHaveLength(1);
    expect(receipts[0].payload).toMatchObject({ gmailMessageId: m.id, replyMessageId: 'm-craig', dispositionId: d.id, receipt: 'recorded_not_mirrored', mirrorReason: 'HubSpot 502 Bad Gateway', retryable: true });
    const refused = w.kinds(COMMAND_REFUSED).filter((e) => e.payload.gmailMessageId === m.id);
    expect(refused.map((e) => e.payload)).toEqual([expect.objectContaining({ command: 'done', reason: 'recorded_then_failed', failedStep: 'settling the reply', error: 'database is down', dispositionId: d.id })]);
    expect(w.db.store.gapAuditEvent.indexOf(receipts[0])).toBeLessThan(w.db.store.gapAuditEvent.indexOf(refused[0]));
    expect(w.kinds(REPLY_RESOLVED)).toEqual([]);
    // The failed mirror did not drop out of sight: the retry pass reads the receipt and mirrors once.
    const pass = await retryDispositionMirrors(w.c, { now: NOW }, { mirror: (p, i) => mirrorDisposition(p, i, w.mirrorDeps) });
    expect(pass).toEqual({ tried: 1, mirrored: 1, failed: 0, exhausted: [] });
    expect(w.notes).toHaveLength(1);
    // DONE again (a new command) finishes it: recorded before, settled once, no second disposition, no second note.
    w.faults.auditKind = null;
    const again = await w.apply(msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day'));
    expect(again).toMatchObject({ applied: true, effect: 'reply_settled' });
    expect(w.db.store.conversationDisposition).toHaveLength(1);
    expect(w.kinds(REPLY_RESOLVED)).toHaveLength(1);
    expect(w.notes).toHaveLength(1);
  });

  it('a mirror skipped by policy says HubSpot was not written and why, and is not retried', async () => {
    vi.stubEnv('GAP_HUBSPOT_MIRROR_ENABLED', 'false');
    const w = await world();
    await w.apply(msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day'));
    const applied = w.kinds(COMMAND_APPLIED).find((e) => e.subject_id === 'reply:m-craig')!;
    expect(applied.payload).toMatchObject({ receipt: 'recorded_not_mirrored', mirrorReason: 'the GAP HubSpot mirror is off', retryable: false });
    const said = w.send.mock.calls.find((call) => /Settled, by your word/.test(String(call[0].text)))![0].text;
    expect(said).toContain('; HubSpot was not written: the GAP HubSpot mirror is off.');
    expect(said).not.toMatch(/mirrored|will be retried/i);
    expect(await retryDispositionMirrors(w.c, { now: NOW })).toEqual({ tried: 0, mirrored: 0, failed: 0, exhausted: [] });
  });
});

describe('the opt-out, the progress note, a reply recorded before and a non-reply DONE', () => {
  it('an opt-out is recorded as do not contact through the one consent writer and settled', async () => {
    const w = await world();
    const r = await w.apply(msg(w.thread('reply:m-stop'), 'DONE: noted it'));
    expect(r).toMatchObject({ applied: true, effect: 'reply_settled' });
    expect(w.db.store.conversationDisposition[0]).toMatchObject({ response_class: 'do_not_contact', source_kind: 'email_command', inbound_message_id: 'm-stop', account_name: 'Walmart Inc.', persona_id: 12 });
    expect(w.recordUnsubscribe).toHaveBeenCalledTimes(1);
    expect((w.recordUnsubscribe.mock.calls[0] as any[])[1]).toMatchObject({ email: TIM, source: 'gap_disposition' });
    expect(w.stopRuns).toHaveBeenCalledWith(expect.anything(), TIM, 'dnc');
    expect(w.kinds(REPLY_RESOLVED)).toHaveLength(1);
    expect(await loadWorkOutcomes(w.c, ['Walmart Inc.'], NOW)).toEqual(new Map());
    const said = w.send.mock.calls.find((call) => /do not contact, by your word/.test(String(call[0].text)))![0].text;
    expect(said).toMatch(/^Recorded as do not contact, by your word: Tim Cooper's reply at Walmart Inc\. Recorded: "noted it"\. GAP will not contact them again\. Recorded in GAP as "Do not contact them again"/);
  });

  it('an opt-out the consent writer did not record stays on the list (the one-day log) and the answer says so', async () => {
    const w = await world({ unsubscribeOk: false });
    const r = await w.apply(msg(w.thread('reply:m-stop'), 'DONE: noted it'));
    expect(r).toMatchObject({ applied: true, effect: 'account_logged' });
    expect(w.kinds(REPLY_RESOLVED)).toEqual([]);
    expect((await loadWorkOutcomes(w.c, ['Walmart Inc.'], NOW)).get('Walmart Inc.')?.kind).toBe('logged');
    const said = w.send.mock.calls.find((call) => /Logged, by your word/.test(String(call[0].text)))![0].text;
    expect(said).toContain('The opt-out stays on your list until it is recorded as do not contact on the account. Recorded in GAP as "Do not contact them again", but the do-not-contact write did not complete.');
  });

  it('R5 review (finding 1): an "Opted out: Tim" item bound to Bob\'s human reply records nothing on Bob: not recorded, the answer says why', async () => {
    // A summary remembered before the binding fix: the card says Tim's opt-out while its message panel is Bob's reply.
    const stale = card({ accountName: 'Acme Foods', stateKind: 'opted_out', state: 'Opted out: Tim Cole, Oct 9', tier: 'admin', lane: 'replies', person: null, reply: prep('m-bob', BOB, 'Bob Hale', 'Tell me more about the gate on a Monday.') });
    const w = await world({ cards: [stale] });
    const r = await w.apply(msg(w.thread('reply:m-bob'), 'DONE: recorded the stop'));
    expect(r).toMatchObject({ applied: false, command: 'done', reason: 'not_the_opt_out', outcome: 'refused' });
    expect(w.db.store.conversationDisposition, 'no disposition on Bob').toEqual([]);
    expect(w.recordUnsubscribe, 'Bob is never suppressed').not.toHaveBeenCalled();
    expect(w.stopRuns).not.toHaveBeenCalled();
    expect(w.mirror).not.toHaveBeenCalled();
    expect(w.kinds(REPLY_RESOLVED)).toEqual([]);
    expect(await loadWorkOutcomes(w.c, ['Acme Foods'], NOW)).toEqual(new Map());
    expect(w.kinds(COMMITMENT_EVENT)).toEqual([]);
    const said = String(w.send.mock.calls.at(-1)![0].text);
    expect(said).toBe("Not recorded: the item's message is not the opt-out; open the account: https://app.example/gap/accounts/acme-foods");
  });

  it('a progress note on a reply never reaches the service: no disposition, no mirror, no settle', async () => {
    const w = await world();
    const r = await w.apply(msg(w.thread('reply:m-craig'), 'DONE: will send Craig the comparison tomorrow'));
    expect(r).toMatchObject({ applied: true, effect: 'progress_noted' });
    expect(w.recordReply).not.toHaveBeenCalled();
    expect(w.db.store.conversationDisposition).toEqual([]);
    expect(w.mirror).not.toHaveBeenCalled();
    expect(w.kinds(REPLY_RESOLVED)).toEqual([]);
  });

  it('a reply Capture recorded before is not recorded twice: no second disposition, no mirror; the answer says it', async () => {
    const w = await world();
    w.db.store.conversationDisposition.push({ id: 'disp-capture', source_kind: 'inbound_message', source_id: 'm-craig', human_confirmed: true, response_class: 'request_information', account_name: 'Kenco', contact_email: CRAIG, created_at: new Date('2026-10-09T16:00:00Z') });
    const r = await w.apply(msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day'));
    expect(r).toMatchObject({ applied: true, effect: 'reply_settled' });
    expect(w.db.store.conversationDisposition.map((d) => d.id)).toEqual(['disp-capture']);
    expect(w.mirror).not.toHaveBeenCalled();
    const applied = w.kinds(COMMAND_APPLIED).find((e) => e.subject_id === 'reply:m-craig')!;
    expect(applied.payload).toMatchObject({ receipt: 'recorded_before', dispositionId: 'disp-capture' });
    expect(w.send.mock.calls.find((call) => /Settled, by your word/.test(String(call[0].text)))![0].text).toContain('What their reply means was recorded before ("They asked for something"); nothing was recorded twice.');
  });

  it('R5 review (finding 2): Capture confirmed after a DONE never records the reply a second time: one disposition, one CRM note', async () => {
    const w = await world();
    await w.apply(msg(w.thread('reply:m-craig'), 'DONE: answered Craig from Gmail the same day'));
    expect(w.db.store.conversationDisposition).toHaveLength(1);
    const done = w.db.store.conversationDisposition[0];
    // The reply's thesis, as Capture holds it (the DONE row stands without one).
    w.db.store.prospectingHypothesis.push({ id: 'hyp-kenco', status: 'active', account_name: 'Kenco', primary_persona_id: 11, problem_family: 'gate dwell', problem_hypothesis: 'Trailers wait at the gate.', primary_persona: { id: 11, email: CRAIG, hubspot_contact_id: 'hs-11', account_name: 'Kenco' } });
    // Capture's confirm (capture/store.ts decideReplyKind) records on the reply's own source: inbound_message m-craig.
    const capture = await recordDisposition(w.c, { hypothesisId: 'hyp-kenco', personaId: 11, contactEmail: CRAIG, channel: 'email', responseClass: 'problem_confirmed', buyerLanguage: 'Can you send the two-site comparison?', source: { kind: 'inbound_message', id: 'm-craig' }, actor: SELLER, actorKind: 'human', now: NOW }, { mirror: w.mirror, stopRuns: w.stopRuns as any, audit: async () => ({ stored: true, reviewQueued: false }) });
    expect(capture).toEqual({ ok: false, kind: 'refused', reason: 'duplicate_source', existingId: done.id });
    expect(w.db.store.conversationDisposition, 'one disposition').toHaveLength(1);
    expect(w.mirror, 'one mirror call').toHaveBeenCalledTimes(1);
    expect(w.notes, 'one CRM note').toHaveLength(1);
    // The same holds for a reply that arrived through HubSpot (its engagement id is the reply's id).
    const engagement = await recordDisposition(w.c, { hypothesisId: 'hyp-kenco', personaId: 11, contactEmail: CRAIG, channel: 'email', responseClass: 'problem_confirmed', buyerLanguage: 'x', source: { kind: 'hubspot_engagement', id: 'm-craig' }, actor: SELLER, actorKind: 'human', now: NOW }, { mirror: w.mirror, stopRuns: w.stopRuns as any, audit: async () => ({ stored: true, reviewQueued: false }) });
    expect(engagement).toMatchObject({ ok: false, reason: 'duplicate_source', existingId: done.id });
    expect(w.db.store.conversationDisposition).toHaveLength(1);
  });

  it('a DONE on a non-reply item keeps the done outcome: no disposition, the service never called', async () => {
    const w = await world();
    const r = await w.apply(msg(w.thread('deal:Boston Beer:2026-10-10'), 'DONE: sent Phil the four documents'));
    expect(r).toMatchObject({ applied: true, effect: 'account_done' });
    expect(w.recordReply).not.toHaveBeenCalled();
    expect(w.db.store.conversationDisposition).toEqual([]);
  });
});

describe('the pieces, pure and at the service', () => {
  it('the class: the message states it, an opted-out or bounced card keeps its reading, a named meeting, else a plain reply handled', () => {
    expect(doneReplyClass({ kind: 'opt_out', human: null }, [])).toEqual({ responseClass: 'do_not_contact', basis: 'message' });
    // R5 review (finding 1): do not contact only when the message itself is the opt-out; another message is refused.
    expect(doneReplyClass({ kind: 'opt_out', human: null }, [], { stateKind: 'opted_out' })).toEqual({ responseClass: 'do_not_contact', basis: 'message' });
    expect(doneReplyClass({ kind: 'human', human: 'reply' }, [], { stateKind: 'opted_out' })).toEqual({ refused: 'not_the_opt_out' });
    expect(doneReplyClass({ kind: 'bounce', human: null }, [])).toEqual({ responseClass: 'bounce', basis: 'message' });
    expect(doneReplyClass({ kind: 'out_of_office', human: null }, [])).toEqual({ responseClass: 'out_of_office', basis: 'message' });
    expect(doneReplyClass({ kind: 'human', human: 'referral' }, [])).toEqual({ responseClass: 'referral', basis: 'message' });
    expect(doneReplyClass({ kind: 'human', human: 'reply' }, [{ kind: 'meeting', day: '2026-10-14', phrase: '10.14.2026', ambiguous: false, words: 'meeting scheduled for 10.14.2026' }])).toEqual({ responseClass: 'meeting_accepted', basis: 'note' });
    expect(doneReplyClass({ kind: 'human', human: 'objection' }, [])).toEqual({ responseClass: 'request_information', basis: 'handled' });
    expect(classWords('do_not_contact')).toBe('"Do not contact them again"');
  });

  it('the receipt: written or already mirrored is mirrored; an error is retryable with its reason; a skip is said and not retried', () => {
    expect(mirrorReceiptOf('written')).toEqual({ receipt: 'mirrored' });
    expect(mirrorReceiptOf('skipped:already_mirrored')).toEqual({ receipt: 'mirrored' });
    expect(mirrorReceiptOf('error:HubSpot 429')).toEqual({ receipt: 'recorded_not_mirrored', reason: 'HubSpot 429', retryable: true });
    expect(mirrorReceiptOf('skipped:no_contact_id')).toEqual({ receipt: 'recorded_not_mirrored', reason: 'the person has no HubSpot contact in GAP', retryable: false });
  });

  it('the reply id: the refs, else the link from=reply:<id>', () => {
    expect(replyIdOf({ refs: { replyMessageId: 'm1' }, href: '/x' })).toBe('m1');
    expect(replyIdOf({ refs: {}, href: '/gap/capture?account=Kenco&from=reply%3Am-2' })).toBe('m-2');
    expect(replyIdOf({ refs: {}, href: '/gap/accounts/kenco' })).toBeNull();
  });

  it('the route can never name email_command: that provenance comes from the authenticated email command handler only', () => {
    expect(DISPOSITION_SOURCE_KINDS).not.toContain('email_command');
    expect([...INTERNAL_DISPOSITION_SOURCE_KINDS]).toEqual(['email_command']);
  });

  it('a disposition without a hypothesis: only for an email command, on an account that exists; the thesis steps are skipped and said', async () => {
    const db = ledgerDb({ accounts: ['Kenco'], personas: [{ id: 11, name: 'Craig Morrison', email: CRAIG, account_name: 'Kenco', hubspot_contact_id: null }] }, NOW);
    const c = serviceClient(db);
    const deps = { mirror: vi.fn(async () => ({ status: 'skipped:no_contact_id' as const })), stopRuns: vi.fn(async () => 0) as any, audit: vi.fn(async () => ({ stored: true, reviewQueued: false })) };
    const base = { contactEmail: CRAIG, channel: 'email', actor: SELLER, actorKind: 'human' as const, now: NOW };
    expect(await recordDisposition(c, { ...base, responseClass: 'request_information', source: { kind: 'manual', id: 'x1' }, accountName: 'Kenco' }, deps)).toEqual({ ok: false, kind: 'invalid_body', field: 'hypothesisId', reason: 'no_hypothesis' });
    expect(await recordDisposition(c, { ...base, responseClass: 'request_information', source: { kind: 'email_command', id: 'x2' } }, deps)).toEqual({ ok: false, kind: 'invalid_body', field: 'accountName', reason: 'no_account' });
    expect(await recordDisposition(c, { ...base, responseClass: 'request_information', source: { kind: 'email_command', id: 'x3' }, accountName: 'Nowhere Inc.' }, deps)).toEqual({ ok: false, kind: 'refused', reason: 'account_not_found' });
    const ok = await recordDisposition(c, { ...base, responseClass: 'problem_confirmed', buyerLanguage: 'We lose trailers every week.', source: { kind: 'email_command', id: 'x4' }, accountName: 'Kenco' }, deps);
    expect(ok).toMatchObject({ ok: true, humanConfirmed: true, refusals: [{ step: 'resolve', reason: 'no_hypothesis' }, { step: 'mirror', reason: 'skipped:no_contact_id' }] });
    expect(db.store.conversationDisposition).toEqual([expect.objectContaining({ hypothesis_id: null, account_name: 'Kenco', persona_id: 11, source_kind: 'email_command', source_id: 'x4' })]);
    expect(db.store.prospectingHypothesis, 'no hypothesis is invented').toEqual([]);
  });
});
