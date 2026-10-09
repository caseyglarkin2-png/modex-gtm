/**
 * CRM STAGE AUTHORITY (C51 of the commercial-context audit, 2026-10-08). Pure.
 *
 * The rule: a deal's stage is HubSpot's to answer, under a complete read. GAP's own ledger (an obligation done, a
 * meeting outcome, a send, a reply) never moves a stage and never reports one; the activity "deal_advanced" (C38c,
 * work/activity.ts) needs a `deal.stage_changed` row whose from and to came from the CRM. Nothing under src/lib/gap
 * writes `dealstage`; the structural test (stream-a-c51-stage-authority.test.ts) proves it on every run.
 *
 * Every writer of a HubSpot deal stage that this codebase or the Clawd control plane holds is named in STAGE_WRITERS
 * with its owner, its trigger and its gate; the same registry is written out in docs/gap/CRM_STAGE_AUTHORITY.md with
 * the enablement proof read on the date stamped there. A writer that is not in the registry is a defect of this file,
 * not an allowance.
 */
import type { DealCoverage } from '../work/deal-coverage';

export type StageWriterKind =
  /** A deliberate human commercial event (a booked meeting, a rep moving an account into a stage). */
  | 'human_event'
  /** An automation that moves a stage because a touch happened (a send, a reply): the class C51 retires. */
  | 'touch_automation';

export interface StageWriter {
  system: 'modex-gtm' | 'clawd-control-plane';
  /** The module path as it appears in its repository. */
  module: string;
  fn: string;
  trigger: string;
  kind: StageWriterKind;
  owner: string;
  /** The gate that must be on for the write to happen; the doc carries the value read and the date. */
  gate: string;
}

export const STAGE_WRITERS: readonly StageWriter[] = [
  { system: 'modex-gtm', module: 'src/lib/hubspot/deals.ts', fn: 'advanceDealStageForward', trigger: 'POST /api/concierge/booked: a booked meeting moves the open deal forward to Discovery', kind: 'human_event', owner: 'Casey (concierge booking)', gate: 'HUBSPOT_SYNC_ENABLED (default on)' },
  { system: 'modex-gtm', module: 'src/lib/hubspot/deals.ts', fn: 'createBookingDeal', trigger: 'POST /api/concierge/booked: a booked meeting with no open deal opens one at Discovery', kind: 'human_event', owner: 'Casey (concierge booking)', gate: 'HUBSPOT_SYNC_ENABLED (default on)' },
  { system: 'modex-gtm', module: 'src/lib/hubspot/deals.ts', fn: 'createDealIfMissing', trigger: 'POST /api/microsites/roi-lead: an ROI lead opens a deal', kind: 'human_event', owner: 'Casey (microsites)', gate: 'HUBSPOT_SYNC_ENABLED (default on)' },
  { system: 'modex-gtm', module: 'src/lib/hubspot/deals.ts', fn: 'upsertDealForAccount', trigger: 'ensureLocalMeetingDealLink from src/app/pipeline/actions.ts (a rep drags an account into a stage, allowCreate), src/lib/actions.ts (a logged meeting, allowCreate; a status dropdown, link only) and src/app/api/cron/check-inbox/route.ts (a reply, link only): an engine-named "YardFlow - <Account>" stub is re-staged to the local pipeline stage', kind: 'touch_automation', owner: 'legacy modex pipeline (check-inbox is automation on a reply)', gate: 'HUBSPOT_SYNC_ENABLED (default on); INBOX_POLLING_ENABLED (default on) for the cron path' },
  { system: 'clawd-control-plane', module: 'scripts/hubspot_autopush.py', fn: 'update_deal_stage', trigger: 'scripts/automation_scheduler.py _run_hubspot_autopush, every PIPELINE_SYNC_INTERVAL: every pipeline entry past approved is pushed through STAGE_MAP (sent_t1 -> qualifiedtobuy, sent_t2 -> presentationscheduled, replied -> decisionmakerboughtin, meeting -> contractsent)', kind: 'touch_automation', owner: 'Clawd (Railway dazzling-spirit)', gate: 'AUTO_HUBSPOT_AUTOPUSH_ENABLED (default TRUE when unset), DRY_RUN unset, HUBSPOT_PRIVATE_APP_TOKEN present' },
  { system: 'clawd-control-plane', module: 'scripts/reply_scanner.py', fn: 'update_deal_stage', trigger: 'the reply scan: a match whose stage_after differs from stage_before pushes the new stage', kind: 'touch_automation', owner: 'Clawd (Railway dazzling-spirit)', gate: 'AUTO_REPLY_SCAN_ENABLED (default TRUE when unset), DRY_RUN unset, HUBSPOT_PRIVATE_APP_TOKEN present' },
  { system: 'clawd-control-plane', module: 'scripts/mc_server.py', fn: 'auto_push_on_send', trigger: 'handle_sequence_send_touch: a sequence touch send passes new_stage=sent_t<n> into update_deal_stage', kind: 'touch_automation', owner: 'Clawd (Railway dazzling-spirit)', gate: 'AUTO_SEQUENCE_CHECK_ENABLED (false on Railway) and AUTO_ACTUATOR_SEND_ENABLED (false on Railway) for the callers; DRY_RUN unset; HUBSPOT_PRIVATE_APP_TOKEN present' },
];

/** The HubSpot deal writer names a GAP module may never import (the structural test greps for them). */
export const FORBIDDEN_IN_GAP: readonly string[] = ['advanceDealStageForward', 'createBookingDeal', 'createDealIfMissing', 'upsertDealForAccount', 'ensureLocalMeetingDealLink', 'pipelineStageToHubSpotDealStage', 'advancePipelineStage'];

// ---------------------------------------------------------------------------
// Reading a stage: HubSpot's answer, under a complete read, or unknown
// ---------------------------------------------------------------------------

export type StageAnswer =
  | { status: 'known'; dealId: string | null; dealName: string | null; stage: string; basis: 'provider'; checkedAt: string | null; accountName: string }
  | { status: 'none'; checkedAt: string | null }
  | { status: 'unknown'; reason: 'crm_unavailable' | 'crm_not_read' | 'deal_not_found' };

/**
 * The stage of a deal (by id) or of an account's first open deal, from the day's HubSpot read (work/deal-coverage.ts).
 * Known only under a complete read; none only under a complete read that holds no open deal for the account; unknown
 * otherwise. Never a stage from GAP's ledger.
 */
export function dealStage(coverage: DealCoverage, q: { dealId?: string | null; accountName?: string | null }): StageAnswer {
  if (coverage.status === 'unavailable') return { status: 'unknown', reason: 'crm_unavailable' };
  if (coverage.status !== 'complete') return { status: 'unknown', reason: 'crm_not_read' };
  const wantId = q.dealId ? String(q.dealId) : null;
  if (wantId) {
    for (const account of new Set(coverage.byName.values())) {
      const d = account.deals.find((x) => x.id !== null && String(x.id) === wantId);
      if (d) return { status: 'known', dealId: d.id, dealName: d.name, stage: d.stage, basis: 'provider', checkedAt: coverage.checkedAt, accountName: account.accountName };
    }
    return { status: 'unknown', reason: 'deal_not_found' };
  }
  const account = q.accountName ? coverage.byName.get(q.accountName.trim().toLowerCase()) : undefined;
  if (!account) return { status: 'none', checkedAt: coverage.checkedAt };
  const d = account.deals[0];
  if (!d) return { status: 'none', checkedAt: coverage.checkedAt };
  return { status: 'known', dealId: d.id, dealName: d.name, stage: d.stage, basis: 'provider', checkedAt: coverage.checkedAt, accountName: account.accountName };
}

const when = (iso: string | null) => (iso ? ` (HubSpot read ${new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} New York)` : '');

/** The seller words: a stage is said with its read time; never "no stage" from an unread CRM. */
export function stageWords(a: StageAnswer): string {
  if (a.status === 'known') return `${a.dealName ?? a.dealId ?? 'the deal'} is at ${a.stage}${when(a.checkedAt)}`;
  if (a.status === 'none') return `no open deal${when(a.checkedAt)}`;
  if (a.reason === 'crm_unavailable') return 'deal stage unknown: HubSpot could not be read';
  if (a.reason === 'deal_not_found') return 'deal stage unknown: that deal is not among the open deals read';
  return 'deal stage unknown: HubSpot not read';
}

// ---------------------------------------------------------------------------
// The one evidence shape for advancement
// ---------------------------------------------------------------------------

export interface StageChangedPayload {
  dealId: string;
  dealName: string | null;
  accountName: string;
  from: string;
  to: string;
  basis: 'provider';
  source: 'hubspot';
  /** When HubSpot was read for the "to" stage. */
  checkedAt: string | null;
  previousCheckedAt: string | null;
  commitmentId?: string | null;
}

/**
 * C38c's `deal.stage_changed` payload, built ONLY from two CRM reads of the same deal: the stage moved between them.
 * Null when either side is not a known CRM stage, when the deals differ, or when nothing moved. GAP never builds one
 * from its own ledger (a send, a reply, an obligation done, a meeting outcome).
 */
export function stageChangedFromCrm(before: StageAnswer, after: StageAnswer, opts: { commitmentId?: string | null } = {}): StageChangedPayload | null {
  if (before.status !== 'known' || after.status !== 'known') return null;
  if (!after.dealId || !before.dealId || before.dealId !== after.dealId) return null;
  if (before.stage === after.stage) return null;
  return { dealId: after.dealId, dealName: after.dealName, accountName: after.accountName, from: before.stage, to: after.stage, basis: 'provider', source: 'hubspot', checkedAt: after.checkedAt, previousCheckedAt: before.checkedAt, ...(opts.commitmentId ? { commitmentId: opts.commitmentId } : {}) };
}
