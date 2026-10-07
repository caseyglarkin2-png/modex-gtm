/**
 * The DRAFT A THESIS defaults (R35, 2026-10-06): the one place the opening story's draft text and the persona key
 * live, so the account page's control (components/gap/outreach-anchor.tsx) and an Ask GAP proposal
 * (lib/gap/ask/proposal.ts) post the SAME payload to the same route (POST /api/gap/story/draft, the one draft
 * service). A seller edits the guess before it goes to review; nothing here is copy (the email is the compiler's).
 *
 * A job or procurement claim gets text of its own approach: the posting says what a role covers, never that they
 * lack a system, are understaffed or have a budget (research/approach-policy.ts).
 *
 * R31 (batch item 4, audit at 31f09c71): the event-led guess was ONE sentence posted at every account ("this change
 * moves load onto the gates, yards and docks they run"), the Tulsa closure and the Gatik agreement alike. The guess,
 * the falsification and what a no means are now derived from the FACT: its change class (a closure moves volume onto
 * the sites that remain; an opening inherits habits; an expansion adds trailers to the same gates), the site it names,
 * and, for a fit-led fact (an ongoing partnership or program), a complementary-workflow question with no why-now. The
 * falsification is editable on the draft form like the guess. Pure; no em dashes.
 */
import { classifyFact } from '../research/facts';
import { classifyClaim } from '../research/claim-types';
import type { EvidenceApproach } from '../research/approach-policy';

export interface DraftDefaults {
  problem: string;
  falsification: string;
  noMeans: string;
}

/** A physical-network change whose change class GAP cannot read (the general case of the event-led path). */
export const EVENT_DRAFT_DEFAULTS: DraftDefaults = {
  problem: 'My guess is that this change moves load onto the gates, yards and docks they run, and that is where site capacity is won or lost.',
  falsification: 'How do trailers get checked in and found at the sites this change touches today?',
  noMeans: 'If trailers do not wait longer at those sites since the change, it moved no load onto the yard: this thesis is closed for them.',
};

/** A job posting or a procurement notice the account issued (the job / procurement-led path). */
export const POSTING_DRAFT_DEFAULTS: DraftDefaults = {
  problem: 'My guess is that the yards are part of what this posting is about and may be where the day gets lost at that site; the posting alone does not say so.',
  falsification: 'Is the posting still open, and do trailers wait at that site today?',
  noMeans: 'If the posting is filled or is not about the yards, there is no yard question here: this thesis is closed for them.',
};

/** The draft text for a fact of this claim class (JOB_POSTING and PROCUREMENT read as postings). */
export function draftDefaultsFor(claimClass: string | null | undefined): DraftDefaults {
  return claimClass === 'JOB_POSTING' || claimClass === 'PROCUREMENT' ? POSTING_DRAFT_DEFAULTS : EVENT_DRAFT_DEFAULTS;
}

const FACILITY_WORD = String.raw`(?:production facility|distribution cent(?:er|re)|fulfil?lment cent(?:er|re)|cross-dock|manufacturing plant|bottling plant|plant|warehouse|facility|DC|terminal|hub|yard)`;
const AT_SITE = new RegExp(String.raw`\b(?:at|in) (?:its |the |a |their |our )?((?:[A-Z][\w.'’-]*,?\s){1,4}${FACILITY_WORD})`);
const ITS_SITE = new RegExp(String.raw`\b(?:its|their|our) ((?:[A-Z][\w.'’-]*,?\s){1,4}${FACILITY_WORD})`);
const FAC_IN = new RegExp(String.raw`\b(${FACILITY_WORD})s? (?:in|near|outside) ((?:[A-Z][\w.'’-]*,?\s?){1,3})`);

/** The site a fact names, in seller words ("the Tulsa, Oklahoma, production facility"), else null. */
export function siteOf(text: string): string | null {
  const at = AT_SITE.exec(text);
  if (at) return `the ${at[1].trim()}`;
  const its = ITS_SITE.exec(text);
  if (its) return `the ${its[1].trim()}`;
  const fin = FAC_IN.exec(text);
  if (fin) return `the ${fin[1]} in ${fin[2].trim().replace(/[,.]+$/, '')}`;
  return null;
}

const CLOSURE = /\b(ceas(?:e|ed|es|ing)|shut(?:s|ting)? down|shutdown|clos(?:e|ed|es|ing|ure)|exit(?:ed|ing|s)?|wind(?:s|ing)? down|idl(?:e|ed|ing)|consolidat\w*)\b/i;

/** R31: the event-led guess, falsification and no-means read off the fact's change class and the site it names. */
function eventDefaultsFor(text: string): DraftDefaults {
  const site = siteOf(text);
  const change = CLOSURE.test(text) ? 'closure' : classifyFact(text).change;
  const s = site ?? 'the sites this change touches';
  switch (change) {
    case 'closure':
      return {
        problem: `My guess is that closing ${s} moves its volume onto the sites that remain, and their gates and yards are where that load shows up first.`,
        falsification: `Have trailers started waiting longer at the sites that took on the volume from ${s}?`,
        noMeans: 'If the sites that took on that volume do not hold trailers longer, the closure moved no load onto their yards: this thesis is closed for them.',
      };
    case 'opening':
      return {
        problem: `My guess is that ${s} opens on gate, yard and dock habits it inherits, and its first months are where that capacity is won or lost.`,
        falsification: `How will trailers be checked in and found at ${s} when it opens?`,
        noMeans: `If ${s} opens with its yard process already settled, the opening adds no yard question: this thesis is closed for them.`,
      };
    case 'expansion':
      return {
        problem: `My guess is that the expansion at ${s} adds trailers to the same gates and yards, and that is where the added capacity is won or lost.`,
        falsification: `Do the gates and yards at ${s} grow with the expansion, or does more volume go through the same ones?`,
        noMeans: 'If the gates and yards grew with it, the expansion moved no load onto the yard: this thesis is closed for them.',
      };
    case 'relocation':
      return {
        problem: `My guess is that moving to ${s} resets how trailers are checked in and found, and the first weeks there decide it.`,
        falsification: `How are trailers checked in and found at ${s} today?`,
        noMeans: 'If the move kept the yard process as it was, there is no yard question in it: this thesis is closed for them.',
      };
    case 'automation':
      return {
        problem: `My guess is that the automation at ${s} needs trailers at the right door on time, and the yard decides whether they are.`,
        falsification: `When the automated lines at ${s} wait for a trailer, where is the time lost: at the gate, finding it, or at the door?`,
        noMeans: 'If the automation never waits on a trailer, the yard is not its constraint: this thesis is closed for them.',
      };
    case 'acquisition':
      return {
        problem: 'My guess is that the acquired sites run their yards their own way, and unifying them is where the network gains or loses capacity.',
        falsification: 'Do the acquired sites check in and track trailers the same way the rest of the network does?',
        noMeans: 'If the acquired sites already run the same yard process, there is nothing to unify: this thesis is closed for them.',
      };
    default:
      return EVENT_DRAFT_DEFAULTS;
  }
}

/** R31: a fit-led fact (an ongoing partnership or program): a complementary-workflow question, no why-now, no diagnosis. */
function fitDefaultsFor(text: string): DraftDefaults {
  // The partner the account names ("with Gatik", or "PepsiCo and Gatik announced").
  const who = classifyClaim(text).attributes.counterparty ?? /\band ([A-Z][\w&.'-]+(?: [A-Z][\w&.'-]+){0,2}) (?:announced|signed|agreed|entered|launched)\b/.exec(text)?.[1] ?? null;
  const what = who ? `the ${who} program` : 'a program like this one';
  return {
    problem: `My guess is that ${what} sends trailers to the yards on a schedule they have to keep, and the yards may be where the day gets lost; nothing new prompted this, it is a fit question.`,
    falsification: 'Where does the day get lost when those trailers reach the yards today: at the gate, finding the trailer, or at the door?',
    noMeans: 'If the yards are not where the day gets lost, there is no fit here: this thesis is closed for them.',
  };
}

/** The draft text for one fact under the approach it opens (draft-approach.ts), read off the fact itself (R31). */
export function draftDefaultsForFact(f: { text: string; claimClass?: string | null; approach?: EvidenceApproach | null }): DraftDefaults {
  if (f.claimClass === 'JOB_POSTING' || f.claimClass === 'PROCUREMENT' || f.approach === 'job_procurement_led') return POSTING_DRAFT_DEFAULTS;
  if (f.approach === 'fit_led') return fitDefaultsFor(f.text);
  return f.text.trim() ? eventDefaultsFor(f.text) : EVENT_DRAFT_DEFAULTS;
}

/** The quoted sentence inside a cited observation (`label: "the sentence" [S:id].`), else the observation. */
function quoteOf(observation: string): string {
  return /"([^"]+)"/.exec(observation)?.[1] ?? observation;
}

/** The seller's persona key for a title (the propose API's enum); a title that names nothing is supply_chain. */
export function personaKeyFor(title: string | null): string {
  const t = (title ?? '').toLowerCase();
  if (/\b(chief|coo|cso|csco|evp|executive vice)\b/.test(t)) return 'executive_ops';
  if (/automation|robotic|engineering/.test(t)) return 'automation';
  if (/transport|freight|fleet|carrier|linehaul|line haul/.test(t)) return 'transportation';
  if (/distribution|warehous|fulfil|\bdc\b/.test(t)) return 'distribution';
  if (/plant|site|facility|yard|gate|dock/.test(t)) return 'site_ops';
  if (/security|compliance|safety/.test(t)) return 'security';
  if (/finance|procure|sourcing/.test(t)) return 'finance_procurement';
  if (/technology|systems|digital|it\b/.test(t)) return 'technology';
  return 'supply_chain';
}

/** The exact body POST /api/gap/story/draft takes for one checked fact and one person. */
export interface StoryDraftPayload {
  accountName: string;
  factId: string;
  personaId: number | null;
  persona: string;
  observation: string;
  problemHypothesis: string;
  falsificationQuestions: string[];
  whatANoMeans: string;
  problemFamily: string | null;
}

/** The payload the opening story's Draft control posts, built once for both callers. */
export function storyDraftPayload(i: { accountName: string; factId: string; claimClass: string | null | undefined; proposedObservation: string; person: { personaId: number | null; title: string | null } | null; problem?: string | null; problemFamily?: string | null; /** R31: the fact sentence (else read from the observation's quote). */ factText?: string | null; approach?: EvidenceApproach | null; /** R31: the seller's edited falsification question. */ falsification?: string | null }): StoryDraftPayload {
  const d = draftDefaultsForFact({ text: i.factText?.trim() || quoteOf(i.proposedObservation), claimClass: i.claimClass, approach: i.approach ?? null });
  return {
    accountName: i.accountName,
    factId: i.factId,
    personaId: i.person?.personaId ?? null,
    persona: personaKeyFor(i.person?.title ?? null),
    observation: i.proposedObservation,
    problemHypothesis: i.problem?.trim() || d.problem,
    falsificationQuestions: [i.falsification?.trim() || d.falsification],
    whatANoMeans: d.noMeans,
    problemFamily: i.problemFamily ?? null,
  };
}
