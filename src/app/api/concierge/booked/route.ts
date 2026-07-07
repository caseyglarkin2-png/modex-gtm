import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { parseDomainFromEmail } from '@/lib/contact-standard';
import { upsertContact } from '@/lib/hubspot/contacts';
import { searchCompanyByDomain, searchCompanyByName } from '@/lib/hubspot/companies';
import { createNote, createCompanyNote } from '@/lib/hubspot/notes';
import {
  findOpenDealForObject,
  findOpenDealByExactName,
  associateDealToObject,
  advanceDealStageForward,
  createBookingDeal,
  DEAL_STAGE_DISCOVERY,
  type OpenDealRef,
} from '@/lib/hubspot/deals';
import { runBookingOnce, bookingIdempotencyKey } from '@/lib/concierge/booking-idempotency';

/**
 * Paper Booking Concierge -> pipeline. Flow-State-'s Order of Operations paper
 * concierge already books the call (contact + calendar meeting + #yardflow-intent
 * Slack ping) but never opened a HubSpot deal. This is that handler.
 *
 * DEDUP-SAFE find-or-create BY IDENTITY. The portal already carries duplicate,
 * INTEGRATION-source stub deals from the GTM engine, and the canonical engine
 * dedupes contacts + companies only (never deals). So this handler must NEVER add
 * to the deal pile on a booking. It resolves the identity, then:
 *   1. contact by email (upsert)
 *   2. company by email domain (skipping free/public domains), else by name
 *   3. an OPEN deal, in order: associated to the contact -> associated to the
 *      company -> exact dealname "YardFlow - {account}"
 *   4. if found: associate contact + company to it, advance stage forward only
 *      (never regress), note it -> { created:false }
 *   5. only if all miss: create exactly ONE deal at Discovery
 *      (appointmentscheduled), associated to both -> { created:true }
 *
 * The read-before-write in steps 3-5 is not atomic, and HubSpot's search +
 * associations index lags several seconds behind a create — so for a brand-new
 * identity a double-tap "book" or a fast client retry could each miss the dedup
 * and open a second deal. `runBookingOnce` (keyed on email+booking-slot) closes
 * that window locally: concurrent calls share one in-flight find-or-create and a
 * fast retry reuses the first result, regardless of HubSpot index lag.
 *
 * Every HubSpot call is best-effort (no-ops when HubSpot is unconfigured); the
 * concierge UX never depends on this.
 *
 * Shared-secret gated via the `x-concierge-secret` header vs CONCIERGE_WEBHOOK_SECRET.
 * If the env is unset we still function (so this works before the secret is wired
 * in Vercel) but log a warning.
 */

/** Free / public inbox domains — never resolve or link a company from these. */
const FREE_EMAIL_DOMAINS = new Set<string>([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.co.uk',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'hey.com',
]);

function isFreeDomain(domain: string | null): boolean {
  return !!domain && FREE_EMAIL_DOMAINS.has(domain);
}

const BodySchema = z.object({
  email: z.string().email().max(200),
  firstName: z.string().trim().max(160).optional(),
  startTime: z.string().trim().min(1).max(80),
  source: z.string().trim().max(80).optional(),
  company: z.string().trim().max(160).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`concierge-booked:${ip}`).ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  const expected = process.env.CONCIERGE_WEBHOOK_SECRET;
  const provided = req.headers.get('x-concierge-secret') ?? '';
  if (expected) {
    if (provided !== expected) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn(
      '[concierge/booked] CONCIERGE_WEBHOOK_SECRET is unset; accepting the request unauthenticated. Set it in Vercel to lock this endpoint down.',
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    // Rejects invalid emails too (zod .email()).
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }

  try {
    // Idempotency guard: coalesce concurrent bookings and short-circuit a fast
    // retry for the same identity+slot, so the non-atomic find-or-create below can
    // never open a second deal while HubSpot is still indexing the first write.
    const idemKey = bookingIdempotencyKey(body.email, body.startTime);
    const result = await runBookingOnce(idemKey, async () => {
      // 1. Resolve the contact by email.
      const contactId = await upsertContact({
        email: body.email,
        firstname: body.firstName,
        company: body.company,
        hs_lead_status: 'NEW',
        lifecyclestage: 'salesqualifiedlead',
      });

      // 2. Resolve the company: by corporate email domain first, then by name.
      const emailDomain = parseDomainFromEmail(body.email);
      const corporateDomain = isFreeDomain(emailDomain) ? null : emailDomain;
      let companyId: string | null = null;
      let companyName: string | null = body.company?.trim() || null;

      if (corporateDomain) {
        const byDomain = await searchCompanyByDomain(corporateDomain);
        if (byDomain) {
          companyId = byDomain.id;
          companyName = companyName ?? byDomain.name ?? null;
        }
      }
      if (!companyId && companyName) {
        const byName = await searchCompanyByName(companyName);
        if (byName) companyId = byName.id;
      }

      // Account name for the dealname: resolved/provided company, else the
      // corporate domain, else the email (never a free inbox as an "account").
      const accountName = companyName ?? corporateDomain ?? body.email;

      // 3. Find an existing OPEN deal by identity: contact -> company -> exact name.
      let existing: OpenDealRef | null = null;
      if (contactId) existing = await findOpenDealForObject('contacts', contactId);
      if (!existing && companyId) existing = await findOpenDealForObject('companies', companyId);
      if (!existing) existing = await findOpenDealByExactName(accountName);

      let dealId: string | null = null;
      let created = false;

      if (existing) {
        // 4. Attach to the deal already in flight — never a new one.
        dealId = existing.id;
        if (contactId) await associateDealToObject(dealId, 'contacts', contactId);
        if (companyId) await associateDealToObject(dealId, 'companies', companyId);
        // Advance forward only; a no-op for any deal already at/after Discovery.
        await advanceDealStageForward(dealId, existing.dealstage, DEAL_STAGE_DISCOVERY);
      } else {
        // 5. No open deal anywhere — open exactly one at Discovery.
        dealId = await createBookingDeal({ accountName, contactId, companyId });
        created = !!dealId;
      }

      // Note either way (annotates a re-book instead of silently duplicating).
      const noteBody = `Booked a call via the Order of Operations paper concierge for ${body.startTime}.`;
      if (contactId) {
        await createNote({ contactId, body: noteBody });
      } else if (companyId) {
        await createCompanyNote({ companyId, body: noteBody });
      }

      return { created, contactId, companyId, dealId };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[concierge/booked] failed', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
