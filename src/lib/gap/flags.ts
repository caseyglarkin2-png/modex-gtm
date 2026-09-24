/// GAP Prospecting OS feature flags.
///
/// Every flag is read from process.env at CALL time, never at module load.
/// Three of these flags can cause outbound (GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED,
/// GAP_AUTO_ENROLL_ENABLED with GAP_AUTO_ENROLL_SHADOW as its rehearsal, and
/// GAP_HUBSPOT_MIRROR_ENABLED, which lets the mirror write live HubSpot notes
/// and properties; HUBSPOT_SYNC_ENABLED alone defaults ON and is not enough),
/// so flipping one off plus a redeploy must halt that path on the very next
/// request. That is the same guarantee OUTREACH_PAUSED gives via
/// isOutreachPaused() in src/lib/feature-flags.ts, and it is deliberately not
/// the module-load envBool() pattern used by the older flags in that file.
///
/// Call-time reads are also what makes these unit-testable: a test can flip
/// process.env between assertions and observe the change without re-importing
/// the module.
///
/// Default is OFF for every flag. Only the spellings 1, true, yes, and on
/// (case-insensitive, trimmed) turn a flag on. Unset, empty, "false", "0",
/// and anything else read as off.

export const GAP_FLAGS = [
  'GAP_OS_ENABLED',
  'GAP_HYPOTHESIS_ENABLED',
  'GAP_ROUTING_ENABLED',
  'GAP_MESSAGE_COMPILER_ENABLED',
  'GAP_REPLY_CLASSIFICATION_ENABLED',
  'GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED',
  'GAP_AUTO_ENROLL_ENABLED',
  'GAP_AUTO_ENROLL_SHADOW',
  'GAP_HUBSPOT_MIRROR_ENABLED',
] as const;

export type GapFlagName = (typeof GAP_FLAGS)[number];

/** The payload a gated route returns instead of doing work. */
export type GapSkipPayload = {
  skipped: true;
  reason: `${GapFlagName}=false`;
};

/**
 * Read one GAP flag from the environment right now. Same regex as
 * isOutreachPaused(): only 1 / true / yes / on (any case, trimmed) count as on.
 */
export function gapFlag(name: GapFlagName): boolean {
  return /^(1|true|yes|on)$/i.test((process.env[name] ?? '').trim());
}

/** Master switch for the whole GAP OS. Off means every GAP surface no-ops. */
export function isGapOsEnabled(): boolean {
  return gapFlag('GAP_OS_ENABLED');
}

/** Build the skip payload that names the flag which stopped the work. */
export function gapSkipPayload(name: GapFlagName): GapSkipPayload {
  return { skipped: true, reason: `${name}=false` };
}

/**
 * Gate check for a GAP surface. GAP_OS_ENABLED is always checked first, even
 * when not listed. Returns null when the master switch and every listed flag
 * are on; otherwise the skip payload naming the FIRST flag that is off, in
 * the order given.
 */
export function assertGapEnabled(...names: GapFlagName[]): GapSkipPayload | null {
  if (!isGapOsEnabled()) return gapSkipPayload('GAP_OS_ENABLED');
  for (const name of names) {
    if (!gapFlag(name)) return gapSkipPayload(name);
  }
  return null;
}
