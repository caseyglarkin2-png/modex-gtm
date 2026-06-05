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

import type { ProspectSegment } from '@/lib/discovery/types';

interface Props {
  tierFilter: string | null;
  corridorFilter: string | null;
  minScore: number | null;
  segmentFilter: string | null;
  segmentCounts: Record<ProspectSegment, number>;
  corridorNames: string[];
  onTierChange: (tier: string | null) => void;
  onCorridorChange: (corridor: string | null) => void;
  onMinScoreChange: (score: number | null) => void;
  onSegmentChange: (segment: string | null) => void;
  resultCount: number;
}

const TIERS = ['A', 'B', 'C', 'D'] as const;

const SEGMENTS: { value: ProspectSegment; label: string }[] = [
  { value: 'shipper', label: 'Shipper' },
  { value: 'carrier', label: 'Carrier' },
  { value: '3pl', label: '3PL' },
  { value: 'parcel', label: 'Parcel' },
];

// Preset thresholds aligned to the tier bands (A≥70, B≥50).
const MIN_SCORE_OPTIONS: { value: string; label: string }[] = [
  { value: '__any__', label: 'Any score' },
  { value: '85', label: 'Score ≥ 85' },
  { value: '70', label: 'Score ≥ 70 (Tier A)' },
  { value: '50', label: 'Score ≥ 50 (Tier A+B)' },
  { value: '30', label: 'Score ≥ 30' },
];

export function FilterBar({
  tierFilter,
  corridorFilter,
  minScore,
  segmentFilter,
  segmentCounts,
  corridorNames,
  onTierChange,
  onCorridorChange,
  onMinScoreChange,
  onSegmentChange,
  resultCount,
}: Props) {
  const hasFilters = Boolean(tierFilter || corridorFilter || minScore != null || segmentFilter);

  return (
    <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Prospect filters">
      <div className="flex items-center gap-1.5" role="group" aria-label="Tier filter">
        {TIERS.map((t) => {
          const active = tierFilter === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              aria-label={`Tier ${t}`}
              onClick={() => onTierChange(active ? null : t)}
              className={`rounded-md border px-2 py-0.5 text-xs font-medium transition ${
                active
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5" role="group" aria-label="Segment filter">
        {SEGMENTS.map((s) => {
          const active = segmentFilter === s.value;
          return (
            <button
              key={s.value}
              type="button"
              aria-pressed={active}
              aria-label={`${s.label} segment`}
              onClick={() => onSegmentChange(active ? null : s.value)}
              className={`rounded-md border px-2 py-0.5 text-xs font-medium transition ${
                active
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              {s.label}
              <span className="ml-1 text-[10px] opacity-70">{segmentCounts[s.value].toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      <Select
        value={corridorFilter ?? '__all__'}
        onValueChange={(v) => onCorridorChange(v === '__all__' ? null : v)}
      >
        <SelectTrigger className="h-8 w-[200px] text-xs" aria-label="Corridor filter">
          <SelectValue placeholder="All corridors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All corridors</SelectItem>
          {corridorNames.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={minScore == null ? '__any__' : String(minScore)}
        onValueChange={(v) => onMinScoreChange(v === '__any__' ? null : parseInt(v, 10))}
      >
        <SelectTrigger className="h-8 w-[170px] text-xs" aria-label="Minimum ICP score">
          <SelectValue placeholder="Any score" />
        </SelectTrigger>
        <SelectContent>
          {MIN_SCORE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            onTierChange(null);
            onCorridorChange(null);
            onMinScoreChange(null);
            onSegmentChange(null);
          }}
          className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}

      {corridorFilter && (
        <Badge variant="outline" className="gap-1 text-xs">
          {corridorFilter}
          <button type="button" aria-label={`Clear corridor ${corridorFilter}`} onClick={() => onCorridorChange(null)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <span className="ml-auto text-xs text-[var(--muted-foreground)]" aria-live="polite">
        {resultCount.toLocaleString()} {resultCount === 1 ? 'prospect' : 'prospects'}
      </span>
    </div>
  );
}
