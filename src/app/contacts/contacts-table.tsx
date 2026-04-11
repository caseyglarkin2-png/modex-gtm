'use client';

import { useTransition } from 'react';
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
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, Plus } from 'lucide-react';
import { EmailComposer } from '@/components/email/composer';
import { addToWave } from './actions';

export interface ContactRow {
  id: number;
  personaId: string;
  name: string;
  email: string;
  title: string;
  accountName: string;
  hubspotContactId: string | null;
  hubspotCompanyId: string | null;
  qualityBand: string;
  priorityBand: string;
  doNotContact: boolean;
  emailValid: boolean;
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

const columns: Column<ContactRow>[] = [
  {
    key: 'accountName',
    label: 'Account',
    sortable: true,
    render: (c) => (
      <div className="flex items-center gap-1.5">
        <Badge variant={c.priorityBand === 'A' ? 'default' : 'secondary'} className="text-[10px] px-1">
          {c.priorityBand}
        </Badge>
        <span className="font-medium">{c.accountName}</span>
      </div>
    ),
  },
  { key: 'name', label: 'Name', sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
  { key: 'title', label: 'Title', sortable: true, className: 'max-w-40 truncate hidden lg:table-cell' },
  { key: 'email', label: 'Email', sortable: true, className: 'text-xs hidden md:table-cell max-w-48 truncate' },
  {
    key: 'qualityBand',
    label: 'Quality',
    sortable: true,
    render: (c) => (
      <Badge variant={c.qualityBand === 'A' ? 'default' : c.qualityBand === 'B' ? 'secondary' : 'outline'} className="text-xs">
        {c.qualityBand}
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
    key: 'hubspotCompanyId' as keyof ContactRow,
    label: 'Company',
    sortable: true,
    className: 'hidden xl:table-cell',
    render: (c) => c.hubspotCompanyId
      ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> Linked</span>
      : <span className="text-xs text-[var(--muted-foreground)]">—</span>,
  },
  {
    key: 'email' as keyof ContactRow,
    label: '',
    sortable: false,
    render: (c) => <ContactActions contact={c} />,
  },
];

export function ContactsTable({ contacts }: { contacts: ContactRow[] }) {
  return (
    <DataTable
      data={contacts}
      columns={columns}
      searchKey="name"
      searchPlaceholder="Search contacts..."
    />
  );
}
