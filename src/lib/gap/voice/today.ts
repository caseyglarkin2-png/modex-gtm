/**
 * LISTEN TO TODAY (account-first UX, UX-11): a short brief for the ear over the Work list: how many accounts need
 * the seller, then the first few in order, each as state, why now, the next person and the next action, and a hold
 * where one applies. A spoken projection of the same cards, never the screen's DOM; nothing private (the cards carry
 * none), nothing machine. Pure; pinned by tests/unit/gap/voice-listen.test.ts.
 */
import type { WorkCard } from '../work/list';
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
};

function whyForTheEar(c: WorkCard): string {
  // The card's why already reads as a sentence; drop a leading account name repeat and anything machine.
  const why = forTheEar(c.why).replace(new RegExp(`^${c.accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:,]?\\s*`, 'i'), '');
  return why ? `${why.charAt(0).toUpperCase()}${why.slice(1).replace(/[.!?]+$/, '')}.` : '';
}

export function todayListenText(cards: readonly WorkCard[], opts: { max?: number; now?: Date } = {}): string {
  const max = opts.max ?? TODAY_MAX_ACCOUNTS;
  if (cards.length === 0) return 'Today. Nothing needs you right now. Replies, follow ups, ready accounts and new angles show up here.';
  const counts = { replied: 0, follow_up: 0, ready: 0, hold: 0 };
  for (const c of cards) {
    if (c.stateKind === 'replied') counts.replied += 1;
    else if (c.stateKind === 'follow_up') counts.follow_up += 1;
    else if (c.stateKind === 'ready') counts.ready += 1;
    else if (c.stateKind === 'in_deal' || c.stateKind === 'unknown_deal' || c.stateKind === 'held') counts.hold += 1;
  }
  const headline = [
    counts.replied ? `${counts.replied} ${counts.replied === 1 ? 'reply' : 'replies'} to read` : null,
    counts.follow_up ? `${counts.follow_up} follow ${counts.follow_up === 1 ? 'up' : 'ups'} due` : null,
    counts.ready ? `${counts.ready} ready for a first touch` : null,
    counts.hold ? `${counts.hold} in a deal or held` : null,
  ].filter(Boolean);
  const parts: string[] = [`Today. ${cards.length} ${cards.length === 1 ? 'account needs' : 'accounts need'} you${headline.length ? `: ${headline.join(', ')}` : ''}.`];
  const spoken = cards.slice(0, max);
  spoken.forEach((c, i) => {
    const lead = i === 0 ? 'First' : i === spoken.length - 1 && spoken.length > 1 ? 'Then' : 'Next';
    const bits = [`${lead}, ${c.accountName}: ${STATE_SPOKEN[c.stateKind]}.`, whyForTheEar(c)];
    if (c.person && c.stateKind !== 'replied' && c.stateKind !== 'opted_out') bits.push(`Next person: ${spokenPerson(c.person.name, c.person.title)}.`);
    if (c.next) bits.push(`Next action: ${forTheEar(c.next.label).replace(/[.!?]+$/, '')}.`);
    if (c.blocker) bits.push(forTheEar(c.blocker));
    parts.push(bits.filter(Boolean).join(' '));
  });
  if (cards.length > spoken.length) parts.push(`${cards.length - spoken.length} more wait below, in order.`);
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, TODAY_MAX_CHARS);
}
