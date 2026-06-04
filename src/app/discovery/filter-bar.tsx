'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  tierFilter: string | null;
  corridorFilter: string | null;
  corridorNames: string[];
  onTierChange: (tier: string | null) => void;
  onCorridorChange: (corridor: string | null) => void;
}

const TIERS = ['A', 'B', 'C', 'D'] as const;

export function FilterBar({ tierFilter, corridorFilter, corridorNames, onTierChange, onCorridorChange }: Props) {
  const hasFilters = tierFilter || corridorFilter;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => onTierChange(tierFilter === t ? null : t)}
            className={`rounded-md border px-2 py-0.5 text-xs font-medium transition ${
              tierFilter === t
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                : 'border-[var(--border)] hover:border-[var(--primary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Select
        value={corridorFilter ?? '__all__'}
        onValueChange={(v) => onCorridorChange(v === '__all__' ? null : v)}
      >
        <SelectTrigger className="h-8 w-[200px] text-xs">
          <SelectValue placeholder="All corridors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All corridors</SelectItem>
          {corridorNames.map((name) => (
            <SelectItem key={name} value={name}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          onClick={() => { onTierChange(null); onCorridorChange(null); }}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}

      {corridorFilter && (
        <Badge variant="outline" className="gap-1 text-xs">
          {corridorFilter}
          <button onClick={() => onCorridorChange(null)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}
