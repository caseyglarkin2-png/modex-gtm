/**
 * ASK GAP ACTION PROPOSALS (GAP OS execution recovery, R35, 2026-10-06). Pure.
 *
 * A conversational request to prepare something ("help me approach this person", "draft an angle from the job
 * posting", "research their footprint deeper") is answered with ONE typed proposal built from the controls the
 * account page already shows, never by the model and never as copy:
 *
 *   draft_thesis  the opening story's DRAFT A THESIS on a checked fact, for a person: the exact payload the page's
 *                 control posts (story/draft-defaults.ts storyDraftPayload) to POST /api/gap/story/draft, the one
 *                 draft service (gated, one draft per fact and person, submitted for review, never approved here)
 *   research      the research plan's DEEPEN on one section: POST /api/gap/accounts/deepen, which re-plans and
 *                 refuses a section the plan does not ask for
 *   open_control  a link to the control that already does it (the prepared email under NEXT, a proposal waiting
 *                 for review, the people rows)
 *
 * The seller presses the button; the route runs its own gates. Nothing here sends, enrolls, chooses a person, spends
 * on a lookup, changes a flag or writes the CRM: a request for any of those still gets the control's name
 * (grounding.ts actionRequest). The intent is read deterministically from the question; a question that is not one
 * of these is left to the read-only answer. Pinned by tests/unit/gap/ask-proposal.test.ts.
 */
import { storyDraftPayload, type StoryDraftPayload } from '../story/draft-defaults';

export type ResearchSection = 'identity' | 'catalysts' | 'footprint' | 'technology' | 'freight';

export type AskProposal =
  | { kind: 'draft_thesis'; label: string; route: '/api/gap/story/draft'; payload: StoryDraftPayload }
  | { kind: 'research'; label: string; route: '/api/gap/accounts/deepen'; payload: { accountName: string; section: ResearchSection } }
  | { kind: 'open_control'; label: string; href: string };

/** What the page's controls hold, for a proposal (kept out of the model's context: ids, never prose). */
export interface AskControls {
  accountHref: string;
  /** The chosen person (the pursuit state's), if any. */
  person: { personaId: number | null; name: string; title: string | null } | null;
  /** The people rows the page shows, for "approach <name>". */
  people: Array<{ personaId: number | null; name: string; title: string | null }>;
  /** The usable opening story, when there is one. */
  primary: { hypothesisId: string; observation: string; usable: boolean } | null;
  /** Proposals waiting for review on the page. */
  pending: Array<{ hypothesisId: string; status: string; story: string; claimClass: string | null }>;
  /** Checked facts no thesis is grounded on yet (the opening story's draft list). */
  draftable: Array<{ factId: string; story: string; proposedObservation: string; claimClass: string | null; approach?: import('../research/approach-policy').EvidenceApproach }>;
  /** NEXT's control, when it has one (the prepared email lives behind it). */
  next: { label: string; href: string } | null;
}

export type AskIntent = { kind: 'approach'; name: string | null } | { kind: 'draft_from_posting' } | { kind: 'draft_angle' } | { kind: 'research'; section: ResearchSection };

/** A request to prepare an approach: "help me approach ...", "how should I approach ...", or an imperative "Approach ...". */
const APPROACH_ASK = /\b(?:help me (?:approach|reach(?: out to)?|contact|get to|open with|talk to|start with)|how (?:do|should|would|can) i (?:approach|open with|reach|start with))\b/i;
const APPROACH_IMPERATIVE = /^(?:please\s+)?approach\b/i;
/** The person a request names after its verb, when it names one (a capitalized name). */
const NAME_AFTER = /\b(?:[Aa]pproach|[Rr]each(?: out to)?|[Cc]ontact|[Gg]et to|[Oo]pen with|[Tt]alk to|[Ss]tart with)\s+([A-Z][a-z]+(?: [A-Z][a-z]+)?)/;
const POSTING = /\b(?:job|posting|postings|hiring|job ad|opening for|role|rfp|rfq|tender|procurement|notice|bid)\b/i;
const DRAFT_ANGLE = /\b(?:draft|prepare|build|make|write|give me|suggest)\s+(?:me\s+)?(?:an?\s+|the\s+|another\s+|a different\s+|a new\s+)?(?:angle|thesis|story|opening story)\b/i;
/** A request to research (an imperative, a "can you", or "research / look into ... deeper"), never a question about research done. */
const RESEARCH_REQUEST = /^(?:please\s+|can you\s+|could you\s+|go\s+)?(?:research|dig (?:into|deeper)|look (?:deeper )?into|deepen|find out more|learn more)\b/i;
const RESEARCH_DEEPER = /\b(?:research|dig into|look into)\b.*\b(?:deeper|further|more)\b/i;

/** The research plan's section a topic names (the DEEPEN control's vocabulary); catalysts when none is named. */
export function researchSectionOf(question: string): ResearchSection {
  const q = question.toLowerCase();
  if (/\b(sites?|facilit|footprint|dcs?\b|distribution cent|plants?|warehouses?|locations?|network map)/.test(q)) return 'footprint';
  if (/\b(tech|technology|systems?|software|wms|tms|yms|automation|stack|it\b)/.test(q)) return 'technology';
  if (/\b(freight|transportation|carriers?|fleet|trucking|lanes?|shipping|logistics providers?|3pl)/.test(q)) return 'freight';
  if (/\b(who they are|company|business|parent|subsidiar|divisions?|operations overview|identity)\b/.test(q)) return 'identity';
  return 'catalysts';
}

/** The proposal intent a question carries, or null (a question to answer, or an action the page names). */
export function proposalIntent(question: string): AskIntent | null {
  const q = question.trim();
  if (DRAFT_ANGLE.test(q)) return POSTING.test(q) ? { kind: 'draft_from_posting' } : { kind: 'draft_angle' };
  if (APPROACH_ASK.test(q) || APPROACH_IMPERATIVE.test(q)) {
    const name = NAME_AFTER.exec(q)?.[1] ?? null;
    return { kind: 'approach', name: name && !/^(This|Him|Her|Them|The)$/.test(name) ? name : null };
  }
  if ((RESEARCH_REQUEST.test(q) || RESEARCH_DEEPER.test(q)) && !/\b(send|email|enroll|apollo)\b/i.test(q)) return { kind: 'research', section: researchSectionOf(q) };
  return null;
}

const firstOf = (name: string) => name.split(' ')[0];
const isPosting = (cls: string | null | undefined) => cls === 'JOB_POSTING' || cls === 'PROCUREMENT';
const clip = (t: string, n = 140) => (t.length > n ? `${t.slice(0, n - 3).trim()}...` : t);

/**
 * The answer and the one proposal for an intent, from the page's controls. The answer says what the button does and
 * that nothing is sent; when no control fits, it says why and offers the nearest one.
 */
export function proposalFor(intent: AskIntent, accountName: string, c: AskControls): { answer: string; proposal: AskProposal | null } {
  const research = (section: ResearchSection, label: string): AskProposal => ({ kind: 'research', label, route: '/api/gap/accounts/deepen', payload: { accountName, section } });
  if (intent.kind === 'research') {
    const words: Record<ResearchSection, string> = { identity: 'the company and its operations', catalysts: 'what is changing there', footprint: 'the footprint (sites and facilities)', technology: 'the technology', freight: 'the freight and transportation' };
    return {
      answer: `GAP can run one focused research pass on ${words[intent.section]} at ${accountName}, the research plan's Deepen. Every excerpt is checked at its own source before it becomes a fact; GAP re-checks the plan when you press it and says so if the section is not needed now. Nothing is sent.`,
      proposal: research(intent.section, `Research ${words[intent.section]}`),
    };
  }

  const named = intent.kind === 'approach' && intent.name ? c.people.find((p) => p.name.toLowerCase().startsWith(intent.name!.toLowerCase()) || firstOf(p.name).toLowerCase() === intent.name!.toLowerCase()) ?? null : null;
  const who = named ?? c.person;
  const draftFor = (d: AskControls['draftable'][number], label: string) => ({ kind: 'draft_thesis' as const, label, route: '/api/gap/story/draft' as const, payload: storyDraftPayload({ accountName, factId: d.factId, claimClass: d.claimClass, proposedObservation: d.proposedObservation, person: who ? { personaId: who.personaId, title: who.title } : null, factText: d.story, approach: d.approach ?? null }) });

  if (intent.kind === 'draft_from_posting') {
    const posting = c.draftable.find((d) => isPosting(d.claimClass));
    const pendingPosting = c.pending.find((p) => isPosting(p.claimClass));
    if (pendingPosting) return { answer: `A thesis on the posting is already waiting for your review on this page ("${clip(pendingPosting.story)}"). Review it there; nothing is sent.`, proposal: { kind: 'open_control', label: 'Review the proposal', href: `${c.accountHref}#outreach-anchor` } };
    if (!posting) return { answer: `GAP has no checked job posting or procurement notice at ${accountName} yet, so there is nothing to draft an angle from. The jobs and notices bundle is searched on the grounded rotation; Coverage says when it last ran here.`, proposal: { kind: 'open_control', label: 'Open Coverage', href: '/gap/coverage' } };
    if (!who?.personaId) return { answer: `There is a checked posting ("${clip(posting.story)}"), but nobody is chosen to hear it yet. Choose the person first; the draft is written for them.`, proposal: { kind: 'open_control', label: 'Choose who hears this first', href: `${c.accountHref}#people-stack` } };
    return { answer: `GAP can draft a job-led thesis for ${firstOf(who.name)} from the checked posting ("${clip(posting.story)}"), in the posting's own words. It goes to review on this page, through the same draft as the opening story; nothing is sent and nothing is approved until you approve it.`, proposal: draftFor(posting, `Draft the thesis for ${firstOf(who.name)} from the posting`) };
  }

  // approach, or a generic "draft an angle"
  if (!who) return { answer: `Nobody is chosen at ${accountName} yet, so there is no one to prepare for. Choose the person first; the opening is written for them.`, proposal: { kind: 'open_control', label: 'Choose who hears this first', href: `${c.accountHref}#people-stack` } };
  const first = firstOf(who.name);
  if (intent.kind === 'approach' && c.primary?.usable && c.next && (!named || named.personaId === c.person?.personaId)) {
    return { answer: `${first}'s opening is prepared on the approved story ("${clip(c.primary.observation)}"). Open it to read the exact email; it still runs every check and your confirm. Nothing is sent from here.`, proposal: { kind: 'open_control', label: c.next.label, href: c.next.href } };
  }
  const pending = c.pending[0];
  if (pending) return { answer: `A proposal is waiting for your review on this page ("${clip(pending.story)}"). Approve it there and ${first}'s opening is prepared; nothing is sent.`, proposal: { kind: 'open_control', label: 'Review the proposal', href: `${c.accountHref}#outreach-anchor` } };
  const d = c.draftable[0];
  if (d && who.personaId) return { answer: `There is no approved story for ${first} yet. GAP can draft one from the checked fact ("${clip(d.story)}"); it goes to review on this page, through the same draft as the opening story. Nothing is sent.`, proposal: draftFor(d, `Draft the thesis for ${first}`) };
  return { answer: `GAP has no checked fact at ${accountName} to open on yet, so there is nothing to prepare for ${first}. A focused research pass on what is changing there is the nearest step.`, proposal: research('catalysts', 'Research what is changing there') };
}
