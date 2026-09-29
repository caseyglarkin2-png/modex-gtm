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
export const DEEPEN_FOCUS = {
  catalysts: 'Recent changes to plants, distribution centers, warehouses or the transportation network (openings, closures, consolidations, expansions, automation).',
  footprint: 'How many plants, distribution centers and warehouses the company operates, and where (annual report properties section, company site).',
  technology: 'Yard management, dock scheduling, gate automation or trailer tracking systems the company uses (press releases, vendor case studies).',
  freight: 'Private fleet, dedicated carriers, intermodal or rail use, and how freight moves between plants and distribution centers.',
} as const;

const HUMAN: Partial<Record<SectionKey, string>> = {
  org: 'Who owns yard performance across the plants and DCs? (ask; never guessed from a title)',
  economics: 'When the yards back up, where does it show: detention, overtime, or missed shipments? (ask; modeled pain is not observed pain)',
  yard: 'How do trailers get checked in and found today? (ask; the satellite audit cannot see process)',
};

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

export function planResearch(brief: AccountIntelligenceBrief, history: readonly ResearchHistory[], now: Date): ResearchPlan {
  const tasks: ResearchTask[] = [];
  const skipped: ResearchPlan['skipped'] = [];
  // Gates first, from the structured deal state: a held account gets no research at all (review C P0).
  if (brief.dealState === 'UNKNOWN' || brief.dealState === 'NOT_READ') {
    tasks.push({ section: 'commercial', depth: 'BRIEF', provider: 'hubspot', focus: 'Re-read the HubSpot deal state (open this page again).', why: 'Nothing else is safe until the deal state is known: no research until then.' });
    for (const { section } of ORDER) skipped.push({ section, reason: 'Held: the HubSpot deal state is not known yet.' });
    return { tasks, skipped };
  }
  if (brief.dealState === 'ACTIVE') {
    tasks.push({ section: 'commercial', depth: 'DEEPEN', provider: 'human', focus: 'The Deal brief next learning objective (one objective per deal, in GAP order).', why: 'An open deal is worked from the deal: learn from the buyer, never cold research.' });
    for (const { section } of ORDER) skipped.push({ section, reason: 'In a deal: learn from the buyer, not the web.' });
    return { tasks, skipped };
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
      const running = mine.find((h) => h.outcome === 'running' && now.getTime() - new Date(h.at).getTime() < IN_FLIGHT_MS);
      const recent = mine.find((h) => h.outcome !== 'running' && now.getTime() - new Date(h.at).getTime() < DAY);
      const empty = mine.find((h) => h.outcome === 'insufficient_evidence' && now.getTime() - new Date(h.at).getTime() < 14 * DAY);
      if (running) skipped.push({ section, reason: `A run on this section started at ${running.at.slice(11, 16)} UTC and has not finished.` });
      else if (empty) skipped.push({ section, reason: `The same focus came back empty on ${empty.at.slice(0, 10)}; not repeated for 14 days.` });
      else if (recent) skipped.push({ section, reason: `Researched on ${recent.at.slice(0, 10)}; once a day per section.` });
      else tasks.push({ section, depth: 'DEEPEN', provider: 'research', focus, why: s.status === 'STALE' ? `Stale: ${why}` : why });
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
    .map((r) => ({ section: String(r.provider_status!.section), outcome: String(r.provider_status!.outcome ?? 'running'), at: new Date(r.created_at).toISOString() }));
}
