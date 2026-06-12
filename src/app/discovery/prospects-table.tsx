'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { DataTable, type Column } from '@/components/data-table';
import { BandBadge } from '@/components/band-badge';
import { Badge } from '@/components/ui/badge';
import { generateAngle } from '@/lib/discovery/angle';
import type { ProspectSegment, Confidence } from '@/lib/discovery/types';
import type { RankedRow } from '@/lib/discovery/scoring';

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

function buildColumns(
  pinned: Set<string>,
  onTogglePin?: (placeId: string) => void,
): Column<RankedRow>[] {
  return [
  {
    key: 'pin',
    label: '',
    className: 'w-8',
    render: (r) => {
      const isPinned = pinned.has(r.placeId);
      return (
        <button
          type="button"
          aria-label={isPinned ? `Unpin ${r.name}` : `Pin ${r.name}`}
          aria-pressed={isPinned}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin?.(r.placeId);
          }}
          className="flex items-center text-[var(--muted-foreground)] hover:text-amber-500"
        >
          <Star className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
        </button>
      );
    },
  },
  {
    key: 'worklistScore',
    label: 'Score',
    sortable: true,
    className: 'w-16',
    render: (r) => <span className="font-mono font-semibold">{r.worklistScore.toFixed(1)}</span>,
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
      <div className={r.excluded ? 'opacity-50' : ''}>
        <span className="flex items-center gap-1.5">
          <span className="font-medium">{r.name}</span>
          {r.segment !== 'shipper' && (
            <Badge variant="outline" className="text-[10px] text-[var(--muted-foreground)] border-[var(--border)]">
              {SEGMENT_LABEL[r.segment]}
            </Badge>
          )}
          {r.isExistingAccount && (
            <Link href={`/accounts/${r.existingAccountSlug}`} onClick={(e) => e.stopPropagation()}>
              <Badge variant="outline" className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                In CRM
              </Badge>
            </Link>
          )}
          {r.pipeline && (
            <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-600/30">
              {r.pipeline.stage}
            </Badge>
          )}
          {r.pipeline?.isStale && (
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600/40">
              Stale
            </Badge>
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
        <span className="mt-0.5 block max-w-md truncate text-[11px] text-[var(--muted-foreground)]" title={generateAngle(r)}>
          {generateAngle(r)}
        </span>
      </div>
    ),
  },
  {
    key: 'contactCount',
    label: 'Contacts',
    sortable: true,
    className: 'w-20 text-center',
    render: (r) => {
      const count = r.contactCount ?? 0;
      return count === 0 ? (
        <span
          className="font-mono text-xs font-semibold text-amber-600"
          title="No known contacts. Source people before outreach."
        >
          0
        </span>
      ) : (
        <span className="font-mono text-xs">{count}</span>
      );
    },
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
    label: 'Proximity',
    sortable: true,
    render: (r) => (
      <span className="font-mono text-xs">
        {r.nearestPrimoDistance.toFixed(1)} mi
      </span>
    ),
  },
  {
    key: 'icpScore',
    label: 'ICP',
    sortable: true,
    className: 'hidden xl:table-cell text-center',
    render: (r) => <span className="font-mono text-xs text-[var(--muted-foreground)]">{r.icpScore}</span>,
  },
  ];
}

interface ProspectsTableProps {
  prospects: RankedRow[];
  onRowClick?: (row: RankedRow) => void;
  pinned?: Set<string>;
  onTogglePin?: (placeId: string) => void;
}

const EMPTY_PINNED = new Set<string>();

export function ProspectsTable({ prospects, onRowClick, pinned, onTogglePin }: ProspectsTableProps) {
  const columns = buildColumns(pinned ?? EMPTY_PINNED, onTogglePin);
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
