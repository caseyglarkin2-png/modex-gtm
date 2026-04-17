import type { PrismaClient } from '@prisma/client';

const SYSTEM_BLOCKED_DOMAINS = new Set([
  'dannon.com',
  'danone.com',
  'bluetriton.com',
  'niagarawater.com',
  'lpcorp.com',
  'xpo.com',
  'kraftheinz.com',
]);

const POSITIVE_EMAIL_STATUSES = ['sent', 'delivered', 'opened', 'clicked'] as const;

export interface RecipientGuardDecision {
  ok: boolean;
  reason?: string;
  domain: string;
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

function isInternalDomain(domain: string): boolean {
  return domain === 'freightroll.com' || domain === 'yardflow.ai';
}

async function hasExactUnsubscribe(prisma: PrismaClient, email: string): Promise<boolean> {
  const row = await prisma.unsubscribedEmail.findUnique({
    where: { email },
    select: { email: true },
  });

  return !!row;
}

async function hasRecoverySignalAfterBounce(
  prisma: PrismaClient,
  where: { email?: string; domain?: string }
): Promise<boolean> {
  const logs = await prisma.emailLog.findMany({
    where: {
      status: { in: ['bounced', ...POSITIVE_EMAIL_STATUSES] },
      ...(where.email ? { to_email: where.email } : {}),
      ...(where.domain ? { to_email: { endsWith: `@${where.domain}` } } : {}),
    },
    select: {
      status: true,
      sent_at: true,
    },
    orderBy: { sent_at: 'asc' },
  });

  let lastBounceAt: Date | null = null;

  for (const log of logs) {
    if (log.status === 'bounced') {
      lastBounceAt = log.sent_at;
      continue;
    }

    if (!lastBounceAt || log.sent_at > lastBounceAt) {
      return true;
    }
  }

  return false;
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

  if (isInternalDomain(domain)) {
    return { ok: true, domain };
  }

  if (SYSTEM_BLOCKED_DOMAINS.has(domain)) {
    return { ok: false, reason: `Suppressed domain: ${domain}`, domain };
  }

  if (await hasExactUnsubscribe(prisma, email)) {
    return { ok: false, reason: 'Recipient explicitly unsubscribed', domain };
  }

  const suppressedDomains = await getSuppressedDomains(prisma);
  if (suppressedDomains.has(domain)) {
    const domainRecovered = await hasRecoverySignalAfterBounce(prisma, { domain });
    if (!domainRecovered) {
      return { ok: false, reason: `Bounce-suppressed domain: ${domain}`, domain };
    }
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
    const recipientRecovered = (persona.do_not_contact || !persona.is_contact_ready)
      ? await hasRecoverySignalAfterBounce(prisma, { email })
      : false;

    if (persona.do_not_contact && !recipientRecovered) {
      return { ok: false, reason: 'Contact marked do_not_contact', domain };
    }
    if (!persona.is_contact_ready && !recipientRecovered) {
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
