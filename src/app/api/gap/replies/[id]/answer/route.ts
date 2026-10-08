/**
 * GET  /api/gap/replies/[id]/answer   the prepared answer to one buyer reply (R42b): what they asked, the editable text,
 *                                     what GAP can cite (each with its trust word), the missing information, and the
 *                                     answer's states (copied, a Gmail draft, sent)
 * POST /api/gap/replies/[id]/answer
 *   `{ op: 'copied', body }`                              the seller copied the text: recorded, nothing leaves GAP
 *   `{ op: 'draft', body }`                               SAVE AS A GMAIL DRAFT in their thread (not sent)
 *   `{ op: 'send', body }`                                the send preview: exactly what would leave, its content hash
 *   `{ op: 'send', body, confirm: { contentHash, recipient } }`   CONFIRM + SEND of exactly that text to that person
 *
 * GAP OS execution recovery, R42b (2026-10-06). Session only; the draft and the send need an owner (HUMAN_APPROVED_1TO1
 * means Casey). Every gate re-runs in lib/gap/execution/seller-reply.ts and seller-send.ts; the wire re-checks the
 * confirmation, suppression, the restriction and the daily cap. Status: 200 answered (a preview, already sent, a
 * recorded copy, an existing draft), 201 drafted or sent, 409 refused `{ error, detail }`, 404 unknown reply or flag
 * off, 401 no session, 403 not an owner, 400 bad body.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/auth-providers';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { createSellerReplyDraft, loadReplyContext, recordReplyCopied, REPLY_BODY_MAX } from '@/lib/gap/execution/seller-reply';
import { sendSellerReply } from '@/lib/gap/execution/seller-send';
import { forgetPursuitSummary } from '@/lib/gap/pursuit/summary';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const body = z.string().max(REPLY_BODY_MAX + 1);
const Body = z.discriminatedUnion('op', [
  z.object({ op: z.literal('copied'), body }).strict(),
  z.object({ op: z.literal('draft'), body }).strict(),
  z.object({ op: z.literal('send'), body, confirm: z.object({ contentHash: z.string().regex(/^[0-9a-f]{64}$/), recipient: z.string().email() }).strict().optional() }).strict(),
]);

async function session(): Promise<string | null> {
  const email = (await auth())?.user?.email;
  return typeof email === 'string' && email.includes('@') ? email : null;
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  if (!(await session())) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { id } = await context.params;
  const ctx = await loadReplyContext(prisma, decodeURIComponent(id ?? '').trim(), new Date());
  if (!ctx) return NextResponse.json({ error: 'reply_not_found' }, { status: 404 });
  return NextResponse.json({
    message: { id: ctx.message.id, from: ctx.message.from, fromName: ctx.message.fromName, subject: ctx.message.subject, receivedAt: ctx.message.receivedAt },
    accountName: ctx.accountName,
    answer: ctx.answer,
    states: ctx.states,
    blocked: ctx.blocked ? { reason: ctx.blocked.reason, detail: ctx.blocked.detail ?? null } : null,
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED');
  if (skip) return NextResponse.json(skip, { status: 404 });
  const email = await session();
  if (!email) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', field: parsed.error.issues[0]?.path.join('.') || 'body' }, { status: 400 });
  const { id } = await context.params;
  const messageId = decodeURIComponent(id ?? '').trim();
  const b = parsed.data;
  const now = new Date();
  const refused = (r: { reason: string; detail?: string }) => NextResponse.json({ error: r.reason, detail: r.detail ?? null }, { status: r.reason === 'reply_not_found' ? 404 : 409 });
  if (b.op === 'copied') {
    const r = await recordReplyCopied(prisma, { messageId, body: b.body, actor: email, now });
    return r.ok ? NextResponse.json(r) : refused(r);
  }
  // A Gmail draft or a send from the GAP mailbox: HUMAN_APPROVED_1TO1 means Casey.
  if (!isAdminEmail(email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (b.op === 'draft') {
    const r = await createSellerReplyDraft(prisma, { messageId, body: b.body, actor: email, now });
    if (!r.ok) return refused(r);
    return NextResponse.json(r, { status: r.alreadyDrafted ? 200 : 201 });
  }
  const r = await sendSellerReply(prisma, { messageId, body: b.body, actor: email, now, confirm: b.confirm ?? null });
  if (!r.ok) return refused(r);
  if ('preview' in r || r.alreadySent) return NextResponse.json(r, { status: 200 });
  // A proven answer changes what the account page says; the remembered summary must not outlive it.
  if (r.sent.accountName) await forgetPursuitSummary(prisma, r.sent.accountName).catch(() => undefined);
  return NextResponse.json(r, { status: 201 });
}
