// @vitest-environment node
/**
 * The adversarial morning audit of October 10 (the lead's slice): a START, NEXT or ITEM on a past day's briefing is
 * refused with today's pointer, never walked; a pointer into the account page ("The opening story, above.", "the
 * proposal below") is never a fact or a move in an email; "The move:" is said once; a held item's move is to choose the
 * person; "Nothing from the buyer yet" is never said over the buyer's own words; a HubSpot-logged out-of-office is not
 * "replied"; the vault's next action is cut at a word.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { buildAssignment } from '@/lib/gap/work/assignment';
import { isStaleBriefingDay, staleDayText } from '@/lib/gap/replies/commands-apply';
import { mergeTouches } from '@/lib/gap/story/touches';
import { knowledgeEvidence } from '@/lib/gap/work/list';
import { rankPeople } from '@/lib/gap/work/intel';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';
import type { AskContext } from '@/lib/gap/ask/grounding';
import type { RelationshipState } from '@/lib/gap/work/relationship-state';

const NOW = new Date('2026-10-10T13:00:00Z');
const item = (over: Partial<PlanItem> & { key: string; accountName: string; token: string }): PlanItem => ({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: null, refs: {}, rank: 0, ...over });
const plan = (items: PlanItem[]): DayPlan => ({ day: '2026-10-10', plannedAt: NOW.toISOString(), fresh: true, items, counts: { needsYou: items.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } });
const ask = (over: Partial<AskContext> & { accountName: string }): AskContext => ({ state: { state: 'ready', stateLine: 'Ready for a first touch.', blocker: null, next: 'Prepare the first touch.', coldTouchAllowed: true }, people: [], setAside: null, story: [], opening: null, otherStories: [], buyerSaid: [], ...over });
const reads = { inbox: { read: true, count: 3, detail: null }, sent: { read: false, count: 0, detail: 'no GAP sender configured' }, drafts: { read: false, count: 0, detail: 'no GAP sender configured' }, engagements: { read: true, count: 3, detail: null }, commitments: { read: true, count: 0 }, deals: { read: true, detail: null }, conversations: { read: true, count: 0 } };
const rel = (over: Partial<RelationshipState> & { person: RelationshipState['person'] }): RelationshipState => ({
  purpose: 'buyer_conversation', purposeWord: 'buyer', lastInbound: null, lastOutbound: null, laterResponse: null, answerOwed: { owed: false, basis: 'nothing of theirs asks for an answer', known: true }, quiet: { quiet: false, days: null, basis: 'no exchange on record either way' }, request: null, requestState: 'none', referral: null, correspondents: [], hubspotCompanyId: null, outboundRead: { read: true, basis: "HubSpot's logged emails were read" }, reads, meetings: [], nextMeetingAt: null, deals: [], promises: [], drafts: [], optOut: null, links: { thread: null, threadKind: null, hubspotContact: null, hubspotCompany: null }, searched: 'no address on record for this person: the inbox was not searched; the suppression list; read Oct 10, 2026, 9:00 AM New York', ...over,
});
const input = { revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW };

describe('a briefing of a past day', () => {
  it('isStaleBriefingDay and staleDayText: Friday on Saturday is stale with the pointer to Work; today is not', () => {
    expect(isStaleBriefingDay('2026-10-09', NOW)).toBe(true);
    expect(isStaleBriefingDay('2026-10-10', NOW)).toBe(false);
    expect(isStaleBriefingDay('2026-10-11', NOW)).toBe(false);
    expect(isStaleBriefingDay('not-a-day', NOW)).toBe(false);
    expect(staleDayText('2026-10-09', NOW, 'https://app.example/')).toBe("That briefing is from Oct 9; its plan is not today's (Oct 10). Reply START on today's briefing when it arrives, or open Work: https://app.example/gap/");
  });
});

describe('the packet', () => {
  const kdp = item({ key: 'review:KDP', accountName: 'Keurig Dr Pepper', token: 'k'.repeat(32), kind: 'review', stateKind: 'decide', title: 'Decide the angle', why: 'A proposal to review.', href: '/gap/accounts/keurig-dr-pepper', person: null });
  const ctx = ask({
    accountName: 'Keurig Dr Pepper',
    state: { state: 'decide', stateLine: 'A decision to review.', blocker: null, next: 'One proposal below is waiting for your review: approve it and the first touch is prepared, or set it aside.', coldTouchAllowed: false },
    story: [
      { label: 'What is changing', tag: 'Checked', lines: [{ text: 'The opening story, above.', tag: 'Checked', basis: 'reported by pepsico.com, Jun 8, 2026' }, { text: 'KDP closed its acquisition of JDE Peet\'s in April 2026.', tag: 'Checked', basis: 'reported by sec.gov, Jun 11, 2026' }] },
      { label: 'Stories that matter', tag: 'Unknown', lines: [{ text: 'Nothing from the buyer yet on how they run the yards today, what it costs them or why it happens.', tag: 'Unknown', basis: 'no buyer input on record' }] },
    ],
    buyerSaid: [{ text: 'We run three yards on paper logs.', who: 'Jamie Taylor', at: '2026-09-17T14:00:00.000Z' }],
  });
  const relationship = async () => rel({ person: { email: null, name: null }, meetings: [{ at: '2026-08-20T15:00:00.000Z', title: 'Intro', kind: 'meeting', outcome: null, source: 'HubSpot' }] });

  it('a pointer line is never a fact; the move loses its "below"; "The move:" is said once when the first option is the move; the no-buyer line yields to the count; a person-less searched line says so', async () => {
    const a = await buildAssignment(ledgerDb({}).client(), { plan: plan([kdp]), item: kdp, ...input }, { askContext: async () => ctx, pursued: async () => [], packet: { relationship, imported: async () => [], contact: { hubspotContact: null, hubspotContactByEmail: null } }, senderEmail: null });
    const t = a.text;
    expect(t).not.toContain('The opening story, above');
    expect(t).toContain("- KDP closed its acquisition of JDE Peet's in April 2026. (reported Jun 11, 2026; sec.gov)");
    expect(t).not.toMatch(/proposal below/);
    expect(t).toContain('- One proposal on the account page is waiting for your review: approve it and the first touch is prepared, or set it aside (internal work):');
    expect(t).not.toContain('The move: One proposal');
    expect(t).not.toContain('Nothing from the buyer yet');
    expect(t).toContain('Buyer input on record: 3 messages from them, 1 held meeting, 1 quoted line below.');
    expect(t).toContain('Jamie Taylor said: "We run three yards on paper logs." (Sep 17, 2026)');
    expect(t).toContain('- Searched: no person is named on the item, so the inbox was not searched by address;');
  });

  it('the move is said once for a reply item too; a held item\'s move is to choose the person', async () => {
    const phil = item({ key: 'reply:m1', accountName: 'The Boston Beer Company', token: 'b'.repeat(32), kind: 'admin', stateKind: 'replied', title: 'Someone replied', why: 'An old reply to triage.', href: '/gap/capture?account=x', person: { name: 'Savastano, Philip', title: null } });
    const r = await buildAssignment(ledgerDb({}).client(), { plan: plan([phil]), item: phil, ...input }, { askContext: async () => ask({ accountName: 'The Boston Beer Company', state: { state: 'replied', stateLine: 'Someone replied.', blocker: null, next: "Read Savastano, Philip's reply and record what they said.", coldTouchAllowed: false } }), pursued: async () => [], packet: { relationship: async () => rel({ person: { email: 'p@x.com', name: 'Savastano, Philip' }, lastInbound: { at: '2026-06-03T12:00:00.000Z', subject: 'FW', purpose: 'buyer_conversation', excerpt: 'Hi', threadId: null } }), imported: async () => [], contact: { hubspotContact: null, hubspotContactByEmail: null } }, senderEmail: null });
    const L = r.text.split('\n');
    expect(L.filter((l) => /Read Savastano, Philip's reply of Jun 3, 2026 and record what they said/.test(l))).toHaveLength(1);
    expect(r.text).not.toContain('The move:');
    const pepsi = item({ key: 'first_touch:dec-1', accountName: 'PepsiCo', token: 'a'.repeat(32), title: 'Ready for a first touch: Tom Kamantauskas', person: { name: 'Tom Kamantauskas', title: null }, refs: { decisionId: 'dec-1' } });
    const h = await buildAssignment(ledgerDb({}).client(), { plan: plan([pepsi]), item: pepsi, ...input }, { askContext: async () => ask({ accountName: 'PepsiCo', state: { state: 'ready', stateLine: 'Ready.', blocker: null, next: 'Prepare the first touch to Tom Kamantauskas.', coldTouchAllowed: true } }), pack: async () => ({ rendered: { queued: { subject: 'Doors', body: 'Shawn,' } }, contentHash: 'h', emailReady: true, hypothesis: null, persona: { email: 'shawn.miller@pepsico.com', name: 'Shawn Miller' } }), packet: { relationship: async () => rel({ person: { email: null, name: 'Tom Kamantauskas' } }), imported: async () => [], contact: { hubspotContact: null, hubspotContactByEmail: null } }, senderEmail: null });
    expect(h.hold?.reason).toBe('recipient_mismatch');
    expect(h.packet?.move).toBe('Choose the person on the account; the prepared email and this item name different people.');
    expect(h.text).not.toContain('Prepare the first touch to Tom');
  });
});

describe('a HubSpot-logged reply is classified', () => {
  it('an out-of-office is never "replied"; a human reply is', () => {
    const touches = mergeTouches({
      engagements: { items: [
        { kind: 'email', at: '2026-09-17T14:00:00.000Z', title: 'Automatic reply: intro', body: 'I am traveling today and will have limited access to email and phone. For urgent issues please reach out to my colleague.', id: 'e1', from: 'jamie.taylor@kdrp.com', to: 'casey@yardflow.ai', direction: 'incoming' },
        { kind: 'email', at: '2026-09-24T14:00:00.000Z', title: 'Re: intro', body: 'Hey Casey, good to hear from you.', id: 'e2', from: 'craig.morrison@kencogroup.com', to: 'casey@yardflow.ai', direction: 'incoming' },
      ], read: true, detail: null },
      people: [],
      history: [],
      firstTouches: [],
      clawd: null,
      now: NOW,
    } as unknown as Parameters<typeof mergeTouches>[0]);
    const replies = touches.filter((t) => t.kind === 'reply');
    const byKind = Object.fromEntries(replies.map((r) => [r.replyKind, (r.address ?? r.name ?? '').toLowerCase()]));
    expect(byKind.out_of_office).toContain('jamie');
    expect(byKind.human).toContain('craig');
    expect(replies.find((r) => r.replyKind === 'out_of_office')?.replyLabel).not.toBe('replied');
  });
});

describe('ranking evidence and the re-engage list', () => {
  it('a vault next action overdue by more than 30 days is not ranking evidence; one due last week is', () => {
    const k = (due: string) => ({ lastConversationAt: null, nextAction: 'One pilot Brian owns, configured per site so it carves cleanly between the two companies, with the number Roger takes to the board.', nextActionDue: due, noteUpdatedAt: null } as unknown as Parameters<typeof knowledgeEvidence>[0]);
    expect(knowledgeEvidence(k('2026-07-17'), NOW).nextAction).toBeNull();
    const recent = knowledgeEvidence(k('2026-10-03'), NOW).nextAction;
    expect(recent).toMatch(/^the vault's next action: One pilot Brian owns/);
    expect(recent).not.toMatch(/\bwit,/);
  });

  it('rankPeople drops a vendor pitch and a calendar response; a quiet buyer stays', () => {
    const old = new Date('2026-08-01T12:00:00Z');
    const rows = [
      { from_email: 'sales@leadgenpro.io', from_name: 'LeadGen Pro', subject: 'Fill your pipeline: lead generation with a limited-time offer', received_at: old, thread_account: null },
      { from_email: 'ops@acmefoods.com', from_name: 'Dana Ops', subject: 'Re: yard throughput at Reno', received_at: old, thread_account: 'Acme Foods' },
      { from_email: 'carl@acmefoods.com', from_name: 'Carl', subject: 'Accepted: Yard walk @ Tue Aug 4', received_at: old, thread_account: 'Acme Foods' },
    ];
    const out = rankPeople(rows, [], { now: NOW, decided: new Set(), unsubscribed: new Set(), coverage: undefined, identity: null, states: null, verdicts: null });
    const emails = out.map((i) => (i as unknown as { email?: string | null }).email ?? (i.title ?? '')).map(String);
    expect(emails.some((e) => e.includes('leadgenpro'))).toBe(false);
    expect(emails.some((e) => e.includes('Accepted') || e.includes('carl@'))).toBe(false);
    expect(out.length).toBe(1);
  });
});
