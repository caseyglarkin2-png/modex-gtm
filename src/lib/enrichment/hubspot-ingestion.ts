import { prisma } from '@/lib/prisma';
import { listRecentContacts, type HubSpotContact } from '@/lib/hubspot/contacts';

const CHECKPOINT_KEY = 'enrichment_hubspot_contacts_after';
const AUDIT_KEY = 'enrichment_hubspot_ingestion_audit';

export async function getHubSpotContactsCheckpoint(): Promise<string | null> {
  const row = await prisma.systemConfig.findUnique({ where: { key: CHECKPOINT_KEY } });
  return row?.value ?? null;
}

export async function setHubSpotContactsCheckpoint(after: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: CHECKPOINT_KEY },
    update: { value: after },
    create: { key: CHECKPOINT_KEY, value: after },
  });
}

export async function ingestHubSpotContactsPage(limit = 100): Promise<{
  contacts: HubSpotContact[];
  nextAfter: string | null;
  usedAfter: string | null;
}> {
  const usedAfter = await getHubSpotContactsCheckpoint();
  const { contacts, nextAfter } = await listRecentContacts(usedAfter ?? undefined, limit);
  if (nextAfter) {
    await setHubSpotContactsCheckpoint(nextAfter);
  }
  return { contacts, nextAfter: nextAfter ?? null, usedAfter };
}

export type HubSpotIngestionAudit = {
  at: string;
  pages: number;
  pulled: number;
  errors: number;
  cursorBefore: string | null;
  cursorAfter: string | null;
};

export async function writeHubSpotIngestionAudit(audit: HubSpotIngestionAudit): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: AUDIT_KEY },
    update: { value: JSON.stringify(audit) },
    create: { key: AUDIT_KEY, value: JSON.stringify(audit) },
  });
}
