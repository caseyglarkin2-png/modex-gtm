// src/lib/revops/velocity/types.ts
//
// HONEST funnel-velocity types. Every number here derives from HubSpot's native
// `dealstage` property-change history (propertiesWithHistory), NOT from any
// locally stored stage column — the local Account.pipeline_stage is a single
// overwritten value with no history, so it CANNOT yield time-in-stage. Label this
// metric "HubSpot deal-stage history velocity" everywhere it surfaces.

/** One `dealstage` change as HubSpot records it: the stage the deal moved INTO at `timestampMs`. */
export interface StageHistoryEntry {
  stage: string;
  /** Epoch milliseconds. Normalized from HubSpot's ValueWithTimestamp.timestamp (a Date). */
  timestampMs: number;
}

/** A single deal's ordered `dealstage` history (as fetched; ordering is normalized on aggregate). */
export interface DealStageHistory {
  id: string;
  dealname: string;
  history: StageHistoryEntry[];
}

/** Average dwell for one stage, across all deals that left it. */
export interface StageDwell {
  stage: string;
  /** Number of completed dwells observed (deal entered THEN left this stage). */
  observations: number;
  avgDays: number;
  medianDays: number;
  totalDays: number;
}

/** How many deals moved directly from `from` -> `to`. */
export interface StageTransition {
  from: string;
  to: string;
  count: number;
}

/** The aggregate honest-velocity result. */
export interface VelocityResult {
  source: 'hubspot-dealstage-history';
  /** ISO timestamp the aggregate was computed. */
  computedAt: string;
  /** Deals whose history was fetched and considered. */
  dealsAnalyzed: number;
  /** Deals that contributed at least one completed dwell (>= 2 history entries). */
  dealsWithDwell: number;
  /** Per-stage average dwell, sorted by total observed time descending. */
  stageDwell: StageDwell[];
  /** Directed stage-to-stage move counts, sorted by count descending. */
  transitions: StageTransition[];
  /** Non-fatal issues (fetch failures, truncation, unparsable entries). Never throws. */
  warnings: string[];
}

/** Options for the bounded deal-history fetch. */
export interface VelocityFetchOptions {
  /** Only consider deals modified within this many days (default 180). */
  lookbackDays?: number;
  /** Hard cap on deals pulled, to stay inside the serverless budget (default 300). */
  maxDeals?: number;
  /** Restrict to a single pipeline id (default 'default'). Pass null for all pipelines. */
  pipelineId?: string | null;
}
