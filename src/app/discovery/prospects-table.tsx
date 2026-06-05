'use client';

import Link from 'next/link';
import { DataTable, type Column } from '@/components/data-table';
import { BandBadge } from '@/components/band-badge';
import { Badge } from '@/components/ui/badge';
import type { CuratedRow, ProspectSegment, Confidence } from '@/lib/discovery/types';

const SEGMENT_LABEL: Record<ProspectSegment, string> = {
  shipper: 'Shipper',
  carrier: 'Carrier',
  '3pl': '3PL',
  parcel: 'Parcel',
};

const CONFIDENCE_STYLE: Record<Confidence, { label: string; className: string }> = {
  high: { label: 'High', className: 'text-emerald-600 border-emerald-600/30' },
  medium: { label: 'Med', className: 'text-[var(--muted-foreground)] border-[var(--border)]' },
  low: { label: 'Low', className: 'text-amber-600 border-amber-600/40' },
};

const columns: Column<CuratedRow>[] = [
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
        {r.segment !== 'shipper' && (
          <Badge variant="outline" className="text-[10px] text-[var(--muted-foreground)] border-[var(--border)]">
            {SEGMENT_LABEL[r.segment]}
          </Badge>
        )}
        {r.isExistingAccount && (
          <Link href={`/accounts/${r.existingAccountSlug}`}>
            <Badge variant="outline" className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              In CRM
            </Badge>
          </Link>
        )}
        {r.mergedCount > 0 && (
          <span className="text-[10px] text-[var(--muted-foreground)]" title={`${r.mergedCount} duplicate/gate row(s) merged here`}>
            +{r.mergedCount}
          </span>
        )}
        {r.excluded && (
          <Badge variant="outline" className="text-[10px] text-neutral-500 border-neutral-500/25">
            {r.excludeReason ?? 'Excluded'}
          </Badge>
        )}
      </span>
    ),
  },
  {
    key: 'confidence',
    label: 'Conf.',
    sortable: true,
    className: 'hidden lg:table-cell w-16',
    render: (r) => {
      const s = CONFIDENCE_STYLE[r.confidence];
      return (
        <Badge variant="outline" className={`text-[10px] ${s.className}`}>
          {s.label}
        </Badge>
      );
    },
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
  prospects: CuratedRow[];
  onRowClick?: (row: CuratedRow) => void;
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
