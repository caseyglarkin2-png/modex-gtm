/**
 * Public ATA-sourced assumptions used to compute modeled detention exposure
 * for the Detention Clock chip. Exported so the chip's source line can cite
 * "rate · ATA 2024 yard ops" and so callers can inspect the figures rather
 * than treat them as magic numbers.
 *
 * If a future spec wants per-vertical rates (reefer vs dry van, etc.), add
 * an overload that accepts an override object — but the default stays the
 * uniform public figure used across all accounts today.
 */
export const DETENTION_ASSUMPTIONS = {
  /** Average dwell per move (hours). 90-min average from the survey. */
  dwellHours: 1.5,
  /** Detention rate ($/hr). ATA 2024 yard ops survey. */
  dollarsPerHour: 100,
  /** Yard moves per facility per workday. */
  movesPerFacilityPerDay: 8,
  /** Working days per month. */
  workdaysPerMonth: 22,
} as const;

/**
 * Modeled detention dollars accruing per second across `facilityCount`
 * facilities, given the public ATA assumptions above.
 *
 *   monthly = facilities × dwellHrs × $/hr × moves/facility-day × workdays/mo
 *   perSecond = monthly / (30 × 86400)
 *
 * For a 13-facility footprint this is ~$0.132/sec → ~$11.4k/day →
 * ~$343k/mo. Linear in facilityCount; returns 0 when facilityCount is 0.
 */
export function computeDetentionPerSecond(facilityCount: number): number {
  const { dwellHours, dollarsPerHour, movesPerFacilityPerDay, workdaysPerMonth } =
    DETENTION_ASSUMPTIONS;
  const monthly =
    facilityCount * dwellHours * dollarsPerHour * movesPerFacilityPerDay * workdaysPerMonth;
  return monthly / (30 * 86400);
}
