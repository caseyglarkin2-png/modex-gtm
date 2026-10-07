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
 *   crm             R54: each deal's HubSpot changes: the exact candidates (the recap as a note, a task per open
 *                   obligation, the next step from the plan) and every proposal already recorded with its state
 *                   (deals/crm-model.ts; nothing is written without the seller's approval click)
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
import { ACCOUNT_LEVEL, closedDealLabel, type ClosedDealRef, type ScopeRead } from './scope';
import { meetingDeal, meetingInstant, meetingState, prepareMeeting, type MeetingPrep } from './meeting-prep';
import { planFor, type Milestone } from './action-plan';
import { loadPlanDecisions } from './action-plan-store';
import { ARTIFACT_USED, nextArtifact, prepareArtifacts, type PreparedArtifact } from './artifacts';
import { crmCandidates, type CrmChange, type CrmOrigin, type CrmSyncItem } from './crm-model';
import { loadCrmSync } from '../crm-sync';
import { stalledSignals } from './stalled';

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
  /** R55: each open deal's stalled-work suggestions (overdue obligations, no recent activity, a passed close date). */
  stalled: Record<string, string[]>;
  /** R54: each open deal's HubSpot change candidates and recorded proposals, by deal id. */
  crm: Record<string, { candidates: Array<{ change: CrmChange; origin: CrmOrigin }>; items: CrmSyncItem[] }>;
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
  /** Sprint 5 review: the deals HubSpot holds as closed here (a meeting on one reads that deal's rows, named). */
  closedDeals?: readonly ClosedDealRef[];
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

type UsedRow = { payload: Record<string, unknown> | null; created_at: Date | string };

/** Batch item 8: the last recap sent back on a deal: copied by the seller (ARTIFACT_USED), or written to HubSpot. */
export function recapSentAtOf(used: readonly UsedRow[], crm: readonly CrmSyncItem[], dealId: string): string | null {
  const copied = used.filter((r) => r.payload?.dealId === dealId && r.payload?.kind === 'recap').map((r) => new Date(r.created_at).toISOString());
  const written = crm.filter((it) => it.dealId === dealId && it.origin.kind === 'recap' && it.state === 'written').map((it) => it.lastAttemptAt ?? it.approvedAt).filter((v): v is string => !!v);
  return [...copied, ...written].sort().pop() ?? null;
}

/** Batch item 9: the obligations done in GAP whose HubSpot task was written on this deal (one completion each). */
export function completionsOf(crm: readonly CrmSyncItem[], commitments: ReadonlyArray<Pick<Commitment, 'commitmentId' | 'status' | 'title'>>, dealId: string): Array<{ commitmentId: string; title: string }> {
  const done = new Map(commitments.filter((c) => c.status === 'done').map((c) => [c.commitmentId, c]));
  return crm.filter((it) => it.dealId === dealId && it.change.kind === 'task' && it.origin.kind === 'commitment' && it.state === 'written' && done.has(it.origin.id)).map((it) => ({ commitmentId: it.origin.id, title: done.get(it.origin.id)!.title }));
}

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
  const [people, bidRows, meetingRows, objectiveRows, planDecisions, crmItems, usedRows] = await Promise.all([
    soft(prisma.persona?.findMany ? prisma.persona.findMany({ where: { account_name: x.accountName }, select: { id: true, name: true, title: true, email: true, hubspot_contact_id: true }, take: 200 }) : null, [], 'the people at the account'),
    soft(prisma.buyerInputData?.findMany ? prisma.buyerInputData.findMany({ where: { account_name: x.accountName }, select: { id: true, type: true, raw_buyer_language: true, normalized_summary: true, contact_email: true, human_confirmed: true, supersedes_id: true, confirmed_at: true, captured_at: true, metadata: true } }) : null, [], 'what the buyer said'),
    soft(prisma.meeting?.findMany ? prisma.meeting.findMany({ where: { account_name: x.accountName }, select: { id: true, meeting_date: true, meeting_time: true, meeting_status: true, objective: true, persona: true, hubspot_deal_id: true, created_at: true, updated_at: true }, orderBy: { meeting_date: 'desc' }, take: 20 }) : null, [], 'the meetings on record'),
    soft(prisma.gapAuditEvent?.findMany ? prisma.gapAuditEvent.findMany({ where: { kind: DEAL_OBJECTIVE, subject_type: 'account', subject_id: x.accountName }, select: { payload: true }, orderBy: { created_at: 'desc' }, take: 1 }) : null, [], 'your learning objective'),
    soft(x.deals.length ? loadPlanDecisions(prisma, x.accountName) : null, [], 'the plan decisions'),
    soft(x.deals.length ? loadCrmSync(prisma, x.accountName) : null, [], 'the HubSpot changes'),
    // Batch item 8: the artifacts the seller used (a copied recap), so the recap is not the next move again.
    soft(x.deals.length && prisma.gapAuditEvent?.findMany ? prisma.gapAuditEvent.findMany({ where: { kind: ARTIFACT_USED, subject_type: 'account', subject_id: x.accountName }, select: { payload: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 50 }) : null, [], 'the artifacts you used'),
  ]);
  const recapSentAt = (dealId: string) => recapSentAtOf(usedRows as UsedRow[], crmItems as CrmSyncItem[], dealId);
  // Batch item 9: an obligation done in GAP whose task is in HubSpot proposes completing that task.
  const completionsFor = (dealId: string) => completionsOf(crmItems as CrmSyncItem[], x.commitments, dealId);
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
    closedDeals: x.closedDeals ?? [],
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
    // Sprint 5 review (R50 / R51): a meeting reads its OWN deal's rows and the account-level ones. A meeting whose row
    // names a deal that is no longer open reads that deal's kept rows (named with its outcome), never the open deals'.
    // A meeting bound to no deal (a joint one) reads every deal's rows, each line labeled with its deal.
    const closedId = !own && row.dealId ? row.dealId : null;
    const closedRef = closedId ? (x.closedDeals ?? []).find((c) => c.id === closedId) ?? null : null;
    // A deal id that matches no open deal reads back as `deal <id>` (scope.ts resolveDealRef).
    const onClosed = <T extends { scope: { unmatched: string | null } }>(xs: readonly T[]) => xs.filter((r) => r.scope.unmatched === `deal ${closedId}`);
    const commitments: ScopedCommitment[] = own
      ? [...own.commitments, ...opportunities.accountLevel.commitments]
      : closedId
        ? [...onClosed(opportunities.elsewhere.commitments), ...opportunities.accountLevel.commitments]
        : [...opportunities.deals.flatMap((d) => d.commitments), ...opportunities.accountLevel.commitments];
    const needs: ScopedNeed[] = own
      ? [...own.needs, ...opportunities.accountLevel.needs]
      : closedId
        ? [...onClosed(opportunities.elsewhere.needs), ...opportunities.accountLevel.needs]
        : [...opportunities.deals.flatMap((d) => d.needs), ...opportunities.accountLevel.needs];
    meetings.push(
      prepareMeeting({
        meeting: row,
        now: x.now,
        deal: own ? { id: own.dealId, name: own.name, contacts: own.contacts } : closedId ? { id: closedId, name: closedRef ? closedDealLabel(closedRef).replace(/^Deal: /, '') : 'a deal that is not open here', contacts: [] } : null,
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
      return [d.dealId, { next: nextArtifact(all, { ...input, recapSentAt: recapSentAt(d.dealId) }), all }];
    }),
  );
  // R54: the exact HubSpot changes GAP may propose for each deal, beside the ones already recorded.
  const crm = Object.fromEntries(
    opportunities.deals.map((d) => {
      const recap = artifacts[d.dealId]?.all.find((a) => a.kind === 'recap') ?? null;
      const next = (plans[d.dealId] ?? []).find((m) => m.state === 'agreed' && m.phase !== 'done' && m.phase !== 'skipped' && m.commitmentId) ?? null;
      const candidates = crmCandidates({
        deal: { id: d.dealId, name: d.name, nextStep: d.nextStep },
        recap: recap ? { text: recap.text, ready: recap.problems.length === 0 && recap.citations.some((c) => c.ref.startsWith('bid:')) } : null,
        commitments: d.commitments.filter((c) => c.source.kind !== 'plan').map((c) => ({ commitmentId: c.commitmentId, kind: c.kind, title: c.title, basis: c.basis, dueAt: c.dueAt, status: c.status })),
        nextMilestone: next ? { commitmentId: next.commitmentId!, title: next.title, dueDay: next.dueDay } : null,
        completions: completionsFor(d.dealId),
      });
      return [d.dealId, { candidates, items: (crmItems as CrmSyncItem[]).filter((it) => it.dealId === d.dealId) }];
    }),
  );
  const stalled = Object.fromEntries(opportunities.deals.map((d) => [d.dealId, stalledSignals({ now: x.now, deal: { name: d.name, lastActivityAt: d.lastActivityAt, closeDate: d.closeDate, contact: d.contacts[0]?.name ?? null }, commitments: d.commitments.map((c) => ({ title: c.title, kind: c.kind, status: c.status, dueAt: c.dueAt, person: c.person ? { name: c.person.name, email: c.person.email } : null })) })]));
  return { accountName: x.accountName, opportunities, meetings, plans, artifacts, crm, stalled, scopeOfBid: (b) => bidScope({ metadata: b.metadata, contactEmail: b.contact_email }, refs, personOf, x.closedDeals ?? []), unread };
}
