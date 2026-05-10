import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getContactById } from '@/lib/hubspot/contacts';
import { normalizeName, normalizeTitle, parseDomainFromEmail, scoreContactQuality, splitName } from '@/lib/contact-standard';
import {
  isNewAccountSendEligible,
  likelySameCompanyName,
  normalizeCompanyDomain,
} from '@/lib/accounts/import-guardrails';
import { syncCanonicalRecords } from '@/lib/revops/canonical-sync';

const BLOCKED_DOMAINS = new Set([
  'dannon.com', 'danone.com', 'bluetriton.com', 'yardflow.ai',
  'niagarawater.com', 'lpcorp.com', 'xpo.com', 'kraftheinz.com', 'freightroll.com',
]);

export const dynamic = 'force-dynamic';

const ImportSchema = z.object({
  hubspotContactIds: z.array(z.string().min(1)).min(1).max(5000),
  cursor: z.number().int().min(0).optional(),
  batchId: z.string().min(1).max(80).optional(),
  chunkSize: z.number().int().min(1).max(100).optional(),
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

  const { hubspotContactIds, cursor = 0, batchId = `tam-${Date.now()}`, chunkSize = 100 } = parsed.data;
  const boundedChunkSize = Math.min(Math.max(chunkSize, 1), 100);
  const start = Math.min(cursor, hubspotContactIds.length);
  const end = Math.min(start + boundedChunkSize, hubspotContactIds.length);
  const scopedIds = hubspotContactIds.slice(start, end);
  const results = {
    batch_id: batchId,
    cursor_start: start,
    cursor_end: end,
    has_more: end < hubspotContactIds.length,
    next_cursor: end < hubspotContactIds.length ? end : null,
    imported: 0,
    skipped: 0,
    blocked: 0,
    linked: 0,
    errors: 0,
    rejected: 0,
    conflicts: 0,
  };
  const conflicts: Array<{ hubspotContactId: string; reason: string }> = [];

  for (const hsId of scopedIds) {
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
        if (existingByEmail.hubspot_contact_id && existingByEmail.hubspot_contact_id !== hsId) {
          conflicts.push({ hubspotContactId: hsId, reason: 'email-linked-to-different-hubspot-id' });
          results.conflicts++;
        }
        if (!existingByEmail.hubspot_contact_id) {
          await prisma.persona.update({
            where: { id: existingByEmail.id },
            data: { hubspot_contact_id: hsId },
          });
          await syncCanonicalRecords({ accountNames: [existingByEmail.account_name], personaIds: [existingByEmail.id] }).catch(() => undefined);
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
      const normalizedDomain = normalizeCompanyDomain(domain);

      // Ensure account exists
      let account = await prisma.account.findFirst({
        where: { name: { equals: accountName, mode: 'insensitive' } },
      });
      if (!account && normalizedDomain) {
        account = await prisma.account.findFirst({
          where: { source_url_1: `https://${normalizedDomain}` },
        });
      }
      if (!account) {
        const near = await prisma.account.findMany({
          where: { name: { contains: accountName.split(' ')[0] || accountName, mode: 'insensitive' } },
          take: 20,
        });
        account = near.find((candidate) => likelySameCompanyName(candidate.name, accountName)) ?? null;
      }
      const isNewAccount = !account;
      if (!account) {
        account = await prisma.account.create({
          data: {
            name: accountName,
            rank: 999,
            vertical: 'Unknown',
            owner: 'Unassigned',
            research_status: 'Needs Review',
            priority_band: 'D',
            priority_score: 50,
            icp_fit: 50,
            event_signal: 0,
            primo_story_fit: 0,
            warm_intro: 0,
            strategic_value: 50,
            meeting_ease: 50,
            source: 'hubspot_import',
            source_url_1: normalizedDomain ? `https://${normalizedDomain}` : null,
            notes: 'Auto-triaged from HubSpot import. Requires vertical/domain/owner review.',
          },
        });
      }

      const qualityResult = scoreContactQuality({
        name: fullName || contact.email,
        title: title || undefined,
        accountName: account?.name ?? accountName,
        email: contact.email,
      });

      const createdPersona = await prisma.persona.create({
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
          hubspot_contact_id: contact.id,
          email_valid: true,
          quality_band: qualityResult.band,
          quality_score: qualityResult.score,
          do_not_contact: isNewAccount ? !isNewAccountSendEligible(qualityResult.score) : false,
          persona_status: isNewAccount ? 'Needs Review' : 'Not started',
        },
      });
      await syncCanonicalRecords({ accountNames: [account.name], personaIds: [createdPersona.id] }).catch(() => undefined);

      results.imported++;
    } catch {
      results.errors++;
    }
  }

  await prisma.systemConfig.upsert({
    where: { key: `tam_import_batch:${batchId}` },
    update: { value: JSON.stringify({ ...results, total: hubspotContactIds.length, conflicts }) },
    create: {
      key: `tam_import_batch:${batchId}`,
      value: JSON.stringify({ ...results, total: hubspotContactIds.length, conflicts }),
    },
  });

  if (conflicts.length > 0) {
    await prisma.systemConfig.upsert({
      where: { key: 'coverage_unresolved_conflicts' },
      update: { value: String(conflicts.length) },
      create: { key: 'coverage_unresolved_conflicts', value: String(conflicts.length) },
    });
  }

  return NextResponse.json({ ...results, conflicts });
}
