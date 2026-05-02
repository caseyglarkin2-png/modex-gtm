import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getContactById } from '@/lib/hubspot/contacts';
import { normalizeName, normalizeTitle, parseDomainFromEmail, scoreContactQuality, splitName } from '@/lib/contact-standard';

const BLOCKED_DOMAINS = new Set([
  'dannon.com', 'danone.com', 'bluetriton.com', 'yardflow.ai',
  'niagarawater.com', 'lpcorp.com', 'xpo.com', 'kraftheinz.com', 'freightroll.com',
]);

export const dynamic = 'force-dynamic';

const ImportSchema = z.object({
  hubspotContactIds: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { hubspotContactIds } = parsed.data;
  const results = {
    imported: 0,
    skipped: 0,
    blocked: 0,
    linked: 0,
    errors: 0,
  };

  for (const hsId of hubspotContactIds) {
    try {
      // Dedup: check if already exists
      const existingByHsId = await prisma.persona.findFirst({
        where: { hubspot_contact_id: hsId },
      });
      if (existingByHsId) {
        results.skipped++;
        continue;
      }

      // Fetch from HubSpot
      const contact = await getContactById(hsId);
      if (!contact || !contact.email) {
        results.errors++;
        continue;
      }

      // Check blocklist
      const domain = parseDomainFromEmail(contact.email);
      if (domain && BLOCKED_DOMAINS.has(domain)) {
        results.blocked++;
        continue;
      }

      // Dedup by email
      const existingByEmail = await prisma.persona.findFirst({
        where: { email: contact.email.toLowerCase() },
      });
      if (existingByEmail) {
        if (!existingByEmail.hubspot_contact_id) {
          await prisma.persona.update({
            where: { id: existingByEmail.id },
            data: { hubspot_contact_id: hsId },
          });
          results.linked++;
        } else {
          results.skipped++;
        }
        continue;
      }

      const { firstName, lastName } = splitName(`${contact.firstname} ${contact.lastname}`.trim());
      const fullName = normalizeName(`${firstName} ${lastName}`);
      const title = normalizeTitle(contact.jobtitle || '');
      const accountName = contact.company || domain || 'Unknown';

      // Ensure account exists
      let account = await prisma.account.findFirst({
        where: { name: { equals: accountName, mode: 'insensitive' } },
      });
      if (!account) {
        account = await prisma.account.create({
          data: {
            name: accountName,
            rank: 999,
            vertical: 'Unknown',
            priority_band: 'D',
            priority_score: 50,
            icp_fit: 50,
            modex_signal: 0,
            primo_story_fit: 0,
            warm_intro: 0,
            strategic_value: 50,
            meeting_ease: 50,
          },
        });
      }

      const qualityResult = scoreContactQuality({
        name: fullName || contact.email,
        title: title || undefined,
        accountName: account?.name ?? accountName,
        email: contact.email,
      });

      await prisma.persona.create({
        data: {
          persona_id: `hs-${contact.id}`,
          name: fullName || contact.email,
          title: title || null,
          email: contact.email.toLowerCase(),
          phone: contact.phone || null,
          account_name: account.name,
          priority: 'P2',
          seniority: '',
          persona_lane: '',
          role_in_deal: '',
          persona_status: 'Not started',
          hubspot_contact_id: contact.id,
          email_valid: true,
          quality_band: qualityResult.band,
        },
      });

      results.imported++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
