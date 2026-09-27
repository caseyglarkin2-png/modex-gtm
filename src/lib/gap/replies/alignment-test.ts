/**
 * Ops closeout 3: the one recipient of the hand-triggered GAP alignment test
 * (src/app/api/cron/gap-alignment-test). Internal, on another Google Workspace
 * domain so the received copy records SPF, DKIM and DMARC for the sender.
 * A constant: no caller can choose it.
 */
export const ALIGNMENT_TEST_RECIPIENT = 'casey@freightroll.com';
