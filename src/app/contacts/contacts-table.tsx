'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, Plus, UserRound } from 'lucide-react';
import { EmailComposer } from '@/components/email/composer';
import { addToWave } from './actions';
import { contactMatchesSavedView, type ContactReadinessKey, type ContactSavedView } from '@/lib/contacts-workspace';
import { AgentActionDialog } from '@/components/agent-actions/agent-action-dialog';

export interface ContactRow {
  id: number;
  personaId: string;
  priority: string | null;
  name: string;
  email: string;
  title: string;
  accountName: string;
  accountSlug: string;
  accountOwner: string;
  accountVertical: string;
  personaLane: string | null;
  roleInDeal: string | null;
  seniority: string | null;
  personaStatus: string | null;
  nextStep: string | null;
  hubspotContactId: string | null;
  hubspotCompanyId: string | null;
  qualityBand: string;
  qualityScore: number;
  priorityBand: string;
  doNotContact: boolean;
  emailValid: boolean;
  lastEnrichedAt: string | null;
  updatedAt: string;
  readinessKey: ContactReadinessKey;
  readinessLabel: string;
  readinessTone: 'success' | 'warning' | 'destructive' | 'secondary';
  readinessReasons: string[];
  campaignName: string | null;
  campaignSlug: string | null;
  canonicalStatus: string;
  canonicalTone: 'success' | 'warning' | 'destructive';
  canonicalCompanySource: string;
  canonicalContactId: string | null;
  canonicalCompanyId: string | null;
  canonicalConflicts: string[];
  canonicalBlockedReason: string | null;
}

const PORTAL_ID = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || '';

function hubspotContactUrl(contactId: string): string {
  return PORTAL_ID
    ? `https://app.hubspot.com/contacts/${PORTAL_ID}/contact/${contactId}`
    : `https://app.hubspot.com/contacts`;
}

function ContactActions({ contact }: { contact: ContactRow }) {
  const [isPending, startTransition] = useTransition();

  function handleAddToWave(waveName: string) {
    startTransition(async () => {
      const result = await addToWave(contact.accountName, waveName);
      if (result.success) {
        toast.success(`${contact.accountName} added to ${waveName}`);
      } else {
        toast.error(result.error ?? 'Failed to add to wave');
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <AgentActionDialog
        request={{
          action: 'contact_dossier',
          target: {
            accountName: contact.accountName,
            company: contact.accountName,
            email: contact.email || undefined,
            personaId: contact.id,
          },
        }}
        title={`Live Intel for ${contact.name}`}
        trigger={
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserRound className="h-3.5 w-3.5" /> Intel
          </Button>
        }
      />
      {contact.email && !contact.doNotContact ? (
        <EmailComposer
          accountName={contact.accountName}
          personaName={contact.name}
          personaEmail={contact.email}
        />
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Wave
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => handleAddToWave('Wave 1')}>Add to Wave 1</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleAddToWave('Wave 2')}>Add to Wave 2</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleAddToWave('Priority Follow-up')}>Add to Priority Follow-up</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ContactsTable({ contacts, savedViews }: { contacts: ContactRow[]; savedViews: ContactSavedView[] }) {
  const [activeView, setActiveView] = useState<ContactSavedView['id']>('all');
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(contacts[0] ?? null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkPending, setBulkPending] = useState(false);

  const filteredContacts = useMemo(
    () => contacts.filter((contact) => contactMatchesSavedView(activeView, toSavedViewInput(contact))),
    [activeView, contacts],
  );
  const selectedContacts = filteredContacts.filter((contact) => selectedIds.includes(contact.id));

  function toggleSelected(contactId: number) {
    setSelectedIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
  }

  async function runBulkEnrich() {
    if (selectedContacts.length === 0) return;
    setBulkPending(true);
    try {
      const results = await Promise.allSettled(
        selectedContacts
          .filter((contact) => Boolean(contact.email))
          .map((contact) =>
            fetch('/api/agent-actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'contact_enrich',
                target: {
                  accountName: contact.accountName,
                  company: contact.accountName,
                  email: contact.email,
                  personaId: contact.id,
                },
              }),
            }),
          ),
      );
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      toast.success(`Requested enrichment for ${successCount} selected contact${successCount === 1 ? '' : 's'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk enrichment failed');
    } finally {
      setBulkPending(false);
    }
  }

  async function runBulkCommitteeBuild() {
    if (selectedContacts.length === 0) return;
    setBulkPending(true);
    try {
      const accounts = Array.from(new Set(selectedContacts.map((contact) => contact.accountName)));
      await Promise.all(
        accounts.map((accountName) =>
          fetch('/api/agent-actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'committee_refresh',
              target: { accountName, company: accountName },
            }),
          }),
        ),
      );
      toast.success(`Requested committee refresh for ${accounts.length} account${accounts.length === 1 ? '' : 's'}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Committee refresh failed');
    } finally {
      setBulkPending(false);
    }
  }

  const columns: Column<ContactRow>[] = [
    {
      key: 'select',
      label: '',
      sortable: false,
      render: (c) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(c.id)}
          onChange={() => toggleSelected(c.id)}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Select ${c.name}`}
        />
      ),
    },
    {
      key: 'accountName',
      label: 'Account',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <Badge variant={c.priorityBand === 'A' ? 'default' : 'secondary'} className="text-[10px] px-1">
            {c.priorityBand}
          </Badge>
          <Link href={`/accounts/${c.accountSlug}`} className="font-medium text-[var(--primary)] hover:underline" onClick={(e) => e.stopPropagation()}>
            {c.accountName}
          </Link>
        </div>
      ),
    },
    { key: 'name', label: 'Name', sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'title', label: 'Title', sortable: true, className: 'max-w-40 truncate hidden lg:table-cell' },
    { key: 'email', label: 'Email', sortable: true, className: 'text-xs hidden md:table-cell max-w-48 truncate' },
    {
      key: 'readinessLabel',
      label: 'Readiness',
      sortable: true,
      render: (c) => (
        <Badge variant={c.readinessTone} className="text-xs" title={c.readinessReasons.join(' ')}>
          {c.readinessLabel}
        </Badge>
      ),
    },
    {
      key: 'canonicalStatus' as keyof ContactRow,
      label: 'Canonical',
      sortable: true,
      render: (c) => (
        <Badge variant={c.canonicalTone} className="text-xs" title={c.canonicalConflicts.join(' ')}>
          {c.canonicalStatus}
        </Badge>
      ),
    },
    {
      key: 'hubspotContactId' as keyof ContactRow,
      label: 'HubSpot',
      sortable: true,
      render: (c) => {
        if (c.doNotContact) {
          return <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="h-3 w-3" /> DNC</span>;
        }
        if (!c.emailValid) {
          return <span className="flex items-center gap-1 text-xs text-amber-500"><AlertTriangle className="h-3 w-3" /> Invalid</span>;
        }
        if (c.hubspotContactId) {
          return (
            <a
              href={hubspotContactUrl(c.hubspotContactId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-green-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <CheckCircle className="h-3 w-3" /> Synced <ExternalLink className="h-3 w-3" />
            </a>
          );
        }
        return <span className="text-xs text-[var(--muted-foreground)]">Unlinked</span>;
      },
    },
    {
      key: 'campaignName' as keyof ContactRow,
      label: 'Campaign',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (c) => c.campaignSlug
        ? (
          <Link href={`/campaigns/${c.campaignSlug}`} className="text-xs text-[var(--primary)] hover:underline" onClick={(e) => e.stopPropagation()}>
            {c.campaignName}
          </Link>
        )
        : <span className="text-xs text-[var(--muted-foreground)]">—</span>,
    },
    {
      key: 'email' as keyof ContactRow,
      label: '',
      sortable: false,
      render: (c) => <ContactActions contact={c} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" aria-label="Contact saved views">
        {savedViews.map((view) => {
          const count = contacts.filter((contact) => contactMatchesSavedView(view.id, toSavedViewInput(contact))).length;

          return (
            <Button
              key={view.id}
              type="button"
              variant={activeView === view.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveView(view.id);
                setSelectedContact(null);
              }}
              title={view.description}
            >
              {view.label} ({count})
            </Button>
          );
        })}
      </div>

      {selectedContacts.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-3">
          <Badge variant="outline">{selectedContacts.length} selected</Badge>
          <Button size="sm" variant="outline" onClick={() => void runBulkEnrich()} disabled={bulkPending}>
            Enrich Selected
          </Button>
          <Button size="sm" variant="outline" onClick={() => void runBulkCommitteeBuild()} disabled={bulkPending}>
            Build Committee
          </Button>
          {selectedContacts[0]?.email ? (
            <EmailComposer
              accountName={selectedContacts[0].accountName}
              personaName={selectedContacts[0].name}
              personaEmail={selectedContacts[0].email}
              trigger={<Button size="sm">Draft Outreach</Button>}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <DataTable
          data={filteredContacts}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search contacts..."
          onRowClick={setSelectedContact}
        />
        <ContactDetailPanel contact={selectedContact} />
      </div>
    </div>
  );
}

function toSavedViewInput(contact: ContactRow) {
  return {
    email: contact.email || null,
    email_valid: contact.emailValid,
    do_not_contact: contact.doNotContact,
    quality_score: contact.qualityScore,
    quality_band: contact.qualityBand,
    hubspot_contact_id: contact.hubspotContactId,
    last_enriched_at: contact.lastEnrichedAt ? new Date(contact.lastEnrichedAt) : null,
    updated_at: new Date(contact.updatedAt),
    readinessKey: contact.readinessKey,
  };
}

function ContactDetailPanel({ contact }: { contact: ContactRow | null }) {
  if (!contact) {
    return (
      <aside className="rounded-lg border border-dashed border-[var(--border)] p-4">
        <p className="text-sm font-medium">Contact Detail</p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Select a contact row to inspect context and next action.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-[var(--border)] p-4" aria-label="Contact Detail">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Contact Detail</p>
          <h2 className="mt-1 text-lg font-bold">{contact.name}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{contact.title || 'Title TBD'}</p>
        </div>
        <UserRound className="h-5 w-5 text-[var(--muted-foreground)]" />
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Readiness</p>
          <Badge variant={contact.readinessTone} className="mt-1">{contact.readinessLabel}</Badge>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--muted-foreground)]">
            {contact.readinessReasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Canonical</p>
          <Badge variant={contact.canonicalTone} className="mt-1">{contact.canonicalStatus}</Badge>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">Company source: {contact.canonicalCompanySource.replaceAll('_', ' ')}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Contact id: {contact.canonicalContactId ?? 'not resolved'}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Company id: {contact.canonicalCompanyId ?? 'not resolved'}</p>
          {contact.canonicalConflicts.length > 0 ? (
            <p className="mt-1 text-xs text-amber-700">Issues: {contact.canonicalConflicts.join(', ')}</p>
          ) : null}
          {contact.canonicalBlockedReason ? (
            <p className="mt-1 text-xs text-red-700">{contact.canonicalBlockedReason}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Info label="Priority" value={contact.priority ?? 'Unscored'} />
          <Info label="Quality" value={`${contact.qualityBand} / ${contact.qualityScore}`} />
          <Info label="Lane" value={contact.personaLane ?? 'Unassigned'} />
          <Info label="Seniority" value={contact.seniority ?? 'Unknown'} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Relationship Context</p>
          <p className="mt-1">{contact.roleInDeal ?? 'Role in deal not set.'}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Status: {contact.personaStatus ?? 'Not started'}</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Next: {contact.nextStep ?? 'No next step set.'}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" asChild>
            <Link href={`/accounts/${contact.accountSlug}`}>Open Account</Link>
          </Button>
          <AgentActionDialog
            request={{
              action: 'contact_dossier',
              target: {
                accountName: contact.accountName,
                company: contact.accountName,
                email: contact.email || undefined,
                personaId: contact.id,
              },
            }}
            title={`Dossier for ${contact.name}`}
            trigger={<Button size="sm" variant="outline">Open Dossier</Button>}
          />
          <AgentActionDialog
            request={{
              action: 'contact_enrich',
              target: {
                accountName: contact.accountName,
                company: contact.accountName,
                email: contact.email || undefined,
                personaId: contact.id,
              },
            }}
            title={`Enrich ${contact.name}`}
            trigger={<Button size="sm" variant="outline">Enrich</Button>}
          />
          <AgentActionDialog
            request={{
              action: 'company_contacts',
              target: {
                accountName: contact.accountName,
                company: contact.accountName,
              },
            }}
            title={`Find Contacts at ${contact.accountName}`}
            trigger={<Button size="sm" variant="outline">Find Same-Company Contacts</Button>}
          />
          <AgentActionDialog
            request={{
              action: 'committee_refresh',
              target: {
                accountName: contact.accountName,
                company: contact.accountName,
              },
            }}
            title={`Build Committee for ${contact.accountName}`}
            trigger={<Button size="sm" variant="outline">Build Committee</Button>}
          />
          {contact.campaignSlug && (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/campaigns/${contact.campaignSlug}`}>Open Campaign</Link>
            </Button>
          )}
          {contact.email && !contact.doNotContact && (
            <EmailComposer accountName={contact.accountName} personaName={contact.name} personaEmail={contact.email} />
          )}
        </div>
      </div>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-2">
      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
