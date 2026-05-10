/**
 * Hardcoded list of accounts that were on the industry-event floor plan.
 * Currently populated with MODEX 2026 historical floor data; refresh per event.
 * Sourced from docs/MODEX_FLOOR_PLAN.md — keep in sync by hand for now.
 * Tier 1 = "Must Connect", Tier 2 = "Attend If Spotted".
 *
 * Used by the account hero badge (S5-T6) so the operator instantly knows
 * an account was on the floor without having to remember the list.
 */
export type EventFloorTier = 'tier_1' | 'tier_2';

export type EventFloorEntry = {
  /** Canonical account name as it appears in the Account.name column. */
  account: string;
  tier: EventFloorTier;
  /** Short angle/context — surfaced in the badge tooltip. */
  context?: string;
};

const EVENT_FLOOR_PLAN: EventFloorEntry[] = [
  // Tier 1 — Must Connect
  { account: 'General Mills', tier: 'tier_1', context: 'Score 83 · Tier 1' },
  { account: 'Frito-Lay', tier: 'tier_1', context: 'Score 83 · Tier 1' },
  { account: 'Diageo', tier: 'tier_1', context: 'Score 83 · Tier 1' },
  { account: 'JM Smucker', tier: 'tier_1', context: 'Score 81 · Tier 1' },
  { account: 'Hormel Foods', tier: 'tier_1', context: 'Score 81 · Tier 1' },
  { account: 'AB InBev', tier: 'tier_1', context: 'Score 81 · Tier 1' },
  { account: 'Coca-Cola', tier: 'tier_1', context: 'Score 81 · Tier 1' },
  // Tier 2 — Attend If Spotted
  { account: 'Home Depot', tier: 'tier_2', context: 'Score 77 · Retail replenishment, 2,300 stores' },
  { account: 'Georgia Pacific', tier: 'tier_2', context: 'Score 75 · Industrial wood products' },
  { account: 'Keurig Dr Pepper', tier: 'tier_2', context: 'Score 75 · Multi-brand beverage complexity' },
  { account: 'Mondelez', tier: 'tier_2', context: 'Score 75 · Snacks + biscuits, global complexity' },
  { account: 'Refresco', tier: 'tier_2', context: 'Score 75 · Co-packing, multiple facility types' },
  { account: 'H-E-B', tier: 'tier_2', context: 'Score 73 · Texas-dominant retail, tight windows' },
  { account: 'Caterpillar', tier: 'tier_2', context: 'Score 71 · Heavy manufacturing, JIT' },
  { account: 'Campbell\'s', tier: 'tier_2', context: 'Score 69 · Post-Sovos, shelf-stable + fresh' },
];

const FLOOR_BY_NAME = new Map(
  EVENT_FLOOR_PLAN.map((entry) => [entry.account.toLowerCase(), entry] as const),
);

/**
 * Returns the floor-plan entry for a given account name, case-insensitive.
 * Returns null when the account is not on the floor.
 */
export function getEventFloorEntry(accountName: string): EventFloorEntry | null {
  if (!accountName) return null;
  return FLOOR_BY_NAME.get(accountName.toLowerCase()) ?? null;
}

export { EVENT_FLOOR_PLAN };

/** MODEX 2026 ran Mon Apr 13 – Thu Apr 16. This is the end date for the most-recent event in this floor plan. */
const EVENT_END_DATE = new Date('2026-04-16T23:59:59Z');

/**
 * True once the industry event is fully concluded. The floor-plan badge flips
 * from a forward-looking "must-connect" prompt to a historical marker
 * so the operator isn't nudged toward an event that already happened.
 */
export function isEventPast(now: Date = new Date()): boolean {
  return now.getTime() > EVENT_END_DATE.getTime();
}
