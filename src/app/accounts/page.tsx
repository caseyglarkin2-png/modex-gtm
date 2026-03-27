'use client';

import { useRouter } from 'next/navigation';
import accountsData from '@/lib/data/accounts.json';
import personasData from '@/lib/data/personas.json';
import { DataTable, type Column } from '@/components/data-table';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { Breadcrumb } from '@/components/breadcrumb';
import { AddAccountDialog } from '@/components/add-account-dialog';

type Account = (typeof accountsData)[number] & { persona_count: number; slug: string };

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const columns: Column<Account>[] = [
  { key: 'rank', label: '#', sortable: true, className: 'w-12 text-center' },
  { key: 'name', label: 'Account', sortable: true, render: (a) => <span className="font-medium">{a.name}</span> },
  { key: 'vertical', label: 'Vertical', sortable: true, className: 'hidden lg:table-cell' },
  { key: 'priority_band', label: 'Band', sortable: true, render: (a) => <BandBadge band={a.priority_band} /> },
  { key: 'tier', label: 'Tier', sortable: true, className: 'hidden md:table-cell' },
  { key: 'priority_score', label: 'Score', sortable: true, render: (a) => <span className="font-mono font-semibold">{a.priority_score}</span> },
  { key: 'persona_count', label: 'Personas', sortable: true, className: 'text-center hidden sm:table-cell' },
  { key: 'owner', label: 'Owner', sortable: true, className: 'hidden lg:table-cell' },
  { key: 'research_status', label: 'Research', sortable: true, className: 'hidden xl:table-cell', render: (a) => <StatusBadge status={a.research_status} /> },
  { key: 'outreach_status', label: 'Outreach', sortable: true, className: 'hidden xl:table-cell', render: (a) => <StatusBadge status={a.outreach_status} /> },
  { key: 'meeting_status', label: 'Meeting', sortable: true, render: (a) => <StatusBadge status={a.meeting_status} /> },
];

export default function AccountsPage() {
  const router = useRouter();
  const accounts: Account[] = accountsData.map((a) => ({
    ...a,
    persona_count: personasData.filter((p) => p.account === a.name).length,
    slug: slugify(a.name),
  }));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Accounts' }]} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          All target accounts ranked by priority score. Click any row to view details.
        </p>
        <AddAccountDialog />
      </div>
      <DataTable
        columns={columns}
        data={accounts}
        searchKey="name"
        searchPlaceholder="Search accounts..."
        onRowClick={(item) => router.push(`/accounts/${item.slug}`)}
      />
    </div>
  );
}
