/**
 * The DRAFT A THESIS defaults (R35, 2026-10-06): the one place the opening story's draft text and the persona key
 * live, so the account page's control (components/gap/outreach-anchor.tsx) and an Ask GAP proposal
 * (lib/gap/ask/proposal.ts) post the SAME payload to the same route (POST /api/gap/story/draft, the one draft
 * service). A seller edits the guess before it goes to review; nothing here is copy (the email is the compiler's).
 *
 * The event-led text is unchanged from the control (pinned by tests). A job or procurement claim gets text of its
 * own approach: the posting says what a role covers, never that they lack a system, are understaffed or have a
 * budget (research/approach-policy.ts). Pure; no em dashes.
 */

export interface DraftDefaults {
  problem: string;
  falsification: string;
  noMeans: string;
}

/** A physical-network change (the event-led path): the text the opening story's control has always posted. */
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
export function storyDraftPayload(i: { accountName: string; factId: string; claimClass: string | null | undefined; proposedObservation: string; person: { personaId: number | null; title: string | null } | null; problem?: string | null; problemFamily?: string | null }): StoryDraftPayload {
  const d = draftDefaultsFor(i.claimClass);
  return {
    accountName: i.accountName,
    factId: i.factId,
    personaId: i.person?.personaId ?? null,
    persona: personaKeyFor(i.person?.title ?? null),
    observation: i.proposedObservation,
    problemHypothesis: i.problem?.trim() || d.problem,
    falsificationQuestions: [d.falsification],
    whatANoMeans: d.noMeans,
    problemFamily: i.problemFamily ?? null,
  };
}
