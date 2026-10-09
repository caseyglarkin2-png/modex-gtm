// @vitest-environment node
/**
 * C24 (the commercial-context audit, 2026-10-08): an accepted angle is promoted into the draft workflow GAP already
 * has. Pinned: Pursue on Dave -> the prepared angle -> the seller accepts the email for Dave -> a Gmail DRAFT of a
 * reply in his thread through the existing reply service (every gate), composed from the angle's starters, with
 * the links back to the angle's sources and its context revision on the ledger; nothing is sent (the send stays
 * CONFIRM + SEND); a second acceptance returns the same draft; a changed text while a draft is outstanding is
 * refused in words; a stranger is never drafted to; a call or research accepts nothing to draft; a signal with a
 * verified fact and nobody writing in becomes a proposal through draftThesisFromFact with a cited observation;
 * a signal without a verified excerpt is research first; a task that is not a prepared angle is refused.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { queueAgentTask, runAgentTasks } from '@/lib/gap/agents/tasks';
import { ANGLE_PROMOTED, composeAngleReply, loadPromotions, personaKeyOf, promoteAngle, type PromoteAngleDeps } from '@/lib/gap/agents/promote-angle';
import { VERIFIED_EXCERPT } from '@/lib/gap/research/evidence-gate';
import type { draftThesisFromFact } from '@/lib/gap/story/draft-from-fact';
import { DAVE_EMAIL, NOW, ROADMAP } from './stream-b-fixture';

const ACTOR = 'casey@freightroll.com';
const SENDER = { serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai', displayName: 'Casey Larkin' };
const ANGLE = {
  whyItMatters: 'My guess is Dave has laid out the 2027 roadmap already, so the end-of-October reconnect is about where a standard driver journey still adds production capacity across those yards.',
  accounts: ['Kenco Logistics'], roles: ['Vice President of Transportation Management'], people: [1],
  starters: ['Which sites move to Blue Yonder first, and how are drivers checked in there today?', 'Where does Birdseye hand off to the dock once a truck is inside the secure yards?'],
  proposedAction: 'email', caveat: null, key: `person:${DAVE_EMAIL}`, title: 'Dave wrote to us', accountName: 'Kenco Logistics', accountHint: null, sourceLine: 'the mailbox, observed Sep 16, 2026 (a recent report)',
  peopleNamed: [{ personaId: 1, name: 'Dave Kiesling', title: 'Vice President of Transportation Management' }], provider: 'test', calls: 1, warnings: [], inDeal: true, dealId: '62704698979',
  contextRevision: 'rev-kenco-1', contextGaps: ['vault: not configured'],
  support: [{ text: 'My guess is Dave has laid out the 2027 roadmap already.', where: 'whyItMatters', kind: 'fact', refs: [{ ref: 'K1', claimId: 'gmail:1a0aa7d3c587d944:7003af57', sourceId: 'gmail:1a0aa7d3c587d944', claimClass: 'buyer_said', at: '2026-09-16T14:02:00.000Z' }] }, { text: 'Which sites move to Blue Yonder first, and how are drivers checked in there today?', where: 'starter', kind: 'fact', refs: [{ ref: 'K1', claimId: 'gmail:1a0aa7d3c587d944:7003af57', sourceId: 'gmail:1a0aa7d3c587d944', claimClass: 'buyer_said', at: '2026-09-16T14:02:00.000Z' }] }],
};

function world() {
  return ledgerDb({
    accounts: ['Kenco Logistics'],
    personas: [{ id: 1, name: 'Dave Kiesling', title: 'Vice President of Transportation Management', email: DAVE_EMAIL, account_name: 'Kenco Logistics', do_not_contact: false, hubspot_contact_id: '217664765537', persona_lane: null }],
    inbound: [{ id: 'm-sep16', thread_id: 't-kenco', rfc_message_id: '<sep16@kencogroup.com>', from_email: DAVE_EMAIL, from_name: 'Dave Kiesling', subject: 'Re: YardFlow and the 2027 roadmap', body_text: ROADMAP, received_at: new Date('2026-09-16T14:02:00Z'), source: 'gmail', thread: { account_name: 'Kenco Logistics' } }],
    signals: [
      { id: 's-fact', url: 'https://dcvelocity.com/kenco', title: 'Kenco opens Jeffersonville DC', source_name: 'dcvelocity.com', source_type: 'public_secondary', source_kind: 'evidence_record', evidence_text: 'Kenco Logistics opened a 400,000 square foot distribution center in Jeffersonville, Indiana.', evidence_url: 'https://dcvelocity.com/kenco', observed_at: new Date('2026-06-24T12:00:00Z'), external_ok: true, metadata: { verified: VERIFIED_EXCERPT }, account_name: 'Kenco Logistics', created_at: new Date('2026-06-24T12:00:00Z'), type: 'news', freshness_expires_at: null, claim_class: null },
      { id: 's-bare', url: 'https://x/2', title: 'An unverified mention', source_type: 'public_secondary', evidence_text: null, evidence_url: null, observed_at: null, external_ok: null, metadata: null, account_name: 'Kenco Logistics', created_at: NOW },
    ],
  }, NOW);
}

const gmailSpy = () => {
  const drafts: unknown[] = [];
  const sent: unknown[] = [];
  const reply = {
    gapSender: () => SENDER,
    materials: async () => [],
    signature: async () => null,
    mailboxSentTo: async () => [] as Array<{ id: string; internalDate: Date; subject: string }>,
    gmail: { createGmailDraft: vi.fn(async (p: unknown) => { drafts.push(p); return { provider: 'gmail' as const, draftId: `d-${drafts.length}`, messageId: 'dm-1', threadId: 't-kenco' }; }), sendViaGmail: vi.fn(async (p: unknown) => { sent.push(p); return { provider: 'gmail' as const, id: 's-1', threadId: 't-kenco' }; }) },
  };
  return { drafts, sent, deps: { reply } as PromoteAngleDeps };
};

async function preparedTask(c: ReturnType<ReturnType<typeof world>['client']>, over: { itemKey?: string; input?: Record<string, unknown>; result?: Record<string, unknown> } = {}) {
  const q = await queueAgentTask(c, { kind: 'develop_angle', itemKey: over.itemKey ?? `person:${DAVE_EMAIL}`, itemToken: '', day: '2026-10-08', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', input: over.input ?? { decision: 'pursue', email: DAVE_EMAIL, name: 'Dave Kiesling', accountName: 'Kenco Logistics', inboundMessageId: 'm-sep16', threadId: 't-kenco', lastWroteAt: '2026-09-16T14:02:00.000Z', contextRevision: 'rev-kenco-1' } }, { now: NOW, actor: ACTOR });
  const r = await runAgentTasks(c, { now: new Date(NOW.getTime() + 1000), max: 5, claimer: 'test', handlers: { develop_angle: async () => ({ ok: true, result: over.result ?? ANGLE }) } });
  expect(r.succeeded).toBe(1);
  return q.id;
}

describe('C24: an accepted angle becomes a draft through the existing workflow', () => {
  it('Pursue on Dave -> the angle -> accept the email -> a Gmail draft of a reply in his thread, composed from the starters, with the source and revision links on the ledger; nothing sent; a repeat returns the same draft; an edited text while the draft stands is refused in words', async () => {
    const db = world();
    const c = db.client();
    const taskId = await preparedTask(c);
    const g = gmailSpy();
    const at = new Date(NOW.getTime() + 5000);
    const r = await promoteAngle(c, { taskId, actor: ACTOR, now: at, personaId: 1, action: 'email' }, g.deps);
    expect(r.ok).toBe(true);
    if (!r.ok || r.lane !== 'reply') throw new Error(`lane ${r.ok ? r.lane : r.reason}`);
    expect(r).toMatchObject({ lane: 'reply', alreadyDrafted: false, gmailDraftId: 'd-1', messageId: 'm-sep16', recipient: DAVE_EMAIL, href: '/gap/accounts/kenco-logistics/' });
    expect(r.body).toBe(`Hi Dave,\n\nThanks for your note on Sep 16.\n\nTwo questions before we talk again: ${ANGLE.starters[0]} ${ANGLE.starters[1]}`);
    expect(r.links).toEqual({ taskId, itemKey: `person:${DAVE_EMAIL}`, contextRevision: 'rev-kenco-1', sources: [{ sourceId: 'gmail:1a0aa7d3c587d944', claimClass: 'buyer_said', at: '2026-09-16T14:02:00.000Z' }] });
    expect(r.line).toMatch(/^A Gmail draft of the reply is saved in Dave Kiesling's thread\. .*nothing was sent\.$/);
    expect(g.drafts).toHaveLength(1);
    expect(g.drafts[0]).toMatchObject({ to: DAVE_EMAIL, threadId: 't-kenco', subject: 'Re: YardFlow and the 2027 roadmap', headers: { 'In-Reply-To': '<sep16@kencogroup.com>' } });
    expect(String((g.drafts[0] as { text?: string }).text)).toContain('Two questions before we talk again');
    expect(g.sent).toEqual([]);
    expect(g.deps.reply!.gmail!.sendViaGmail).not.toHaveBeenCalled();
    // The ledger: one promotion row on the item, carrying the task, the revision, the sources and the draft.
    const promos = await loadPromotions(c, `person:${DAVE_EMAIL}`);
    expect(promos).toHaveLength(1);
    expect(promos[0]).toMatchObject({ lane: 'reply', taskId, payload: { gmailDraftId: 'd-1', contextRevision: 'rev-kenco-1', messageId: 'm-sep16', sources: [{ sourceId: 'gmail:1a0aa7d3c587d944' }] } });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === ANGLE_PROMOTED)).toHaveLength(1);
    // Prepared is not sent: the reply ledger holds a draft and no send.
    const replyKinds = db.store.gapAuditEvent.filter((e) => e.subject_type === 'inbound_message').map((e) => e.kind);
    expect(replyKinds).toContain('execution.reply_drafted');
    expect(replyKinds).not.toContain('execution.reply_sent');
    // A second acceptance meets the saved draft as competing work (C25, server side, before anything is created): the seller chooses.
    const again = await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 1000), personaId: 1 }, g.deps);
    expect(again).toMatchObject({ ok: false, reason: 'competing_work', offers: ['reuse', 'fresh'], competing: { found: true, items: [{ kind: 'draft', id: 'd-1', provider: 'gmail', sellerEdited: false, offer: 'reuse', why: ['same_thread', 'same_person', 'same_purpose'] }], line: '1 existing draft for this person and deal: reuse or revise before a new one is written.' } });
    expect(g.drafts).toHaveLength(1);
    const reuse = await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 1500), personaId: 1, choice: 'reuse' }, g.deps);
    expect(reuse).toMatchObject({ ok: true, lane: 'existing', choice: 'reuse', item: { id: 'd-1' }, line: expect.stringMatching(/^Reusing the existing draft/) });
    expect(g.drafts).toHaveLength(1);
    // A fresh one with the same text is the same draft; the seller's edit while that draft stands is refused in words, never a second conflicting draft.
    const fresh = await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 1800), personaId: 1, choice: 'fresh' }, g.deps);
    expect(fresh).toMatchObject({ ok: true, lane: 'reply', alreadyDrafted: true, gmailDraftId: 'd-1' });
    const edited = await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 2000), personaId: 1, body: 'Hi Dave,\n\nA different note.', choice: 'fresh' }, g.deps);
    expect(edited).toMatchObject({ ok: false, reason: 'draft_outstanding' });
    expect(g.drafts).toHaveLength(1);
    // An unsent draft with the seller's own edits (an injected competing read): no second draft is ever created; only revise is offered, and revise returns that draft.
    const sellerEdit = { timeline: [], drafts: [{ id: 'r-edited', provider: 'gmail' as const, threadId: 't-kenco', to: [DAVE_EMAIL], subject: 'Phased 2027 proposal', dealId: '62704698979', purpose: 'buyer_conversation' as const, updatedAt: '2026-10-05T11:30:00.000Z', sellerEdited: true }] };
    const h = gmailSpy();
    const guarded = await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 3000), personaId: 1 }, { ...h.deps, competing: async () => sellerEdit });
    expect(guarded).toMatchObject({ ok: false, reason: 'competing_seller_edit', offers: ['revise'], competing: { found: true, items: [{ id: 'r-edited', sellerEdited: true, offer: 'revise' }] } });
    expect(await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 3500), personaId: 1, choice: 'fresh' }, { ...h.deps, competing: async () => sellerEdit })).toMatchObject({ ok: false, reason: 'competing_seller_edit' });
    // C57 P2-1: Casey's own hand-written Gmail draft, read by the typed timeline's drafts reader (deps.thread.listDrafts, no GAP ledger row), is in-flight seller work: the promotion refuses with revise only and writes nothing beside it.
    const byHand = gmailSpy();
    const listDrafts = vi.fn<(recipient: string) => Promise<Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string; isDraft: boolean }>>>(async () => [{ id: 'r-hand-1', threadId: 't-kenco', internalDate: new Date('2026-10-05T11:30:00Z'), to: DAVE_EMAIL, subject: 'Phased 2027 proposal', isDraft: true }, { id: 'r-hand-2', threadId: 't-kenco', internalDate: new Date('2026-10-06T09:00:00Z'), to: DAVE_EMAIL, subject: 'Re: YardFlow and the 2027 roadmap', isDraft: true }]);
    const hand = await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 3600), personaId: 1 }, { ...byHand.deps, thread: { listDrafts, listSent: async () => [], ownAddresses: new Set(['casey@yardflow.ai']) } });
    expect(hand).toMatchObject({ ok: false, reason: 'competing_seller_edit', offers: ['revise'], competing: { found: true, items: expect.arrayContaining([expect.objectContaining({ kind: 'in_flight', id: 'r-hand-2', sellerEdited: true, offer: 'revise' }), expect.objectContaining({ kind: 'in_flight', id: 'r-hand-1', sellerEdited: true })]) } });
    expect(listDrafts).toHaveBeenCalledWith(DAVE_EMAIL);
    expect(byHand.drafts).toEqual([]);
    expect(await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 3700), personaId: 1, choice: 'fresh' }, { ...byHand.deps, thread: { listDrafts, listSent: async () => [], ownAddresses: new Set(['casey@yardflow.ai']) } })).toMatchObject({ ok: false, reason: 'competing_seller_edit' });
    expect(byHand.drafts).toEqual([]);
    const revise = await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 4000), personaId: 1, choice: 'revise' }, { ...h.deps, competing: async () => sellerEdit });
    expect(revise).toMatchObject({ ok: true, lane: 'existing', choice: 'revise', item: { id: 'r-edited' }, line: expect.stringMatching(/^Revise the existing draft/) });
    expect(h.drafts).toEqual([]);
    // A text with an em dash never reaches Gmail.
    const dash = await promoteAngle(c, { taskId, actor: ACTOR, now: new Date(at.getTime() + 3000), personaId: 1, body: 'Hi Dave — a note.' }, g.deps);
    expect(dash.ok).toBe(false);
    expect(g.drafts).toHaveLength(1);
  });

  it('a stranger is never drafted to; a call accepts nothing to draft and points at the call brief; research accepts nothing to draft; a task that is not a prepared angle is refused', async () => {
    const c = world().client();
    const taskId = await preparedTask(c);
    const g = gmailSpy();
    expect(await promoteAngle(c, { taskId, actor: ACTOR, now: NOW, personaId: 99 }, g.deps)).toEqual({ ok: false, reason: 'person_not_offered', detail: '99' });
    const call = await promoteAngle(c, { taskId, actor: ACTOR, now: NOW, personaId: 1, action: 'call' }, g.deps);
    expect(call).toMatchObject({ ok: true, lane: 'call', href: '/gap/call/1', line: expect.stringMatching(/^Nothing drafted: the angle is a call/) });
    const research = await promoteAngle(c, { taskId, actor: ACTOR, now: NOW, action: 'research' }, g.deps);
    expect(research).toMatchObject({ ok: true, lane: 'research', href: '/gap/accounts/kenco-logistics/' });
    expect(g.drafts).toEqual([]);
    expect(await loadPromotions(c, `person:${DAVE_EMAIL}`)).toHaveLength(2);
    expect(g.sent).toEqual([]);
    expect(await promoteAngle(c, { taskId: 'at_nope', actor: ACTOR, now: NOW }, g.deps)).toEqual({ ok: false, reason: 'task_not_found' });
    const queued = await queueAgentTask(c, { kind: 'develop_angle', itemKey: 'signal:s-x', itemToken: '', day: '2026-10-08', revision: 0, request: 'pursue', requestedBy: ACTOR, requestedFrom: 'app', input: {} }, { now: NOW, actor: ACTOR });
    expect(await promoteAngle(c, { taskId: queued.id, actor: ACTOR, now: NOW }, g.deps)).toMatchObject({ ok: false, reason: 'angle_not_prepared', detail: 'queued' });
    const other = await queueAgentTask(c, { kind: 'revise_message', itemKey: 'x', itemToken: '', day: '2026-10-08', revision: 0, request: 'r', requestedBy: ACTOR, requestedFrom: 'app' }, { now: NOW, actor: ACTOR });
    expect(await promoteAngle(c, { taskId: other.id, actor: ACTOR, now: NOW }, g.deps)).toMatchObject({ ok: false, reason: 'not_an_angle' });
  });

  it('a signal with a verified fact and nobody writing in becomes a proposal through draftThesisFromFact: the observation cites the fact with its date and signal token, the thesis is the angle, the questions are the starters, the persona key is read off the title; a signal with no verified excerpt is research first', async () => {
    const c = world().client();
    const signalAngle = { ...ANGLE, key: 'signal:s-fact', title: 'Kenco opens Jeffersonville DC', sourceLine: 'dcvelocity.com, published Jun 24, 2026 (a historical observation)', inDeal: undefined, dealId: undefined };
    const taskId = await preparedTask(c, { itemKey: 'signal:s-fact', input: { decision: 'pursue', title: 'Kenco opens Jeffersonville DC', accountName: 'Kenco Logistics', url: 'https://dcvelocity.com/kenco', publishedAt: '2026-06-24T12:00:00.000Z' }, result: signalAngle });
    const draftThesis = vi.fn<typeof draftThesisFromFact>(async () => ({ ok: true, hypothesisId: 'h-1', status: 'review_required', existing: false, existingVia: null, family: 'hidden_capacity', familyBasis: 'derived', preparation: 'submitted', missing: [], submitRefusal: null }));
    const g = gmailSpy();
    const r = await promoteAngle(c, { taskId, actor: ACTOR, now: NOW, personaId: 1 }, { ...g.deps, draftThesis });
    expect(r).toMatchObject({ ok: true, lane: 'thesis', hypothesisId: 'h-1', preparation: 'submitted', existing: false, href: '/gap/preview/h-1', links: { contextRevision: 'rev-kenco-1' }, line: expect.stringMatching(/is now a proposal that is under review.*Nothing was sent\.$/) });
    expect(draftThesis).toHaveBeenCalledTimes(1);
    const arg = draftThesis.mock.calls[0][1];
    expect(arg).toMatchObject({ accountName: 'Kenco Logistics', factId: 's-fact', personaId: 1, persona: 'transportation', problemHypothesis: ANGLE.whyItMatters, falsificationQuestions: ANGLE.starters, whatANoMeans: null, actor: ACTOR });
    expect(String(arg.observation)).toMatch(/\(reported June 2026\): "Kenco Logistics opened a 400,000 square foot distribution center in Jeffersonville, Indiana" \[S:s-fact\]\.$/);
    expect(g.drafts).toEqual([]);
    expect((await loadPromotions(c, 'signal:s-fact'))[0]).toMatchObject({ lane: 'thesis', payload: { hypothesisId: 'h-1', factId: 's-fact' } });
    const bareId = await preparedTask(c, { itemKey: 'signal:s-bare', input: { decision: 'pursue', title: 'An unverified mention', accountName: 'Kenco Logistics' }, result: { ...signalAngle, key: 'signal:s-bare', peopleNamed: [] } });
    expect(await promoteAngle(c, { taskId: bareId, actor: ACTOR, now: NOW }, { ...g.deps, draftThesis })).toMatchObject({ ok: false, reason: 'no_verified_fact' });
    expect(draftThesis).toHaveBeenCalledTimes(1);
    expect(personaKeyOf({ persona_lane: 'site_ops', title: 'VP Transportation' })).toBe('site_ops');
    expect(personaKeyOf({ title: 'Chief Operating Officer' })).toBe('executive_ops');
    expect(personaKeyOf(null)).toBe('site_ops');
    expect(composeAngleReply({ starters: ['A?', 'B?'] }, { name: null, email: 'craig.morrison@kencogroup.com' }, null)).toBe('Hi Craig,\n\nThanks for your note.\n\nTwo questions before we talk again: A? B?');
  });
});
