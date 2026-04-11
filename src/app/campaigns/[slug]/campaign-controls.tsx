'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, PauseCircle, PlayCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pauseCampaignAutomationAction, resumeCampaignAutomationAction, resetCampaignDripQueueAction } from '../actions';

export function CampaignControls({
  slug,
  status,
  paused,
}: {
  slug: string;
  status: string;
  paused: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const isPaused = paused || status === 'paused';

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={isPaused ? 'default' : 'outline'}
        size="sm"
        className="gap-1.5"
        disabled={pending || isPaused}
        onClick={() => {
          startTransition(async () => {
            const result = await pauseCampaignAutomationAction(slug);
            if (result.success) {
              toast.success('Campaign drip paused');
            } else {
              toast.error(result.error ?? 'Pause failed');
            }
          });
        }}
      >
        {pending && !isPaused ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PauseCircle className="h-3.5 w-3.5" />}
        Pause Drip
      </Button>

      <Button
        variant={!isPaused ? 'default' : 'outline'}
        size="sm"
        className="gap-1.5"
        disabled={pending || !isPaused}
        onClick={() => {
          startTransition(async () => {
            const result = await resumeCampaignAutomationAction(slug);
            if (result.success) {
              toast.success('Campaign drip resumed');
            } else {
              toast.error(result.error ?? 'Resume failed');
            }
          });
        }}
      >
        {pending && isPaused ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
        Resume Drip
      </Button>

      <Button
        variant="secondary"
        size="sm"
        className="gap-1.5"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await resetCampaignDripQueueAction(slug);
            if (result.success) {
              toast.success(`Cleared ${result.cleared ?? 0} queued drip tasks`);
            } else {
              toast.error(result.error ?? 'Reset failed');
            }
          });
        }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset Queue
      </Button>
    </div>
  );
}
