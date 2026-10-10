// @vitest-environment node
/**
 * THE WALK FIX, part 3 (Casey, 2026-10-10: "yes, change the command. optimize!"): the START/NEXT walk and the
 * briefing. The adversarial audit of his October 10 morning: the walk handed him seven deal-hygiene items ("Confirm
 * the real date") before anything new, and the briefing never said that 0 of 14 items were new conversations.
 * Pinned here:
 *   - the walk order is replies to answer, commitments due, ready first touches, review items, then admin; deal hygiene
 *     is not walked (a due deal step is a commitment and is); the plan's numbering is unchanged
 *   - START and NEXT (nextAssignableItem) follow it; a held item stays held (never handed over), its title unchanged
 *   - the briefing's "Begin with" names the walk's first item with its number, says the walk order when it differs,
 *     keeps the hygiene in "Deals, in one line", and says the shortage plainly; no body line starts with a command word
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { ITEM_HELD_FOR_RESEARCH, ITEM_SUBJECT_TYPE, nextAssignableItem } from '@/lib/gap/work/assignment';
import { heldTitle, type DayPlan, type PlanItem } from '@/lib/gap/work/plan';
import { COMMAND_WORDS, renderBriefing } from '@/lib/gap/work/briefing';
import { isDealHygiene, newConversationLine, walkOrder, walkSkips } from '@/lib/gap/work/walk';

const NOW = new Date('2026-10-10T11:05:00Z');
const DAY = '2026-10-10';
const links = { start: 'https://x/start', work: 'https://x/gap/', item: (it: PlanItem) => `https://x/item/${it.rank}` };

const item = (rank: number, accountName: string, kind: PlanItem['kind'], over: Partial<PlanItem> = {}): PlanItem => ({
  key: `${kind}:${accountName}:${DAY}`,
  rank,
  accountName,
  kind,
  stateKind: kind === 'deal' || kind === 'commitment' || kind === 'meeting' ? 'in_deal' : kind === 'reply' ? 'replied' : kind === 'review' ? 'decide' : kind === 'admin' ? 'opted_out' : kind === 'follow_up' ? 'follow_up' : 'ready',
  title: kind === 'deal' ? 'In a deal' : kind === 'reply' ? 'Someone replied' : kind === 'review' ? 'Decide the angle' : kind === 'admin' ? 'Opted out' : kind === 'follow_up' ? 'Follow up due' : kind === 'commitment' ? 'Send the dock comparison' : kind === 'meeting' ? 'Prepare the meeting' : 'Ready for a first touch',
  why: kind === 'deal' ? 'The close date (Sep 30) has passed and the deal is still open. Confirm the real date.' : 'Due today.',
  href: `/gap/accounts/${accountName.toLowerCase()}`,
  person: null,
  refs: {},
  token: String(rank).padStart(32, 'a'),
  ...over,
});
const plan = (items: PlanItem[]): DayPlan => ({ day: DAY, plannedAt: '2026-10-10T11:00:00.000Z', fresh: true, counts: { needsYou: items.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 }, items });

/** A mixed day, numbered in Work's order: the hygiene deals sit early, the reply and the first touch late. */
function mixed(): PlanItem[] {
  return [
    item(0, 'Kroger', 'commitment', { refs: { commitmentId: 'c-1' }, key: 'commitment:c-1' }),
    item(1, 'Acme', 'deal'),
    item(2, 'Beta', 'deal'),
    item(3, 'Swire', 'deal', { title: 'Next step on the deal: Send the pilot scope' }),
    item(4, 'H-E-B', 'follow_up'),
    item(5, 'General Mills', 'review'),
    item(6, 'Walmart Inc.', 'admin'),
    item(7, 'PepsiCo', 'ready', { refs: { decisionId: 'dec-1' }, key: 'first_touch:dec-1' }),
    item(8, 'NFI Industries', 'reply', { refs: { replyMessageId: 'm-nfi' }, key: 'reply:m-nfi' }),
    item(9, 'Dole', 'deal', { title: 'Send the order form', refs: { commitmentId: 'c-2' }, key: 'commitment:c-2' }),
    item(10, 'Kenco', 'meeting', { refs: { meetingKey: 'meeting:7' }, key: 'meeting:meeting:7' }),
  ];
}

describe('the walk order', () => {
  it('replies, then what is due, then first touches, reviews and admin; deal hygiene left out; a due deal step walked with the commitments', () => {
    const items = mixed();
    expect(walkOrder(items).map((i) => i.accountName)).toEqual(['NFI Industries', 'Kroger', 'Swire', 'H-E-B', 'Dole', 'Kenco', 'PepsiCo', 'General Mills', 'Walmart Inc.']);
    expect(items.filter(walkSkips).map((i) => i.accountName)).toEqual(['Acme', 'Beta']);
    // The briefing's one-line shape is unchanged: the due deal step is in it as before, and still walked.
    expect(items.filter(isDealHygiene).map((i) => i.accountName)).toEqual(['Acme', 'Beta', 'Dole']);
    // The plan's own numbering is never touched.
    expect(items.map((i) => i.rank)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('START and NEXT hand the items in the walk order and never a hygiene deal; a held item stays held with its title unchanged', async () => {
    const db = ledgerDb({ accounts: [] }, NOW);
    const c = db.client();
    const items = mixed();
    // PepsiCo's prepared email names someone else: the plan's held title, held for the agent on an earlier walk.
    items[7] = { ...items[7], title: heldTitle('Shawn Lee', 'Karen Ortiz'), hold: { reason: 'recipient_mismatch', recipient: 'Shawn Lee' } };
    await c.gapAuditEvent.create({ data: { kind: 'work.command_applied', actor: 'cron', subject_type: ITEM_SUBJECT_TYPE, subject_id: items[7].key, payload: { effect: ITEM_HELD_FOR_RESEARCH, reason: 'recipient_mismatch', day: DAY } } });
    const p = plan(items);
    const handed: string[] = [];
    for (let k = 0; k < 20; k += 1) {
      const next = await nextAssignableItem(c, p);
      if (!next.item) {
        expect(next.held.map((h) => [h.item.accountName, h.item.title, h.recorded])).toEqual([['PepsiCo', 'Held: the prepared email names Shawn Lee, not Karen Ortiz', false]]);
        break;
      }
      handed.push(next.item.accountName);
      await c.gapAuditEvent.create({ data: { kind: 'work.assignment_sent', actor: 'test', subject_type: ITEM_SUBJECT_TYPE, subject_id: next.item.key, payload: { day: DAY, itemToken: next.item.token, revision: 0 } } });
    }
    expect(handed).toEqual(['NFI Industries', 'Kroger', 'Swire', 'H-E-B', 'Dole', 'Kenco', 'General Mills', 'Walmart Inc.']);
    expect(handed).not.toContain('Acme');
    expect(handed).not.toContain('Beta');
  });
});

/** The October 10 shape: 14 items, none a first touch or a buyer's reply; seven of them deal hygiene. */
function october10(): PlanItem[] {
  const hygiene = ['Acme', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta'].map((a, k) => item(k + 4, a, 'deal'));
  return [
    item(0, 'Kroger', 'commitment', { refs: { commitmentId: 'c-1' }, key: 'commitment:c-1' }),
    item(1, 'Kenco', 'meeting', { refs: { meetingKey: 'meeting:7' }, key: 'meeting:meeting:7' }),
    item(2, 'Swire', 'commitment', { refs: { commitmentId: 'c-3' }, key: 'commitment:c-3', title: 'Send the yard count' }),
    item(3, 'Dole', 'commitment', { refs: { commitmentId: 'c-4' }, key: 'commitment:c-4', title: 'Answer the pricing question' }),
    ...hygiene,
    item(11, 'Walmart Inc.', 'admin'),
    item(12, 'Boston Beer', 'admin', { stateKind: 'replied', title: 'An old reply to triage' }),
    item(13, 'Gusto', 'admin', { stateKind: 'replied', title: 'An old reply to triage' }),
  ];
}

describe('the briefing: the walk and the shortage, said plainly', () => {
  it('October 10: "0 of 14", the walk order with the seven deals not walked, the hygiene in one line, item 1 begins; no line starts with a command word', () => {
    const out = renderBriefing({ plan: plan(october10()), dayToken: 'tok', links, commandsEnabled: true, legacyDigest: false }, NOW);
    const lines = out.text.split('\n');
    expect(lines).toContain('New conversations today: 0 of 14 items are a first touch or a reply from a buyer; the rest is deal work and admin.');
    expect(lines).toContain('Walk order (START, then NEXT): the replies to answer first, then what is due, the ready first touches, the reviews and the admin; the 7 deals in one line are not walked.');
    expect(out.text).toContain('Begin with item 1, Kroger: Send the dock comparison. https://x/start');
    expect(out.text).toMatch(/Deals, in one line \(7\): Acme \(.*Confirm the real date\); Beta/);
    // The shortage comes with the plan's header, before the items.
    expect(out.text.indexOf('New conversations today')).toBeLessThan(out.text.indexOf('Begin with item'));
    expect(out.html).toContain('<b>New conversations today: 0 of 14 items are a first touch or a reply from a buyer; the rest is deal work and admin.</b>');
    const words = new RegExp(`^(${COMMAND_WORDS.join('|')})\\b`, 'i');
    for (const l of lines) expect(l).not.toMatch(words);
  });

  it('the pointer names the walk\'s first item with its number: a reply numbered 9 begins the day', () => {
    const out = renderBriefing({ plan: plan(mixed()), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, NOW);
    expect(out.text).toContain('Begin with item 9, NFI Industries: Someone replied. https://x/start');
    expect(out.text).toContain('the 2 deals in one line are not walked.');
  });

  it('a day in walk order already, mostly new conversations: no walk line, no shortage line, item 1 begins as before', () => {
    const items = [item(0, 'NFI Industries', 'reply', { key: 'reply:m-1' }), item(1, 'PepsiCo', 'ready', { key: 'first_touch:d-1' }), item(2, 'Kroger', 'commitment', { key: 'commitment:c-9' })];
    // The reply first, then the commitment due, then the first touch: walk order puts the commitment before the ready.
    const walked = renderBriefing({ plan: plan([items[0], { ...items[2], rank: 1 }, { ...items[1], rank: 2 }]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, NOW);
    expect(walked.text).not.toContain('Walk order');
    expect(walked.text).not.toContain('New conversations today');
    expect(walked.text).toContain('Begin with item 1, NFI Industries: Someone replied.');
  });

  it('newConversationLine: a first touch or a buyer\'s reply counts; fewer than half is a shortage, said with what the rest is', () => {
    expect(newConversationLine([])).toBeNull();
    expect(newConversationLine([item(0, 'A', 'ready'), item(1, 'B', 'deal')])).toBeNull();
    expect(newConversationLine([item(0, 'A', 'ready'), item(1, 'B', 'deal'), item(2, 'C', 'follow_up')])).toBe('New conversations today: 1 of 3 items are a first touch or a reply from a buyer; the rest is deal work and follow-ups.');
    expect(newConversationLine([item(0, 'A', 'review')])).toBe('New conversations today: 0 of 1 item is a first touch or a reply from a buyer; the rest is reviews.');
    // An old reply to triage is admin, not a new conversation; an opt-out is admin.
    expect(newConversationLine([item(0, 'A', 'admin', { stateKind: 'replied' }), item(1, 'B', 'admin')])).toBe('New conversations today: 0 of 2 items are a first touch or a reply from a buyer; the rest is admin.');
  });
});

describe('a held item is not what the briefing begins with', () => {
  it('walkBegins: the first walked item that is not held; walkSkips leaves a held item in the walk (START records the hold and walks past it)', async () => {
    const { walkSkips, walkOrder, walkBegins, isHeld } = await import('@/lib/gap/work/walk');
    const held = { kind: 'ready' as const, stateKind: 'ready' as const, title: 'Held: the prepared email names Shawn Miller, not Tom Kamantauskas', refs: {}, rank: 0, hold: { reason: 'recipient_mismatch' as const, recipient: 'Shawn Miller' } };
    const ready = { kind: 'ready' as const, stateKind: 'ready' as const, title: 'Ready for a first touch: Karen Ortiz', refs: {}, rank: 1 };
    expect(isHeld(held)).toBe(true);
    expect(isHeld({ ...held, hold: undefined })).toBe(true);
    expect(walkSkips(held)).toBe(false);
    expect(walkOrder([held, ready]).map((i) => i.title)[0]).toMatch(/^Held:/);
    expect(walkBegins([held, ready])?.title).toBe('Ready for a first touch: Karen Ortiz');
    expect(walkBegins([held])).toBeNull();
  });
});
