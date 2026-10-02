/**
 * DOGFOOD NOTES (stabilization E): Casey's one-tap product feedback while using GAP. Durable dogfood memory, nothing
 * else: a note never edits code, opens a PR or issue, changes product behavior or touches seller state.
 *
 * Storage is the append-only audit table (no migration): a note is a `feedback.note` row; a status change is a
 * `feedback.status` row on the same subject. The current status is the newest status row.
 *
 * Context is captured from a closed allowlist of safe fields (route, lane, object ids, build, viewport, the error
 * code on screen). Never cookies, headers, tokens, keys, passwords or page text: anything else is dropped.
 */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { FeedbackItem } from './packet';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const FEEDBACK_NOTE = 'feedback.note' as const;
export const FEEDBACK_STATUS = 'feedback.status' as const;
export const FEEDBACK_TYPES = ['bug', 'friction', 'data', 'research', 'copy', 'idea', 'keep', 'other'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export const FEEDBACK_STATUSES = ['open', 'later', 'fixed', 'dismissed'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
export const NOTE_MAX = 4_000;

const id = z.string().trim().max(120);
/** The ONLY context a note may carry. Unknown keys are dropped, never stored. */
export const FeedbackContext = z
  .object({
    route: z.string().trim().max(300).optional(),
    lane: id.optional(),
    accountName: z.string().trim().max(200).optional(),
    accountSlug: id.optional(),
    personId: id.optional(),
    signalId: id.optional(),
    sourceUrl: z.string().trim().max(500).optional(),
    hypothesisId: id.optional(),
    cardId: id.optional(),
    surface: id.optional(),
    viewport: z.object({ w: z.number().int().min(0).max(20_000), h: z.number().int().min(0).max(20_000) }).optional(),
    device: z.enum(['phone', 'tablet', 'desktop']).optional(),
    errorCode: id.optional(),
  })
  .strip();
export type FeedbackContext = z.infer<typeof FeedbackContext>;

/** A route or URL with any query value that could carry a secret removed (token, code, key, session, auth...). */
export function safeRoute(route: string | undefined): string | undefined {
  if (!route) return route;
  try {
    const u = new URL(route, 'https://gap.local');
    for (const k of [...u.searchParams.keys()]) if (/token|code|key|secret|session|auth|password|cookie|sig/i.test(k)) u.searchParams.delete(k);
    return `${u.pathname}${u.search}`;
  } catch {
    return undefined;
  }
}

export function sanitizeContext(raw: unknown): FeedbackContext {
  const parsed = FeedbackContext.safeParse(raw ?? {});
  const c = parsed.success ? parsed.data : {};
  // A source link keeps its page, never its query string.
  return { ...c, route: safeRoute(c.route), sourceUrl: c.sourceUrl && /^https?:\/\//.test(c.sourceUrl) ? c.sourceUrl.split('?')[0] : undefined };
}


export async function createNote(
  prisma: PrismaLike,
  input: { note: string; type?: FeedbackType | null; context?: unknown; actor: string; now: Date; build?: string | null },
): Promise<{ ok: true; id: string } | { ok: false; reason: 'note_required' | 'note_too_long' }> {
  const note = input.note.trim();
  if (!note) return { ok: false, reason: 'note_required' };
  if (note.length > NOTE_MAX) return { ok: false, reason: 'note_too_long' };
  const noteId = randomUUID();
  await prisma.gapAuditEvent.create({
    data: {
      kind: FEEDBACK_NOTE,
      actor: input.actor,
      subject_type: 'feedback',
      subject_id: noteId,
      created_at: input.now,
      payload: { note, type: input.type ?? null, context: sanitizeContext(input.context), build: input.build ?? null },
    },
  });
  return { ok: true, id: noteId };
}

export async function setFeedbackStatus(prisma: PrismaLike, input: { id: string; status: FeedbackStatus; actor: string; now: Date }): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
  const exists = await prisma.gapAuditEvent.findFirst({ where: { kind: FEEDBACK_NOTE, subject_type: 'feedback', subject_id: input.id }, select: { id: true } });
  if (!exists) return { ok: false, reason: 'not_found' };
  await prisma.gapAuditEvent.create({ data: { kind: FEEDBACK_STATUS, actor: input.actor, subject_type: 'feedback', subject_id: input.id, created_at: input.now, payload: { status: input.status } } });
  return { ok: true };
}

export async function listFeedback(prisma: PrismaLike, opts: { limit?: number } = {}): Promise<FeedbackItem[]> {
  const notes: Array<{ subject_id: string; actor: string; created_at: Date; payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({
    where: { kind: FEEDBACK_NOTE, subject_type: 'feedback' },
    orderBy: { created_at: 'desc' },
    take: opts.limit ?? 500,
    select: { subject_id: true, actor: true, created_at: true, payload: true },
  });
  const statuses: Array<{ subject_id: string; created_at: Date; payload: Record<string, unknown> | null }> = notes.length
    ? await prisma.gapAuditEvent.findMany({ where: { kind: FEEDBACK_STATUS, subject_type: 'feedback', subject_id: { in: notes.map((n) => n.subject_id) } }, orderBy: { created_at: 'desc' }, select: { subject_id: true, created_at: true, payload: true } })
    : [];
  const latest = new Map<string, { status: FeedbackStatus; at: string }>();
  for (const s of statuses) {
    const st = s.payload?.status;
    if (!latest.has(s.subject_id) && typeof st === 'string' && (FEEDBACK_STATUSES as readonly string[]).includes(st)) latest.set(s.subject_id, { status: st as FeedbackStatus, at: new Date(s.created_at).toISOString() });
  }
  return notes.map((n) => {
    const p = n.payload ?? {};
    const type = typeof p.type === 'string' && (FEEDBACK_TYPES as readonly string[]).includes(p.type) ? (p.type as FeedbackType) : null;
    return {
      id: n.subject_id,
      note: String(p.note ?? ''),
      type,
      status: latest.get(n.subject_id)?.status ?? 'open',
      statusAt: latest.get(n.subject_id)?.at ?? null,
      context: sanitizeContext(p.context),
      build: typeof p.build === 'string' ? p.build : null,
      createdAt: new Date(n.created_at).toISOString(),
      actor: n.actor,
    };
  });
}

export { debugPacket } from './packet';
export type { FeedbackItem } from './packet';
