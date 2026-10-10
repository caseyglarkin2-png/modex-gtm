/**
 * UX-03 PURSUIT STATE (account-first UX, 2026-10-05): ONE read per account that every seller surface renders from
 * (the Work card, the NOW header, the People Stack, the action pack, the Ready filter). Pure over what GAP already
 * holds: the account motion (one cold email motion at a time), the newest audited human choice, the newest reply with
 * its class, the opportunity truth, the restriction, the first touches. Nothing is recomputed differently anywhere
 * else. The live cases this pins: Walmart (paused on a reply whose body is "stop": an opt-out, never "Buyer replied";
 * NOW said "Ready for a first touch"), FedEx (Casey chose Glen Chaffee; NOW ignored it and named a CFO on an
 * out-of-office), PepsiCo (two or more eligible, nobody chosen), Kroger (in a deal: no cold touch).
 */
import { describe, expect, it } from 'vitest';
import { approvalHoldFor, projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';

const NOW = new Date('2026-10-05T15:00:00Z');
const base = (over: Partial<PursuitInput> = {}): PursuitInput => ({
  accountName: 'Acme Foods',
  now: NOW,
  motionType: 'FACT_LED',
  opportunity: { status: 'CLEAR', detail: '', deals: [] },
  restriction: null,
  familyHold: null,
  motion: null,
  choice: null,
  activePersona: null,
  replies: [],
  lastOutbound: null,
  outstandingDraft: null,
  followUpDue: null,
  eligible: [{ key: 'gap:1', personaId: 1, name: 'Doug Estrada', title: 'Senior Director - Regional Transportation - Logistics' }],
  ...over,
});

describe('replies are classified before they rank', () => {
  it('an opt-out reply is OPTED OUT: the account is not "replied", the person is set aside, no cold touch to them, the line says it', () => {
    const s = projectPursuitState(base({ accountName: 'Walmart Inc.', replies: [{ from: 'timothy.cooper@walmart.com', name: null, at: '2026-10-05T13:58:00Z', subject: 'Re: Leaving this with you', snippet: 'stop', triaged: false }] }));
    expect(s.state).toBe('opted_out');
    expect(s.replyClass?.kind).toBe('opt_out');
    expect(s.stateLine).toMatch(/Opted out/);
    expect(s.stateLine).not.toMatch(/Ready for a first touch|replied/i);
    expect(s.blocker).toMatch(/record it as do not contact/i);
    expect(s.lastInbound).toMatchObject({ who: 'timothy.cooper@walmart.com', kind: 'opt_out' });
  });
  it('a human reply nobody has recorded pauses the account: REPLIED leads, the next person waits with the unlock named', () => {
    const s = projectPursuitState(base({ replies: [{ from: 'dana@acmefoods.com', name: 'Dana Trans', at: '2026-10-04T12:00:00Z', subject: 'Re: Yard question', snippet: 'Thanks Casey, we are looking at gate dwell at two DCs. Can you send more?', triaged: false }] }));
    expect(s.state).toBe('replied');
    expect(s.stateLine).toMatch(/Someone replied/);
    expect(s.person?.name).toBe('Dana Trans');
    expect(s.unlock).toMatch(/record what they said/i);
    expect(s.coldTouchAllowed).toBe(false);
  });
  it('an out-of-office is not a conversation: the state stays what the motion says, and the notice is named once', () => {
    const s = projectPursuitState(base({ accountName: 'FedEx', replies: [{ from: 'courtney.keen@fedex.com', name: 'Courtney Keen', at: '2026-06-02T12:00:00Z', subject: 'Re: One view', snippet: 'I am in the office but my responses will be delayed due to all day meetings Monday to Thursday.', triaged: false }] }));
    expect(s.state).not.toBe('replied');
    expect(s.replyClass?.kind).toBe('out_of_office');
    expect(s.lastInbound).toMatchObject({ kind: 'out_of_office' });
    expect(s.stateLine).not.toMatch(/replied/i);
  });
});

describe('holds dominate: deal, restriction, family hold, outstanding draft', () => {
  it('an open HubSpot deal is IN A DEAL: no cold touch, the deal is the frame', () => {
    const s = projectPursuitState(base({ motionType: 'IN_DEAL', opportunity: { status: 'OPEN', detail: 'YardFlow - Kroger', deals: [{ name: 'YardFlow - Kroger', stage: 'Appointment scheduled' }] } }));
    expect(s.state).toBe('in_deal');
    expect(s.coldTouchAllowed).toBe(false);
    expect(s.stateLine).toMatch(/In a deal/);
  });
  it('a warm-intro-only restriction is HELD with the route named', () => {
    const s = projectPursuitState(base({ motionType: 'INTRO_ONLY', restriction: { kind: 'warm_intro_only', introducer: 'Mark Shaughnessy', route: 'the Danone CSCO office' } }));
    expect(s.state).toBe('held');
    expect(s.blocker).toMatch(/Mark Shaughnessy/);
    expect(s.coldTouchAllowed).toBe(false);
  });
  it('an outstanding GAP draft holds the account until it is sent or discarded', () => {
    const s = projectPursuitState(base({ outstandingDraft: { recipient: 'michelle@acmefoods.com', name: 'Michelle Schlie', decisionId: 'd1' } }));
    expect(s.state).toBe('held');
    expect(s.blocker).toMatch(/draft to Michelle Schlie/);
  });
  it('unknown opportunity truth is a hold too: never a cold touch on a read that could not complete', () => {
    const s = projectPursuitState(base({ opportunity: { status: 'UNKNOWN', detail: 'HubSpot could not be read', deals: [] } }));
    expect(s.coldTouchAllowed).toBe(false);
    expect(s.blocker).toMatch(/HubSpot/);
  });
});

describe('the chosen person is the newest audited human choice, read everywhere', () => {
  it('the motion choice names the person; the stack and the header read the same name with who chose and when', () => {
    const s = projectPursuitState(base({ accountName: 'FedEx', choice: { personaId: 7, by: 'casey@yardflow.ai', at: '2026-10-05T20:41:00Z', source: 'owner_resolution' }, eligible: [{ key: 'gap:7', personaId: 7, name: 'Glen Chaffee', title: 'Managing Director - Transportation & Logistics' }, { key: 'gap:2187', personaId: 2187, name: 'Jeffrey Tallman', title: 'VP Operations Planning' }] }));
    expect(s.state).toBe('ready');
    expect(s.person).toMatchObject({ name: 'Glen Chaffee', key: 'gap:7', chosenBy: 'you, Oct 5' });
    expect(s.stateLine).toMatch(/Ready for a first touch/);
  });
  it('the active hypothesis person counts as the choice when no motion choice is newer', () => {
    const s = projectPursuitState(base({ activePersona: { personaId: 7, at: '2026-10-05T20:41:00Z', by: 'casey@yardflow.ai' }, eligible: [{ key: 'gap:7', personaId: 7, name: 'Glen Chaffee', title: 'MD' }, { key: 'gap:2', personaId: 2, name: 'Other', title: 'VP' }] }));
    expect(s.person?.name).toBe('Glen Chaffee');
  });
  it('two or more eligible and nobody chosen is CHOOSE PERSON: no person is named as if chosen', () => {
    const s = projectPursuitState(base({ accountName: 'PepsiCo', eligible: [{ key: 'hubspot:1', personaId: null, name: 'Karen Darling', title: 'Sr Director PBNA Transportation' }, { key: 'gap:2', personaId: 2, name: 'Matt Laneve', title: 'Logistics Sr Director' }] }));
    expect(s.state).toBe('choose_person');
    expect(s.person).toBeNull();
    expect(s.stateLine).toMatch(/Choose who/);
    expect(s.coldTouchAllowed).toBe(true);
  });
  it('exactly one eligible person is READY with that person, marked as GAP\'s only candidate, not a human choice', () => {
    const s = projectPursuitState(base());
    expect(s.state).toBe('ready');
    expect(s.person).toMatchObject({ name: 'Doug Estrada', chosenBy: null });
  });
  it('a chosen person who is no longer eligible is reported and the state falls back to choose', () => {
    const s = projectPursuitState(base({ choice: { personaId: 99, by: 'casey@yardflow.ai', at: '2026-10-01T00:00:00Z', source: 'motion' }, eligible: [{ key: 'gap:1', personaId: 1, name: 'A', title: 'VP Transportation' }, { key: 'gap:2', personaId: 2, name: 'B', title: 'Director Transportation' }] }));
    expect(s.state).toBe('choose_person');
    expect(s.chosenMissing).toMatch(/no longer/);
  });
});

describe('the motion in flight and research', () => {
  it('a live first touch inside the unlock window is IN MOTION with the unlock date', () => {
    const s = projectPursuitState(base({ motion: { state: 'in_motion', primary: { personaId: 1, name: 'Doug Estrada', title: null }, next: { personaId: 2, name: 'Kelly Kruse', title: null, unlock: 'after Fri, Oct 10 with no response (5 business days)' }, headline: 'In motion.' } }));
    expect(s.state).toBe('in_motion');
    expect(s.person?.name).toBe('Doug Estrada');
    expect(s.unlock).toMatch(/Oct 10/);
  });
  it('a due follow-up leads over a ready first touch', () => {
    const s = projectPursuitState(base({ followUpDue: { personaId: 1, name: 'Doug Estrada', dueAt: '2026-10-03T00:00:00Z', cardHref: '/gap?lane=follow_up&open=c1' } }));
    expect(s.state).toBe('follow_up_due');
    expect(s.person?.name).toBe('Doug Estrada');
  });
  it('nobody eligible is RESEARCH with the find-operator ask', () => {
    const s = projectPursuitState(base({ eligible: [] }));
    expect(s.state).toBe('research');
    expect(s.blocker).toMatch(/transportation/i);
  });
  it('a NO_GOOD_MOTION brief is research even with people on record', () => {
    const s = projectPursuitState(base({ motionType: 'NO_GOOD_MOTION' }));
    expect(s.state).toBe('research');
  });
});

describe('priority is fixed: reply > deal/hold > follow up > in motion > ready > choose > research', () => {
  it('a human reply outranks an open deal in the state line, and a deal outranks a ready person', () => {
    const r = projectPursuitState(base({ motionType: 'IN_DEAL', opportunity: { status: 'OPEN', detail: '', deals: [{ name: 'd', stage: 'Discovery' }] }, replies: [{ from: 'x@acmefoods.com', name: 'X', at: '2026-10-04T00:00:00Z', subject: null, snippet: 'Call me Tuesday.', triaged: false }] }));
    expect(r.state).toBe('replied');
    expect(r.coldTouchAllowed).toBe(false);
    const d = projectPursuitState(base({ motionType: 'IN_DEAL', opportunity: { status: 'OPEN', detail: '', deals: [{ name: 'd', stage: 'Discovery' }] }, followUpDue: { personaId: 1, name: 'Doug', dueAt: '2026-10-01T00:00:00Z', cardHref: '/x' } }));
    expect(d.state).toBe('in_deal');
  });
});

describe('review fixes (UX-03 fresh review)', () => {
  it('a newsletter subscriber or list member is never a relationship that leads the account; a conference, intro or referral is', async () => {
    const { isRealRelationship } = await import('@/lib/gap/pursuit/state');
    expect(isRealRelationship('newsletter', 'MMYQB LinkedIn subscribers · Sep 2026')).toBe(false);
    expect(isRealRelationship('list', 'Shippers among MMYQB subscribers')).toBe(false);
    expect(isRealRelationship('conference', 'Inland26 · Chicago')).toBe(true);
    expect(isRealRelationship('referral', 'Mark Shaughnessy')).toBe(true);
    expect(isRealRelationship('meeting', 'MODEX 2026')).toBe(true);
  });
  it('a lone eligible person is GAP\'s preselection, never "chosen by you"', () => {
    const s = projectPursuitState(base());
    expect(s.person).toMatchObject({ name: 'Doug Estrada', chosenBy: null });
  });
  it('the research line mirrors the brief: an approved angle that needs review, or a fact with no angle grounded yet', () => {
    expect(projectPursuitState(base({ motionType: 'NO_GOOD_MOTION', briefNext: 'Do not contact yet: the approved thesis needs review before it is used.' })).stateLine).toMatch(/angle needs your review/);
    expect(projectPursuitState(base({ motionType: 'NO_GOOD_MOTION', briefNext: 'Do not contact yet: a verified fact, but no thesis grounded in it yet (draft and review one first).' })).stateLine).toMatch(/no angle grounded on it yet/);
    expect(projectPursuitState(base({ motionType: 'NO_GOOD_MOTION' })).chooseAllowed).toBe(true);
  });
  it('an opt-out promises only what exists: the person is set aside when recorded; no 14-day cool-down is claimed', () => {
    const s = projectPursuitState(base({ replies: [{ from: 'tim@acme.com', name: null, at: '2026-10-05T13:58:00Z', subject: null, snippet: 'stop', triaged: false }] }));
    expect(`${s.blocker} ${s.unlock}`).not.toMatch(/14 days|cools/);
  });
});

describe('the cockpit motion\'s own holds are read, never recomputed away (trust review blocker)', () => {
  it('a paused_reply or in_conversation motion is REPLIED even when the reply list holds nothing untriaged', () => {
    const paused = projectPursuitState(base({ accountName: 'Walmart Inc.', choice: { personaId: 1, by: 'casey@yardflow.ai', at: '2026-10-05T14:00:00Z', source: 'motion' }, motion: { state: 'paused_reply', primary: null, next: { personaId: 1, name: 'Doug Estrada', title: null, unlock: 'after the reply is triaged' }, headline: 'Paused: timothy.cooper@walmart.com at Walmart Inc. wrote in on 2026-10-05. Triage it in Replies before anyone there gets a cold email.' } }));
    expect(paused.state).toBe('replied');
    expect(paused.coldTouchAllowed).toBe(false);
    expect(paused.chooseAllowed).toBe(false);
    expect(paused.person?.name).toBe('timothy.cooper@walmart.com');
    const conv = projectPursuitState(base({ motion: { state: 'in_conversation', primary: null, next: null, headline: 'In a conversation: dana@acmefoods.com answered (problem confirmed, 2026-10-04). No cold email to anyone else at Acme Foods; work it from that conversation.' } }));
    expect(conv.state).toBe('replied');
    expect(conv.person?.name).toBe('dana@acmefoods.com');
  });
  it('a needs_owner motion is CHOOSE PERSON unless a human already chose', () => {
    const s = projectPursuitState(base({ motion: { state: 'needs_owner', primary: null, next: null, headline: 'No ready card is for a direct transportation operator.' }, eligible: [{ key: 'gap:1', personaId: 1, name: 'A', title: 'VP Transportation' }, { key: 'gap:2', personaId: 2, name: 'B', title: 'Director Transportation' }] }));
    expect(s.state).toBe('choose_person');
    const chosen = projectPursuitState(base({ motion: { state: 'needs_owner', primary: null, next: null, headline: 'x' }, choice: { personaId: 1, by: 'casey@yardflow.ai', at: '2026-10-05T14:00:00Z', source: 'motion' } }));
    expect(chosen.state).toBe('ready');
  });
});

describe('approvalHoldFor: a proposal is approvable unless the account is under a real hold (2026-10-08, PepsiCo in production)', () => {
  it('research, ready and choose are not holds: the proposal under review is the next move, so approval is open', () => {
    const research = projectPursuitState(base({ motionType: 'NO_GOOD_MOTION', briefNext: 'No thesis grounded on the fact yet: draft and review one.' }));
    expect(research.state).toBe('research');
    expect(research.coldTouchAllowed).toBe(false);
    expect(approvalHoldFor(research)).toBeNull();
    expect(approvalHoldFor(projectPursuitState(base()))).toBeNull();
    expect(approvalHoldFor({ state: 'choose_person', blocker: null })).toBeNull();
    expect(approvalHoldFor({ state: 'research', blocker: 'The send gate could not be read just now.' })).toBeNull();
  });
  it("a reply, an opt-out, a deal and a held account are holds, named by the state's own blocker sentence", () => {
    const deal = projectPursuitState(base({ opportunity: { status: 'OPEN', detail: '', deals: [{ name: 'Acme pilot', stage: 'Qualified' }] } }));
    expect(approvalHoldFor(deal)).toBe(deal.blocker);
    expect(approvalHoldFor(deal)).toMatch(/open HubSpot deal/);
    const replied = projectPursuitState(base({ replies: [{ from: 'doug@acme.example', name: 'Doug Estrada', at: '2026-10-05T13:58:00Z', subject: 'Re: hi', snippet: 'Sure, let us talk next week.', triaged: false }] }));
    expect(approvalHoldFor(replied)).toBe(replied.blocker);
    const opted = projectPursuitState(base({ replies: [{ from: 'doug@acme.example', name: null, at: '2026-10-05T13:58:00Z', subject: 'Re: hi', snippet: 'stop', triaged: false }] }));
    expect(approvalHoldFor(opted)).toMatch(/do not contact/);
    const held = projectPursuitState(base({ restriction: { kind: 'warm_intro', introducer: 'Mark S', route: 'the CSCO office' } }));
    expect(held.state).toBe('held');
    expect(approvalHoldFor(held)).toMatch(/No cold touch/);
    expect(approvalHoldFor({ state: 'held', blocker: null })).toBe('A hold on the account stops approval for use.');
  });
});

describe('paused reply (Casey, 2026-10-10): the reply on record and the first touch the send gate pauses, said apart', () => {
  const WORDS = 'Thanks Casey, we are looking at gate dwell at two DCs. Can you send more?';
  const HOLD = { from: 'dana@acmefoods.com', receivedAt: '2026-10-04T12:00:00.000Z', snippet: WORDS, id: 'm-dana' };
  const pausedMotion = { state: 'paused_reply', primary: null, next: { personaId: 1, name: 'Doug Estrada', title: null, unlock: "after dana@acmefoods.com's reply is triaged in Replies" }, headline: 'Paused: dana@acmefoods.com at Acme Foods wrote in on 2026-10-04. Triage it in Replies before anyone there gets a cold email.', pausedBy: HOLD };
  const RECEIVED = `A reply from Dana Trans on Oct 4 is on record ("${WORDS}").`;
  const PAUSED = 'The proposed first touch to Doug Estrada is paused by the send gate: the reply is not recorded yet; nothing was sent.';

  it('the reply list holds it: the line and the blocker say the reply received (their words) and the paused first touch, two sentences; nothing sent; never "Someone replied" alone', () => {
    const s = projectPursuitState(base({ motion: pausedMotion, replies: [{ from: 'dana@acmefoods.com', name: 'Dana Trans', at: '2026-10-04T12:00:00Z', subject: 'Re: Yard question', snippet: WORDS, triaged: false, id: 'm-dana' }] }));
    expect(s.state).toBe('replied');
    expect(s.stateLine).toBe('Reply on record: Dana Trans, Oct 4. First touch to Doug Estrada paused, nothing sent');
    expect(s.blocker).toBe(`${RECEIVED} ${PAUSED}`);
    expect(s.paused).toEqual({ accountName: 'Acme Foods', reply: { name: 'Dana Trans', from: 'dana@acmefoods.com', at: '2026-10-04T12:00:00Z', words: WORDS, id: 'm-dana' }, proposed: { kind: 'first_touch', to: 'Doug Estrada' }, reason: 'reply_unrecorded' });
    expect(s.person?.name).toBe('Dana Trans');
    expect(s.coldTouchAllowed).toBe(false);
    expect(`${s.stateLine} ${s.blocker}`).not.toMatch(/Someone replied/);
  });

  it("the reply list does not hold it (the gate reads every domain at the account): the gate's own message keeps the buyer's words; the same two sentences", () => {
    const s = projectPursuitState(base({ motion: pausedMotion, replies: [] }));
    expect(s.state).toBe('replied');
    expect(s.paused?.reply).toEqual({ name: 'dana@acmefoods.com', from: 'dana@acmefoods.com', at: HOLD.receivedAt, words: WORDS, id: 'm-dana' });
    expect(s.blocker).toBe(`A reply from dana@acmefoods.com on Oct 4 is on record ("${WORDS}"). ${PAUSED}`);
    expect(s.stateLine).not.toMatch(/Someone replied/);
  });

  it('a motion read before its hold rode along says the writer and the day off its headline; with nobody lined up, the first touch to anyone else there is what is paused', () => {
    const s = projectPursuitState(base({ eligible: [], motion: { state: 'paused_reply', primary: null, next: null, headline: pausedMotion.headline } }));
    expect(s.paused).toMatchObject({ reply: { name: 'dana@acmefoods.com', words: null }, proposed: { kind: 'first_touch', to: null } });
    expect(s.blocker).toBe("A reply from dana@acmefoods.com on Oct 4 is on record (its words are not in GAP's synced inbox). The proposed first touch to anyone else at Acme Foods is paused by the send gate: the reply is not recorded yet; nothing was sent.");
    expect(s.stateLine).toBe('Reply on record: dana@acmefoods.com, Oct 4. First touch paused, nothing sent');
  });

  it('an unrecorded reply the gate does not hold on (no paused motion: older than its window) pauses nothing: said as the reply alone; an opt-out under the hold stays an opt-out', () => {
    const old = projectPursuitState(base({ replies: [{ from: 'emily@gusto.example', name: 'Emily Maja', at: '2026-08-19T12:00:00Z', subject: null, snippet: 'Happy to chat in Q4.', triaged: false }] }));
    expect(old.state).toBe('replied');
    expect(old.paused).toBeUndefined();
    expect(old.stateLine).toBe('Someone replied: Emily Maja, Aug 19');
    expect(old.blocker).not.toMatch(/send gate/);
    const stop = projectPursuitState(base({ motion: pausedMotion, replies: [{ from: 'dana@acmefoods.com', name: 'Dana Trans', at: '2026-10-04T12:00:00Z', subject: null, snippet: 'stop', triaged: false }] }));
    expect(stop.state).toBe('opted_out');
    expect(stop.paused).toBeUndefined();
  });
});
