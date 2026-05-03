import { describe, expect, it } from 'vitest';
import {
  buildPipelineStageHistory,
  parsePipelineFilters,
  parsePipelineTab,
  pipelineWorkspaceTabs,
  stageLabel,
} from '@/lib/pipeline-workspace';

describe('pipeline workspace contract', () => {
  it('declares canonical pipeline tabs', () => {
    expect(pipelineWorkspaceTabs.map((tab) => tab.label)).toEqual([
      'Board',
      'Meetings',
      'Activities',
      'Stage History',
    ]);
  });

  it('parses tab and filters deterministically', () => {
    expect(parsePipelineTab('meetings')).toBe('meetings');
    expect(parsePipelineTab('stage-history')).toBe('stage-history');
    expect(parsePipelineTab('bad-tab')).toBe('board');

    expect(parsePipelineFilters({ account: 'general-mills', campaign: 'modex-2026-follow-up' })).toEqual({
      account: 'general-mills',
      campaign: 'modex-2026-follow-up',
    });
    expect(parsePipelineFilters({})).toEqual({
      account: 'all',
      campaign: 'all',
    });
  });

  it('maps pipeline activity rows into stage history entries', () => {
    const history = buildPipelineStageHistory([
      {
        id: 1,
        account_name: 'General Mills',
        outcome: 'Moved stage from contacted to engaged',
        notes: null,
        owner: 'Casey',
        activity_date: new Date('2026-05-03T12:00:00Z'),
        created_at: new Date('2026-05-03T12:01:00Z'),
      },
      {
        id: 2,
        account_name: 'Frito-Lay',
        outcome: 'Moved to meeting',
        notes: null,
        owner: null,
        activity_date: null,
        created_at: new Date('2026-05-04T08:00:00Z'),
      },
    ]);

    expect(history[0]?.accountName).toBe('Frito-Lay');
    expect(history[0]?.toStage).toBe('meeting');
    expect(history[1]?.fromStage).toBe('contacted');
    expect(history[1]?.toStage).toBe('engaged');
    expect(stageLabel(history[1]?.toStage)).toBe('Engaged');
  });
});
