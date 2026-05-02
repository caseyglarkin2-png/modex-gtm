# One-Pager Send Release Checklist

## Test-Mode External Send Safety

Use this checklist before any Sprint 0+ validation and before production smoke tests.

1. Gmail sender safety:
- Ensure automated tests mock `@/lib/email/client` and never call real Gmail APIs.
- Confirm no test sets real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REFRESH_TOKEN`.
- Validate with route tests that send endpoints are exercised through mocked return values only.

2. HubSpot logging safety:
- Ensure tests mock HubSpot modules (`@/lib/hubspot/*`) or set HubSpot logging flags for test mode.
- Confirm no tests run against production `HUBSPOT_ACCESS_TOKEN`.
- Validate by asserting mocked HubSpot methods were called (or intentionally skipped), not network I/O.

3. Async send job safety:
- Any send-job processor tests must use mocked Gmail + mocked HubSpot.
- Assert idempotency paths and failure/retry paths without external requests.
- Confirm tests assert status transitions and DB writes, not external side effects.

4. E2E safety for send workflows:
- Run e2e with a test dataset and mocked send endpoints where applicable.
- Do not run e2e against production send routes with real recipient addresses.
- Capture Playwright traces/screenshots as proof artifacts for workflow validation.

## Core Validation Commands

Run these before sprint closeout:

```bash
npm run lint
npm run lint:one-pager
npx tsc --noEmit
npm run test:unit -- tests/unit/generated-content-fixtures.test.ts tests/unit/send-job-fixtures.test.ts
```

Route- and workflow-focused regression commands:

```bash
npm run test:unit -- tests/unit/generation-job-list.test.tsx tests/unit/send-job-tracker.test.tsx tests/unit/generated-content-bulk-preview-dialog.test.tsx
npm run test:unit -- tests/unit/email-send-bulk-async-route.test.ts tests/unit/email-send-job-status-route.test.ts tests/unit/send-job-retry-failed-route.test.ts tests/unit/process-send-jobs-route.test.ts
npm run test:unit -- tests/unit/generation-metrics.test.ts tests/unit/send-job-metrics.test.ts tests/unit/stuck-jobs.test.ts
```

For admin metrics smoke:

```bash
npx playwright test tests/e2e/generation-metrics.spec.ts
```

For queue/send workflow smokes:

```bash
npx playwright test tests/e2e/generation-queue.spec.ts tests/e2e/generated-content-bulk-preview.spec.ts
npx playwright test tests/e2e/send-jobs.spec.ts tests/e2e/one-pager-send-workflow.spec.ts
npm run test:e2e:one-pager
```

## Production Smoke Reminder

When smoke-testing in production, record:
- generation job ID(s),
- generated content ID/version,
- email log ID,
- HubSpot engagement ID (if available),
- screenshot of UI confirmation state.

## Known Gate Notes

- As of May 2, 2026, `npm run lint` passes with warnings after excluding legacy `scripts/**` from the flat ESLint project scope.
- Keep `npm run lint:one-pager` as the strict scoped gate for this roadmap slice.
