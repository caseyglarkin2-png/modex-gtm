/**
 * WHICH EVIDENCE APPROACH A CHECKED FACT MAY OPEN (batch item 4 and item 6, 2026-10-07). Pure, client-safe.
 *
 * One answer for the account page (what DRAFT A THESIS offers) and the draft service (what it drafts), so the page
 * never offers a draft the service refuses and the service never drafts one approach in another's words:
 *
 *   job_procurement_led   a job posting or a procurement notice the account issued (its own claim class)
 *   event_led             a physical-network change (research/facts.ts: never a software deployment or a partner
 *                         announcement, which are claims of their own type)
 *   fit_led               an ONGOING state the account states (a multi-year partnership, a program in operation, a
 *                         network it runs): a transparent fit question, no invented why-now (the Gatik agreement)
 *   null                  nothing GAP may open on: a one-time software deployment, a leadership change, a finance
 *                         line. The page says so instead of offering a draft (an honest no-action).
 */
import { isPhysicalOpsFact } from '../research/facts';
import { classifyContinuity } from '../research/continuity';
import { classifyClaim } from '../research/claim-types';
import type { EvidenceApproach } from '../research/approach-policy';

export interface DraftApproachInput {
  text: string;
  /** The stored claim class (JOB_POSTING, PROCUREMENT, FACT, PARTNERSHIP, ...), when there is one. */
  claimClass?: string | null;
  /** The recorded continuity, when there is one; else read from the words. */
  continuity?: 'event' | 'ongoing_state' | 'ended' | null;
}

export function draftApproachFor(f: DraftApproachInput): EvidenceApproach | null {
  if (f.claimClass === 'JOB_POSTING' || f.claimClass === 'PROCUREMENT') return 'job_procurement_led';
  const continuity = f.continuity ?? classifyContinuity(f.text);
  if (continuity === 'ended') return null;
  const stored = f.claimClass && f.claimClass !== 'FACT' ? f.claimClass : null;
  if (!stored && isPhysicalOpsFact(f.text)) return 'event_led';
  return continuity === 'ongoing_state' ? 'fit_led' : null;
}

/** Why a checked fact opens nothing, in seller words (the page says it instead of offering a draft). */
export function noOpeningLine(text: string): string {
  const t = classifyClaim(text).type;
  const what = t === 'technology' ? 'a technology deployment' : t === 'partnership' ? 'a partnership announcement' : t === 'leadership' ? 'a leadership change' : t === 'financial' ? 'a financial line' : 'a one-time statement that is not a physical change';
  return `Checked, but ${what} is not an opening for a first touch: context only.`;
}
