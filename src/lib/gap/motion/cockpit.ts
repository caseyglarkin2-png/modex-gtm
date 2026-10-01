/**
 * Account motion for the cockpit (Phase 2 C): which email cards are READY
 * (one primary per account), which wait as NEXT, which accounts are paused by
 * a reply, and the angles for everyone shown. Read only.
 */
import { checkThesisCurrent, type ThesisCurrentnessCheck } from '../execution/thesis-currentness';
import type { QueueItem } from '../routing/queue';
import { sellerLaneOf } from '../routing/card-readiness';
import { computeAccountMotion, EMAIL_ACTIONS, type AccountMotion } from './account-motion';
import { loadAccountConversations, loadAccountFirstTouches, loadMotionChoices, loadReplyHolds } from './load';
import { loadAngles, suggestAngle, type PersonaAngle } from './persona-angle';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface CockpitAngle {
  personaId: number;
  angle: PersonaAngle | null;
  suggested: string | null;
}

export interface CockpitMotion extends AccountMotion {
  angles: Record<string, CockpitAngle>;
}

export interface CockpitMotions {
  motions: CockpitMotion[];
  /** Email cards that must not be READY now (not the account's motion). */
  heldCardIds: string[];
  /**
   * Execution acceptance: READY cards whose thesis is not the account's current actionable thesis (needs review, or
   * cannot be confirmed). Never READY: they wait in RESEARCH, where the thesis is revised on the current fact.
   */
  thesisHeldCardIds?: string[];
}

export async function loadCockpitMotions(
  prisma: PrismaLike,
  items: readonly QueueItem[],
  now: Date,
  deps: { thesisCurrent?: ThesisCurrentnessCheck } = {},
): Promise<CockpitMotions> {
  // Execution acceptance: the SAME current-actionable-thesis check the click runs, once per thesis on a READY card.
  const readyWithThesis = items.filter((i) => sellerLaneOf(i) === 'ready' && i.hypothesis?.id);
  const theses = [...new Map(readyWithThesis.map((i) => [i.hypothesis!.id, i.account.name])).entries()];
  const check = deps.thesisCurrent ?? checkThesisCurrent;
  const notCurrent = new Set(
    (await Promise.all(theses.map(async ([id, account]) => ((await check(prisma, account, id, now).catch(() => ({ current: 'unknown' as const, reason: '' }))).current === true ? null : id)))).filter(
      (x): x is string => !!x,
    ),
  );
  const thesisHeldCardIds = readyWithThesis.filter((i) => notCurrent.has(i.hypothesis!.id)).map((i) => i.id);
  const thesisHeld = new Set(thesisHeldCardIds);
  const readyEmail = items.filter((i) => EMAIL_ACTIONS.has(i.action) && typeof i.persona.id === 'number' && sellerLaneOf(i) === 'ready' && !thesisHeld.has(i.id));
  const byAccount = new Map<string, QueueItem[]>();
  for (const i of readyEmail) byAccount.set(i.account.name, [...(byAccount.get(i.account.name) ?? []), i]);
  const accounts = [...byAccount.keys()].sort();
  if (accounts.length === 0) return { motions: [], heldCardIds: [], thesisHeldCardIds };

  const emails = new Map<string, string>();
  for (const [a, cards] of byAccount) {
    const e = cards.map((c) => c.persona.email).find((x): x is string => !!x);
    if (e) emails.set(a, e);
  }
  const [choices, touches, holds, conversations] = await Promise.all([
    loadMotionChoices(prisma, accounts),
    loadAccountFirstTouches(prisma, accounts, now),
    loadReplyHolds(prisma, emails, now),
    loadAccountConversations(prisma, accounts, now),
  ]);
  const angles = await loadAngles(prisma, readyEmail.map((c) => c.persona.id as number));
  const hypIds = [...new Set(readyEmail.map((c) => c.hypothesis?.id).filter((x): x is string => !!x))];
  const thesisRole = new Map<string, string | null>(
    hypIds.length ? ((await prisma.prospectingHypothesis.findMany({ where: { id: { in: hypIds } }, select: { id: true, persona: true } })) as Array<{ id: string; persona: string | null }>).map((h) => [h.id, h.persona]) : [],
  );

  const motions: CockpitMotion[] = [];
  const held: string[] = [];
  for (const account of accounts) {
    const cards = byAccount.get(account)!;
    const m = computeAccountMotion({
      accountName: account,
      readyEmailCards: cards.map((c) => ({ id: c.id, action: c.action, account: c.account, persona: c.persona, hypothesis: c.hypothesis ? { ...c.hypothesis, persona: thesisRole.get(c.hypothesis.id) ?? null } : null, createdAt: c.createdAt })),
      choice: choices.get(account) ?? null,
      firstTouches: touches.get(account) ?? [],
      replyHold: holds.get(account) ?? null,
      conversation: conversations.get(account) ?? null,
      now,
    });
    held.push(...m.heldCardIds);
    const a: Record<string, CockpitAngle> = {};
    for (const c of cards) {
      const pid = c.persona.id as number;
      a[String(pid)] = { personaId: pid, angle: angles.get(pid) ?? null, suggested: angles.has(pid) ? null : suggestAngle({ title: c.persona.title, personaKey: c.persona.personaKey, accountName: account }) };
    }
    // Only accounts where the motion changes what Casey sees (more than one person, a pause, or a live motion).
    if (cards.length > 1 || m.state === 'paused_reply' || m.state === 'in_conversation' || m.state === 'in_motion') motions.push({ ...m, angles: a });
  }
  return { motions, heldCardIds: held, thesisHeldCardIds };
}

/**
 * The seller lane with account motion applied: a held email card is never READY. A card whose thesis needs review
 * is never READY either: it waits in RESEARCH, where the thesis is revised on the current fact.
 */
export function laneWithMotion(item: QueueItem, held: ReadonlySet<string>, thesisHeld: ReadonlySet<string> = new Set()): ReturnType<typeof sellerLaneOf> {
  const lane = sellerLaneOf(item);
  if (lane === 'ready' && thesisHeld.has(item.id)) return 'research';
  return lane === 'ready' && held.has(item.id) ? 'later' : lane;
}
