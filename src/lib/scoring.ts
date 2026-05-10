// Scoring engine derived from Lists.csv weights
// Fit weight: 30, Industry Event signal: 20, Primo story: 20, Warm intro: 15, Strategic value: 10, Meeting ease: 5
// Tier 1 cutoff: 85, Tier 2 cutoff: 70

const WEIGHTS = {
  icp_fit: 30,
  event_signal: 20,
  primo_story_fit: 20,
  warm_intro: 15,
  strategic_value: 10,
  meeting_ease: 5,
} as const;

const TIER_CUTOFFS = {
  tier1: 85,
  tier2: 70,
} as const;

export interface ScoringInput {
  icp_fit: number;
  event_signal: number;
  primo_story_fit: number;
  warm_intro: number;
  strategic_value: number;
  meeting_ease: number;
}

export function computePriorityScore(input: ScoringInput): number {
  const raw =
    input.icp_fit * WEIGHTS.icp_fit +
    input.event_signal * WEIGHTS.event_signal +
    input.primo_story_fit * WEIGHTS.primo_story_fit +
    input.warm_intro * WEIGHTS.warm_intro +
    input.strategic_value * WEIGHTS.strategic_value +
    input.meeting_ease * WEIGHTS.meeting_ease;
  return raw / 5;
}

export function computeTier(score: number): string {
  if (score >= TIER_CUTOFFS.tier1) return "Tier 1";
  if (score >= TIER_CUTOFFS.tier2) return "Tier 2";
  return "Tier 3";
}

export function computePriorityBand(score: number): "A" | "B" | "C" | "D" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}

// Heat Score from Mobile Capture: Interest + Urgency + Influence + Fit (4-20)
export interface HeatScoreInput {
  interest: number;
  urgency: number;
  influence: number;
  fit: number;
}

export function computeHeatScore(input: HeatScoreInput): number {
  return input.interest + input.urgency + input.influence + input.fit;
}

export function computeHeatBand(score: number): "Hot" | "Warm" | "Cool" {
  if (score >= 16) return "Hot";
  if (score >= 10) return "Warm";
  return "Cool";
}
