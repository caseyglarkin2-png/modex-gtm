import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { upsertContact } from '@/lib/hubspot/contacts';
import { createNote } from '@/lib/hubspot/notes';
import { createDealIfMissing } from '@/lib/hubspot/deals';
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';

/**
 * ROI self-serve lead -> pipeline. Flow-State- /api/email/roi POSTs here after a
 * named buyer builds their own business case on yardflow.ai/roi (the warmest
 * inbound signal we get). Best-effort: upsert the contact, open a deal IF one
 * does not already exist (never regress a deal in flight), drop a note with the
 * modeled numbers, and fire the #yardflow-intent Slack ping so Casey can pounce
 * while attention is hot. Every HubSpot call is graceful (no-ops when HubSpot is
 * unconfigured); the caller's UX never depends on this.
 *
 * Shared-secret gated (ROI_LEAD_SECRET, set in both Vercel projects) since it
 * writes deals. Demo mode is a no-op.
 */
const BodySchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().email().max(200),
  company: z.string().trim().min(1).max(160),
  yearOneRoiPercent: z.number().finite().optional(),
  yearOneNetGain: z.number().finite().optional(),
  paybackMonths: z.number().finite().optional(),
  source: z.string().trim().max(80).optional(),
  secret: z.string().max(200).optional(),
  demo: z.boolean().optional(),
});

const money = (n?: number) => (typeof n === 'number' ? `$${Math.round(n).toLocaleString()}` : 'n/a');

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`roi-lead:${ip}`).ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  const expected = process.env.ROI_LEAD_SECRET;
  const provided = body.secret || req.headers.get('x-roi-secret') || '';
  if (expected && provided !== expected) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (body.demo) return NextResponse.json({ ok: true, demo: true });

  const [firstname, ...rest] = body.name.split(/\s+/);
  const lastname = rest.join(' ') || undefined;

  let contactId: string | null = null;
  let dealResult: { id: string; created: boolean } | null = null;
  try {
    contactId = await upsertContact({
      email: body.email,
      firstname,
      lastname,
      company: body.company,
      hs_lead_status: 'NEW',
      lifecyclestage: 'salesqualifiedlead',
    });

    dealResult = await createDealIfMissing({
      accountName: body.company,
      stage: 'engaged',
      amount: body.yearOneNetGain,
      contactId,
    });

    if (contactId) {
      const lines = [
        'Self-served ROI on yardflow.ai/roi (warm inbound).',
        `Year-1 net gain (modeled): ${money(body.yearOneNetGain)}`,
        typeof body.yearOneRoiPercent === 'number' ? `Year-1 ROI: ${Math.round(body.yearOneRoiPercent)}%` : null,
        typeof body.paybackMonths === 'number' ? `Payback: ${body.paybackMonths} months` : null,
        `Source: ${body.source ?? 'roi'}`,
      ].filter(Boolean);
      await createNote({ body: lines.join('<br>'), contactId });
    }
  } catch {
    // best-effort: never break the caller
  }

  try {
    await sendSlackNotification(
      [
        `🔥 *ROI self-modeled — ${body.company}*`,
        `${body.name} (${body.email}) built their own business case on /roi.`,
        `Modeled Year-1 net gain *${money(body.yearOneNetGain)}*` +
          (typeof body.yearOneRoiPercent === 'number' ? ` (${Math.round(body.yearOneRoiPercent)}% ROI)` : '') +
          (typeof body.paybackMonths === 'number' ? `, ${body.paybackMonths}mo payback` : '') +
          '.',
        dealResult ? `Deal ${dealResult.created ? 'opened' : 'already open'} in HubSpot. Reach out while it's hot.` : 'Reach out while it is hot.',
      ].join('\n'),
    );
  } catch {
    // non-fatal
  }

  return NextResponse.json({ ok: true, contactId: !!contactId, deal: dealResult?.created ?? false });
}
