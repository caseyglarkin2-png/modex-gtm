import type { PrismaClient } from '@prisma/client';

export interface RecipientGuardDecision {
  ok: boolean;
  reason?: string;
  domain: string;
}

export function getEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || '';
}

export async function evaluateRecipientEligibility(
  prisma: PrismaClient,
  email: string,
  _options?: { allowPayloadReady?: boolean; payloadReady?: boolean; payloadDoNotContact?: boolean }
): Promise<RecipientGuardDecision> {
  void prisma;
  void _options;
  const domain = getEmailDomain(email);
  if (!domain) {
    return { ok: false, reason: 'Invalid email domain', domain };
  }

  return { ok: true, domain };
}
