export const PIPELINE_STAGES = [
  'targeted',
  'contacted',
  'engaged',
  'meeting',
  'proposal',
  'closed',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  targeted: 'Targeted',
  contacted: 'Contacted',
  engaged: 'Engaged',
  meeting: 'Meeting',
  proposal: 'Proposal',
  closed: 'Closed Won',
};

export function derivePipelineStage(input: {
  pipeline_stage?: string | null;
  outreach_status?: string | null;
  meeting_status?: string | null;
}): PipelineStage {
  const explicit = (input.pipeline_stage ?? '').toLowerCase() as PipelineStage;
  if (PIPELINE_STAGES.includes(explicit)) return explicit;

  const meeting = (input.meeting_status ?? '').toLowerCase();
  const outreach = (input.outreach_status ?? '').toLowerCase();

  if (meeting.includes('held')) return 'proposal';
  if (meeting.includes('booked') || meeting.includes('scheduled') || meeting.includes('requested')) return 'meeting';
  if (outreach.includes('replied') || outreach.includes('follow-up')) return 'engaged';
  if (outreach.includes('contacted') || outreach.includes('in progress')) return 'contacted';
  return 'targeted';
}

export function stageToStatus(stage: PipelineStage): {
  outreachStatus: string;
  meetingStatus: string;
} {
  switch (stage) {
    case 'targeted':
      return { outreachStatus: 'Not started', meetingStatus: 'No meeting' };
    case 'contacted':
      return { outreachStatus: 'Contacted', meetingStatus: 'No meeting' };
    case 'engaged':
      return { outreachStatus: 'Replied', meetingStatus: 'Requested' };
    case 'meeting':
      return { outreachStatus: 'Replied', meetingStatus: 'Meeting Booked' };
    case 'proposal':
      return { outreachStatus: 'Follow-up', meetingStatus: 'Meeting Held' };
    case 'closed':
      return { outreachStatus: 'Follow-up', meetingStatus: 'Meeting Held' };
  }
}

export function nextPipelineStage(stage: PipelineStage): PipelineStage {
  const index = PIPELINE_STAGES.indexOf(stage);
  return PIPELINE_STAGES[Math.min(index + 1, PIPELINE_STAGES.length - 1)];
}

export function advancePipelineStage(current: PipelineStage, proposed: PipelineStage): PipelineStage {
  return PIPELINE_STAGES.indexOf(proposed) > PIPELINE_STAGES.indexOf(current) ? proposed : current;
}

export function pipelineStageToHubSpotDealStage(stage: PipelineStage): string {
  switch (stage) {
    case 'targeted':
      return 'appointmentscheduled';
    case 'contacted':
      return 'qualifiedtobuy';
    case 'engaged':
      return 'presentationscheduled';
    case 'meeting':
      return 'decisionmakerboughtin';
    case 'proposal':
      return 'contractsent';
    case 'closed':
      return 'closedwon';
  }
}
