import { prisma } from '@/lib/prisma';
import { Breadcrumb } from '@/components/breadcrumb';
import { ContactsTable } from './contacts-table';
import { HubSpotSearch } from './hubspot-search';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contacts — HubSpot Sync' };

export default async function ContactsPage() {
  const [personas, accounts, enrichmentCount, sendReadyCount] = await Promise.all([
    prisma.persona.findMany({
      where: { email: { not: null } },
      select: {
        id: true,
        persona_id: true,
        name: true,
        email: true,
        title: true,
        account_name: true,
        hubspot_contact_id: true,
        quality_band: true,
        do_not_contact: true,
        email_valid: true,
      },
      orderBy: [{ account_name: 'asc' }, { name: 'asc' }],
    }),
    prisma.account.findMany({
      select: {
        name: true,
        hubspot_company_id: true,
        priority_band: true,
        owner: true,
        vertical: true,
      },
    }),
    prisma.contactEnrichment.count({
      where: { apollo_person_id: { not: null } },
    }),
    prisma.persona.count({
      where: {
        email: { not: null },
        do_not_contact: false,
        email_valid: true,
        quality_score: { gte: 80 },
      },
    }),
  ]);

  const accountMap = new Map(accounts.map(a => [a.name, a]));

  const contacts = personas.map(p => ({
    id: p.id,
    personaId: p.persona_id,
    name: p.name,
    email: p.email || '',
    title: p.title || '',
    accountName: p.account_name,
    hubspotContactId: p.hubspot_contact_id,
    hubspotCompanyId: accountMap.get(p.account_name)?.hubspot_company_id || null,
    qualityBand: p.quality_band,
    priorityBand: accountMap.get(p.account_name)?.priority_band || 'D',
    doNotContact: p.do_not_contact,
    emailValid: p.email_valid,
  }));

  const synced = contacts.filter(c => c.hubspotContactId).length;
  const unsynced = contacts.length - synced;
  const ownerCoverage = accounts.length ? Math.round((accounts.filter((a) => a.owner && a.owner !== 'Unassigned').length / accounts.length) * 100) : 0;
  const verticalCoverage = accounts.length ? Math.round((accounts.filter((a) => a.vertical && a.vertical !== 'Unknown').length / accounts.length) * 100) : 0;
  const enrichmentCoverage = contacts.length ? Math.round((enrichmentCount / contacts.length) * 100) : 0;
  const sendReadyCoverage = contacts.length ? Math.round((sendReadyCount / contacts.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Contacts' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Contacts ({contacts.length})
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {synced} synced to HubSpot · {unsynced} unlinked · {contacts.filter(c => c.doNotContact).length} DNC
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          New-company readiness: owner {ownerCoverage}% · vertical {verticalCoverage}% · enriched {enrichmentCoverage}% · send-ready {sendReadyCoverage}%
        </p>
      </div>
      <ContactsTable contacts={contacts} />
      <HubSpotSearch />
    </div>
  );
}
