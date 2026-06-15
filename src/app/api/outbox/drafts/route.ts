import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Batch-create Outbox drafts for clawd's contact-sourcing pipeline.
 *
 * Auth: x-pounce-token (the shared clawd<->modex write token, same as
 * /api/for/ingest). Path: POST /api/outbox/drafts/ (trailing slash; modex is
 * trailingSlash:true, a missing slash 308s and drops the auth header).
 *
 * Server-side dedup so clawd needs no separate read: an item is skipped if its
 * to_email is already drafted (any campaign) or already sent. Returns per-item
 * status so clawd can log what landed.
 *
 * Body: { items: [ {
 *   campaign_tag, to_email, to_name?, company?, subject, body,
 *   image_url?, status?, source?, owner?, idempotency_key?
 * } ] }
 * Response: { ok, created, skipped, results: [ { to_email, status, reason? } ] }
 */
interface InItem {
  campaign_tag?: string;
  to_email?: string;
  to_name?: string;
  persona_name?: string;
  company?: string;
  account_name?: string;
  subject?: string;
  body?: string;
  image_url?: string;
  status?: string;
  source?: string;
  owner?: string;
  created_by?: string;
  idempotency_key?: string;
}

type ItemStatus = 'created' | 'skipped' | 'error';

export async function POST(request: NextRequest) {
  const token = process.env.POUNCE_INGEST_TOKEN;
  if (!token || request.headers.get('x-pounce-token') !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { items?: InItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ error: 'items[] required' }, { status: 400 });
  if (items.length > 200) return NextResponse.json({ error: 'max 200 items per batch' }, { status: 400 });

  const norm = items.map((it) => ({
    raw: it,
    to_email: (it.to_email ?? '').trim().toLowerCase(),
    subject: (it.subject ?? '').trim(),
    bodyText: it.body ?? '',
  }));
  const emails = [...new Set(norm.map((n) => n.to_email).filter(Boolean))];

  // Bulk dedup: drafted in any campaign, or already sent.
  const [drafted, sent] = await Promise.all([
    prisma.draftQueueItem.findMany({ where: { to_email: { in: emails } }, select: { to_email: true } }),
    prisma.emailLog.findMany({ where: { to_email: { in: emails }, status: 'sent' }, select: { to_email: true } }),
  ]);
  const draftedSet = new Set(drafted.map((d) => d.to_email.toLowerCase()));
  const sentSet = new Set(sent.map((s) => s.to_email.toLowerCase()));

  const results: { to_email: string; status: ItemStatus; reason?: string }[] = [];
  const seenInBatch = new Set<string>();

  for (const n of norm) {
    const it = n.raw;
    if (!n.to_email || !n.subject || !n.bodyText) {
      results.push({ to_email: n.to_email, status: 'error', reason: 'to_email, subject, body required' });
      continue;
    }
    if (seenInBatch.has(n.to_email)) {
      results.push({ to_email: n.to_email, status: 'skipped', reason: 'duplicate_in_batch' });
      continue;
    }
    if (draftedSet.has(n.to_email)) {
      results.push({ to_email: n.to_email, status: 'skipped', reason: 'already_drafted' });
      continue;
    }
    if (sentSet.has(n.to_email)) {
      results.push({ to_email: n.to_email, status: 'skipped', reason: 'already_sent' });
      continue;
    }
    seenInBatch.add(n.to_email);

    const owner = it.owner ?? 'casey@freightroll.com';
    try {
      await prisma.draftQueueItem.create({
        data: {
          to_email: n.to_email,
          account_name: it.company ?? it.account_name ?? '',
          persona_name: it.to_name ?? it.persona_name ?? null,
          subject: n.subject,
          body: n.bodyText,
          image_url: it.image_url ?? null,
          campaign_tag: it.campaign_tag ?? 'allentown-tour',
          status: 'draft',
          source: it.source ?? 'clawd',
          owner,
          created_by: it.created_by ?? owner,
          idempotency_key: it.idempotency_key ?? randomUUID(),
        },
      });
      results.push({ to_email: n.to_email, status: 'created' });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      results.push({
        to_email: n.to_email,
        status: code === 'P2002' ? 'skipped' : 'error',
        reason: code === 'P2002' ? 'already_queued' : 'create_failed',
      });
    }
  }

  const created = results.filter((r) => r.status === 'created').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  return NextResponse.json({ ok: true, created, skipped, results });
}
