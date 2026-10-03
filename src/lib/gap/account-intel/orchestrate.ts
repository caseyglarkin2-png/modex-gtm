/**
 * ACCOUNT INTELLIGENCE C: the RESEARCH ORCHESTRATOR. Three depths:
 *   SCOUT   a company GAP does not know yet (entity/scout.ts, from the candidate queue)
 *   BRIEF   the live projection (free; build.ts)
 *   DEEPEN  one focused research run on the highest-value missing section, through the ONE verification
 *           contract (research/run.ts): every excerpt is re-fetched at its own source before it is a fact
 *
 * The plan is the brief read backwards: sections ordered by what they unblock (can we contact at all, is the
 * story right, where would we start), never a score. A KNOWN, fresh section is never re-researched; a focus
 * that came back empty in the last 14 days is not repeated; what the web cannot answer (ownership, observed
 * cost) becomes a discovery question for a human.
 */
import type { AccountIntelligenceBrief, SectionKey } from './build';

export type Depth = 'SCOUT' | 'BRIEF' | 'DEEPEN';
export interface ResearchTask {
  section: SectionKey;
  depth: Depth;
  /** research: a verified research run; hubspot: re-read the deal; human: a discovery question for Casey */
  provider: 'research' | 'hubspot' | 'human';
  focus: string;
  why: string;
}
export interface ResearchPlan {
  tasks: ResearchTask[];
  skipped: Array<{ section: SectionKey; reason: string }>;
}
export interface ResearchHistory {
  section: string;
  outcome: string;
  at: string;
}

/** The web focus for each section a research run can answer. */
// Each focus names the decision it fills and the searches most likely to find a verifiable source for it.
export const DEEPEN_FOCUS = {
  catalysts: 'Recent changes to plants, distribution centers, warehouses or the transportation network (openings, closures, consolidations, expansions, automation). Useful searches: "<company> new distribution center", "<company> plant closure", "<company> warehouse expansion", "<company> logistics facility", "<company> warehouse automation".',
  footprint: 'How many plants, distribution centers and warehouses the company operates, and where (annual report properties section, company site). Useful searches: "<company> 10-K properties", "<company> distribution network", "<company> facilities locations".',
  technology: 'Yard management, dock scheduling, gate automation or trailer tracking systems the company uses (press releases, vendor case studies naming it). Useful searches: "<company> yard management", "<company> YMS", "<company> Kaleris PINC", "<company> TMS implementation", "<company> warehouse management case study".',
  freight: 'Private fleet, dedicated carriers, intermodal or rail use, and how freight moves between plants and distribution centers. Useful searches: "<company> private fleet", "<company> dedicated fleet", "<company> intermodal", "<company> drop and hook", "<company> transportation network".',
} as const;

const HUMAN: Partial<Record<SectionKey, string>> = {
  org: 'Who owns yard performance across the plants and DCs? (ask; never guessed from a title)',
  economics: 'When the yards back up, where does it show: detention, overtime, or missed shipments? (ask; modeled pain is not observed pain)',
  yard: 'How do trailers get checked in and found today? (ask; the satellite audit cannot see process)',
};

/** Contact discovery that follows the person prior (V2): the questions, then where to look; never an auto-created contact. */
export const CONTACT_DISCOVERY = 'Find the transportation operating owner: who owns transportation operations in the US / North America, transportation and warehousing, the private fleet, distribution transportation or network logistics execution? Look in HubSpot contacts and the contact candidates first, then public sources; surface candidates for Casey (no contact is created automatically).';

// What each section unblocks, in order. The order IS the priority; there is no weight.
const ORDER: Array<{ section: SectionKey; why: string }> = [
  { section: 'catalysts', why: 'No live verified fact gates contact: nothing public to open on yet.' },
  { section: 'footprint', why: 'Without a sourced facility count the wedge and the economics stay modeled.' },
  { section: 'technology', why: 'An incumbent changes the wedge; it is never assumed from a mention.' },
  { section: 'freight', why: 'The freight model decides where yard delays cost the most.' },
  { section: 'org', why: 'Ownership is the question research cannot answer.' },
  { section: 'economics', why: 'Only the buyer can say what the problem costs.' },
  { section: 'yard', why: 'The current yard process sets the pilot scope.' },
];

const DAY = 86_400_000;

const IN_FLIGHT_MS = 5 * 60_000;
const HOUR = 3_600_000;

export function planResearch(brief: AccountIntelligenceBrief, history: readonly ResearchHistory[], now: Date): ResearchPlan {
  const tasks: ResearchTask[] = [];
  const skipped: ResearchPlan['skipped'] = [];
  // Gates first, from the structured deal state: a held account gets no research at all (review C P0).
  if (brief.dealState === 'UNKNOWN' || brief.dealState === 'NOT_READ') {
    tasks.push({ section: 'commercial', depth: 'BRIEF', provider: 'hubspot', focus: 'Re-read the HubSpot deal state (open this page again).', why: 'Nothing else is safe until the deal state is known: no research until then.' });
    for (const { section } of ORDER) skipped.push({ section, reason: 'Held: the HubSpot deal state is not known yet.' });
    return { tasks, skipped };
  }
  // A related account in the corporate family is live: the next decision is Casey's (a separate buying motion or
  // not), never more research on an account that may already be in play through its parent or subsidiary.
  if (brief.family?.hold) {
    tasks.push({ section: 'commercial', depth: 'BRIEF', provider: 'human', focus: 'Confirm whether this is a separate buying motion from the related account (Separate buying motion on this page).', why: brief.family.hold.detail });
    for (const { section } of ORDER) skipped.push({ section, reason: 'Held: related account activity in the corporate family.' });
    return { tasks, skipped };
  }
  if (brief.dealState === 'ACTIVE') {
    tasks.push({ section: 'commercial', depth: 'DEEPEN', provider: 'human', focus: 'The Deal brief next learning objective (one objective per deal, in GAP order).', why: 'An open deal is worked from the deal: learn from the buyer, never cold research.' });
    for (const { section } of ORDER) skipped.push({ section, reason: 'In a deal: learn from the buyer, not the web.' });
    return { tasks, skipped };
  }
  // The account motion decides what research is for. A live conversation is learned from, not researched around.
  if (brief.motion.type === 'FOLLOW_UP') {
    tasks.push({ section: 'commercial', depth: 'DEEPEN', provider: 'human', focus: `Continue the conversation with ${brief.motion.who ?? 'the buyer'} and log what they say as buyer input.`, why: brief.motion.why });
    for (const { section } of ORDER) skipped.push({ section, reason: 'A live conversation: learn from the buyer, not the web.' });
    return { tasks, skipped };
  }
  // What the company IS and what it operates decides whether any of the rest matters (entity type != fit):
  // an account whose fit is unknown gets an identity Scout first (Scout's own cooldown bounds it).
  if (brief.fit.fit === 'UNKNOWN' || !brief.fit.entityType) {
    // One identity Scout answers for 14 days: an operator still UNKNOWN after it needs a human, not a re-run.
    const scouted = brief.fit.scoutedAt && now.getTime() - new Date(brief.fit.scoutedAt).getTime() < 14 * DAY ? brief.fit.scoutedAt : null;
    if (scouted) skipped.push({ section: 'identity', reason: `Scouted on ${scouted.slice(0, 10)}; its answer stands for 14 days (ask what it runs if it is still unclear).` });
    else tasks.push({ section: 'identity', depth: 'SCOUT', provider: 'research', focus: 'What the company is, and which facilities, yards, terminals or fleets it runs (Scout, cited).', why: brief.fit.fit === 'UNKNOWN' ? 'YardFlow fit is unknown: what it operates decides whether anything else is worth researching.' : `What kind of company it is is not established (fit reads ${brief.fit.fit === 'DIRECT_BUYER' ? 'direct buyer' : brief.fit.fit.toLowerCase().replace(/_/g, ' ')} from its operations).` });
  }
  // A first touch is ready on a verified fact: the next move is Casey's review, not more research (it would only
  // delay a ready touch). Research resumes on what the buyer says. An unknown fit is still Scouted first (above):
  // a touch to a company whose fit is unknown waits for what it runs.
  if (brief.motion.type === 'FACT_LED') {
    tasks.push({ section: 'commercial', depth: 'BRIEF', provider: 'human', focus: `Review the thesis and the first touch to ${brief.motion.who ?? 'the primary person'} (every gate runs at the click).`, why: brief.motion.why });
    for (const { section } of ORDER) skipped.push({ section, reason: 'A first touch is ready: review it before researching more.' });
    return { tasks, skipped };
  }
  // Relationship-led: the ask comes first; research is context for that conversation, never a cold opener.
  // Warm intro only: the introduction is the work; research is context for that conversation, never a cold opener.
  if (brief.motion.type === 'INTRO_ONLY') {
    tasks.push({ section: 'relationships', depth: 'BRIEF', provider: 'human', focus: `Ask ${brief.motion.who ?? 'the introducer'} for the introduction (no draft, no cold opener).`, why: brief.motion.why });
  }
  if (brief.motion.type === 'RELATIONSHIP_LED' || brief.motion.type === 'REFERRAL_LED') {
    tasks.push({ section: 'relationships', depth: 'BRIEF', provider: 'human', focus: `Ask ${brief.motion.who ?? 'the person Casey knows here'} for their perspective (no draft, no cold opener).`, why: brief.motion.why });
  }
  for (const { section, why } of ORDER) {
    const s = brief.sections[section];
    if (s.status === 'KNOWN') {
      skipped.push({ section, reason: 'Known and fresh: nothing to research.' });
      continue;
    }
    if (s.status === 'CONTRADICTED') {
      tasks.push({ section, depth: 'DEEPEN', provider: 'human', focus: `Sources disagree about ${s.title.toLowerCase()}: ask the buyer which is true (the web cannot settle it).`, why });
      continue;
    }
    const focus = (DEEPEN_FOCUS as Record<string, string>)[section];
    if (focus) {
      const mine = history.filter((h) => h.section === section);
      const age = (h: ResearchHistory) => now.getTime() - new Date(h.at).getTime();
      const running = mine.find((h) => h.outcome === 'running' && age(h) < IN_FLIGHT_MS);
      // A pass the web provider could not run learned nothing about the company: retry after an hour, never 14 days.
      const down = mine.find((h) => h.outcome === 'provider_unavailable' && age(h) < HOUR);
      const recent = mine.find((h) => h.outcome !== 'running' && h.outcome !== 'provider_unavailable' && age(h) < DAY);
      // Empty FOR THIS SECTION: the run found nothing at all, or found facts that landed in other sections.
      const empty = mine.find((h) => (h.outcome === 'insufficient_evidence' || h.outcome === 'nothing_for_section') && age(h) < 14 * DAY);
      if (running) skipped.push({ section, reason: `A run on this section started at ${running.at.slice(11, 16)} UTC and has not finished.` });
      else if (down) skipped.push({ section, reason: `The web search was unavailable at ${down.at.slice(11, 16)} UTC; retry after an hour (nothing was learned).` });
      else if (empty) skipped.push({ section, reason: `The same focus found no outreach evidence for this section on ${empty.at.slice(0, 10)} (what it did find is under Sources / signals); not repeated for 14 days.` });
      else if (recent) skipped.push({ section, reason: `Researched on ${recent.at.slice(0, 10)}; once a day per section.` });
      else tasks.push({ section, depth: 'DEEPEN', provider: 'research', focus, why: s.status === 'STALE' ? `Stale: ${why}` : why });
    } else if (section === 'org' && brief.people && brief.people.primary?.lane !== 'PRIMARY_OPERATOR') {
      // The person prior (people/person-prior.ts): no transportation operating owner on record, so contact discovery
      // looks for that person first. Candidates surface for Casey; GAP never creates a contact.
      tasks.push({ section, depth: 'DEEPEN', provider: 'human', focus: `${CONTACT_DISCOVERY}${brief.people.primary ? ` Best on record now: ${brief.people.primary.name}${brief.people.primary.title ? `, ${brief.people.primary.title}` : ''} (${brief.people.primary.laneLabel.toLowerCase()}).` : ''}${brief.division ? ` ${brief.division.question} Find that division's transportation owner.` : ''} Then ask: ${HUMAN.org}`, why: 'No US / North America transportation operating owner on record: the person Casey sells to best.' });
    } else if (HUMAN[section]) {
      tasks.push({ section, depth: 'DEEPEN', provider: 'human', focus: HUMAN[section]!, why });
    }
  }
  return { tasks, skipped };
}

/** Recent DEEPEN runs on this account (the orchestrator's memory: what was tried, and what came back). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadResearchHistory(prisma: any, accountName: string, now: Date): Promise<ResearchHistory[]> {
  // Deepen runs only (filtered in the query), newest first. Throws on a read error: the route fails closed.
  const rows: Array<{ created_at: Date; provider_status: Record<string, unknown> | null }> = await prisma.researchRun.findMany({
    where: { account_name: accountName, run_key: { startsWith: 'gap_research:' }, created_at: { gte: new Date(now.getTime() - 30 * DAY) }, provider_status: { path: ['orchestrator'], equals: 'deepen' } },
    select: { created_at: true, provider_status: true },
    orderBy: { created_at: 'desc' },
    take: 40,
  });
  return rows
    .filter((r) => r.provider_status?.orchestrator === 'deepen' && typeof r.provider_status.section === 'string')
    // A run with no outcome yet is still running (or died mid-run: it counts as in flight for a few minutes).
    // The section's own outcome (recorded by the deepen route) wins over the run's account-wide one.
    .map((r) => ({ section: String(r.provider_status!.section), outcome: String(r.provider_status!.sectionOutcome ?? r.provider_status!.outcome ?? 'running'), at: new Date(r.created_at).toISOString() }));
}
