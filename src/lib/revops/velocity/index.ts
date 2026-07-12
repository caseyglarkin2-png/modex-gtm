// src/lib/revops/velocity/index.ts
//
// HubSpot deal-stage history velocity — the ONLY honest funnel-velocity source in
// this system. Neither modex nor clawd stores stage history (Account.pipeline_stage
// is a single overwritten column; qualification writes only a last-evaluated stamp),
// so time-in-stage is derived exclusively from HubSpot's native `dealstage`
// property-change history via propertiesWithHistory. Do not relabel this as local
// time-in-stage — it is not.

import { fetchDealStageHistories } from './fetch';
import { computeVelocity } from './aggregate';
import type { VelocityFetchOptions, VelocityResult } from './types';

export { computeVelocity } from './aggregate';
export { fetchDealStageHistories, resolveVelocityOptions } from './fetch';
export type {
  VelocityResult,
  VelocityFetchOptions,
  StageDwell,
  StageTransition,
  DealStageHistory,
  StageHistoryEntry,
} from './types';

/**
 * Fetch bounded recent deal histories from HubSpot and aggregate them into the
 * honest velocity metric. Read-only, fail-soft: any fetch problem surfaces as a
 * warning in the result rather than an exception.
 */
export async function computePipelineVelocity(
  opts: VelocityFetchOptions = {},
): Promise<VelocityResult> {
  const { deals, warnings } = await fetchDealStageHistories(opts);
  return computeVelocity(deals, warnings);
}
