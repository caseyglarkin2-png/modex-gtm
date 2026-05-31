import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { upsertContact } from '@/lib/hubspot/contacts';
import { createNote } from '@/lib/hubspot/notes';

/**
 * H.T1 / H.T2 — Custom-audit request capture from the industry gallery.
 *
 * Two entry points POST here:
 *   - H.T1: the empty-filter "I want this for my industry" form
 *     ({ email, industry }).
 *   - H.T2: the "Don't see your brand?" modal ({ email, company, role }).
 *
 * Best-effort lead capture: upsert a HubSpot contact and drop a note with
 * the request details. Every HubSpot call is graceful (returns null when
 * HubSpot is unconfigured/disabled, swallows write failures) so the form
 * UX never breaks. Demo mode (rep presenting) is a no-op: we accept the
 * submit and return ok without creating a real lead.
 */

const BodySchema = z.object({
  email: z.string().email().max(200),
  industry: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
  role: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).optional(),
  demo: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { ok } = rateLimit(`audit-request:${ip}`);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  // Demo mode: do not create a real lead during a rep's presentation.
  if (body.demo) {
    return NextResponse.json({ ok: true, demo: true });
  }

  try {
    const contactId = await upsertContact({
      email: body.email,
      company: body.company,
      jobtitle: body.role,
      hs_lead_status: 'NEW',
      lifecyclestage: 'lead',
    });
    if (contactId) {
      const lines = [
        'Custom audit request from the YardFlow industry gallery.',
        body.industry ? `Industry: ${body.industry}` : null,
        body.company ? `Company: ${body.company}` : null,
        body.role ? `Role: ${body.role}` : null,
        `Source: ${body.source ?? 'gallery'}`,
      ].filter(Boolean);
      await createNote({ body: lines.join('<br>'), contactId });
    }
  } catch {
    // HubSpot write failed — capture is best-effort; never break the form.
  }

  return NextResponse.json({ ok: true });
}
