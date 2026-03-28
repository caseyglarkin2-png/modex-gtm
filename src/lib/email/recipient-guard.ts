import type { PrismaClient } from '@prisma/client';

const SYSTEM_BLOCKED_DOMAINS = new Set([
  'dannon.com',
  'danone.com',
  'bluetriton.com',
  'yardflow.ai',
  'niagarawater.com',
  'homedepot.com',
  'heb.com',
  'fedex.com',
  'johndeere.com',
  'kencogroup.com',
  'bn.com',
  'hmna.com',
  'hormel.com',
  'gapac.com',
  'jmsmucker.com',
  'lpcorp.com',
  'xpo.com',
  'kraftheinz.com',
  'freightroll.com',
]);

export interface RecipientGuardDecision {
  ok: boolean;
  reason?: string;
  domain: string;
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

export async function getSuppressedDomains(prisma: PrismaClient): Promise<Set<string>> {
  const rows = await prisma.listsConfig.findMany({
    where: { key: 'blocked_domain' },
    select: { value: true },
  });

  const domains = new Set<string>();
  for (const row of rows) {
    const value = row.value.trim().toLowerCase();
    if (value) domains.add(value);
  }
  return domains;
}

export async function evaluateRecipientEligibility(
  prisma: PrismaClient,
  email: string,
  options?: { allowPayloadReady?: boolean; payloadReady?: boolean; payloadDoNotContact?: boolean }
): Promise<RecipientGuardDecision> {
  const domain = getEmailDomain(email);
  if (!domain) {
    return { ok: false, reason: 'Invalid email domain', domain };
  }

  if (SYSTEM_BLOCKED_DOMAINS.has(domain)) {
    return { ok: false, reason: `Suppressed domain: ${domain}`, domain };
  }

  const suppressedDomains = await getSuppressedDomains(prisma);
  if (suppressedDomains.has(domain)) {
    return { ok: false, reason: `Bounce-suppressed domain: ${domain}`, domain };
  }

  const persona = await prisma.persona.findFirst({
    where: { email },
    select: {
      email: true,
      is_contact_ready: true,
      do_not_contact: true,
      quality_band: true,
    },
    orderBy: { quality_score: 'desc' },
  });

  if (persona) {
    if (persona.do_not_contact) {
      return { ok: false, reason: 'Contact marked do_not_contact', domain };
    }
    if (!persona.is_contact_ready) {
      return { ok: false, reason: `Contact is not ready for send (${persona.quality_band})`, domain };
    }
    return { ok: true, domain };
  }

  if (options?.allowPayloadReady) {
    if (options.payloadDoNotContact) {
      return { ok: false, reason: 'Payload marked do_not_contact', domain };
    }
    if (!options.payloadReady) {
      return { ok: false, reason: 'Payload is not contact-ready', domain };
    }
    return { ok: true, domain };
  }

  return { ok: false, reason: 'No eligible persona record found for recipient', domain };
}
