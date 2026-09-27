/**
 * Scratch-database stand-ins for HubSpot opportunity truth (final Monday
 * blocker, 2026-09-27). A scratch run has no HubSpot company behind its
 * fixture accounts, so the real resolver would answer UNKNOWN and every gate
 * would (correctly) refuse. These scripts exercise everything else, so they
 * inject an explicit "no open deal". Production never uses this file.
 */
import type { OpportunityTruth } from '../../src/lib/gap/opportunity/active-opportunity';

/** For routing snapshots. */
export const SCRATCH_NO_DEALS_TRUTH: OpportunityTruth = { status: 'CLEAR', companyIds: [] };

/** For the action-time gates (enroll `opportunity`, seller draft/send `activeOpportunity`). */
export const SCRATCH_NO_DEALS = async () => ({ status: 'CLEAR' as const });
