# One-Pager Send A+ Atomic Sprint Plan

**Status:** Closeout gates passed  
**Scope:** One-pager generation, generated-content operations, version-aware send, queue reliability, durable bulk send, metrics, and release readiness.  
**Source docs:** `one-pager-send-sprint-plan.md`, `one-pager-send-sprint-todos.md`, `queue-implementation-decision.md`.

## Planning Rules

- No ticket should mix unrelated concerns. Each ticket should be committable by itself.
- Every ticket must include tests. If automated tests do not fit, the ticket must name a concrete validation artifact.
- Every sprint must end with demoable software that can run, be tested, and build on prior sprints.
- Server mutations should follow existing app patterns: Zod validation, Prisma, feature flags where appropriate, and graceful HubSpot degradation.
- Pages that query Prisma directly must keep `export const dynamic = 'force-dynamic'`.
- Sending must remain Gmail-only from `casey@freightroll.com`; HubSpot logging must remain non-blocking.
- Automated tests must never send real external email or write real HubSpot objects. Gmail and HubSpot must be mocked in test mode.
- Do not mark roadmap tasks complete until the behavior exists, is reachable in UI/API, and has proof.

## Per-Sprint Closeout Gate

Every sprint closes with:

- `npm run lint`
- `npx tsc --noEmit`
- affected unit/component tests
- at least one demo route with named seed/test data
- a short closeout note with completed tickets, files changed, test proof, demo path, and carryover

## Current State Audit

### Solid Ground

- AI generation is routed through Vercel AI Gateway when configured.
- Provider resilience and `/api/ai/health` exist.
- `GenerationJob` exists and queue processing is implemented through Vercel Cron + Prisma polling.
- `GeneratedContent` has version fields and publish state.
- Single and bulk email send endpoints accept `generatedContentId` and increment send count.
- `OnePageSendDialog` can preview generated content, select recipients, and send.
- Queue page has a generated-content grid and recipient preloading.
- Admin cron page includes basic generation performance cards.

### Gaps To Close Before A+

- Legacy `scripts/**` lint debt remains explicitly out of scope for this sprint closeout.

## Closeout Evidence (May 2, 2026)

- `npm run lint` passed.
- `npx tsc --noEmit` passed.
- `npm run test:unit` passed (48 files, 140 tests).
- `npm run test:e2e:one-pager:proof` passed with deterministic execution:
  - queue retry test passed,
  - bulk guard acknowledgement test passed,
  - async enqueue + tracker test passed,
  - generation metrics seeded-state test passed,
  - visual regression checks for generated-content and bulk preview framing passed,
  - summary: `expected=6, passed=6, skipped=0`.

## Sprint 0: Quality Gate And Fixture Foundation

**Goal:** unblock reliable validation before feature work continues.  
**Demo:** local quality gate runs, test fixtures exist, and later sprints can use stable data without touching production email or HubSpot.

### Task 0.1: Fix lint configuration

- **Change:** Align ESLint with the installed ESLint 9 runtime by adding `eslint.config.*` or pinning the repo to the existing `.eslintrc.js`-compatible version.
- **Files:** `eslint.config.mjs` or `package.json` and lockfile.
- **Acceptance:** lint runs locally without configuration errors.
- **Tests:** `npm run lint`.
- **Validation:** closeout includes lint output summary.

### Task 0.2: Add generated-content test fixtures

- **Change:** Add fixture builder for accounts, personas, generated content versions, queue states, and zero-recipient accounts.
- **Files:** `tests/fixtures/generated-content.ts`.
- **Acceptance:** fixtures cover:
  - account with two one-pager versions,
  - account with eligible recipients,
  - account with zero eligible recipients,
  - failed generation job,
  - pending generation job,
  - processing generation job.
- **Tests:** fixture import smoke in `tests/unit/generated-content-fixtures.test.ts`.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-fixtures.test.ts`.

### Task 0.3: Add mocked send job fixtures

- **Change:** Add fixture data for send job states without real Gmail/HubSpot calls.
- **Files:** `tests/fixtures/send-jobs.ts`.
- **Acceptance:** fixtures cover pending, processing, completed, partial, failed, and failed-recipient retry candidates.
- **Tests:** fixture import smoke in `tests/unit/send-job-fixtures.test.ts`.
- **Validation:** `npm run test:unit -- tests/unit/send-job-fixtures.test.ts`.

### Task 0.4: Document test-mode external send safety

- **Change:** Document how tests mock Gmail and HubSpot and how to verify no real external send occurs.
- **Files:** `docs/roadmaps/one-pager-send-release-checklist.md`.
- **Acceptance:** checklist names required env/test settings, mocked modules, and proof expected before production smoke.
- **Validation:** doc review confirms no automated test path sends real email.

## Sprint 1: Queue Correctness And Retry

**Goal:** make the existing queue reliable enough to build on.  
**Demo:** using seeded failed queue data, a failed generation job can be retried from `/queue/generations`, returns to pending, and a queued generation creates the next generated-content version.

### Task 1.1: Normalize queued one-pager version creation

- **Change:** Update `/api/cron/process-generation-jobs` so generated content created by the worker uses `(latest version + 1)` scoped by `account_name`, `content_type`, and `campaign_id`.
- **Files:** `src/app/api/cron/process-generation-jobs/route.ts`.
- **Acceptance:** queued generations never create duplicate version `1` rows for an account that already has generated one-pagers.
- **Tests:** unit test cron route with an existing version and assert created row uses the next version.
- **Validation:** `npm run test:unit -- tests/unit/process-generation-jobs-route.test.ts`.

### Task 1.2: Add failed generation retry API

- **Change:** Add `POST /api/ai/generation-jobs/[id]/retry`.
- **Files:** `src/app/api/ai/generation-jobs/[id]/retry/route.ts`.
- **Acceptance:** failed jobs with `retry_count < 3` are reset to `pending`; non-failed jobs and max-retry jobs return `409`; missing jobs return `404`.
- **Tests:** unit test happy path, non-failed rejection, max-retry rejection, invalid id, missing job.
- **Validation:** `npm run test:unit -- tests/unit/generation-job-retry-route.test.ts`.

### Task 1.3: Wire retry UI

- **Change:** Connect `GenerationJobList` retry button to the retry API when no callback is supplied.
- **Files:** `src/components/queue/generation-job-list.tsx`.
- **Acceptance:** clicking retry updates the visible row to pending and shows success/error toast.
- **Tests:** component test with mocked `fetch` and failed-job fixture.
- **Validation:** `npm run test:unit -- tests/unit/generation-job-list.test.tsx`.

### Task 1.4: Make completed job CTA actionable

- **Change:** Replace inert `View & Send` button with a real link to the account or generated-content workflow.
- **Files:** `src/components/queue/generation-job-list.tsx`.
- **Acceptance:** completed jobs provide a reachable review/send path.
- **Tests:** component test asserting link target.
- **Validation:** `npm run test:unit -- tests/unit/generation-job-list.test.tsx`.

### Task 1.5: Add queue retry Playwright smoke

- **Change:** Add thin e2e coverage for `/queue/generations` retry with seeded failed job.
- **Files:** `tests/e2e/generation-queue.spec.ts`.
- **Acceptance:** test visits `/queue/generations`, clicks retry for seeded failed job, and asserts visible pending state or success toast.
- **Validation:** `npx playwright test tests/e2e/generation-queue.spec.ts`.

### Task 1.6: Update queue status documentation

- **Change:** Mark only actually completed queue tasks in `one-pager-send-sprint-todos.md`.
- **Files:** `docs/roadmaps/one-pager-send-sprint-todos.md`.
- **Acceptance:** todo doc matches shipped behavior and points to this atomic plan for remaining work.
- **Validation:** doc review compares checked items to test proof listed in sprint closeout.

## Sprint 2: Generated Content Operations Page

**Goal:** create the missing `/generated-content` operating surface from the original sprint plan.  
**Demo:** using seeded generated-content data, Casey can open `/generated-content`, filter generated one-pagers, preview versions, publish a draft, and start a single-version send flow.

### Task 2.1: Extract reusable generated-content query builder

- **Change:** Move generated-content aggregation into a helper used by queue page and `/generated-content`.
- **Files:** `src/lib/generated-content/queries.ts`, `src/app/queue/generations/page.tsx`.
- **Acceptance:** no duplicated grouping logic between pages; query returns versions, queue counts, campaign labels, recipient counts, and account slugs.
- **Tests:** unit test query shaping with mocked Prisma results.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-queries.test.ts`.

### Task 2.2: Add generated-content server page

- **Change:** Create `/generated-content` route with server-side data loading.
- **Files:** `src/app/generated-content/page.tsx`.
- **Acceptance:** page lists generated one-pagers grouped by account and latest version; page includes `export const dynamic = 'force-dynamic'`.
- **Tests:** server page smoke or route availability test.
- **Validation:** `npx tsc --noEmit`; local browser route `/generated-content` renders fixture data.

### Task 2.3: Add filterable client workspace

- **Change:** Build a client component for filtering by account, campaign, status, provider, sent/unsent, and search text.
- **Files:** `src/components/generated-content/generated-content-workspace.tsx`.
- **Acceptance:** filters are URL-driven and preserve state on refresh/share.
- **Tests:** component test for URL filter state and visible rows.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-workspace.test.tsx`.

### Task 2.4: Add content parser helper

- **Change:** Extract parser/renderer input normalization for JSON, HTML, and plain-text stored content.
- **Files:** `src/lib/generated-content/content-rendering.ts`.
- **Acceptance:** parser returns safe render metadata for JSON one-pager, HTML string, and plain text without throwing.
- **Tests:** unit test all three content shapes plus malformed JSON.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-rendering.test.ts`.

### Task 2.5: Add version preview modal

- **Change:** Add preview modal that renders stored content through `content-rendering.ts`.
- **Files:** `src/components/generated-content/generated-content-preview-dialog.tsx`.
- **Acceptance:** user can preview any listed version from `/generated-content`.
- **Tests:** component test opens modal and asserts rendered account/version labels.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-preview-dialog.test.tsx`; manual screenshot of `/generated-content` preview with fixture version.

### Task 2.6: Add publish action from generated-content page

- **Change:** Wire publish button to existing publish endpoint.
- **Files:** `src/components/generated-content/generated-content-workspace.tsx`.
- **Acceptance:** publishing one version unpublishes sibling versions and refreshes UI state.
- **Tests:** existing publish route test plus component interaction test mocking the endpoint.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-publish-route.test.ts tests/unit/generated-content-workspace.test.tsx`.

### Task 2.7: Add single-version send entry point

- **Change:** Reuse `OnePageSendDialog` from each generated-content card/row.
- **Files:** `src/components/generated-content/generated-content-workspace.tsx`, `src/components/email/one-pager-send-dialog.tsx` if prop cleanup is needed.
- **Acceptance:** selected version opens send dialog with recipients preloaded and queue/version guard active.
- **Tests:** component test asserts selected row passes correct generated content id, version, queue state, and recipients to dialog.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-workspace.test.tsx`.

### Task 2.8: Add generated-content Playwright smoke

- **Change:** Add e2e smoke for filters, preview, and send dialog open.
- **Files:** `tests/e2e/generated-content.spec.ts`.
- **Acceptance:** test visits `/generated-content`, applies seeded account filter, opens preview, opens send dialog, and asserts recipient count.
- **Validation:** `npx playwright test tests/e2e/generated-content.spec.ts`.

## Sprint 3: Bulk Preview And Guarded Send Readiness

**Goal:** allow multiple generated one-pagers to be selected, previewed, and validated for safe sending. This sprint prepares guarded bulk send using existing send primitives; Sprint 4 replaces the final send action with durable async jobs.  
**Demo:** select multiple account one-pagers, preview all, see per-account recipients/warnings, and confirm readiness without bypassing guard rules.

### Task 3.1: Add multi-select state and row actions

- **Change:** Add checkboxes, select-all-visible, selected count, and clear selection in `/generated-content`.
- **Files:** `src/components/generated-content/generated-content-workspace.tsx`.
- **Acceptance:** selection is stable for loaded records, can be cleared, and disabled for rows with no eligible recipients.
- **Tests:** component test for selection behavior.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-workspace.test.tsx`.

### Task 3.2: Centralize send guard evaluation

- **Change:** Extract queue/version send guard into a pure helper.
- **Files:** `src/lib/generated-content/send-guard.ts`, `src/components/email/one-pager-send-dialog.tsx`, `src/components/generated-content/generated-content-workspace.tsx`.
- **Acceptance:** single and bulk send paths use identical guard logic.
- **Tests:** unit tests for outdated version, pending queue, processing queue, combined warning, and no-warning state.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-send-guard.test.ts`.

### Task 3.3: Add per-account recipient resolution display

- **Change:** Show eligible recipient count and blocked/no-recipient state before bulk send.
- **Files:** `src/lib/generated-content/queries.ts`, `src/components/generated-content/generated-content-workspace.tsx`.
- **Acceptance:** accounts with zero eligible recipients are visible and cannot be selected for send.
- **Tests:** unit test recipient grouping and component test for zero-recipient state.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-queries.test.ts tests/unit/generated-content-workspace.test.tsx`.

### Task 3.4: Add bulk preview drawer

- **Change:** Add drawer/modal showing selected versions with account, version, recipients, send count, guard warnings, and rendered preview.
- **Files:** `src/components/generated-content/bulk-preview-dialog.tsx`.
- **Acceptance:** all selected rows can be inspected before sending; warnings are visible per item.
- **Tests:** component test for multiple selected previews.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-bulk-preview-dialog.test.tsx`; Playwright screenshot artifact from `/generated-content`.

### Task 3.5: Add guarded bulk send acknowledgement

- **Change:** Require acknowledgement for any selected item with guard warnings before the final bulk action is enabled.
- **Files:** `src/components/generated-content/bulk-preview-dialog.tsx`.
- **Acceptance:** action disabled until all warnings are acknowledged; action remains disabled for zero-recipient selections.
- **Tests:** component test for disabled/enabled states.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-bulk-preview-dialog.test.tsx`.

### Task 3.6: Add guarded bulk workflow Playwright smoke

- **Change:** Add e2e smoke for selecting multiple versions and resolving warnings.
- **Files:** `tests/e2e/generated-content-bulk-preview.spec.ts`.
- **Acceptance:** test uses seeded outdated-version and pending-queue fixture, opens bulk preview, verifies warning, checks acknowledgement, and sees final action enabled.
- **Validation:** `npx playwright test tests/e2e/generated-content-bulk-preview.spec.ts`.

## Sprint 4: Durable Async Bulk Send

**Goal:** move multi-account sending into durable job state so the UI is not blocked and results are inspectable.  
**Demo:** bulk send creates a send job, UI shows job progress, recipient results persist, and failed recipients can be retried without resending successful recipients.

### Task 4.1: Add send job schema

- **Change:** Add `SendJob` and `SendJobRecipient` models.
- **Files:** `prisma/schema.prisma`, generated migration.
- **Acceptance:** schema includes:
  - `SendJob.status`: `pending`, `processing`, `completed`, `failed`, `partial`, `cancelled`.
  - `SendJobRecipient.status`: `pending`, `sending`, `sent`, `failed`, `skipped`.
  - relations to campaign when available, generated content, email log when sent, and account/persona identifiers.
  - idempotency key on recipient row.
  - indexes on job status, created timestamp, recipient job id, recipient status, and idempotency lookup.
  - unique constraint preventing duplicate recipient sends for the same job/content/email.
- **Tests:** Prisma generation and TypeScript compile.
- **Validation:** `npx prisma generate`; `npx tsc --noEmit`.

### Task 4.2: Add async bulk send enqueue API

- **Change:** Add `POST /api/email/send-bulk-async`.
- **Files:** `src/app/api/email/send-bulk-async/route.ts`, validation schema in `src/lib/validations.ts`.
- **Acceptance:** validates selected generated-content ids, subject/body source, recipients, and guard acknowledgements; creates pending send job and recipient rows; returns job id immediately.
- **Tests:** route tests for valid enqueue, invalid generated content, no recipients, guard warnings not acknowledged, and mocked Gmail not called.
- **Validation:** `npm run test:unit -- tests/unit/email-send-bulk-async-route.test.ts`.

### Task 4.3: Add send job status API

- **Change:** Add `GET /api/email/send-jobs/[id]`.
- **Files:** `src/app/api/email/send-jobs/[id]/route.ts`.
- **Acceptance:** returns aggregate job state, counts, generated content ids, and recipient outcomes; not found returns `404`.
- **Tests:** route unit test for found/not found.
- **Validation:** `npm run test:unit -- tests/unit/email-send-job-status-route.test.ts`.

### Task 4.4: Add send job processor

- **Change:** Add cron route to process pending send jobs.
- **Files:** `src/app/api/cron/process-send-jobs/route.ts`, `src/lib/cron-monitor.ts`.
- **Acceptance:** sends recipient rows idempotently, writes `EmailLog`, increments generated-content send count, records HubSpot ids, handles partial failure, and never sends rows already marked `sent`.
- **Tests:** route unit test with mocked Gmail/HubSpot, one success, one failure, skipped recipient, rerun idempotency.
- **Validation:** `npm run test:unit -- tests/unit/process-send-jobs-route.test.ts`.

### Task 4.5: Add send job tracker UI

- **Change:** Add tracker component that polls job status.
- **Files:** `src/components/generated-content/send-job-tracker.tsx`.
- **Acceptance:** shows pending, processing, completed, partial, failed, recipient errors, and HubSpot ids when present.
- **Tests:** component test for each job state using `tests/fixtures/send-jobs.ts`.
- **Validation:** `npm run test:unit -- tests/unit/send-job-tracker.test.tsx`.

### Task 4.6: Wire generated-content bulk action to async enqueue

- **Change:** Replace final bulk confirmation action with `POST /api/email/send-bulk-async` and open `SendJobTracker` with returned job id.
- **Files:** `src/components/generated-content/bulk-preview-dialog.tsx`, `src/components/generated-content/generated-content-workspace.tsx`.
- **Acceptance:** bulk confirmation never calls the old synchronous bulk endpoint; UI opens tracker after enqueue.
- **Tests:** component test asserting endpoint call and tracker state.
- **Validation:** `npm run test:unit -- tests/unit/generated-content-bulk-preview-dialog.test.tsx`.

### Task 4.7: Add failed-recipient retry API

- **Change:** Add endpoint to reset failed `SendJobRecipient` rows to pending.
- **Files:** `src/app/api/email/send-jobs/[id]/retry-failed/route.ts`.
- **Acceptance:** only failed/skipped retryable rows are reset; sent rows are never resent; missing job returns `404`.
- **Tests:** route test for retry failed only, no failed rows, missing job.
- **Validation:** `npm run test:unit -- tests/unit/send-job-retry-failed-route.test.ts`.

### Task 4.8: Wire failed-recipient retry UI

- **Change:** Add retry failed recipients button to tracker.
- **Files:** `src/components/generated-content/send-job-tracker.tsx`.
- **Acceptance:** button appears only for jobs with failed retryable rows and refreshes tracker after success.
- **Tests:** component test for button visibility and mocked retry call.
- **Validation:** `npm run test:unit -- tests/unit/send-job-tracker.test.tsx`.

### Task 4.9: Add async send Playwright smoke

- **Change:** Add e2e smoke for enqueue and status tracker using mocked email sender/test env.
- **Files:** `tests/e2e/send-jobs.spec.ts`.
- **Acceptance:** test selects generated content, confirms bulk send, asserts tracker shows returned job id and no real external send occurred.
- **Validation:** `npx playwright test tests/e2e/send-jobs.spec.ts`.

## Sprint 5: Admin Metrics And Operational Visibility

**Goal:** make generation/send operations diagnosable without database spelunking.  
**Demo:** admin can view provider performance, queue depth, failure causes, send job outcomes, recent stuck jobs, and links back to actionable workflows.

### Task 5.1: Add generation metrics query module

- **Change:** Build metrics helper for generation jobs and generated content.
- **Files:** `src/lib/admin/generation-metrics.ts`.
- **Acceptance:** returns queue depth, success rate, provider distribution, failure categories, p50/p95 durations, and recent failed jobs.
- **Tests:** unit test metrics calculations from fixtures.
- **Validation:** `npm run test:unit -- tests/unit/generation-metrics.test.ts`.

### Task 5.2: Add send job metrics query module

- **Change:** Build metrics helper for send jobs and recipient outcomes.
- **Files:** `src/lib/admin/send-job-metrics.ts`.
- **Acceptance:** returns sent/failed/partial counts, average job completion, recent failed recipients, and skipped recipient categories.
- **Tests:** metrics fixture test.
- **Validation:** `npm run test:unit -- tests/unit/send-job-metrics.test.ts`.

### Task 5.3: Add stuck-job metrics helper

- **Change:** Add pure helper that identifies generation/send jobs processing beyond configured threshold.
- **Files:** `src/lib/admin/stuck-jobs.ts`.
- **Acceptance:** returns stuck generation jobs, stuck send jobs, age, status, and recommended action label.
- **Tests:** helper test for threshold boundaries.
- **Validation:** `npm run test:unit -- tests/unit/stuck-jobs.test.ts`.

### Task 5.4: Add `/admin/generation-metrics` page

- **Change:** Create admin page with metric cards and tables.
- **Files:** `src/app/admin/generation-metrics/page.tsx`.
- **Acceptance:** page renders generation metrics, send metrics, stuck-job attention table, and links to queue/generated-content pages; includes `export const dynamic = 'force-dynamic'`.
- **Tests:** server render smoke where practical.
- **Validation:** `npx tsc --noEmit`; local browser route `/admin/generation-metrics` renders fixture/seed data.

### Task 5.5: Link metrics page from cron health/admin navigation

- **Change:** Add discoverable link from existing admin cron health page.
- **Files:** `src/app/admin/crons/page.tsx`, navigation component if present.
- **Acceptance:** admin can reach generation metrics without typing URL.
- **Tests:** component/server render assertion for link.
- **Validation:** local route click from `/admin/crons` to `/admin/generation-metrics`.

### Task 5.6: Add metrics Playwright smoke

- **Change:** Add e2e smoke for admin metrics page.
- **Files:** `tests/e2e/generation-metrics.spec.ts`.
- **Acceptance:** test visits `/admin/generation-metrics`, sees generation metric cards, send metric cards, and stuck-job table from seed data.
- **Validation:** `npx playwright test tests/e2e/generation-metrics.spec.ts`.

## Sprint 6: Release Readiness And Roadmap Truth

**Goal:** prove the full workflow is stable and accurately documented.  
**Demo:** full local quality suite passes; Playwright demonstrates queue retry, generated-content preview, guarded bulk readiness, async send job, and admin metrics.

### Task 6.1: Add production smoke checklist

- **Change:** Complete release checklist for AI Gateway, Gmail send, HubSpot logging, generated-content send count, queue retry, async send job tracker, and rollback notes.
- **Files:** `docs/roadmaps/one-pager-send-release-checklist.md`.
- **Acceptance:** checklist names exact routes, expected fields, environment variables, and proof artifacts.
- **Validation:** doc review confirms each smoke item maps to a shipped route or UI.

### Task 6.2: Add full workflow Playwright spec

- **Change:** Add e2e spec for queue -> generated-content -> guarded preview -> async send tracker.
- **Files:** `tests/e2e/one-pager-send-workflow.spec.ts`.
- **Acceptance:** test uses mocked Gmail/HubSpot, asserts no real send, and verifies user-visible state across pages.
- **Validation:** `npx playwright test tests/e2e/one-pager-send-workflow.spec.ts`.

### Task 6.3: Add route-level regression suite command documentation

- **Change:** Document exact test commands for the workflow.
- **Files:** `docs/roadmaps/one-pager-send-release-checklist.md`.
- **Acceptance:** release checklist includes unit, type, lint, and Playwright commands.
- **Validation:** command list reviewed against package scripts.

### Task 6.4: Update roadmap status accurately

- **Change:** Update `one-pager-send-sprint-todos.md` only after implemented and validated work lands.
- **Files:** `docs/roadmaps/one-pager-send-sprint-todos.md`, `docs/roadmaps/one-pager-send-sprint-plan.md`.
- **Acceptance:** no aspirational checkboxes; every checked item has proof in the closeout note or release checklist.
- **Validation:** doc review against test results.

### Task 6.5: Final local quality gate

- **Change:** Run complete local validation.
- **Files:** none unless failures require fixes.
- **Acceptance:** lint, typecheck, relevant unit tests, and e2e specs pass.
- **Validation:** closeout includes:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run test:unit -- <affected tests>`
  - `npx playwright test <workflow specs>`

## Final Approval Gate

Implementation should not continue beyond planning until this plan is approved. After approval, each sprint should be implemented in order, and each sprint closeout should include:

- completed ticket ids,
- files changed,
- tests/validation run,
- demo route(s),
- proof artifacts,
- known carryover.

## Reviewer Feedback Incorporated

This draft incorporates subagent review by:

- moving lint/quality gate work to Sprint 0,
- adding explicit test fixtures before UI/E2E work,
- splitting broad API/UI tickets,
- adding the missing async-send UI handoff ticket,
- tightening `SendJob` schema acceptance criteria,
- replacing vague validation with concrete commands/routes/artifacts,
- clarifying Sprint 3 as guarded bulk readiness before async send,
- adding Playwright smoke tests in the sprint where high-risk behavior lands,
- naming exact files for new routes/components/helpers.
