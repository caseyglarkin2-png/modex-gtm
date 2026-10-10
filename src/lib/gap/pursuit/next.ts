/**
 * NEXT from the pursuit state (account-first UX, UX-03): one sentence and one control per state, so NOW's NEXT and
 * the chosen person agree by construction (the live defect: PepsiCo's NEXT named Karen while "Review the thesis"
 * opened a draft to Shawn). Pure; pinned by tests/unit/gap/pursuit-next.test.ts.
 */
import type { PursuitState } from './state';
import { hubspotCompanySearchUrl } from '../routing/seller-action';

export interface NextAction {
  text: string;
  control: { href: string; label: string } | null;
  source: 'pursuit';
}

const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const first = (name: string) => name.split(' ')[0];

/**
 * What Listen reads when the page carries a pursuit state: the same state line, NEXT and person the page shows (the
 * trust review: Listen must never speak "Ready for a first touch" over a page that says "Opted out"). Never the
 * private line; the rest of NOW follows as before.
 */
export function pursuitListenText(v: { name: string; listen: string; stateLine: string; unit: string | null }, s: PursuitState, nextText: string): string {
  const head = `${v.name}. ${[...v.stateLine.split(' · ').slice(0, 2), s.stateLine].join('. ')}.`;
  const inbound = s.lastInbound ? ` ${s.lastInbound.label}: ${s.lastInbound.who}.` : '';
  // The person is spoken only when they are the next move (a first touch, a follow-up, the motion in flight, the
  // person who replied); under an opt-out, a deal or a hold nobody is named as if they were next.
  const speakWho = s.coldTouchAllowed || s.state === 'replied' || s.state === 'follow_up_due' || s.state === 'in_motion';
  const who = speakWho && s.person ? ` Who: ${s.person.name}${s.person.title ? `, ${s.person.title}` : ''}${s.person.chosenBy ? `, chosen by ${s.person.chosenBy}` : ''}.` : s.state === 'choose_person' ? ' Who: choose one of the people on the page; GAP does not pick.' : '';
  // Drop the old opening (name, state line, unit, NEXT, WHO) from the previous listen text; keep the rest (why now, our read, ask).
  const rest = v.listen.replace(/^[\s\S]*?(?=Why now:|Current state|Our read:|Impact|Ask:|Relationship:|$)/, '').trim();
  return `${head}${inbound} Next: ${nextText}${who}${rest ? ` ${rest}` : ''}`.replace(/\s+/g, ' ').trim();
}

export function nextFromPursuit(
  s: PursuitState,
  opts: { hypothesisId: string | null; accountSlugHref: (view: 'now' | 'brief' | 'sources') => string; replyThreadHref: string | null; captureHref: string; /** R12: the cockpit card where SEND FROM YARDFLOW lives (the pursuit view's ready target), so NEXT lands where the email is sent, never a page that points at a lane. */ readyHref?: string | null; /** R60: Capture opened on the waiting reply (its words and what it means, recorded once). */ replyCaptureHref?: string | null },
): NextAction {
  const p = s.person;
  switch (s.state) {
    case 'replied':
      return {
        // The seller judges the activity: no blanket "nobody gets a cold email" is imposed here (Casey, 2026-10-10).
        // Paused reply (2026-10-10): the reply the send gate holds on is the one to read, with its own date.
        text: `Read ${p ? `${p.name}'s` : 'the'} reply of ${s.paused?.reply.at ? day(s.paused.reply.at) : s.lastInbound ? day(s.lastInbound.at) : 'today'} and record what they said.`,
        // R60: the reply is read and recorded on this account (its own waiting replies, in place); Gmail answers it.
        control: opts.replyCaptureHref ? { href: opts.replyCaptureHref, label: 'Log what they said' } : { href: `${opts.accountSlugHref('now')}#record-reply`, label: 'Open the reply' },
        source: 'pursuit',
      };
    case 'opted_out':
      return { text: `Record ${s.lastInbound ? `${s.lastInbound.who}'s` : 'the'} opt-out as do not contact. No reply goes back.`, control: { href: opts.replyCaptureHref ?? `${opts.accountSlugHref('now')}#record-reply`, label: 'Record the opt-out' }, source: 'pursuit' };
    case 'in_deal':
      // R50: two opportunities are two pieces of work, each worked on its own in the deal brief.
      return s.deals.length > 1
        ? { text: `Work the ${s.deals.length} open deals (${s.deals.map((d) => d.name ?? 'an unnamed deal').join('; ')}) each on its own, never a cold first touch. The deal brief holds each deal's obligations and what to learn next.`, control: { href: opts.accountSlugHref('brief'), label: 'Open the deal brief' }, source: 'pursuit' }
        : { text: `Work the deal${s.deals[0]?.name ? ` (${s.deals[0].name})` : ''}, never a cold first touch. The deal brief says what to learn next.`, control: { href: opts.accountSlugHref('brief'), label: 'Open the deal brief' }, source: 'pursuit' };
    case 'held':
      // R63-A S13: an account with no HubSpot company linked (or two) offers the link, where the seller makes it.
      return { text: s.blocker ?? 'Held.', control: s.stateLine.includes('warm intro') ? { href: opts.captureHref, label: 'Log the intro ask' } : /no HubSpot company linked|more than one HubSpot company/.test(s.stateLine) ? { href: hubspotCompanySearchUrl(s.accountName), label: 'Link it in HubSpot' } : null, source: 'pursuit' };
    case 'follow_up_due':
      return { text: `Send the next touch to ${p?.name ?? 'them'} (due ${s.followUp ? day(s.followUp.dueAt) : 'now'}).`, control: s.followUp ? { href: s.followUp.cardHref, label: 'Prepare the follow-up' } : null, source: 'pursuit' };
    case 'in_motion':
      return { text: `${p?.name ?? 'The first person'} has the first touch. ${s.unlock ?? ''}`.trim(), control: p?.personaId ? { href: `/gap/call/${p.personaId}`, label: `Call prep for ${first(p.name)}` } : null, source: 'pursuit' };
    case 'ready':
      if (!p) return { text: 'Ready for a first touch.', control: null, source: 'pursuit' };
      if (/^Relationship-led/.test(s.stateLine)) return { text: `Log the warm touch with ${p.name}; a cold email to anyone else waits for their answer.`, control: { href: opts.captureHref, label: 'Log the warm touch' }, source: 'pursuit' };
      if (p.personaId === null) return { text: `Add ${p.name}${p.title ? ` (${p.title})` : ''} to GAP, then prepare the first touch to them.`, control: { href: '#people-stack-heading', label: `Add ${first(p.name)} from the people below` }, source: 'pursuit' };
      if (!opts.hypothesisId) return { text: `Prepare the first touch to ${p.name}: no grounded angle yet, so review the angle first.`, control: { href: `${opts.accountSlugHref('sources')}#brief-hypotheses`, label: 'Review the angle' }, source: 'pursuit' };
      // The title lives on the person's row directly below; NEXT says the name once (UX-04 review: Glen named four times).
      return { text: `Prepare the first touch to ${p.name}.`, control: { href: opts.readyHref ?? `/gap/preview/${opts.hypothesisId}?personaId=${p.personaId}`, label: `Prepare the email to ${first(p.name)}` }, source: 'pursuit' };
    case 'choose_person':
      return { text: `Choose who hears this first. GAP ranks the people below and says why; it does not pick.`, control: { href: '#people-stack-heading', label: 'See the people' }, source: 'pursuit' };
    case 'research':
      return { text: s.blocker ?? 'Find the operator.', control: { href: `${opts.accountSlugHref('sources')}#research-plan`, label: 'Open the research plan' }, source: 'pursuit' };
    default:
      return { text: 'Nothing needs you here right now.', control: null, source: 'pursuit' };
  }
}
