// src/lib/revops/qualification/types.ts
export type Verdict = 'none' | 'mql' | 'sql';

/** Raw contact properties the engine reads (HubSpot returns all as strings). */
export interface QualContact {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  jobtitle: string;
  lifecyclestage: string;
  hs_seniority: string;
  hs_role: string;
  yardflow_qual_verdict: string;
  intent_score: string;
  last_intent_at: string;
  last_intent_source: string;
  hs_sales_email_last_replied: string;
  hs_email_open: string;
  hs_email_replied: string;
  engagements_last_meeting_booked: string;
}

export interface QualCompany {
  id: string;
  name: string;
  icpScore: number;
  tam: string;
  tier: string;
  /**
   * Account-grade heat, read from the COMPANY (the modex intent engine stamps
   * these). The keystone join (2026-07-20): a hot account promotes its
   * role-gated committee to SQL even when no single contact has personal
   * engagement — which is what finally makes /demo + /for traffic produce SQLs.
   */
  intentScore?: number; // 0-100 web/demo/for reading behavior (company intent_score)
  triggerScore?: number; // 0-100 external news/capex heat (company trigger_score)
  lastIntentAt?: string;
  lastIntentSource?: string;
}

export interface VerdictDiff {
  contactId: string;
  name: string;
  email: string;
  companyId: string;
  companyName: string;
  icpScore: number;
  seniority: string;
  role: string;
  jobtitle: string;
  currentLifecycle: string;
  currentVerdict: Verdict;
  newVerdict: Verdict;
  changed: boolean;
  reason: string;
  tamTier: string;
  /** Any email engagement (open/reply) — gates MQL lifecycle promotion (SQLs promote regardless). */
  hasPulse: boolean;
}

export interface EvaluateResult {
  evaluatedAt: string;
  companies: number;
  contacts: number;
  counts: Record<Verdict, number>;
  changes: number;
  diff: VerdictDiff[];
  /** Per-company fetch failures that were isolated so the run could continue. */
  warnings: string[];
}
