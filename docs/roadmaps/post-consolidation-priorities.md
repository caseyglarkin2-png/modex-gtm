# Post-Consolidation Priorities — Sprint Plan

**Status:** Approved 2026-05-08
**Purpose:** After the IA consolidation (PRs #19-#24) shipped a coherent operator loop and the YNS Microsite Redesign opened the public funnel, this plan covers the remaining build priorities: send reliability, UI shake-down, HubSpot throughput, engagement attribution, and tech debt.

The YNS Microsite Redesign is its own document at `docs/roadmaps/yns-microsite-redesign-sprint-plan.md`. The two plans run in parallel; pick whichever sprint matches available focus.

## Sprints

Each sprint task gets the full acceptance card filled in **before** implementation starts. One commit per task unless atomically inseparable. Each sprint closes with a proof-ledger entry.

### Sprint S1 — Send Reliability

**Goal:** Today's 43 failed jobs go to 0 (or to a documented permanent-failure set), and future failures auto-retry.
**Demo:** Home Health Bar shows Healthy or Warning (not Blocked); `/ops?tab=generation-metrics` Recent Failures empty for the past 24h.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| S1.1 | Cluster the 43 current failures by error type | `tsx scripts/audit-failed-jobs.ts` prints clusters; output committed to proof ledger | scripts only |
| S1.2 | Mark permanent-failure recipients as do-not-contact | Bulk update in `SendJobRecipient` for invalid-email cluster; before/after counts in ledger | scripts only |
| S1.3 | Bulk-retry the recoverable cluster | One-shot script re-queues `failed` rows where `error_class = 'retriable'`; re-asserts Recent Failures pane is empty | scripts only |
| S1.4 | Add exponential-backoff auto-retry to send-jobs cron | New `attempts` + `next_attempt_at` columns; cron picks up `failed` where `attempts < 3` and `next_attempt_at < now()`. Backoff: 5m / 15m / 1h | prisma migration + cron handler |
| S1.5 | Surface retry state on `/ops?tab=generation-metrics` | "Retries in flight" + "Retries exhausted" mini-metrics added to `GenerationMetricsRich` | one component + page-level fetch |
| S1.6 | Unit test the backoff scheduler | `tests/unit/send-job-retry-backoff.test.ts` proves attempts increment, backoff doubles, exhausted retries terminate | one test file |

### Sprint S2 — UI Shake-Down Loop

**Goal:** First production week with the new cockpit produces a triaged friction log + the top 3-5 fixes shipped.
**Demo:** `docs/roadmaps/post-consolidation-friction-log.md` with at least 5 logged items, half marked fixed.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| S2.1 | "Note UX friction" quick-capture button on Home | Opens pre-filled `/capture` form with `ux-friction` tag; capture lands in `MobileCapture` | one component + home page wire-up |
| S2.2 | Friction log doc scaffold | `docs/roadmaps/post-consolidation-friction-log.md` matching the roadmap convention | doc only |
| S2.3 | `/ops?tab=ux-friction` view | Reads MobileCapture rows tagged ux-friction; shows timestamp / area / severity / status / resolved-at | new tab + component |
| S2.4-S2.6 | Top 3 friction fixes (decided after 5+ items logged) | Each: one PR, one commit, before/after note in friction log | one fix per commit |

### Sprint S3 — HubSpot Throughput

**Goal:** HubSpot writes never hit the daily conversational cap; cap-blocked writes auto-resume the next day.
**Demo:** `/ops?tab=cron-health` shows HubSpot sync running at expected cadence with 0 cap-block errors over 7 days.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| S3.1 | `HubSpotWriteQueue` Prisma model | `id / op_type / payload(json) / attempts / status / scheduled_for / last_error / created_at` | migration + schema |
| S3.2 | `enqueueHubSpotWrite()` helper | `src/lib/hubspot/queue.ts` inserts with default `scheduled_for=now()`; typed by op_type union | one lib file + 1 unit test |
| S3.3 | Convert contact-create writes to use the queue | Replace direct API call in `external-contact-import.ts` and `app/api/contacts/import/route.ts` | contact-create call sites only |
| S3.4 | Convert activity-log + deal-stage writes to use the queue | Same pattern in 2 more call sites | activity + deal sites only |
| S3.5 | `process-hubspot-queue` cron | Runs every 5 min, processes oldest 50 items, respects `HUBSPOT_DAILY_WRITE_BUDGET` env var; cap-blocked items defer to tomorrow | cron handler + vercel.json schedule |
| S3.6 | Surface queue depth + budget remaining on `/ops?tab=connector-health` | New card with depth, budget remaining, last cap-block timestamp | one tab augmentation |
| S3.7 | Home alert when HubSpot queue depth > 100 | Red AlertTile on home (replaces one of the 3 existing tiles conditionally) | home page + AlertTile call only |

### Sprint S4 — Engagement Attribution

**Goal:** For every booked meeting, trace back the touch-stream — first email, microsite views, replies — that led to it.
**Demo:** Open a booked meeting → see "First touched 2026-04-15 via /for/general-mills, opened 3 emails, replied 2026-04-22, booked 2026-04-23".

| ID | Task | Assertion | Commit |
|---|---|---|---|
| S4.1 | `EngagementJourney` view | `src/lib/revops/engagement-journey.ts` joins MicrositeEngagement + EmailLog + Notification(reply) + Meeting on (account_name, persona_email); returns chronologically ordered touches | one lib file + 1 unit test on a fixture |
| S4.2 | Surface journey on Account Outreach/History tab | New "Engagement timeline" card; conditional fetch | one component + page wire-up |
| S4.3 | `/analytics?tab=attribution` | Microsite slug → meetings booked → estimated pipeline value, sortable | new tab in analytics-workspace + fetch + component |
| S4.4 | Home alert "N new meetings this week" with first-touch breakdown | Conditional tile on Home (replaces "0 unanswered replies" when N > 0) | home page only |
| S4.5 | Backfill first-touch attribution for existing meetings | Script walks existing Meeting rows, writes `first_touch_source` / `first_touch_at` / `first_touch_url` to a new column on Account (or side table) | migration + script only |

### Sprint S5 — Tech Debt

**Goal:** Local dev unblocked; dead code gone; CI catches future drift.
**Demo:** `pnpm test:unit` runs locally without rollup binding errors; `grep yardflow.ai middleware.ts` returns nothing (after Sprint M1.3); nav-integrity test runs on every PR.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| S5.1 | Migrate package manager to pnpm | `pnpm import`, commit `pnpm-lock.yaml`, drop `package-lock.json`, `packageManager: "pnpm@..."` in package.json, update GitHub Actions and Vercel build command | one PR — package mgr swap |
| S5.2 | Update Playwright specs that assert deleted URLs | Specs in `tests/e2e/{generated-content,nav-inventory,full-audit,etc.}.spec.ts` updated to expect the redirected path | tests/e2e only |
| S5.3 | Absorb the 2 MiniMetric variants into shared component | New `src/components/mini-metric.tsx` (icon-inline, smaller value, lower padding); replace inline defs in `analytics/quarterly-rich.tsx` and `ops/page.tsx` | one shared component + replacements |
| S5.4 | Add nav-integrity test to CI | `.github/workflows/*.yml` runs `vitest run tests/unit/nav-integrity.test.ts` on every PR | one workflow file |

## Do-Not-Build Boundaries

- Do not start a sprint without filling in the acceptance card for each task in that sprint.
- Do not let a sprint cross-pollinate with another (e.g., don't bundle Send Reliability fixes into a HubSpot Throughput PR).
- Do not skip the proof-ledger closeout. Each sprint ends with an entry recording tsc / lint / affected tests / artifact / carryover.
- Do not extend MiniMetric absorption (S5.3) into a broader MetricCard refactor — the named-13 absorption is done; this is the explicit cleanup of the remaining 2.

## Approval Gate

Plan approved 2026-05-08. Sprint sequencing is operator-driven (no fixed order); pick whichever matches available focus and current pain.
