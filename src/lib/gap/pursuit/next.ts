/**
 * NEXT from the pursuit state (account-first UX, UX-03): one sentence and one control per state, so NOW's NEXT and
 * the chosen person agree by construction (the live defect: PepsiCo's NEXT named Karen while "Review the thesis"
 * opened a draft to Shawn). Pure; pinned by tests/unit/gap/pursuit-next.test.ts.
 */
import type { PursuitState } from './state';

export interface NextAction {
  text: string;
  control: { href: string; label: string } | null;
  source: 'pursuit';
}

const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const first = (name: string) => name.split(' ')[0];

export function nextFromPursuit(
  s: PursuitState,
  opts: { hypothesisId: string | null; accountSlugHref: (view: 'brief' | 'sources') => string; replyThreadHref: string | null; captureHref: string },
): NextAction {
  const p = s.person;
  switch (s.state) {
    case 'replied':
      return {
        text: `Read ${p ? `${p.name}'s` : 'the'} reply of ${s.lastInbound ? day(s.lastInbound.at) : 'today'} and record what they said. Nobody at ${s.accountName} gets a cold email until then.`,
        control: opts.replyThreadHref ? { href: opts.replyThreadHref, label: `Open ${p ? `${p.name}'s` : 'the'} thread in Gmail` } : { href: '/gap?lane=replies', label: 'Open the reply' },
        source: 'pursuit',
      };
    case 'opted_out':
      return { text: `Record ${s.lastInbound ? `${s.lastInbound.who}'s` : 'the'} opt-out as do not contact. No reply goes back; the account cools before anyone else is touched.`, control: { href: '/gap?lane=replies', label: 'Record the opt-out' }, source: 'pursuit' };
    case 'in_deal':
      return { text: `Work the deal${s.deals[0]?.name ? ` (${s.deals[0].name})` : ''}, never a cold first touch. The deal brief says what to learn next.`, control: { href: opts.accountSlugHref('brief'), label: 'Open the deal brief' }, source: 'pursuit' };
    case 'held':
      return { text: s.blocker ?? 'Held.', control: s.stateLine.includes('warm intro') ? { href: opts.captureHref, label: 'Log the intro ask' } : null, source: 'pursuit' };
    case 'follow_up_due':
      return { text: `Send the next touch to ${p?.name ?? 'them'} (due ${s.followUp ? day(s.followUp.dueAt) : 'now'}).`, control: s.followUp ? { href: s.followUp.cardHref, label: 'Open the follow-up card' } : null, source: 'pursuit' };
    case 'in_motion':
      return { text: `${p?.name ?? 'The first person'} has the first touch. ${s.unlock ?? ''}`.trim(), control: p?.personaId ? { href: `/gap/call/${p.personaId}`, label: `Call prep for ${first(p.name)}` } : null, source: 'pursuit' };
    case 'ready':
      if (!p) return { text: 'Ready for a first touch.', control: null, source: 'pursuit' };
      if (p.personaId === null) return { text: `Add ${p.name}${p.title ? ` (${p.title})` : ''} to GAP, then prepare the first touch to them.`, control: null, source: 'pursuit' };
      if (!opts.hypothesisId) return { text: `Prepare the first touch to ${p.name}: no grounded angle yet, so review the angle first.`, control: { href: `${opts.accountSlugHref('sources')}#brief-hypotheses`, label: 'Review the angle' }, source: 'pursuit' };
      return { text: `Prepare the first touch to ${p.name}${p.title ? `, ${p.title}` : ''} (every gate runs when you send).`, control: { href: `/gap/preview/${opts.hypothesisId}?personaId=${p.personaId}`, label: `Prepare the email to ${first(p.name)}` }, source: 'pursuit' };
    case 'choose_person':
      return { text: `Choose who hears this first. GAP ranks the people below and says why; it does not pick.`, control: { href: '#people-stack-heading', label: 'See the people' }, source: 'pursuit' };
    case 'research':
      return { text: s.blocker ?? 'Find the operator.', control: { href: `${opts.accountSlugHref('sources')}#research-plan`, label: 'Open the research plan' }, source: 'pursuit' };
    default:
      return { text: 'Nothing needs you here right now.', control: null, source: 'pursuit' };
  }
}
