# One-Pager Operator Acceptance Checklist (5 Minutes)

Use this checklist to validate the latest one-pager workflow in production.

- App URL: `https://modex-gtm.vercel.app`
- Required account: `casey@freightroll.com`
- Scope: generated content workspace, bulk preview decision flow, queue, and metrics.

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

## Evidence To Capture

Capture these artifacts for each run:

1. Timestamp (UTC) and tester name.
2. Deployment URL (or alias) tested.
3. Screenshot of `/generated-content` showing summary panel.
4. Screenshot of bulk preview dialog showing decision summary + badges.
5. Screenshot of `/queue/generations`.
6. Screenshot of `/admin/generation-metrics`.
7. Pass/fail result with any blockers.

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
- Notes / blockers:
```
