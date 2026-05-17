'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { WAVE_STATUSES } from '@/lib/campaign-workspace';
import { setWaveStatusAction } from '../actions';

export function WaveStatusControl({
  waveId,
  slug,
  status,
}: {
  waveId: number;
  slug: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const current = (WAVE_STATUSES as readonly string[]).includes(status) ? status : 'Not started';

  return (
    <div className="flex items-center gap-1.5">
      {pending ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : null}
      <select
        aria-label="Wave status"
        value={current}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          if (next === current) return;
          startTransition(async () => {
            const result = await setWaveStatusAction(waveId, next, slug);
            if (result.success) {
              toast.success(`Wave marked “${next}”`);
            } else {
              toast.error(result.error ?? 'Failed to update wave status');
            }
          });
        }}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium disabled:opacity-60"
      >
        {WAVE_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
