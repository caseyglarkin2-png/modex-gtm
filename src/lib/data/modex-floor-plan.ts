/**
 * Hardcoded list of accounts attending or worth ambushing at MODEX
 * (April 13-16). Sourced from docs/MODEX_FLOOR_PLAN.md — keep in sync
 * by hand for now. Tier 1 = "Must Connect", Tier 2 = "Attend If Spotted".
 *
 * Used by the account hero badge (S5-T6) so the operator instantly knows
 * an account is on the floor without having to remember the list.
 */
export type ModexFloorTier = 'tier_1' | 'tier_2';

export type ModexFloorEntry = {
  /** Canonical account name as it appears in the Account.name column. */
  account: string;
  tier: ModexFloorTier;
  /** Short angle/context — surfaced in the badge tooltip. */
  context?: string;
};

const MODEX_FLOOR_PLAN: ModexFloorEntry[] = [
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
  MODEX_FLOOR_PLAN.map((entry) => [entry.account.toLowerCase(), entry] as const),
);

/**
 * Returns the floor-plan entry for a given account name, case-insensitive.
 * Returns null when the account is not on the floor.
 */
export function getModexFloorEntry(accountName: string): ModexFloorEntry | null {
  if (!accountName) return null;
  return FLOOR_BY_NAME.get(accountName.toLowerCase()) ?? null;
}

export { MODEX_FLOOR_PLAN };

/** MODEX 2026 ran Mon Apr 13 – Thu Apr 16. Inclusive of the final day. */
const MODEX_END_2026 = new Date('2026-04-16T23:59:59Z');

/**
 * True once MODEX 2026 is fully concluded. The floor-plan badge flips
 * from a forward-looking "must-connect" prompt to a historical marker
 * so the operator isn't nudged toward an event that already happened.
 */
export function isModexPast(now: Date = new Date()): boolean {
  return now.getTime() > MODEX_END_2026.getTime();
}
