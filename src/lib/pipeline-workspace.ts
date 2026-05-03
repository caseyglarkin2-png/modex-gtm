import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type PipelineStage } from '@/lib/pipeline';

export type PipelineTabId = 'board' | 'meetings' | 'activities' | 'stage-history';

export type PipelineTab = {
  id: PipelineTabId;
  label: string;
  purpose: string;
};

export type PipelineFilterState = {
  account: string;
  campaign: string;
};

export type PipelineHistorySource = {
  id: number;
  account_name: string;
  outcome: string | null;
  notes: string | null;
  owner: string | null;
  activity_date: Date | null;
  created_at: Date;
};

export type PipelineStageHistoryItem = {
  id: string;
  accountName: string;
  fromStage?: PipelineStage;
  toStage?: PipelineStage;
  outcome: string;
  owner: string;
  occurredAt: Date;
};

export const pipelineWorkspaceTabs: PipelineTab[] = [
  { id: 'board', label: 'Board', purpose: 'Stage-by-stage account progression and stage movement actions.' },
  { id: 'meetings', label: 'Meetings', purpose: 'Booked/upcoming meeting pipeline and prep coverage.' },
  { id: 'activities', label: 'Activities', purpose: 'Execution timeline and follow-up activity queue.' },
  { id: 'stage-history', label: 'Stage History', purpose: 'Audit trail of pipeline stage changes over time.' },
];

function toStageToken(input: string): PipelineStage | undefined {
  const normalized = input.trim().toLowerCase();
  return PIPELINE_STAGES.find((stage) => stage === normalized);
}

function parseStagesFromText(text: string): { fromStage?: PipelineStage; toStage?: PipelineStage } {
  const lower = text.toLowerCase();
  const fromMatch = lower.match(/from\s+([a-z_]+)/);
  const toMatch = lower.match(/to\s+([a-z_]+)/);
  return {
    fromStage: fromMatch ? toStageToken(fromMatch[1] ?? '') : undefined,
    toStage: toMatch ? toStageToken(toMatch[1] ?? '') : undefined,
  };
}

export function buildPipelineStageHistory(items: PipelineHistorySource[]): PipelineStageHistoryItem[] {
  return items
    .map((item) => {
      const outcome = item.outcome ?? item.notes ?? 'Pipeline stage update';
      const parsed = parseStagesFromText(`${item.outcome ?? ''} ${item.notes ?? ''}`);
      return {
        id: `pipeline-history-${item.id}`,
        accountName: item.account_name,
        fromStage: parsed.fromStage,
        toStage: parsed.toStage,
        outcome,
        owner: item.owner ?? 'System',
        occurredAt: item.activity_date ?? item.created_at,
      };
    })
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}

export function parsePipelineTab(tab: string | undefined): PipelineTabId {
  const ids = new Set(pipelineWorkspaceTabs.map((item) => item.id));
  return ids.has(tab as PipelineTabId) ? (tab as PipelineTabId) : 'board';
}

export function parsePipelineFilters(input: {
  account?: string;
  campaign?: string;
}): PipelineFilterState {
  return {
    account: input.account ?? 'all',
    campaign: input.campaign ?? 'all',
  };
}

export function stageLabel(stage: PipelineStage | undefined): string {
  if (!stage) return 'Unknown';
  return PIPELINE_STAGE_LABELS[stage];
}
