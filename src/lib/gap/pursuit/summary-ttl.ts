/**
 * The pursuit summary's ages (pursuit/summary.ts re-exports them; kept apart so the day loader reads them without the
 * summary module's readers). Work ranks only by a summary within PURSUIT_SUMMARY_TTL_MS; the answered replies a summary
 * recorded (the walk fix, 2026-10-10) are FACTS, not display state, and are read for ANSWERED_FACTS_MAX_MS (a reply
 * answered stays answered; the Sent window).
 */
export const PURSUIT_SUMMARY_TTL_MS = 15 * 60_000;
export const ANSWERED_FACTS_MAX_MS = 180 * 86_400_000;
