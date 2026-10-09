/**
 * THE COCKPIT READ (X01, GAP OS sales execution engine, 2026-10-08): the Work page's `loadCockpit`, moved out of the
 * page component verbatim so the briefing cron and the page read the same thing. Nothing here is new behavior; the
 * history of each read is in the comments it carries (Phase 2, UX-08, R14, R41, R60, R61, R63). Server only.
 */
import { listReplies } from '../replies/list';
import { listAllCurrent } from '../routing/queue';
import { type ReviewWaiting } from '../routing/card-readiness';
import { packHref } from '../account-intel/href';
import { loadThesisGroups, splitThesisWork, orderGroupsForReview, type LoadedGroup } from '../hypothesis/thesis-groups';
import { resolveRoutableHypothesisScope } from '../routing/run';
import { buildNextUpCandidates } from '../routing/next-up';
import { type WorkInput } from './list';
import { loadSendableThesesFor } from '../pursuit/load';
import { loadMotionChoices, loadRecentFirstTouchAccounts, loadAccountConversations } from '../motion/load';
import { laneWithMotion, loadCockpitMotions, type CockpitMotions } from '../motion/cockpit';
import { loadEvidenceInbox } from '../research/inbox';
import { loadInDealsSummary, type InDealsSummary } from '../deals/in-deals';
import { resolveAccountOpportunity } from '../opportunity/active-opportunity';
import { accountsToCheck, loadOpportunityHolds, OPPORTUNITY_HOLD_TIMEOUT_MS } from './opportunity-holds';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

const REPLY_TILE_LIMIT = 50;

export async function loadCockpit(prisma: PrismaLike) {
  const [routableScope, queue, repliesPage, rawGroups, active, inDeals] = await Promise.all([
    resolveRoutableHypothesisScope(prisma),
    listAllCurrent(prisma),
    listReplies(prisma, { state: 'undispositioned', limit: REPLY_TILE_LIMIT }),
    // Every current thesis, one-person ones included, with server-derived actionability.
    loadThesisGroups(prisma, {}, { singletons: true }).catch((): LoadedGroup[] => []),
    prisma.prospectingHypothesis.findMany({ where: { status: 'active', primary_persona_id: { not: null } }, select: { primary_persona_id: true } }),
    // The ONE In Deals answer (tile and lane): open HubSpot deals mapped to GAP accounts, cached minutes, timestamped.
    loadInDealsSummary(prisma).catch((e): InDealsSummary => ({ status: 'unavailable', count: null, accounts: [], unresolved: [], checkedAt: new Date().toISOString(), openDeals: 0, error: e instanceof Error ? e.message : String(e) })),
  ]);
  const groups = orderGroupsForReview(rawGroups);
  const now = new Date();
  // Phase 2 C: one cold email motion per account. A held email card is never READY; it waits as NEXT.
  // A failed motion read shows every card (every send gate still enforces one motion per account).
  // A failed read holds every READY card (fail closed): nothing presents as READY that the click would refuse.
  const motion: CockpitMotions = await loadCockpitMotions(prisma, queue.items, now).catch(() => ({ motions: [], heldCardIds: [], thesisHeldCardIds: queue.items.filter((i) => i.hypothesis?.id).map((i) => i.id) }));
  const held = new Set(motion.heldCardIds);
  const thesisHeld = new Set(motion.thesisHeldCardIds ?? []);
  const lanes = queue.items.map((item) => ({ item, lane: laneWithMotion(item, held, thesisHeld) }));
  const inLane = (lane: string) => lanes.filter((l) => l.lane === lane).map((l) => l.item);

  // REVIEW counts decisions that can succeed, not rows: a shared thesis is ONE review however many
  // people it covers. A thesis the evidence gate rates not ready is RESEARCH, never fake review work.
  const { reviewGroups, readyOneOffIds, researchGroups } = splitThesisWork(groups);
  // Last mile: exactly what the REVIEW lane renders, so a card's "missing thesis" fix links there only
  // when its own thesis is waiting (never to an empty lane).
  const oneOffIds = new Set(readyOneOffIds);
  const reviewMembers = groups.flatMap((g) => (reviewGroups.includes(g) ? g.members : g.members.filter((m) => oneOffIds.has(m.id))));
  const reviewWaiting: ReviewWaiting = {
    hypothesisIds: reviewMembers.map((m) => m.id),
    personaIds: reviewMembers.map((m) => m.primary_persona_id).filter((p): p is number => typeof p === 'number'),
  };

  // People in use with no current card, or a card from before they were in use.
  // Rows activated before APPROVE + USE routed on its own, or whose account's routing failed.
  const cardFor = new Map(queue.items.map((i) => [i.persona.id, i]));
  const unrouted = [...new Set((active as Array<{ primary_persona_id: number | null }>).map((a) => a.primary_persona_id as number))].filter((pid) => {
    const card = cardFor.get(pid);
    return !card || card.action === 'approve_hypothesis' || card.ruleId === 'no_hypothesis';
  }).length;

  const ready = inLane('ready');
  const followUp = inLane('follow_up');
  const research = inLane('research');

  // Phase 2 C5: NEXT UP v2, deterministic rules (lib/gap/routing/next-up.ts), one item per account,
  // never an account held by an open deal or unknown opportunity truth.
  const inbox = await loadEvidenceInbox(prisma, now).catch(() => []);
  const accountsSeen = [...new Set([...queue.items.map((i) => i.account.name), ...groups.map((g) => g.accountName), ...inbox.map((a) => a.accountName)])];
  const [tierRows, expiryRows] = await Promise.all([
    accountsSeen.length ? prisma.account.findMany({ where: { name: { in: accountsSeen } }, select: { name: true, tier: true } }).catch(() => []) : [],
    ready.length
      ? prisma.hypothesisSignal
          .findMany({ where: { hypothesis_id: { in: ready.map((r) => r.hypothesis?.id).filter((x): x is string => !!x) }, role: 'primary' }, select: { hypothesis_id: true, signal: { select: { freshness_expires_at: true } } } })
          .catch(() => [])
      : [],
  ]);
  const tiers = new Map((tierRows as Array<{ name: string; tier: string | null }>).map((t) => [t.name, t.tier]));
  const primaryExpiry = new Map(
    (expiryRows as Array<{ hypothesis_id: string; signal: { freshness_expires_at: Date | null } | null }>).map((r) => [r.hypothesis_id, r.signal?.freshness_expires_at ? new Date(r.signal.freshness_expires_at).toISOString() : null]),
  );
  const oneOffAccount = new Map(groups.flatMap((g) => g.members.map((m) => [m.id, g.accountName] as const)));
  const candidates = buildNextUpCandidates({
      replies: repliesPage.items,
      followUps: followUp,
      ready,
      primaryExpiry,
      reviewGroups: reviewGroups.map((g) => ({ accountName: g.accountName, people: g.members.length })),
      readyOneOffs: readyOneOffIds.map((id) => ({ accountName: oneOffAccount.get(id) ?? '' })),
      researchGroups: researchGroups.map((g) => ({ accountName: g.accountName, people: g.members.filter((m) => m.next === 'find_evidence' || m.next === 'revise').length })),
      researchCards: research,
      inbox: inbox.map((a) => ({ accountName: a.accountName, ready: a.ready.length, people: Math.max(0, ...a.theses.map((t) => t.people)) })),
      tiers,
      // R60: a ready or follow-up card opens its pack page, never the cockpit lane.
      openHref: (_lane, decisionId) => packHref(decisionId),
    });
  // UX-08: WORK, one card per account in the same order, over the same reads (never a second state engine).
  const heldWhy = new Map<string, 'active_opportunity' | 'opportunity_unknown'>();
  for (const it of queue.items) {
    if (it.ruleId === 'opportunity_unknown') heldWhy.set(it.account.name, 'opportunity_unknown');
    else if (it.ruleId === 'active_opportunity' && !heldWhy.has(it.account.name)) heldWhy.set(it.account.name, 'active_opportunity');
  }
  // R14: an account GAP touched (a proven send, an outstanding draft) is Work even when the lanes hold no card for it.
  const recentTouches = await loadRecentFirstTouchAccounts(prisma, now).catch(() => new Map());
  const workAccounts = [...new Set([...candidates.map((c) => c.accountName).filter((x): x is string => !!x), ...repliesPage.items.map((r) => r.accountName), ...inDeals.accounts.map((a) => a.accountName), ...recentTouches.keys()])];
  // What the database alone says per Work account, on every load (no HubSpot): a usable thesis exists; the recorded
  // chosen person. A cold instance then still agrees with the workspace on READY and on research (Pass A blocker).
  const choicesAll = await loadMotionChoices(prisma, workAccounts).catch(() => new Map());
  const chosenIds = [...new Set([...[...choicesAll.values()].map((c) => c.primaryPersonaId), ...[...recentTouches.values()].map((t) => t.personaId).filter((x): x is number => typeof x === 'number')])];
  const personaRows = chosenIds.length ? ((await prisma.persona.findMany({ where: { id: { in: chosenIds } }, select: { id: true, name: true, title: true } }).catch(() => [])) as Array<{ id: number; name: string | null; title: string | null }>) : [];
  const personaById = new Map(personaRows.map((p) => [p.id, p]));
  const dbState = new Map<string, { sendable: boolean; chosen: { name: string; title: string | null } | null }>();
  // R61: one read for every Work account's send gate (it was one read per account, one after another).
  const sendableAll = await loadSendableThesesFor(prisma, workAccounts, now).catch(() => null);
  for (const name of workAccounts) {
    const sendable = sendableAll?.get(name) ?? null;
    if (sendable === null) continue;
    const choice = choicesAll.get(name);
    const p = choice ? personaById.get(choice.primaryPersonaId) : undefined;
    dbState.set(name, { sendable: sendable.size > 0, chosen: p?.name ? { name: p.name, title: p.title } : null });
  }
  // R63-B S12: the gate's own opportunity read for the few accounts Work would offer cold work (a closed deal parks
  // or makes a customer; the page and the gate already say so). Bounded and remembered per instance; never a write.
  const toCheck = accountsToCheck({ candidates, dbState, held: heldWhy, inDeals });
  const opportunityHolds = toCheck.length ? await loadOpportunityHolds(toCheck, (a) => resolveAccountOpportunity(prisma, a, {}, { timeoutMs: OPPORTUNITY_HOLD_TIMEOUT_MS })) : new Map();
  // R63-A B3: each Work account's recorded conversation (the page's own reader, DB only), named by the person GAP holds.
  const convRaw = await loadAccountConversations(prisma, workAccounts, now).catch(() => new Map<string, { who: string; responseClass: string; at: string }>());
  const convEmails = [...new Set([...convRaw.values()].map((c) => c.who).filter((w) => w.includes('@')))];
  const convPeople = convEmails.length ? ((await prisma.persona.findMany({ where: { OR: convEmails.map((e) => ({ email: { equals: e, mode: 'insensitive' } })) }, select: { email: true, name: true } }).catch(() => [])) as Array<{ email: string | null; name: string | null }>) : [];
  const nameByEmail = new Map(convPeople.filter((p) => p.email && p.name).map((p) => [String(p.email).toLowerCase(), String(p.name)]));
  const conversations = new Map([...convRaw].map(([a, c]) => [a, { ...c, name: nameByEmail.get(c.who.toLowerCase()) ?? null }]));
  // The pieces the Work cards are built from; the cards themselves are built at render over the live pursuit summaries.
  const inMotion = new Map<string, { state: 'sent' | 'drafted'; at: string; person: { name: string; title: string | null } | null }>();
  for (const [name, t] of recentTouches) {
    const p = t.personaId != null ? personaById.get(t.personaId) : undefined;
    inMotion.set(name, { state: t.state, at: t.at, person: p?.name ? { name: p.name, title: p.title } : t.recipient ? { name: t.recipient, title: null } : null });
  }
  const workInput: Omit<WorkInput, 'summaries'> = {
    now,
    candidates,
    dbState,
    inMotion,
    replies: repliesPage.items.map((r) => ({ accountName: r.accountName, contactEmail: r.contactEmail, subject: r.subject, snippet: r.snippet, receivedAt: r.receivedAt, id: r.id, threadId: r.threadId ?? null, fromName: r.fromName ?? null, personaId: r.personaId, hubspotContactId: r.hubspotContactId ?? null })),
    mailbox: process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null,
    motions: motion.motions.map((m) => ({ accountName: m.accountName, state: m.state, primary: m.primary ? { name: m.primary.name, title: m.primary.title } : null, next: m.next ? { name: m.next.name, title: m.next.title, unlock: m.next.unlock } : null })),
    // R50: each deal keeps its HubSpot id (an obligation names its deal; Capture binds a note to it by id).
    inDeals: { status: inDeals.status, checkedAt: inDeals.checkedAt, accounts: inDeals.accounts.map((a) => ({ accountName: a.accountName, deals: a.deals.map((d) => ({ ...(d.id ? { id: d.id } : {}), name: d.name, stage: d.stage, lastActivityAt: d.lastActivityAt ?? null, closeDate: d.closeDate ?? null, nextStep: d.nextStep ?? null, contactIds: d.contactIds ?? [] })) })) },
    held: heldWhy,
    opportunityHolds,
    conversations,
  };

  const routableHypotheses = 'tooLarge' in routableScope ? 0 : routableScope.hypothesesCount;
  const routableAccounts = 'tooLarge' in routableScope ? routableScope.accountCount : routableScope.accountNames.length;
  return {
    counts: {
      review: reviewGroups.length + readyOneOffIds.length,
      research: research.length + researchGroups.length,
      ready: ready.length,
      followUp: followUp.length,
      replies: { count: repliesPage.items.length, atLeast: repliesPage.nextCursor !== null },
      deals: { count: inDeals.count, unresolved: inDeals.unresolved.length, checkedAt: inDeals.checkedAt },
    },
    inDeals,
    workInput,
    workAccounts,
    groups: reviewGroups,
    readyOneOffIds,
    researchGroups,
    reviewWaiting,
    motion,
    inbox,
    queueAsOf: queue.asOf,
    unrouted,
    routing: { canRun: routableHypotheses > 0 || queue.items.length > 0, routableHypotheses, routableAccounts },
  };
}

export type CockpitData = Awaited<ReturnType<typeof loadCockpit>>;
