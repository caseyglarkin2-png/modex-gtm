/**
 * Feature flags — read from env vars, type-safe, with defaults.
 * Flip any flag to 'false' to disable without code revert.
 */

function envBool(key: string, defaultVal: boolean): boolean {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultVal;
  return val.toLowerCase() !== 'false' && val !== '0';
}

/** Gates HubSpot logging in sendEmail()/sendBulk(). Default: false (enable after Sprint 1). */
export const HUBSPOT_LOGGING_ENABLED = envBool('HUBSPOT_LOGGING_ENABLED', false);

/** Gates HubSpot sync cron routes. Default: false (enable after Sprint 1). */
export const HUBSPOT_SYNC_ENABLED = envBool('HUBSPOT_SYNC_ENABLED', false);

/** Gates inbox polling cron. Default: false (enable after Sprint 2). */
export const INBOX_POLLING_ENABLED = envBool('INBOX_POLLING_ENABLED', false);
