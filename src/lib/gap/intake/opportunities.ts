/**
 * COHORT OPPORTUNITIES (Universal Work Intake, 2026-09-28): what a source
 * yields is people worth Casey's attention, never generated emails.
 *
 * Each opportunity: ACCOUNT, PERSON, SOURCE / RELATIONSHIP, WHY THIS ACCOUNT
 * (the verified fact), THESIS, WHY THIS PERSON, SUGGESTED APPROACH, WHAT WE
 * NEED TO LEARN, WHAT WOULD MAKE US WRONG, SAFETY. Actions stay the existing
 * ones: REVIEW (the account's section in Research, where DRAFT THESIS / USE
 * live), RESEARCH MORE, NOT NOW, IGNORE. Nothing here drafts or sends.
 *
 * The approach is the smallest methodology-safe distinction:
 *   fact_led          a verified fact: observation -> bridge -> question -> ask,
 *                     through every normal gate. Relationship context is an
 *                     optional opener Casey may choose, never the reason.
 *   relationship_led  real relationship context, no verified fact: ask for
 *                     perspective; no problem is claimed; GAP will not draft a
 *                     first touch (the evidence gate is unchanged)
 *   referral_led      the same, for a referral / introduction
 *   follow_up         an existing conversation: follow up in the thread
 */
import { loadEvidenceInbox } from '../research/inbox';
import { loadAccountConversations } from '../motion/load';
import { suggestAngle } from '../motion/persona-angle';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type Approach = 'fact_led' | 'relationship_led' | 'referral_led' | 'follow_up';

export interface OpportunityInput {
  member: { id: string; name: string | null; title: string | null; accountName: string; personaId: number | null; candidateId: number | null; relationshipContext: string | null; note: string | null; qualification: string | null; alsoFrom: string[] };
  source: { name: string; sourceType: string };
  fact: { signalId: string; quote: string; reason: string; chain: string } | null;
  thesis: { summary: string; useLabel: string | null; learn: string | null; wrongIf: string | null } | null;
  conversation: { who: string; responseClass: string; at: string } | null;
  suggestedAngle: string | null;
}

export interface Opportunity {
  memberId: string;
  account: string;
  person: { name: string | null; title: string | null; personaId: number | null; staged: boolean };
  source: { name: string; relationshipContext: string | null; alsoFrom: string[]; note: string | null };
  whyAccount: string | null;
  fact: OpportunityInput['fact'];
  thesis: OpportunityInput['thesis'];
  whyPerson: string | null;
  approach: Approach;
  suggestedApproach: string;
  learn: string | null;
  wrongIf: string | null;
  safety: { state: 'ok' | 'caution'; lines: string[] };
  reviewHref: string;
}

const GATES = 'Every send still runs the normal gates at the click: suppression, deal truth, duplicate send, account motion.';

export function proposeOpportunity(i: OpportunityInput): Opportunity {
  const m = i.member;
  const ctx = m.relationshipContext;
  let approach: Approach;
  let suggested: string;
  if (i.conversation) {
    approach = 'follow_up';
    suggested = `Follow-up: there is a conversation at ${m.accountName} (${i.conversation.responseClass.replace(/_/g, ' ')}). Continue it in the thread; this is not a cold first touch.`;
  } else if (i.fact) {
    approach = 'fact_led';
    suggested = `Fact-led: open with the verified fact, bridge to one question about how it lands on their yards, then a small ask.${ctx ? ` Optional: you may mention ${ctx} if it would feel natural; never as the reason.` : ''}`;
  } else if (i.source.sourceType === 'referral') {
    approach = 'referral_led';
    suggested = `Referral-led: name the introduction (${ctx ?? i.source.name}) and ask for their perspective on how their network handles yard handoffs. No problem is claimed.`;
  } else {
    approach = 'relationship_led';
    suggested = `Relationship-led: ask for their perspective on a topic you share (${ctx ?? i.source.name}). Let them educate you; nothing about them is assumed.`;
  }

  const safety: Opportunity['safety'] = { state: 'ok', lines: [] };
  if (approach === 'relationship_led' || approach === 'referral_led') {
    safety.state = 'caution';
    safety.lines.push(`No verified fact at ${m.accountName}: GAP will not draft a first touch. If you reach out, it is your own note.`);
  }
  if (!m.personaId) {
    safety.state = 'caution';
    safety.lines.push('Staged, not yet a contact: review and promote the person before GAP can prepare outreach.');
  }
  if (approach === 'fact_led' || approach === 'follow_up') safety.lines.push(GATES);

  return {
    memberId: m.id,
    account: m.accountName,
    person: { name: m.name, title: m.title, personaId: m.personaId, staged: !m.personaId },
    source: { name: i.source.name, relationshipContext: ctx, alsoFrom: m.alsoFrom, note: m.note },
    whyAccount: i.fact?.quote ?? null,
    fact: i.fact,
    thesis: i.thesis,
    whyPerson: i.suggestedAngle,
    approach,
    suggestedApproach: suggested,
    learn: i.thesis ? i.thesis.learn : i.fact ? 'No thesis yet: draft one from this fact in Research, then set what to learn.' : null,
    wrongIf: i.thesis?.wrongIf ?? null,
    safety,
    reviewHref: `/gap?lane=research#account-${encodeURIComponent(m.accountName)}`,
  };
}

const RELATIONSHIP_TYPES = new Set(['referral', 'relationship', 'conference', 'newsletter', 'content', 'inbound']);

/**
 * The opportunities in one source: people at EVIDENCE READY accounts (fact-led), and people with a real
 * relationship at accounts still needing research (relationship- or referral-led). Read only.
 */
export async function loadOpportunities(prisma: PrismaLike, workSourceId: string, now: Date, opts: { limit?: number } = {}): Promise<Opportunity[]> {
  const source = await prisma.gapWorkSource.findUnique({ where: { id: workSourceId }, select: { name: true, source_type: true } });
  if (!source) return [];
  const relational = RELATIONSHIP_TYPES.has(source.source_type);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows
  const members: Array<Record<string, any>> = await prisma.gapWorkSourceMember.findMany({
    where: { work_source_id: workSourceId, kind: 'person', status: 'active', account_name: { not: null }, resolution: { in: ['resolved', 'new_candidate'] }, qualification: { in: relational ? ['evidence_ready', 'research'] : ['evidence_ready'] } },
    orderBy: [{ qualification: 'asc' }, { account_name: 'asc' }, { name: 'asc' }],
    take: Math.min(opts.limit ?? 60, 200),
  });
  if (!members.length) return [];
  const accounts = [...new Set(members.map((m) => m.account_name as string))];
  const [inbox, conversations, hyps, personas] = await Promise.all([
    loadEvidenceInbox(prisma, now, { accounts }).catch(() => []),
    loadAccountConversations(prisma, accounts, now).catch(() => new Map()),
    prisma.prospectingHypothesis.findMany({ where: { account_name: { in: accounts }, status: { in: ['draft', 'review_required', 'approved', 'active'] }, superseded_by: { is: null } }, select: { account_name: true, problem_hypothesis: true, falsification_questions: true, what_a_no_means: true }, orderBy: { created_at: 'desc' } }).catch(() => []),
    prisma.persona.findMany({ where: { id: { in: members.map((m) => m.persona_id).filter(Boolean) } }, select: { id: true, title: true } }).catch(() => []),
  ]);
  const box = new Map(inbox.map((a) => [a.accountName, a]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows
  const hypOf = new Map<string, Record<string, any>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw rows
  for (const h of hyps as Array<Record<string, any>>) if (!hypOf.has(h.account_name)) hypOf.set(h.account_name, h);
  const titleOf = new Map((personas as Array<{ id: number; title: string | null }>).map((p) => [p.id, p.title]));
  const out: Opportunity[] = [];
  for (const m of members) {
    const a = box.get(m.account_name);
    const best = a?.ready.find((f) => f.signalId === a.bestSignalId) ?? null;
    // A research-state person is an opportunity only with real relationship context (never "research needed" alone).
    if (!best && !m.relationship_context && !m.note) continue;
    const h = hypOf.get(m.account_name);
    const falsify = Array.isArray(h?.falsification_questions) ? (h!.falsification_questions as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    const title = m.title ?? (m.persona_id ? titleOf.get(m.persona_id) ?? null : null);
    const conv = (conversations as Map<string, { who: string; responseClass: string; at: string }>).get(m.account_name) ?? null;
    out.push(
      proposeOpportunity({
        member: { id: m.id, name: m.name, title, accountName: m.account_name, personaId: m.persona_id, candidateId: m.candidate_id, relationshipContext: m.relationship_context, note: m.note, qualification: m.qualification, alsoFrom: [] },
        source: { name: source.name, sourceType: source.source_type },
        fact: best ? { signalId: best.signalId, quote: best.quote, reason: best.relevance.reason, chain: `${best.chain.kind === 'primary' ? 'PRIMARY SOURCE' : 'SOURCE'} ${best.chain.source.label} · ${best.chain.source.date.slice(0, 10)}${best.chain.currentness ? ` / CURRENTNESS CONFIRMED ${best.chain.currentness.label} · ${best.chain.currentness.date.slice(0, 10)}` : ''}` } : null,
        thesis: h ? { summary: String(h.problem_hypothesis ?? '').slice(0, 200), useLabel: a?.theses[0]?.useLabel ?? null, learn: falsify[0] ?? null, wrongIf: (typeof h.what_a_no_means === 'string' && h.what_a_no_means.trim()) || falsify[1] || null } : null,
        conversation: conv ? { who: conv.who, responseClass: conv.responseClass, at: new Date(conv.at).toISOString() } : null,
        suggestedAngle: suggestAngle({ title, personaKey: null, accountName: m.account_name }),
      }),
    );
  }
  // Fact-led first (the ready ones), then follow-ups, then relationship- and referral-led.
  const order: Record<Approach, number> = { fact_led: 0, follow_up: 1, referral_led: 2, relationship_led: 3 };
  return out.sort((x, y) => order[x.approach] - order[y.approach] || x.account.localeCompare(y.account));
}
