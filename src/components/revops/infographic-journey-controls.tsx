'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JOURNEY_STAGE_INTENTS, STAGE_LABELS } from '@/lib/revops/infographic-journey';
import { toast } from 'sonner';

type JourneyControlsProps = {
  accountName: string;
  campaignId?: number | null;
  initialStage?: (typeof JOURNEY_STAGE_INTENTS)[number];
};

export function InfographicJourneyControls({
  accountName,
  campaignId = null,
  initialStage = 'cold',
}: JourneyControlsProps) {
  const [stage, setStage] = useState<(typeof JOURNEY_STAGE_INTENTS)[number]>(initialStage);
  const [loading, setLoading] = useState(false);

  async function advance(reasonCode: 'engagement_positive' | 'engagement_negative') {
    setLoading(true);
    try {
      const res = await fetch('/api/revops/infographic-journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          campaignId,
          fromStage: stage,
          reasonCode,
          queueNextAsset: true,
        }),
      });
      const json = await res.json() as { error?: string; transition?: { toStage: (typeof JOURNEY_STAGE_INTENTS)[number] }; queuedJobId?: number | null };
      if (!res.ok) throw new Error(json.error ?? 'Could not transition journey');
      if (json.transition?.toStage) {
        setStage(json.transition.toStage);
      }
      toast.success(`Journey advanced (${reasonCode.replaceAll('_', ' ')})${json.queuedJobId ? ` • queued #${json.queuedJobId}` : ''}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update journey');
    } finally {
      setLoading(false);
    }
  }

  async function manualOverride(nextStage: (typeof JOURNEY_STAGE_INTENTS)[number]) {
    setLoading(true);
    try {
      const res = await fetch('/api/revops/infographic-journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          campaignId,
          fromStage: stage,
          reasonCode: 'operator_override',
          overrideToStage: nextStage,
          queueNextAsset: false,
        }),
      });
      const json = await res.json() as { error?: string; transition?: { toStage: (typeof JOURNEY_STAGE_INTENTS)[number] } };
      if (!res.ok) throw new Error(json.error ?? 'Override failed');
      setStage(json.transition?.toStage ?? nextStage);
      toast.success(`Journey overridden to ${nextStage}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Override failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Infographic Journey</p>
        <Badge variant="outline">{STAGE_LABELS[stage]}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => advance('engagement_positive')} disabled={loading}>
          Advance +
        </Button>
        <Button size="sm" variant="outline" onClick={() => advance('engagement_negative')} disabled={loading}>
          Regress -
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {JOURNEY_STAGE_INTENTS.map((stageOption) => (
          <Button
            key={stageOption}
            size="sm"
            variant={stageOption === stage ? 'default' : 'outline'}
            onClick={() => manualOverride(stageOption)}
            disabled={loading}
            className="h-7 px-2 text-[11px]"
          >
            {STAGE_LABELS[stageOption]}
          </Button>
        ))}
      </div>
    </div>
  );
}
