/**
 * Pure formatting for HubSpot deal/pipeline state shown on the worklist.
 * No HubSpot imports here so it stays trivially unit-testable; the network
 * loader lives in `pipeline.ts`.
 */
import { PIPELINE_STAGE_LABELS, type PipelineStage } from '@/lib/pipeline';

/** A deal is "stale" (re-engage) once this many days pass with no activity. */
export const STALE_DAYS = 21;

// Standard HubSpot sales-pipeline stage ids → app stage keys (inverse of
// pipelineStageToHubSpotDealStage in src/lib/pipeline.ts).
const HS_STAGE_TO_APP: Record<string, PipelineStage> = {
  appointmentscheduled: 'targeted',
  qualifiedtobuy: 'contacted',
  presentationscheduled: 'engaged',
  decisionmakerboughtin: 'meeting',
  contractsent: 'proposal',
  closedwon: 'closed',
};

function titleCase(s: string): string {
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Readable label for a raw HubSpot dealstage id. */
export function hubspotStageLabel(rawStage: string): string {
  const app = HS_STAGE_TO_APP[rawStage];
  if (app) return PIPELINE_STAGE_LABELS[app];
  if (rawStage === 'closedlost') return 'Closed Lost';
  return rawStage ? titleCase(rawStage) : 'Unknown';
}

/** Whole days between an ISO timestamp and `now` (ms). */
export function daysSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

/** True when the last activity is at least STALE_DAYS old. */
export function isStaleDeal(lastActivity: string | null, now: number): boolean {
  if (!lastActivity) return false;
  return daysSince(lastActivity, now) >= STALE_DAYS;
}

export interface PipelineState {
  /** Readable stage label, e.g. "Meeting". */
  stage: string;
  /** Raw HubSpot dealstage id. */
  rawStage: string;
  owner: string | null;
  amount: number | null;
  /** ISO timestamp of the most recent activity, or null. */
  lastActivity: string | null;
  nextStep: string | null;
  closeDate: string | null;
  isStale: boolean;
}

function num(v: string | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Build a PipelineState from HubSpot deal properties + a resolved owner name. */
export function mapDealToPipelineState(
  props: Record<string, string | null | undefined>,
  ownerName: string | null,
  now: number,
): PipelineState {
  const rawStage = props.dealstage ?? '';
  const lastActivity = props.notes_last_contacted || props.hs_lastmodifieddate || null;
  return {
    stage: hubspotStageLabel(rawStage),
    rawStage,
    owner: ownerName,
    amount: num(props.amount),
    lastActivity,
    nextStep: props.hs_next_step || null,
    closeDate: props.closedate || null,
    isStale: isStaleDeal(lastActivity, now),
  };
}
