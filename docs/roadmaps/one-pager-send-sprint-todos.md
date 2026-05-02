# One-Pager Send Sprint Todo List

## Overview
This document captures the recommended execution path for the one-pager generation + send workflow. It is intentionally atomic, exhaustive, and aligned to the sprint plan in `one-pager-send-sprint-plan.md`.

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
- [ ] Add queue-aware version send preview guard.

## Sprint 5: Account Template Extensions
- [x] Create account template reference data for verticals.
- [x] Add new account onboarding form with template-driven context.
- [x] Auto-populate one-pager context for new accounts.
- [x] Queue sample one-pager during account onboarding.

## Sprint 6: DX Polish & Performance
- [ ] Add generated-content grid and bulk preview/send flow.
- [ ] Preload personas and recipients in queue pages.
- [ ] Build admin metrics for generation performance.
- [ ] Add direct send job feedback and user-facing job state.

## Status Tracking
- Sprint 0 documentation created.
- Sprints 1-5 implemented and covered by typecheck/unit tests.
- Remaining Sprint 6 work is UI polish and performance instrumentation.
