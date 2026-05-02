# One-Pager Send Sprint Todo List

## Overview
This document captures the recommended execution path for the one-pager generation + send workflow. It is intentionally atomic, exhaustive, and aligned to the sprint plan in `one-pager-send-sprint-plan.md`.

## Linked Docs
- Strategic plan: `docs/roadmaps/one-pager-send-sprint-plan.md`
- Atomic execution + gap closure: `docs/roadmaps/one-pager-send-atomic-sprint-plan.md`
- Queue decision record: `docs/roadmaps/queue-implementation-decision.md`

## Sprint 0: Queue Technology Choice
- [x] Decide the queue model before implementing batch generation.
- [x] Evaluate Vercel Cron + Prisma polling.
- [x] Evaluate Upstash / Bull queue.
- [x] Evaluate custom serverless scheduler.
- [x] Document the chosen approach and implementation decision.

## Sprint 1: Provider Resilience & Quota Management
- [x] Implement provider-aware error classification in `src/lib/ai/client.ts`.
- [x] Add exponential backoff and retry logic for AI Gateway / Gemini / OpenAI.
- [x] Record provider errors to `GeneratedContent` / logs.
- [x] Add `/api/ai/health` endpoint for provider status visibility.
- [x] Route generation through Vercel AI Gateway first when `AI_GATEWAY_API_KEY` is configured.

## Sprint 2: Generation Job Queue System
- [x] Add `GenerationJob` database model and migration.
- [x] Build batch generation API endpoint.
- [x] Implement the background job processor for queued generations.
- [x] Add job queue UI for status, logs, and retries.

## Sprint 3: Direct Send from Generated Content
- [x] Add `generatedContentId` support to single and bulk send flows.
- [x] Build `OnePageSendDialog` that preloads generated content.
- [x] Link sent emails to generated content and activity logs.
- [x] Add safe preview + send confirmation.

## Sprint 4: Send Template Versioning
- [x] Extend `GeneratedContent` with version fields.
- [x] Auto-increment version on generation.
- [x] Add version selector UI component.
- [x] Ensure send dialog uses versioned content correctly.
- [x] Track send analytics by content version.
- [x] Add publish endpoint for selecting the active content version.
- [x] Add queue-aware version send preview guard.

## Sprint 5: Account Template Extensions
- [x] Create account template reference data for verticals.
- [x] Add new account onboarding form with template-driven context.
- [x] Auto-populate one-pager context for new accounts.
- [x] Queue sample one-pager during account onboarding.

## Sprint 6: DX Polish & Performance
- [x] Add generated-content grid and bulk preview/send flow.
- [x] Preload personas and recipients in queue pages.
- [x] Build admin metrics for generation performance.
- [x] Add direct send job feedback and user-facing job state.

## Status Tracking
- Sprint 0 documentation created.
- Sprints 1-5 implemented and covered by typecheck/unit tests.
- Sprint 6 implementation complete with async send tracker, bulk guarded preview, and admin send/generation metrics.
- Added unit regression coverage for:
  - `tests/unit/generation-job-list.test.tsx` (retry API + completed CTA path)
  - `tests/unit/send-job-tracker.test.tsx` (status polling refresh + failed-recipient retry)
  - `tests/unit/generated-content-bulk-preview-dialog.test.tsx` (guard acknowledgement + async enqueue handoff)
  - `tests/unit/stuck-jobs.test.ts` (stuck generation/send job threshold diagnostics)
- Global lint now passes with warnings after excluding legacy `scripts/**`; one-pager quality continues to be enforced by `npm run lint:one-pager`.
- E2E contract split:
  - `npm run test:e2e:one-pager:smoke` for deployed safe-smoke checks (skip-guarded),
  - `npm run test:e2e:one-pager:proof` for deterministic local seeded proof (skip disallowed).
- Proof-mode closeout evidence (May 2, 2026):
  - `npm run test:e2e:one-pager:proof` => `expected=4, passed=4, skipped=0`.
