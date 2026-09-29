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

export function planResearch(brief: AccountIntelligenceBrief, history: readonly ResearchHistory[], now: Date): ResearchPlan {
  const tasks: ResearchTask[] = [];
  const skipped: ResearchPlan['skipped'] = [];
  const inDeal = /^Open deal/.test(brief.glance.commercialState);
  if (/could not be read|not read/.test(brief.glance.commercialState)) {
    tasks.push({ section: 'commercial', depth: 'BRIEF', provider: 'hubspot', focus: 'Re-read the HubSpot deal state (open this page again).', why: 'Nothing else is safe until the deal state is known.' });
  } else if (inDeal) {
    tasks.push({ section: 'commercial', depth: 'DEEPEN', provider: 'human', focus: brief.discovery.find((q) => q.type !== 'VERIFY_PROBLEM')?.question ?? 'The next unknown in the deal.', why: 'An open deal is worked from the deal: learn, never cold research.' });
  }
  for (const { section, why } of ORDER) {
    const s = brief.sections[section];
    if (inDeal && section === 'catalysts') {
      skipped.push({ section, reason: 'In a deal: no cold research for an opening.' });
      continue;
    }
    if (s.status === 'KNOWN') {
      skipped.push({ section, reason: 'Known and fresh: nothing to research.' });
      continue;
    }
    const focus = (DEEPEN_FOCUS as Record<string, string>)[section];
    if (focus) {
      const empty = history.find((h) => h.section === section && h.outcome === 'insufficient_evidence' && now.getTime() - new Date(h.at).getTime() < 14 * DAY);
      if (empty) {
        skipped.push({ section, reason: `The same focus came back empty on ${empty.at.slice(0, 10)}; not repeated for 14 days.` });
        continue;
      }
      tasks.push({ section, depth: 'DEEPEN', provider: 'research', focus, why: s.status === 'STALE' ? `Stale: ${why}` : why });
    } else if (HUMAN[section]) {
      tasks.push({ section, depth: 'DEEPEN', provider: 'human', focus: HUMAN[section]!, why });
    }
  }
  return { tasks, skipped };
}

/** Recent DEEPEN runs on this account (the orchestrator's memory: what was tried, and what came back). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadResearchHistory(prisma: any, accountName: string, now: Date): Promise<ResearchHistory[]> {
  const rows: Array<{ created_at: Date; provider_status: Record<string, unknown> | null }> = await prisma.researchRun
    .findMany({ where: { account_name: accountName, run_key: { startsWith: 'gap_research:' }, created_at: { gte: new Date(now.getTime() - 30 * DAY) } }, select: { created_at: true, provider_status: true }, orderBy: { created_at: 'desc' }, take: 40 })
    .catch(() => []);
  return rows
    .filter((r) => r.provider_status?.orchestrator === 'deepen' && typeof r.provider_status.section === 'string')
    .map((r) => ({ section: String(r.provider_status!.section), outcome: String(r.provider_status!.outcome ?? 'unknown'), at: new Date(r.created_at).toISOString() }));
}
