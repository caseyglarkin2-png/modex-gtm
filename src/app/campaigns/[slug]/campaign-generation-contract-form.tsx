'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type ContractState = {
  objective: string;
  personaHypothesis: string;
  offer: string;
  proof: string;
  cta: string;
  metric: string;
};

export function CampaignGenerationContractForm({
  campaignId,
  campaignSlug,
  accountNames,
  policyEnabled,
  initial,
}: {
  campaignId: number;
  campaignSlug: string;
  accountNames: string[];
  policyEnabled: boolean;
  initial: Partial<ContractState>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [state, setState] = useState<ContractState>({
    objective: initial.objective ?? '',
    personaHypothesis: initial.personaHypothesis ?? '',
    offer: initial.offer ?? '',
    proof: initial.proof ?? '',
    cta: initial.cta ?? '',
    metric: initial.metric ?? '',
  });

  const isComplete = Object.values(state).every((value) => value.trim().length >= 4);

  async function saveContract() {
    setSubmitting(true);
    try {
      const response = await fetch('/api/revops/campaign-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          ...state,
          createdBy: 'Casey',
        }),
      });
      const payload = await response.json().catch(() => ({} as { error?: string; evaluation?: { score: number } }));
      if (!response.ok) throw new Error(payload.error ?? 'Failed to save generation contract');
      toast.success(`Campaign brief saved (quality ${payload.evaluation?.score ?? 0})`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save generation contract');
    } finally {
      setSubmitting(false);
    }
  }

  async function queueGeneration() {
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNames,
          campaignSlug,
        }),
      });
      const payload = await response.json().catch(() => ({} as { error?: string; createdJobs?: Array<{ id: number }> }));
      if (!response.ok) throw new Error(payload.error ?? 'Failed to queue generation');
      toast.success(`Queued ${payload.createdJobs?.length ?? 0} jobs`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to queue generation');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Campaign Brief → Generation Contract</p>
      <p className="text-xs text-muted-foreground">
        {policyEnabled ? 'This campaign requires a complete brief contract before generation.' : 'Complete this brief to improve generation quality and analytics correlation.'}
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Objective</span>
          <input className="w-full rounded border bg-background px-2 py-1" value={state.objective} onChange={(e) => setState((prev) => ({ ...prev, objective: e.target.value }))} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Persona Hypothesis</span>
          <input className="w-full rounded border bg-background px-2 py-1" value={state.personaHypothesis} onChange={(e) => setState((prev) => ({ ...prev, personaHypothesis: e.target.value }))} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Offer</span>
          <input className="w-full rounded border bg-background px-2 py-1" value={state.offer} onChange={(e) => setState((prev) => ({ ...prev, offer: e.target.value }))} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Proof</span>
          <input className="w-full rounded border bg-background px-2 py-1" value={state.proof} onChange={(e) => setState((prev) => ({ ...prev, proof: e.target.value }))} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">CTA</span>
          <input className="w-full rounded border bg-background px-2 py-1" value={state.cta} onChange={(e) => setState((prev) => ({ ...prev, cta: e.target.value }))} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Metric</span>
          <input className="w-full rounded border bg-background px-2 py-1" value={state.metric} onChange={(e) => setState((prev) => ({ ...prev, metric: e.target.value }))} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={saveContract} disabled={submitting}>{submitting ? 'Saving...' : 'Save Brief Contract'}</Button>
        <Button size="sm" variant="outline" onClick={queueGeneration} disabled={generating || (policyEnabled && !isComplete)}>
          {generating ? 'Queueing...' : 'Queue Generation'}
        </Button>
      </div>
    </div>
  );
}
