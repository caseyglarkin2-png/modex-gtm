# GAP OS dogfood, Phase 9: learning validation

STATUS: Real, non-zero data now exists in `/gap/learning/` for the dimensions that have evidence. No fabricated percentages.

<!-- verified:2026-09-24 -->

Ran `buildLearningReport` (the real function behind `/gap/learning/`) against production after Phases 2-4.

## Non-zero dimensions

- **`counts.hypotheses`: 20** (up from 0 before tonight -- all from Phase 4, all `draft`).
- **`signalYield`**: real, with visible N.
  - `site_expansion`: 5/11 signals became a hypothesis (45%, n=11)
  - `automation_program`: 1/7 (14%, n=7)
  - `technology_signal`: 1/4 (25%, n=4)
  - `news`: 0/1 (0%, n=1)
- **`replyBacklog`**: `{count: 0}` -- correct and expected (Phase 8: zero real GAP-attributed replies exist yet).
- **`staleHypotheses`**: `{value: 0, n: 20}` -- correct, all 20 are hours old, not stale by definition.

## Still zero (honestly, not hidden)

- **`counts.conversations`: 0** -- no `ConversationDisposition` exists yet (nobody has replied to a GAP-driven send yet, because none has been sent).
- **`bySequenceFamily`, `bySequenceVersion`, `byChannel`, `bySender`, `byEngine`, `dispositionDistribution`**: all empty arrays. These require enrollments and dispositions, neither of which this session created (not authorized, and not yet earned per the shadow-readiness gate).
- **Tier 1 / Tier 2 funnel breakdowns**: every rate is `{value: null, n: 0}` -- correctly reported as "no data" (`null`), not manufactured as 0% or 100%.

## Why this matters

Every non-zero number above traces to a real production Phase 2/4 write this
session made and can be pointed to by id (`docs/gap/dogfood-hypothesis-cohort.md`).
Every zero traces to something genuinely absent (no enrollment, no reply,
no disposition), reported honestly with N=0 or value=null rather than
suppressed or faked. This is the "trustworthy closed-loop learning," not
volume, the overnight directive asked to optimize for.
