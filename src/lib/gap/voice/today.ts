/**
 * LISTEN TO TODAY (account-first UX, UX-11): a short brief for the ear over the Work list: how many accounts need
 * the seller, then the first few in order, each as state, why now, the next person and the next action, and a hold
 * where one applies. A spoken projection of the same cards, never the screen's DOM; nothing private (the cards carry
 * none), nothing machine. Pure; pinned by tests/unit/gap/voice-listen.test.ts.
 */
import { needsYouCard, type WorkCard } from '../work/list';
import { forTheEar, spokenPerson } from './for-the-ear';

export const TODAY_MAX_ACCOUNTS = 5;
export const TODAY_MAX_CHARS = 1800;

const STATE_SPOKEN: Record<WorkCard['stateKind'], string> = {
  replied: 'someone replied',
  opted_out: 'opted out, record it',
  bounced: 'an address failed',
  follow_up: 'a follow up is due',
  ready: 'ready for a first touch',
  decide: 'an angle to decide',
  research: 'research',
  in_deal: 'in a deal',
  unknown_deal: 'held, HubSpot could not be checked',
  held: 'held',
  committed: 'a commitment to the buyer is due',
  meeting: 'a meeting to prepare',
};

function whyForTheEar(c: WorkCard): string {
  // The card's why already reads as a sentence; drop a leading account name repeat and anything machine.
  const why = forTheEar(c.why).replace(new RegExp(`^${c.accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:,]?\\s*`, 'i'), '').replace(/\b(\d+) cards? missing evidence( or contact data)?\b/i, '$1 people missing evidence$2').replace(/\bFound and verified in the background\. Use or ignore\.?/i, 'Verified facts are waiting for your judgment');
  return why ? `${why.charAt(0).toUpperCase()}${why.slice(1).replace(/[.!?]+$/, '')}.` : '';
}

export function todayListenText(cards: readonly WorkCard[], opts: { max?: number; now?: Date } = {}): string {
  const max = opts.max ?? TODAY_MAX_ACCOUNTS;
  if (cards.length === 0) return 'Today. Nothing needs you right now. Replies, follow ups, ready accounts and new angles show up here.';
  // Batch item 8: research, holds and set-asides are parked, never "needs you"; the headline counts them apart.
  const needs = cards.filter(needsYouCard);
  const parkedCards = cards.filter((c) => !needsYouCard(c));
  const tally = (list: readonly WorkCard[]) => {
    const t = { committed: 0, meeting: 0, replied: 0, opted_out: 0, bounced: 0, follow_up: 0, ready: 0, decide: 0, research: 0, hold: 0, later: 0 };
    for (const c of list) {
      if (c.tier === 'later') t.later += 1;
      else if (c.stateKind === 'in_deal' || c.stateKind === 'unknown_deal' || c.stateKind === 'held') t.hold += 1;
      else t[c.stateKind] += 1;
    }
    return t;
  };
  const counts = tally(needs);
  const parked = tally(parkedCards);
  // Every kind is counted, so the headline adds up to the list.
  const headline = [
    counts.committed ? `${counts.committed} buyer ${counts.committed === 1 ? 'commitment' : 'commitments'} due` : null,
    counts.meeting ? `${counts.meeting} ${counts.meeting === 1 ? 'meeting' : 'meetings'} to prepare` : null,
    counts.replied ? `${counts.replied} ${counts.replied === 1 ? 'reply' : 'replies'} to read` : null,
    counts.opted_out ? `${counts.opted_out} opt-out${counts.opted_out === 1 ? '' : 's'} to record` : null,
    counts.bounced ? `${counts.bounced} failed address${counts.bounced === 1 ? '' : 'es'}` : null,
    counts.follow_up ? `${counts.follow_up} follow ${counts.follow_up === 1 ? 'up' : 'ups'} due` : null,
    counts.ready ? `${counts.ready} ready for a first touch` : null,
    counts.decide ? `${counts.decide} angle${counts.decide === 1 ? '' : 's'} to decide` : null,
  ].filter(Boolean);
  const parkedLine = [parked.research ? `${parked.research} in research` : null, parked.hold ? `${parked.hold} in a deal or held` : null, parked.later ? `${parked.later} set aside` : null].filter(Boolean).join(', ');
  const lead = needs.length ? `Today. ${needs.length} ${needs.length === 1 ? 'account needs' : 'accounts need'} you${headline.length ? `: ${headline.join(', ')}` : ''}` : 'Today. Nothing needs you right now';
  const more = needs.length ? `${parkedCards.length} more` : `${parkedCards.length}`;
  const parts: string[] = [`${lead}${parkedCards.length ? `; ${more} ${parkedCards.length === 1 ? 'is' : 'are'} parked: ${parkedLine}` : ''}.`];
  const spoken = cards.slice(0, max);
  spoken.forEach((c, i) => {
    const lead = i === 0 ? 'First' : i === spoken.length - 1 && spoken.length > 1 ? 'Then' : 'Next';
    // A canonical card speaks its own state line ("First touch in motion: Glen Chaffee"), never a folded kind.
    const stateSpoken = c.source === 'pursuit' ? forTheEar(c.state).replace(/[.!?]+$/, '').replace(/^\w/, (m) => m.toLowerCase()) : STATE_SPOKEN[c.stateKind];
    const bits = [`${lead}, ${c.accountName}: ${stateSpoken}.`, whyForTheEar(c)];
    const held = c.stateKind === 'in_deal' || c.stateKind === 'unknown_deal' || c.stateKind === 'held';
    if (c.person && !held && c.stateKind !== 'replied' && c.stateKind !== 'opted_out') bits.push(`Next person: ${spokenPerson(c.person.name, c.person.title, c.accountName)}.`);
    if (c.next) bits.push(`Next action: ${forTheEar(c.next.label).replace(/[.!?]+$/, '')}.`);
    if (c.blocker) bits.push(forTheEar(c.blocker));
    parts.push(bits.filter(Boolean).join(' '));
  });
  if (cards.length > spoken.length) parts.push(`${cards.length - spoken.length} more follow, in order.`);
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, TODAY_MAX_CHARS);
}
