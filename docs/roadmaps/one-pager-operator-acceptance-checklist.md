# One-Pager Operator Acceptance Checklist (5 Minutes)

Use this checklist to validate the latest one-pager workflow in production.

- App URL: `https://modex-gtm.vercel.app`
- Required account: `casey@freightroll.com`
- Scope: generated content workspace, bulk preview decision flow, queue, metrics, and contacts enrichment.

## 1) Login

Path: `/login`

Pass criteria:
- Sign in succeeds.
- You land on the authenticated app shell.

Fail if:
- Credentials are rejected for authorized user.
- Redirect loops or blank page.

## 2) Generated Content Workspace

Path: `/generated-content`

Pass criteria:
- Page heading shows `Generated Content`.
- Search input is visible.
- Selection summary panel is visible with:
  - `Selectable Accounts`
  - `Selected Accounts`
  - `Selected Recipients`
  - `Items Requiring Review`

Fail if:
- Page shows `Page Not Found`.
- Summary panel is missing.

## 3) Bulk Preview Decision Flow

Path: `/generated-content` (select at least one row, then open `Bulk Preview & Queue Send`)

Pass criteria:
- Bulk dialog opens.
- Decision summary strip shows:
  - `Accounts In Scope`
  - `Recipients In Scope`
  - `Warnings To Acknowledge`
  - `Auto-Skipped Accounts`
- Warning rows show `Needs Review` badge when applicable.
- `Queue Async Send Job` is disabled until required warning acknowledgements are checked.

Fail if:
- Dialog does not open.
- Queue button enables before required acknowledgements.

## 4) Generation Queue

Path: `/queue/generations`

Pass criteria:
- Page heading shows `Generation Queue`.
- `Job List` is visible.
- If failed jobs exist, `Retry Generation` control is visible.

Fail if:
- Route not reachable.
- Queue list fails to render.

## 5) Generation Metrics

Path: `/admin/generation-metrics`

Pass criteria:
- Page heading shows `Generation Metrics`.
- Panels visible:
  - `Provider Breakdown`
  - `Queue State`
  - `Send Job State`
  - `Potentially Stuck Jobs`

Fail if:
- Missing key panels or route fails.

## 6) Contacts Intake + Apollo Enrichment

Path: `/contacts`

Pass criteria:
- `Load Recent HubSpot Contacts` loads intake candidates.
- `Enrich Selected (Apollo)` is visible.
- Row-level enrichment outcome is visible (`Matched` or `No Match`) where enrichment exists.
- Confidence + last enriched metadata appear when available.
- Filters are visible and functional:
  - recommendation state,
  - enrichment outcome,
  - freshness.

Fail if:
- intake load fails silently.
- enrich action is missing or cannot run for selectable contacts.
- enrichment outcome metadata never appears.

## 7) Cron Health (Re-enrichment)

Path: `/admin/crons`

Pass criteria:
- `Contact Re-enrichment` card is visible.
- `Run Now` control is visible on that card.
- Clicking `Run Now` updates run telemetry (`runs`, `last run`, and message/stats).

Fail if:
- card missing.
- no way to trigger manual run.
- run telemetry does not update.

## Evidence To Capture

Capture these artifacts for each run:

1. Timestamp (UTC) and tester name.
2. Deployment URL (or alias) tested.
3. Screenshot of `/generated-content` showing summary panel.
4. Screenshot of bulk preview dialog showing decision summary + badges.
5. Screenshot of `/queue/generations`.
6. Screenshot of `/admin/generation-metrics`.
7. Screenshot of `/contacts` showing enrichment outcome badges and confidence/last-enriched line.
8. Screenshot of `/admin/crons` showing `Contact Re-enrichment` and `Run Now`.
9. Pass/fail result with any blockers.

## Engineering Evidence (Command Output)

Capture and paste command output in the run log:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run test:unit -- tests/unit/apollo-match.test.ts tests/unit/apollo-enrichment.test.ts tests/unit/import-guardrails.test.ts tests/unit/reenrich-contacts-runner.test.ts tests/unit/reenrich-contacts-route.test.ts`
4. `npm run test:e2e:one-pager:proof`

Expected proof suite evidence:
- contacts intake proof test executes and passes.
- `executed > 0`
- `skipped = 0`

## Quick Result Template

```text
Operator Acceptance Result
- Date (UTC):
- Tester:
- Deployment URL:
- Login: PASS/FAIL
- Generated Content Workspace: PASS/FAIL
- Bulk Preview Decision Flow: PASS/FAIL
- Generation Queue: PASS/FAIL
- Generation Metrics: PASS/FAIL
- Contacts Intake + Apollo Enrichment: PASS/FAIL
- Cron Health Re-enrichment: PASS/FAIL
- Notes / blockers:
```
