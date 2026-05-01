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
- [ ] Implement provider-aware error classification in `src/lib/ai/client.ts`.
- [ ] Add exponential backoff and retry logic for Gemini / OpenAI.
- [ ] Record provider errors to `GeneratedContent` / logs.
- [ ] Add `/api/ai/health` endpoint for provider status visibility.

## Sprint 2: Generation Job Queue System
- [ ] Add `GenerationJob` database model and migration.
- [ ] Build batch generation API endpoint.
- [ ] Implement the background job processor for queued generations.
- [ ] Add job queue UI for status, logs, and retries.

## Sprint 3: Direct Send from Generated Content
- [ ] Add `generated_content_id` support to bulk send flow.
- [ ] Build `OnePageSendDialog` that preloads generated content.
- [ ] Link sent emails to generated content and activity logs.
- [ ] Add safe preview + send confirmation.

## Sprint 4: Send Template Versioning
- [ ] Extend `GeneratedContent` with version fields.
- [ ] Auto-increment version on generation.
- [ ] Add version selector UI component.
- [ ] Ensure send dialog uses versioned content correctly.
- [ ] Track send analytics by content version.
- [ ] Add queue-aware version send preview guard.

## Sprint 5: Account Template Extensions
- [ ] Create account template reference data for verticals.
- [ ] Add new account onboarding form with template-driven context.
- [ ] Auto-populate one-pager context for new accounts.
- [ ] Generate sample one-pager during account onboarding.

## Sprint 6: DX Polish & Performance
- [ ] Add generated-content grid and bulk preview/send flow.
- [ ] Preload personas and recipients in queue pages.
- [ ] Build admin metrics for generation performance.
- [ ] Add direct send job feedback and user-facing job state.

## Status Tracking
- Sprint 0 documentation created.
- Remaining sprint tasks are ready to execute in order.
