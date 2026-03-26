'use client';

import { useRouter } from 'next/navigation';
import personasData from '@/lib/data/personas.json';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { ExternalLink } from 'lucide-react';

type Persona = (typeof personasData)[number];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const columns: Column<Persona>[] = [
  { key: 'persona_id', label: 'ID', sortable: true, className: 'font-mono text-xs w-16 hidden sm:table-cell' },
  { key: 'account', label: 'Account', sortable: true, render: (p) => <span className="font-medium">{p.account}</span> },
  {
    key: 'name', label: 'Name', sortable: true,
    render: (p) => p.linkedin_url ? (
      <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {p.name} <ExternalLink className="h-3 w-3" />
      </a>
    ) : <span className="font-medium">{p.name}</span>,
  },
  { key: 'title', label: 'Title', sortable: true, className: 'max-w-48 truncate hidden lg:table-cell' },
  {
    key: 'priority', label: 'Priority', sortable: true,
    render: (p) => <Badge variant={p.priority === 'P1' ? 'default' : 'secondary'} className="text-xs">{p.priority}</Badge>,
  },
  { key: 'persona_lane', label: 'Lane', sortable: true, className: 'hidden md:table-cell' },
  { key: 'persona_status', label: 'Status', sortable: true, render: (p) => <StatusBadge status={p.persona_status} /> },
  { key: 'next_step', label: 'Next Step', className: 'max-w-48 truncate text-xs hidden xl:table-cell' },
];

export default function PersonasPage() {
  const router = useRouter();
  const personas: Persona[] = personasData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Personas ({personas.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {personas.length} named personas across {new Set(personas.map((p) => p.account)).size} accounts. Click row to view account.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={personas}
        searchKey="name"
        searchPlaceholder="Search personas..."
        onRowClick={(item) => router.push(`/accounts/${slugify(item.account)}`)}
      />
    </div>
  );
}
