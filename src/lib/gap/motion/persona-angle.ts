/**
 * PersonaAngle (Phase 2 C1, 2026-09-28): ONE human-owned line answering
 * "why this person?" for a person inside an account motion.
 *
 *   "Owns the NA beverage DC network where autonomous linehaul terminates."
 *
 * It is not a public fact and not buyer-facing copy. The machine may SUGGEST
 * a draft from the person's title and persona key only (no LinkedIn, nothing
 * inferred about secret or internal responsibilities); a suggestion is
 * labelled suggested and never authoritative. Casey accepts or edits it, and
 * the accepted text is the angle.
 *
 * Storage: the append-only GAP audit ledger (kind `persona.angle`, subject
 * the persona), the same no-new-table decision as the draft ledger. The
 * newest row wins; every earlier version stays. It is keyed on the PERSON,
 * so it survives hypothesis revision.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const PERSONA_ANGLE = 'persona.angle' as const;
export const ANGLE_MAX = 240;

export interface PersonaAngle {
  personaId: number;
  text: string;
  source: 'human' | 'accepted_suggestion';
  by: string;
  at: string;
}

/** The newest accepted angle per person. */
export async function loadAngles(prisma: PrismaLike, personaIds: readonly number[]): Promise<Map<number, PersonaAngle>> {
  const ids = [...new Set(personaIds.filter((id) => Number.isInteger(id)))];
  const out = new Map<number, PersonaAngle>();
  if (ids.length === 0) return out;
  const rows: Array<{ subject_id: string; actor: string; payload: Record<string, unknown>; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: PERSONA_ANGLE, subject_type: 'persona', subject_id: { in: ids.map(String) } },
    select: { subject_id: true, actor: true, payload: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  for (const r of rows) {
    const id = Number(r.subject_id);
    if (out.has(id)) continue;
    const text = typeof r.payload?.text === 'string' ? r.payload.text.trim() : '';
    if (!text) continue;
    out.set(id, { personaId: id, text, source: r.payload?.source === 'accepted_suggestion' ? 'accepted_suggestion' : 'human', by: r.actor, at: new Date(r.created_at).toISOString() });
  }
  return out;
}

export type AngleRefusal = 'empty' | 'too_long' | 'persona_not_found';

export interface AnchorChoice {
  personaId: number;
  hypothesisId: string;
  by: string;
  at: string;
}

/** UX-06 (Option A): the newest anchor choice per person (a `persona.angle` row carrying `anchorHypothesisId`). */
export async function loadAnchorChoices(prisma: PrismaLike, personaIds: readonly number[]): Promise<Map<number, AnchorChoice>> {
  const ids = [...new Set(personaIds.filter((id) => Number.isInteger(id)))];
  const out = new Map<number, AnchorChoice>();
  if (ids.length === 0) return out;
  const rows: Array<{ subject_id: string; actor: string; payload: Record<string, unknown>; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: PERSONA_ANGLE, subject_type: 'persona', subject_id: { in: ids.map(String) } },
    select: { subject_id: true, actor: true, payload: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  for (const r of rows) {
    const id = Number(r.subject_id);
    if (out.has(id)) continue;
    const hypothesisId = typeof r.payload?.anchorHypothesisId === 'string' ? r.payload.anchorHypothesisId.trim() : '';
    if (!hypothesisId) continue;
    out.set(id, { personaId: id, hypothesisId, by: r.actor, at: new Date(r.created_at).toISOString() });
  }
  return out;
}

export type AnchorRefusal = 'persona_not_found' | 'hypothesis_not_open_here';

/**
 * UX-06 (Option A): record which approved or active thesis at the person's account is their outreach anchor.
 * Append-only; the newest wins. The thesis must be an open one at the SAME account; nothing else is checked here
 * (the pack, the compiler and the approval run their own gates when the email is built).
 */
export async function setAnchor(prisma: PrismaLike, input: { personaId: number; hypothesisId: string; actor: string }): Promise<{ ok: true; anchor: AnchorChoice } | { ok: false; reason: AnchorRefusal }> {
  const persona: { id: number; account_name: string } | null = await prisma.persona.findUnique({ where: { id: input.personaId }, select: { id: true, account_name: true } });
  if (!persona) return { ok: false, reason: 'persona_not_found' };
  const h: { id: string; account_name: string; status: string } | null = await prisma.prospectingHypothesis.findUnique({ where: { id: input.hypothesisId }, select: { id: true, account_name: true, status: true } });
  if (!h || h.account_name !== persona.account_name || !['approved', 'active', 'confirmed', 'partially_confirmed'].includes(h.status)) return { ok: false, reason: 'hypothesis_not_open_here' };
  const row = await prisma.gapAuditEvent.create({
    data: { kind: PERSONA_ANGLE, actor: input.actor, subject_type: 'persona', subject_id: String(input.personaId), payload: { accountName: persona.account_name, anchorHypothesisId: h.id, source: 'human' } },
    select: { created_at: true },
  });
  return { ok: true, anchor: { personaId: input.personaId, hypothesisId: h.id, by: input.actor, at: new Date(row?.created_at ?? Date.now()).toISOString() } };
}

/** Record Casey's angle (append-only). */
export async function setAngle(
  prisma: PrismaLike,
  input: { personaId: number; text: string; source: 'human' | 'accepted_suggestion'; actor: string },
): Promise<{ ok: true; angle: PersonaAngle } | { ok: false; reason: AngleRefusal }> {
  const text = input.text.replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (text.length > ANGLE_MAX) return { ok: false, reason: 'too_long' };
  const persona: { id: number; account_name: string } | null = await prisma.persona.findUnique({ where: { id: input.personaId }, select: { id: true, account_name: true } });
  if (!persona) return { ok: false, reason: 'persona_not_found' };
  const row = await prisma.gapAuditEvent.create({
    data: { kind: PERSONA_ANGLE, actor: input.actor, subject_type: 'persona', subject_id: String(input.personaId), payload: { accountName: persona.account_name, text, source: input.source } },
    select: { created_at: true },
  });
  return { ok: true, angle: { personaId: input.personaId, text, source: input.source, by: input.actor, at: new Date(row?.created_at ?? Date.now()).toISOString() } };
}

/**
 * A SUGGESTED angle from the title and persona key alone. Deterministic; it
 * says what the role usually owns and what to learn from it, never a claim
 * about this person's actual responsibilities. Null when the title gives
 * nothing to go on (then Casey writes it).
 */
export function suggestAngle(p: { title: string | null; personaKey: string | null; accountName: string }): string | null {
  const t = (p.title ?? '').toLowerCase();
  const a = p.accountName;
  if (!t.trim()) return null;
  if (/\b(chief|cso|csco|coo)\b|chief (supply|operating)/.test(t)) return `Executive owner of the ${a} network; would sponsor a yard program rather than run it. Learn what they already measure about site capacity limits.`;
  // An individual contributor is close to the work, never its owner: never tell them they run or own it.
  if (/\b(specialist|analyst|coordinator|associate|assistant|intern|planner|representative|clerk)\b/.test(t) && !/\b(yard|dock|gate|receiving|shipping)\b/.test(t) && !/\b(vice president|president|vp|svp|evp|avp|director|head|manager|general manager)\b/.test(t)) return `Close to the day-to-day ${/transport|freight|carrier|fleet|logistics/.test(t) ? 'transportation' : /distribution|warehouse|fulfil/.test(t) ? 'distribution' : 'supply chain'} work at ${a}; may see where trucks wait without owning the decision. Learn who owns yard performance.`;
  // A title that spans functions ("Manufacturing and logistics operations leader") shows no single ownership.
  const spans = [/\b(manufactur\w*|plants?|production)\b/, /\b(transport\w*|freight|carriers?|fleet|logistics)\b/, /\b(distribution|warehous\w*|fulfil\w*)\b/]
    .map((re) => re.exec(t))
    .filter((m): m is RegExpExecArray => !!m)
    .sort((x, y) => x.index - y.index);
  if (spans.length >= 2) return `Title spans ${spans.map((m) => m[1]).join(' and ')} at ${a}; which part they own is not known. Learn who owns yard performance.`;
  if (/transport|freight|carrier|fleet/.test(t) && /procure|sourcing|buyer|category/.test(t)) return `Buys transportation for ${a}; may see detention and dwell charges before operations does. Learn whether carrier dwell shows up in their costs.`;
  if (/transport|freight|carrier|fleet|logistics/.test(t)) return `Runs transportation at ${a}, so carrier dwell and detention are visible to them. Learn whether their yards are where trucks wait.`;
  if (/distribution|\bdc\b|warehouse|fulfil/.test(t)) return `Runs distribution at ${a}: the dock and yard are where arrival variability shows up first. Learn how trailers are staged and found.`;
  if (/yard|dock|gate|receiving|shipping/.test(t)) return `Works the yard and dock at ${a} every day. Learn how trailers are found, moved and checked in today.`;
  if (/security|compliance|safety/.test(t)) return `Owns site security or compliance at ${a}; gate check-in and driver identity sit with them. Learn how the gate is controlled today.`;
  if (/plant|site|manufactur|production/.test(t)) return `Runs a site at ${a}, where inbound trailers feed production. Learn whether late or missing trailers ever stop the line.`;
  if (/supply chain|operations|network/.test(t)) return `Owns the ${a} supply chain network the DCs and plants sit in. Learn whether yard capacity limits what the network can move.`;
  if (/procure|sourcing|finance/.test(t)) return `Controls spend at ${a}; would weigh yard cost against production capacity. Learn who owns yard costs today.`;
  return null;
}
