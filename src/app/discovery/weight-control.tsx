'use client';

import { SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WEIGHT_PRESETS, type Weights } from '@/lib/discovery/scoring';

const PRESET_LABELS: { value: string; label: string; hint: string }[] = [
  { value: 'proximity-led', label: 'Proximity-led', hint: 'Lead with distance to a live YardFlow site' },
  { value: 'balanced', label: 'Balanced', hint: 'Even blend of proximity, fit, and density' },
  { value: 'fit-led', label: 'Fit-led', hint: 'Lead with enterprise scale + ICP fit' },
  { value: 'corridor-density', label: 'Corridor-density', hint: 'Work one corridor at a time — trip planning' },
];

interface Props {
  weighting: string;
  onChange: (weighting: string) => void;
}

/** Compact summary of the active weights, e.g. "Prox 55 · Fit 30 · Density 15". */
function weightSummary(w: Weights): string {
  const pct = (n: number) => Math.round(n * 100);
  return `Prox ${pct(w.proximity)} · Fit ${pct(w.fit)} · Density ${pct(w.density)}`;
}

export function WeightControl({ weighting, onChange }: Props) {
  const active = WEIGHT_PRESETS[weighting] ?? WEIGHT_PRESETS['proximity-led'];
  return (
    <div className="flex items-center gap-2" aria-label="Ranking weighting">
      <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--muted-foreground)]" aria-hidden />
      <Select value={weighting} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[180px] text-xs" aria-label="Ranking weighting">
          <SelectValue placeholder="Proximity-led" />
        </SelectTrigger>
        <SelectContent>
          {PRESET_LABELS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              <span className="flex flex-col">
                <span>{p.label}</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">{p.hint}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="hidden text-[10px] text-[var(--muted-foreground)] lg:inline">{weightSummary(active)}</span>
    </div>
  );
}
