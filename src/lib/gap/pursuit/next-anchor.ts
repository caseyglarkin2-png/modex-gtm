/**
 * NEXT, REFINED BY THE OUTREACH ANCHOR (R63-A S8, 2026-10-07). Pure.
 *
 * Fedex's Work card said "Prepare the email to Glen" and, with no seller action, "Put the story in use" later: the
 * account page refined NEXT with the outreach anchor (an approved story not yet in use is put in use on the page; a
 * cold touch off the person's remit says so; a proposal waits for review; a checked fact can become a thesis), while
 * the Work warmer and Ask read NEXT without it. One function now says it for all three, so the card keeps the page's
 * move until the seller acts.
 */
import type { NextAction } from './next';
import type { PursuitState } from './state';
import type { OutreachAnchor } from '../story/anchor';
import { remitCaution } from '../story/anchor-text';

export function refineNextWithAnchor(next: NextAction, x: { state: PursuitState; anchor: OutreachAnchor | null }): NextAction {
  const out: NextAction = { ...next, control: next.control ? { ...next.control } : null };
  const { state, anchor } = x;
  if (!anchor) return out;
  // The remit caution travels to NEXT: a cold first touch never asks the buyer who owns it.
  if (anchor.primary && anchor.primary.relevance.tier === 'none' && state.person) {
    const first = state.person.name.split(' ')[0];
    out.text = `${out.text} ${remitCaution(first, anchor.primary.factLabel, anchor.fitsBetter)}${anchor.fitsBetter ? ` Use a different story below, or make ${anchor.fitsBetter.name.split(' ')[0]} first.` : ' Use a different story below.'}`;
  }
  // R12: a READY account whose story is approved but not yet in use: the move is on the page (put it in use).
  if (state.state === 'ready' && state.person?.personaId != null && anchor.primary && anchor.primary.status === 'approved') {
    const first = state.person.name.split(' ')[0];
    out.text = `The story for ${first} is approved but not yet in use: put it in use below and the email is prepared on it.`;
    out.control = { href: '#outreach-anchor', label: 'Put the story in use' };
  }
  if (state.state === 'research' && anchor.pending.length > 0) {
    // R12: a proposal in progress is reviewed where the action lives, never in a lane.
    const incomplete = anchor.pending.filter((p) => !p.familyKnown).length;
    out.text = incomplete
      ? `${incomplete === 1 ? 'One proposal' : `${incomplete} proposals`} below ${incomplete === 1 ? 'needs' : 'need'} one answer: which problem the fact points at. Set it and the thesis goes to review; approve it and the first touch is prepared.`
      : `${anchor.pending.length === 1 ? 'One proposal' : `${anchor.pending.length} proposals`} below ${anchor.pending.length === 1 ? 'is' : 'are'} waiting for your review: approve it and the first touch is prepared, or set it aside.`;
    out.control = { href: '#outreach-anchor', label: incomplete ? 'Complete the proposal' : 'Review the proposal' };
  } else if (state.state === 'research' && anchor.draftable.length > 0) {
    out.text = `${anchor.draftable.length === 1 ? 'One checked fact' : `${anchor.draftable.length} checked facts`} can become a thesis: draft it from the opening story below; review grounds it, then the first touch is prepared.`;
    out.control = { href: '#outreach-anchor', label: 'Draft a thesis from the checked fact' };
  }
  return out;
}
