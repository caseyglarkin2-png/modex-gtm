import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { prisma } from '@/lib/prisma';
import { fetchTamCompanies, fetchAssociatedContactIds, readContacts } from '@/lib/revops/qualification/evaluate';
import { hasAccountIntent } from '@/lib/revops/qualification/model';
import { selectWarmCommitteeTargets, buildWarmDraftBatchPayload } from '@/lib/discovery/warm-committee';
import { dispatchDraftBatch } from '@/lib/discovery/clawd-dispatch';
import { isOutreachPaused } from '@/lib/feature-flags';
import { STATUS } from '@/lib/queue/types';
import type { QualContact } from '@/lib/revops/qualification/types';

export const dynamic = 'force-dynamic';

const OWNER = 'casey@freightroll.com';
const MAX_ACCOUNTS = Number(process.env.WARM_DISPATCH_MAX_ACCOUNTS || '25');

// OFF by default. This is the WARM half of the outreach spine: it hands warm
// accounts + their committee to Clawd (spear_factory drafts the legit 1:1 copy),
// which stages drafts back into the Draft Queue for the guarded send path. Flip
// WARM_DISPATCH_ENABLED=true to arm it; OUTREACH_PAUSED halts it alongside the
// queue drain.
function enabled(): boolean {
  return (process.env.WARM_DISPATCH_ENABLED || 'false').toLowerCase() === 'true';
}

/** An email is off-limits if it unsubscribed, has ANY prior EmailLog send, or
 * sits in an ACTIVE (not sent/skipped/failed) queue row. Best-effort first pass
 * so we never hand Clawd a person mid-thread; the send-time guards + the partial
 * unique index remain the authoritative backstop. Emails are lowercased on the
 * way in (QualContact + DraftQueueItem both lowercase). */
async function buildSuppressionSet(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const [unsub, emailed, queued] = await Promise.all([
    prisma.unsubscribedEmail.findMany({ where: { email: { in: emails } }, select: { email: true } }),
    prisma.emailLog.findMany({ where: { to_email: { in: emails } }, distinct: ['to_email'], select: { to_email: true } }),
    prisma.draftQueueItem.findMany({
      where: { to_email: { in: emails }, status: { notIn: [STATUS.sent, STATUS.skipped, STATUS.failed] } },
      distinct: ['to_email'], select: { to_email: true },
    }),
  ]);
  const s = new Set<string>();
  for (const r of unsub) s.add((r.email || '').toLowerCase());
  for (const r of emailed) s.add((r.to_email || '').toLowerCase());
  for (const r of queued) s.add((r.to_email || '').toLowerCase());
  return s;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!enabled()) return NextResponse.json({ skipped: true, reason: 'WARM_DISPATCH_ENABLED=false' });
  if (isOutreachPaused()) return NextResponse.json({ skipped: true, reason: 'OUTREACH_PAUSED' });

  const nowMs = Date.now();

  // 1. Warm accounts only: filter the 6.8k TAM down to accounts whose OWN heat
  //    clears the qualification threshold (fresh intent >= 60, or trigger >= 60)
  //    BEFORE pulling any associations, so we touch HubSpot for only the handful.
  const allTam = await fetchTamCompanies();
  const warm = allTam.filter((c) => hasAccountIntent(c, nowMs)).slice(0, MAX_ACCOUNTS);
  if (warm.length === 0) return NextResponse.json({ dispatched: 0, reason: 'no warm accounts' });

  // 2. Committee per warm account (a per-account fetch failure is isolated).
  const contactsByCompanyId: Record<string, QualContact[]> = {};
  for (const company of warm) {
    try {
      const ids = await fetchAssociatedContactIds(company.id);
      contactsByCompanyId[company.id] = ids.length ? await readContacts(ids) : [];
    } catch {
      contactsByCompanyId[company.id] = [];
    }
  }

  // 3. Suppress anyone already unsubscribed / emailed / actively queued.
  const candidateEmails = Array.from(new Set(
    Object.values(contactsByCompanyId).flat()
      .map((c) => (c.email || '').trim().toLowerCase())
      .filter(Boolean),
  ));
  const suppressed = await buildSuppressionSet(candidateEmails);

  // 4. Select the sendable committee and hand off to Clawd.
  const targets = selectWarmCommitteeTargets({ companies: warm, contactsByCompanyId, nowMs, suppressedEmails: suppressed });
  const contactCount = targets.reduce((n, t) => n + t.contacts.length, 0);
  if (contactCount === 0) {
    return NextResponse.json({ dispatched: 0, reason: 'no sendable committee after suppression', warmAccounts: warm.length });
  }

  const payload = buildWarmDraftBatchPayload(targets, OWNER);
  const result = await dispatchDraftBatch(payload);

  return NextResponse.json({
    warmAccounts: warm.length,
    dispatchedAccounts: targets.length,
    dispatchedContacts: contactCount,
    accepted: result.ok ? result.accepted : 0,
    batchId: result.ok ? result.batchId : null,
    dispatchOk: result.ok,
    dispatchReason: result.ok ? undefined : result.reason,
  });
}
