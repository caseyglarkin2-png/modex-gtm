# Reviewable Resend Runbook - 2026-04-08

Use this only for the five reviewable resend candidates.

## Goal

Send one message at a time from `casey@freightroll.com`, then watch for bounce or unsubscribe before the next send.

Telemetry reality:

The current live sender is Gmail API. In this repo, Gmail sends log as `sent` and do not generate outbound delivery, open, or click webhook updates.

## Recommended Order

1. Ryan Hutcherson
2. Troy Retzloff
3. Will Bonifant
4. Rob Ferguson
5. John Deaton

Reasoning:

1. Ryan and Troy are the cleanest operational retries. Both are A-band and still `is_contact_ready=true`.
2. Will, Rob, and John are reviewable, but their persona rows are still stale on readiness and should follow the first two.

## Hard Rules

1. Dry run every manifest first.
2. Live send exactly one review-resend manifest at a time.
3. Wait and monitor before the next send.
4. Stop immediately on any bounce or unsubscribe.
5. Do not wait for `delivered`, `opened`, or `clicked` status on Gmail sends. That telemetry does not exist in the current stack.

## Safety Latch

Live review-resend sends require `RECOVERY_RESEND_OK=1`.

That is intentional. It forces an explicit opt-in for these recovery attempts.

## Commands

### Dry run the first candidate

```bash
DRY_RUN=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=review-resend-ryan-hutcherson
```

### Live send the first candidate

```bash
RECOVERY_RESEND_OK=1 npx tsx --env-file=.env.local scripts/batch-send-gmail.ts --contacts=review-resend-ryan-hutcherson
```

### Monitor the first candidate

```bash
npx tsx --env-file=.env.local scripts/monitor-reviewable-resends.ts --contacts=review-resend-ryan-hutcherson --lookbackMinutes=60
```

### Monitor the full recovery lane before sending the next one

```bash
npx tsx --env-file=.env.local scripts/monitor-reviewable-resends.ts --contacts=review-resend-ryan-hutcherson,review-resend-troy-retzloff,review-resend-will-bonifant,review-resend-rob-ferguson,review-resend-john-deaton --lookbackMinutes=180
```

## Proceed Criteria

Send the next contact only if the monitor script returns `CLEAR` and there is no manual bounce notice in the Gmail inbox.

## Stop Criteria

Do not send the next contact if either of these is true:

1. `STOP`: a watched address bounced or unsubscribed.
2. Gmail returns or later receives a bounce or complaint outside the app logs.

## Manifests

1. `review-resend-ryan-hutcherson`
2. `review-resend-troy-retzloff`
3. `review-resend-will-bonifant`
4. `review-resend-rob-ferguson`
5. `review-resend-john-deaton`
