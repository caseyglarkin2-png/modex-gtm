/**
 * THE DEAL WORKSPACE READ (GAP OS execution recovery, Sprint 5, 2026-10-06). Server only. What an account with open
 * HubSpot deals needs to be worked from the deal, read once for the account page:
 *
 *   opportunities   R50: each open deal with its own obligations, confirmed buyer words, contacts and HubSpot next
 *                   step; the account-level rows labeled as such (deals/opportunities.ts over deals/scope.ts)
 *   meetings        R51: one preparation per meeting on record (the Meeting table; no new calendar connector), bound
 *                   to its deal; a canceled one prepares nothing (deals/meeting-prep.ts)
 *   plans           R52: each deal's mutual action plan: agreed milestones (commitments), declined steps and GAP's
 *                   proposals awaiting the seller's one review (deals/action-plan.ts)
 *   artifacts       R53: each deal's next artifact or stakeholder move, prepared (never sent) from its confirmed
 *                   context and plan (deals/artifacts.ts)
 *
 * The deals themselves come from the account read (the opportunity resolver: HubSpot is the deal authority). Every
 * read here is soft: a failed read leaves its part empty and says so, never the page. Nothing here writes.
 */
import { selectConfirmedBids } from '../bid/select';
import { loadCommitments, withPhases } from '../work/commitments';
import type { Commitment, PhaseRead } from '../work/commitment-model';
import { accountSlug } from '../account-intel/href';
import { buildOpportunities, dealRefs, personIndex, bidScope, type OpportunitiesView, type OpportunityBid, type OpportunityDealInput, type OpportunityPerson, type ScopedCommitment, type ScopedNeed } from './opportunities';
import { DEAL_OBJECTIVE, openQuestionsFor, unknownSectionsOfTypes, type BriefBidRow } from './deal-brief';
import { ACCOUNT_LEVEL, type ScopeRead } from './scope';
import { meetingDeal, meetingInstant, meetingState, prepareMeeting, type MeetingPrep } from './meeting-prep';
import { planFor, type Milestone } from './action-plan';
import { loadPlanDecisions } from './action-plan-store';
import { nextArtifact, prepareArtifacts, type PreparedArtifact } from './artifacts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const HUBSPOT_PORTAL = '3819073';

export interface DealWorkspace {
  accountName: string;
  opportunities: OpportunitiesView;
  /** R51: the meetings to prepare (and the canceled ones, said as such), each bound to its deal or account-level. */
  meetings: MeetingPrep[];
  /** R52: each open deal's plan, by deal id. */
  plans: Record<string, Milestone[]>;
  /** R53: each open deal's prepared artifacts and the one it needs now, by deal id. */
  artifacts: Record<string, { next: PreparedArtifact; all: PreparedArtifact[] }>;
  /** The shared scope rule over this account's open deals, for the per-deal briefs. */
  scopeOfBid: (b: BriefBidRow) => ScopeRead;
  /** A part that could not be read, in words. */
  unread: string[];
}

/** What the account page already holds that a meeting preparation reads (never re-read here). */
export interface WorkspaceContext {
  /** The working thesis's problem statements (guesses to test in the room). */
  guesses?: readonly string[];
  /** Verified public facts at the account. */
  publicFacts?: ReadonlyArray<{ quote: string; title: string; url: string | null; publishedAt: string }>;
  /** What already exists for the account (demo pack, microsite, content). */
  materials?: ReadonlyArray<{ label: string; href: string | null }>;
  /** R53: the account's ROI model (MODELED), for the business-case inputs. */
  roi?: { hardSavingsAnnual: number; totalValueAnnual: number; facilities: number; calculatorVersion: string | null; assumptions: readonly string[] } | null;
}

/** Capture opened on one deal: the HubSpot id binds the note's words and obligations to it; the name is the label. */
export function captureHrefFor(accountName: string, deal: { id: string; name: string | null }, extra: Record<string, string> = {}): string {
  return `/gap/capture?${new URLSearchParams({ account: accountName, deal: deal.id, ...(deal.name ? { dealName: deal.name } : {}), from: `account:${accountSlug(accountName)}`, ...extra }).toString()}`;
}

/** The workspace for the account page: the account's commitments read here, with their phase now. */
export async function loadAccountDealWorkspace(prisma: PrismaLike, x: { accountName: string; deals: readonly OpportunityDealInput[]; now: Date } & WorkspaceContext): Promise<DealWorkspace> {
  const commitments = await loadCommitments(prisma, { accountNames: [x.accountName] }).catch(() => null);
  const w = await loadDealWorkspace(prisma, { ...x, commitments: withPhases(commitments ?? [], x.now) });
  return commitments ? w : { ...w, unread: [...w.unread, 'the obligations'] };
}

type MeetingRow = { id: number; meeting_date: Date | null; meeting_time: string | null; meeting_status: string; objective: string | null; persona: string | null; hubspot_deal_id: string | null; created_at: Date; updated_at: Date };

export async function loadDealWorkspace(
  prisma: PrismaLike,
  x: { accountName: string; deals: readonly OpportunityDealInput[]; commitments: ReadonlyArray<Commitment & PhaseRead>; now: Date } & WorkspaceContext,
): Promise<DealWorkspace> {
  const unread: string[] = [];
  const soft = <T,>(p: Promise<T> | null, fallback: T, what: string): Promise<T> =>
    (p ?? Promise.resolve(fallback)).catch(() => {
      unread.push(what);
      return fallback;
    });
  const [people, bidRows, meetingRows, objectiveRows, planDecisions] = await Promise.all([
    soft(prisma.persona?.findMany ? prisma.persona.findMany({ where: { account_name: x.accountName }, select: { id: true, name: true, title: true, email: true, hubspot_contact_id: true }, take: 200 }) : null, [], 'the people at the account'),
    soft(prisma.buyerInputData?.findMany ? prisma.buyerInputData.findMany({ where: { account_name: x.accountName }, select: { id: true, type: true, raw_buyer_language: true, normalized_summary: true, contact_email: true, human_confirmed: true, supersedes_id: true, confirmed_at: true, captured_at: true, metadata: true } }) : null, [], 'what the buyer said'),
    soft(prisma.meeting?.findMany ? prisma.meeting.findMany({ where: { account_name: x.accountName }, select: { id: true, meeting_date: true, meeting_time: true, meeting_status: true, objective: true, persona: true, hubspot_deal_id: true, created_at: true, updated_at: true }, orderBy: { meeting_date: 'desc' }, take: 20 }) : null, [], 'the meetings on record'),
    soft(prisma.gapAuditEvent?.findMany ? prisma.gapAuditEvent.findMany({ where: { kind: DEAL_OBJECTIVE, subject_type: 'account', subject_id: x.accountName }, select: { payload: true }, orderBy: { created_at: 'desc' }, take: 1 }) : null, [], 'your learning objective'),
    soft(x.deals.length ? loadPlanDecisions(prisma, x.accountName) : null, [], 'the plan decisions'),
  ]);
  const persons: OpportunityPerson[] = (people as Array<{ id: number; name: string | null; title: string | null; email: string | null; hubspot_contact_id: string | null }>).map((p) => ({ personaId: p.id, name: p.name ?? `person ${p.id}`, title: p.title ?? null, email: p.email ?? null, hubspotContactId: p.hubspot_contact_id ? String(p.hubspot_contact_id) : null }));
  type BidRow = { id: string; type: string; raw_buyer_language: string; normalized_summary: string | null; contact_email: string | null; human_confirmed: boolean; supersedes_id: string | null; confirmed_at: Date | string | null; captured_at: Date | string; metadata: unknown };
  const confirmed = selectConfirmedBids((bidRows as BidRow[]).map((b) => ({ ...b, id: String(b.id), humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id ?? null })));
  const bids: OpportunityBid[] = confirmed.map((b) => ({ id: String(b.id), type: String(b.type), quote: String(b.raw_buyer_language), summary: (b.normalized_summary as string | null) ?? null, contactEmail: String(b.contact_email ?? '').toLowerCase(), at: new Date(b.confirmed_at ?? b.captured_at).toISOString(), metadata: b.metadata }));
  const opportunities = buildOpportunities({
    accountName: x.accountName,
    deals: x.deals,
    people: persons,
    commitments: x.commitments,
    bids,
    captureHref: (d) => captureHrefFor(x.accountName, d),
    hubspotDealHref: (id) => `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL}/record/0-3/${id}`,
  });
  const refs = dealRefs(x.deals);
  const personOf = personIndex(persons);
  const objectiveText = (() => {
    const p = (objectiveRows as Array<{ payload: { text?: unknown } | null }>)[0]?.payload;
    return typeof p?.text === 'string' && p.text.trim() ? p.text.trim() : null;
  })();

  // R51: one preparation per meeting on record: upcoming ones, and canceled ones not long past (said as canceled).
  const meetings: MeetingPrep[] = [];
  for (const r of meetingRows as MeetingRow[]) {
    const at = meetingInstant(r.meeting_date, r.meeting_time);
    const row = { id: r.id, at: at ? at.toISOString() : null, status: r.meeting_status, objective: r.objective, attendees: r.persona, dealId: r.hubspot_deal_id ?? null, createdAt: new Date(r.created_at).toISOString(), updatedAt: new Date(r.updated_at ?? r.created_at).toISOString() };
    const state = meetingState(row, x.now);
    if (/no meeting/i.test(r.meeting_status) || state === 'past' || (state === 'canceled' && at && at.getTime() < x.now.getTime() - 2 * 86_400_000)) continue;
    const own = meetingDeal(row, opportunities.deals.map((d) => ({ ...d, id: d.dealId })));
    const commitments: ScopedCommitment[] = own ? [...own.commitments, ...opportunities.accountLevel.commitments] : [...opportunities.deals.flatMap((d) => d.commitments), ...opportunities.accountLevel.commitments];
    const needs: ScopedNeed[] = own ? [...own.needs, ...opportunities.accountLevel.needs] : [...opportunities.deals.flatMap((d) => d.needs), ...opportunities.accountLevel.needs];
    meetings.push(
      prepareMeeting({
        meeting: row,
        now: x.now,
        deal: own ? { id: own.dealId, name: own.name, contacts: own.contacts } : null,
        people: persons.map((p) => ({ name: p.name, title: p.title })),
        commitments: commitments.map((c) => ({ title: c.title, kind: c.kind, status: c.status, line: c.line, createdAt: c.createdAt, updatedAt: c.updatedAt, person: c.person ? { name: c.person.name } : null, scopeLabel: c.scope.label })),
        needs: needs.map((n) => ({ type: n.type, quote: n.quote, who: n.who, at: n.at, scopeLabel: n.scope.basis === 'none' ? ACCOUNT_LEVEL : n.scope.label })),
        unknownQuestions: openQuestionsFor(unknownSectionsOfTypes(needs.map((n) => n.type))),
        learningObjective: objectiveText,
        guesses: x.guesses ?? [],
        publicFacts: x.publicFacts ?? [],
        materials: x.materials ?? [],
      }),
    );
  }
  meetings.sort((a, b) => String(a.at ?? '9999').localeCompare(String(b.at ?? '9999')));
  const plans = Object.fromEntries(x.deals.map((d) => [d.id, planFor(d.id, x.commitments.filter((c) => c.dealId === d.id), planDecisions)]));
  // R53: the deal's own confirmed words (and the labeled account-level ones), its plan and its open obligations.
  const artifacts = Object.fromEntries(
    opportunities.deals.map((d) => {
      const needs = [...d.needs, ...opportunities.accountLevel.needs].sort((a, b) => a.at.localeCompare(b.at)).map((n) => ({ id: n.id, type: n.type, quote: n.quote, who: n.who, at: n.at, accountLevel: n.scope.basis === 'none' }));
      const input = { accountName: x.accountName, deal: { id: d.dealId, name: d.name, contacts: d.contacts }, needs, plan: plans[d.dealId] ?? [], commitments: d.commitments.map((c) => ({ commitmentId: c.commitmentId, kind: c.kind, title: c.title, line: c.line, dueAt: c.dueAt })), roi: x.roi ?? null };
      const all = prepareArtifacts(input);
      return [d.dealId, { next: nextArtifact(all, input), all }];
    }),
  );
  return { accountName: x.accountName, opportunities, meetings, plans, artifacts, scopeOfBid: (b) => bidScope({ metadata: b.metadata, contactEmail: b.contact_email }, refs, personOf), unread };
}
