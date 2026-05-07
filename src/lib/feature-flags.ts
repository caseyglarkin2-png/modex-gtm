/**
 * Feature flags — read from env vars, type-safe, with defaults.
 * Flip any flag to 'false' to disable without code revert.
 */

function envBool(key: string, defaultVal: boolean): boolean {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultVal;
  return val.toLowerCase() !== 'false' && val !== '0';
}

/** Gates HubSpot logging in sendEmail()/sendBulk(). Default: true. */
export const HUBSPOT_LOGGING_ENABLED = envBool('HUBSPOT_LOGGING_ENABLED', true);

/** Gates HubSpot sync cron routes. Default: true. */
export const HUBSPOT_SYNC_ENABLED = envBool('HUBSPOT_SYNC_ENABLED', true);

/** Gates inbox polling cron. Default: true. */
export const INBOX_POLLING_ENABLED = envBool('INBOX_POLLING_ENABLED', true);

/** Gates campaign drip automation cron. Default: true. */
export const DRIP_SEQUENCE_ENABLED = envBool('DRIP_SEQUENCE_ENABLED', true);

/** Gates source-backed evidence ingest + persistence. Default: false (progressive rollout). */
export const SOURCE_EVIDENCE_INGEST_ENABLED = envBool('SOURCE_EVIDENCE_INGEST_ENABLED', false);

/** Gates hard approval checks for generated-content sends. Default: false (progressive rollout). */
export const SOURCE_APPROVAL_GATE_ENABLED = envBool('SOURCE_APPROVAL_GATE_ENABLED', false);

/** Gates CC parsing/validation in bulk send contracts. Default: false (progressive rollout). */
export const SOURCE_CC_BULK_ENABLED = envBool('SOURCE_CC_BULK_ENABLED', false);
