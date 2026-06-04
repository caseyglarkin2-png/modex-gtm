'use client';

import Link from 'next/link';
import { DataTable, type Column } from '@/components/data-table';
import { BandBadge } from '@/components/band-badge';
import { Badge } from '@/components/ui/badge';
import type { ProspectRow } from '@/lib/discovery/types';

const columns: Column<ProspectRow>[] = [
  {
    key: 'icpScore',
    label: 'Score',
    sortable: true,
    className: 'w-16',
    render: (r) => <span className="font-mono font-semibold">{r.icpScore}</span>,
  },
  {
    key: 'tier',
    label: 'Tier',
    sortable: true,
    className: 'w-16',
    render: (r) => <BandBadge band={r.tier} />,
  },
  {
    key: 'name',
    label: 'Prospect',
    sortable: true,
    render: (r) => (
      <span className={`flex items-center gap-1.5 ${r.excluded ? 'opacity-50' : ''}`}>
        <span className="font-medium">{r.name}</span>
        {r.isExistingAccount && (
          <Link href={`/accounts/${r.existingAccountSlug}`}>
            <Badge variant="outline" className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              In CRM
            </Badge>
          </Link>
        )}
        {r.excluded && (
          <Badge variant="outline" className="text-[10px] text-neutral-500 border-neutral-500/25">
            {r.excludeReason ?? 'Excluded'}
          </Badge>
        )}
      </span>
    ),
  },
  { key: 'cityState', label: 'Location', sortable: true, className: 'hidden lg:table-cell' },
  { key: 'corridor', label: 'Corridor', sortable: true, className: 'hidden xl:table-cell' },
  {
    key: 'enterpriseScale',
    label: 'Scale',
    sortable: true,
    className: 'hidden xl:table-cell text-center',
    render: (r) => <span className="font-mono text-xs">{r.enterpriseScale}</span>,
  },
  {
    key: 'networkComplexity',
    label: 'Network',
    sortable: true,
    className: 'hidden xl:table-cell text-center',
    render: (r) => <span className="font-mono text-xs">{r.networkComplexity}</span>,
  },
  {
    key: 'verticalMatch',
    label: 'Vertical',
    sortable: true,
    className: 'hidden xl:table-cell text-center',
    render: (r) => <span className="font-mono text-xs">{r.verticalMatch}</span>,
  },
  {
    key: 'nearestPrimoDistance',
    label: 'Primo',
    sortable: true,
    className: 'hidden lg:table-cell',
    render: (r) => (
      <span className="text-xs text-[var(--muted-foreground)]">
        {r.nearestPrimoDistance.toFixed(1)} mi
      </span>
    ),
  },
];

interface ProspectsTableProps {
  prospects: ProspectRow[];
  onRowClick?: (row: ProspectRow) => void;
}

export function ProspectsTable({ prospects, onRowClick }: ProspectsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={prospects}
      searchKey="name"
      searchPlaceholder="Search prospects..."
      onRowClick={onRowClick}
      pageSize={50}
    />
  );
}
