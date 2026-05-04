import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/data';
import { contactSavedViews, resolveContactReadiness } from '@/lib/contacts-workspace';
import { formatCanonicalConflictLabel, formatCanonicalStatusLabel } from '@/lib/revops/canonical-records';
import { ensureCanonicalRecords } from '@/lib/revops/canonical-sync';
import { Breadcrumb } from '@/components/breadcrumb';
import { ContactsTable } from './contacts-table';
import { HubSpotSearch } from './hubspot-search';
import { ContactsIntakePanel } from './contacts-intake-panel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contacts' };

const TARGET_ACCOUNT_COUNT = 1000;
const TARGET_CONTACT_COUNT = 13000;

export default async function ContactsPage() {
  const [personas, accounts, enrichmentCount, apolloLinkedCount, sendReadyCount, activeCampaign, canonicalWorkspace] = await Promise.all([
    prisma.persona.findMany({
      select: {
        id: true,
        persona_id: true,
        priority: true,
        name: true,
        normalized_name: true,
        email: true,
        email_valid: true,
        title: true,
        account_name: true,
        persona_lane: true,
        role_in_deal: true,
        seniority: true,
        persona_status: true,
        next_step: true,
        hubspot_contact_id: true,
        company_domain: true,
        quality_band: true,
        quality_score: true,
        do_not_contact: true,
        last_enriched_at: true,
        updated_at: true,
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
    prisma.contactEnrichment.count(),
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
    prisma.campaign.findFirst({
      where: { status: 'active' },
      orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
      select: { name: true, slug: true },
    }),
    ensureCanonicalRecords(),
  ]);

  const accountMap = new Map(accounts.map(a => [a.name, a]));

  const contacts = personas.map((p) => {
    const readiness = resolveContactReadiness(p);
    const account = accountMap.get(p.account_name);
    const canonical = canonicalWorkspace.contactsByPersonaId.get(p.id);
    const canonicalTone: 'success' | 'warning' | 'destructive' = canonical?.status === 'resolved'
      ? 'success'
      : canonical?.status === 'conflict'
        ? 'warning'
        : 'destructive';

    return {
      id: p.id,
      personaId: p.persona_id,
      priority: p.priority,
      name: p.name,
      email: p.email || '',
      title: p.title || '',
      accountName: p.account_name,
      accountSlug: slugify(p.account_name),
      accountOwner: account?.owner || 'Unassigned',
      accountVertical: account?.vertical || 'Unknown',
      personaLane: p.persona_lane,
      roleInDeal: p.role_in_deal,
      seniority: p.seniority,
      personaStatus: p.persona_status,
      nextStep: p.next_step,
      hubspotContactId: p.hubspot_contact_id,
      hubspotCompanyId: account?.hubspot_company_id || null,
      qualityBand: p.quality_band,
      qualityScore: p.quality_score,
      priorityBand: account?.priority_band || 'D',
      doNotContact: p.do_not_contact,
      emailValid: p.email_valid,
      lastEnrichedAt: p.last_enriched_at?.toISOString() ?? null,
      updatedAt: p.updated_at.toISOString(),
      readinessKey: readiness.key,
      readinessLabel: readiness.label,
      readinessTone: readiness.tone,
      readinessReasons: readiness.reasons,
      campaignName: activeCampaign?.name ?? null,
      campaignSlug: activeCampaign?.slug ?? null,
      canonicalStatus: canonical ? formatCanonicalStatusLabel(canonical.status) : 'Unresolved',
      canonicalTone,
      canonicalCompanySource: canonical?.canonicalCompanySource ?? 'missing',
      canonicalContactId: canonical?.canonicalContactId ?? null,
      canonicalCompanyId: canonical?.canonicalCompanyId ?? null,
      canonicalConflicts: canonical?.conflictCodes.map(formatCanonicalConflictLabel) ?? [],
      canonicalBlockedReason: canonical?.sendBlockReason ?? null,
    };
  });

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
          Contacts
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Core workspace for people, enrichment, readiness, and relationship context.
        </p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {contacts.length} contacts · {synced} HubSpot linked · {unsynced} unlinked · {contacts.filter(c => c.doNotContact).length} DNC · send-ready {sendReadyCoverage}%
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <ContactMetric label="Send Ready" value={contacts.filter((contact) => contact.readinessKey === 'send-ready').length} />
        <ContactMetric label="Needs Enrichment" value={contacts.filter((contact) => contact.readinessKey === 'needs-enrichment').length} />
        <ContactMetric label="Blocked / Hold" value={contacts.filter((contact) => contact.readinessKey === 'blocked-hold').length} />
        <ContactMetric label="Canonical Conflicts" value={contacts.filter((contact) => contact.canonicalStatus !== 'Resolved').length} />
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">
        Coverage: owner {ownerCoverage}% · vertical {verticalCoverage}% · enriched {enrichmentCoverage}%
      </p>
      <ContactsIntakePanel
        accountCount={accounts.length}
        contactCount={contacts.length}
        targetAccountCount={TARGET_ACCOUNT_COUNT}
        targetContactCount={TARGET_CONTACT_COUNT}
        hubspotLinkedCount={synced}
        apolloLinkedCount={apolloLinkedCount}
      />
      <ContactsTable contacts={contacts} savedViews={contactSavedViews} />
      <HubSpotSearch />
    </div>
  );
}

function ContactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4 text-center">
      <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
