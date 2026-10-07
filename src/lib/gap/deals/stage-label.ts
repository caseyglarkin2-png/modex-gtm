/**
 * A HubSpot deal stage in words (Sprint 5 exit: "YardFlow - Kroger · appointmentscheduled" showed the stage id).
 * Client safe: no server imports. The account page reads the live pipeline names first (opportunity/stage-labels.ts);
 * this is the words when that read has no name, so a page never shows a stage id.
 */

const DEFAULT_STAGES: Record<string, string> = {
  appointmentscheduled: 'Appointment scheduled',
  qualifiedtobuy: 'Qualified to buy',
  presentationscheduled: 'Presentation scheduled',
  decisionmakerboughtin: 'Decision maker bought in',
  contractsent: 'Contract sent',
  closedwon: 'Closed won',
  closedlost: 'Closed lost',
};

/** A portal's custom stage whose name could not be read says so, never its id. */
export const CUSTOM_STAGE = 'Custom stage (its name could not be read)';

export function stageLabel(stage: string | null | undefined): string {
  if (!stage) return 'Stage unknown';
  return DEFAULT_STAGES[stage] ?? CUSTOM_STAGE;
}

/** The live pipeline name when one was read, else the words above. */
export function stageName(stage: string | null | undefined, live?: ReadonlyMap<string, string>): string | null {
  if (!stage) return null;
  return live?.get(stage) ?? stageLabel(stage);
}
