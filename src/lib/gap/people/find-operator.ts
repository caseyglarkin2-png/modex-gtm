/**
 * FIND OPERATOR (owner resolution, 2026-10-05): when nobody on record is a current direct operator, Casey's click
 * runs the EXISTING grounded, source-backed contact research (discovery/research.ts: explicit responsibility slots,
 * every person with a public source URL, the slot re-read by the person prior) and stages the direct-operator finds
 * as AccountContactCandidates for his review. Never a Persona, never a HubSpot contact, never an email guess, never
 * an Apollo credit; a row already on record (any state) is never re-staged or overwritten. The same staging the
 * read-only operator audit's --stage performs (scripts/gap/operator-contact-audit.ts), as a seller control.
 */
import { normalizeName, normalizeTitle } from '@/lib/contact-standard';
import type { ResearchedContact } from '@/lib/discovery/research';
import { stageableResearch } from './operator-audit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface FindOperatorInput {
  accountName: string;
  /** Names already on record (GAP, HubSpot, staged), so research never re-stages a known person. */
  known: readonly string[];
  actor: string;
  now: Date;
}

export interface FindOperatorDeps {
  research?: (company: string) => Promise<ResearchedContact[]>;
}

export interface FindOperatorResult {
  ok: true;
  found: ResearchedContact[];
  staged: Array<{ id: number; name: string; title: string | null; sourceUrl: string | null }>;
  alreadyOnRecord: string[];
  note: string;
}

export async function findOperator(prisma: PrismaLike, input: FindOperatorInput, deps: FindOperatorDeps = {}): Promise<FindOperatorResult> {
  const research = deps.research ?? (async (company: string) => (await import('@/lib/discovery/research')).researchDecisionMakers(company));
  const found = await research(input.accountName);
  const stageable = stageableResearch(found, input.known);
  const staged: FindOperatorResult['staged'] = [];
  const alreadyOnRecord: string[] = [];
  for (const f of stageable) {
    const key = `${normalizeName(f.name)}::${normalizeTitle(f.title ?? '')}`;
    const existing = await prisma.accountContactCandidate.findUnique({ where: { account_name_candidate_key: { account_name: input.accountName, candidate_key: key } }, select: { id: true, state: true } });
    if (existing) {
      alreadyOnRecord.push(`${f.name} (${existing.state})`);
      continue;
    }
    const row = await prisma.accountContactCandidate.create({
      data: {
        account_name: input.accountName,
        candidate_key: key,
        full_name: f.name,
        normalized_name: normalizeName(f.name),
        title: f.title ?? null,
        // Only an email the source itself published survives the parser; never a guess.
        email: f.email ?? null,
        email_valid: false,
        linkedin_url: f.linkedinUrl ?? null,
        source: 'web_research',
        source_action: 'owner_resolution_find_operator',
        source_provider: 'gemini_grounded_search',
        source_payload: { ...f, stagedBy: input.actor, stagedAt: input.now.toISOString() } as never,
        // Never recommended by default: a model-found person is verified by Casey before anything else.
        recommended: false,
        recommendation_reason: `Possible direct operator from public research (${f.sourceUrl}); verify the current role and the source before promoting.`,
        state: 'staged',
      },
      select: { id: true },
    });
    staged.push({ id: row.id, name: f.name, title: f.title ?? null, sourceUrl: f.sourceUrl ?? null });
  }
  const note = found.length === 0
    ? 'Research found nobody source-backed. Owner not resolved; nothing was staged.'
    : staged.length === 0
      ? `Research found ${found.length} source-backed ${found.length === 1 ? 'person' : 'people'}, none a new direct operator to stage${alreadyOnRecord.length ? ` (${alreadyOnRecord.join(', ')} already on record)` : ''}.`
      : `${staged.length} direct-operator ${staged.length === 1 ? 'candidate' : 'candidates'} staged for your review (verify the source and the current role; promote in Contacts). Nothing became a GAP contact or a HubSpot record, and no Apollo credit was spent.`;
  return { ok: true, found, staged, alreadyOnRecord, note };
}
