# Autonomous Outbound Loop v1 — Design

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


**Date:** 2026-06-07
**Status:** Approved design, pre-implementation
**Spans:** `modex-gtm` (caller/Outbox) + `clawd-control-plane` (receiver/signals/alerts)

## Problem

Hand-to-Clawd shipped and works (modex-gtm `/discovery` button → control-plane
`/api/yardflow/draft-batch` → drafts staged into the Outbox). But the loop still
costs Casey a touch per batch, the drafted contacts are noisy (synthesized
contacts DB fuzzy-matches across unrelated companies), every draft leads with the
same proximity hook, and the rich daily signal mining in the control plane
(SEC capex, patents, tradeshows, competitor logos, news → per-account intent
scores) never reaches the outreach. Replies are detected but no proactive alert
fires.

## Goal

Make the loop run itself: each morning Casey wakes to a full, reviewed-ready
Outbox of **verified-contact**, **signal-led** drafts he didn't have to trigger,
and gets a **push the moment a hot reply lands**. Optimize for velocity, more
angles of attack, fewer clicks. Sending stays Casey's approval (the one human
gate); everything upstream of it is automatic.

Out of scope for v1 (each its own next sprint): A/B outcomes → HubSpot,
auto-generated T2/T3 follow-up content, auto-send without review, unifying the
two parallel send systems.

## Architecture

Four components. Three live in the control plane (where the data is); one in
modex-gtm (where the worklist + caller are).

```
[modex-gtm cron ~6am ET]  select top-50 fresh accounts ──▶ dispatchDraftBatch
        │                                                          │
        ▼                                                          ▼
                                   [control-plane receiver, per account]
                                   ① verified committee (DDG+LLM → email)
                                   ② top mined signal (intent store)
                                   ③ signal-led draft (proximity fallback)
                                          │ stage back
                                          ▼
                              [modex-gtm Outbox]  Casey reviews + approves + sends
                                          │
                                          ▼
                              [send + existing open/reply/bounce detection]
                                          │
[control-plane alerts cron ~15m] ◀────────┘  ④ hot-reply / bounce push to phone
```

### Component ① — Verified contact sourcing (control plane)

Replace the synthesized-DB path in `scripts/yardflow_draft_batch.source_committee`
with verified sourcing, behind a flag (`YARDFLOW_VERIFIED_SOURCING`, default on)
so we can compare against the current path.

Pipeline per account:
1. **People** — `committee_discovery.ddg_linkedin_people(company, areas, seniorities)`
   → `rank_candidates_llm(...)` returns ranked `{name, title, linkedin}` for the
   right seniority bands (economic buyer + ops/supply-chain owner). These are
   verified to work at the actual company (public LinkedIn), unlike the fuzzy DB.
2. **Domain** — resolve `account → corporate domain`. Reuse the domain the intent
   store already keys accounts by (`yardflow_intent.get_account`), falling back to
   an existing resolver (`contact_resolver` / `brand_audit` domain). This is the
   same domain Component ② uses, so it is resolved once per account.
3. **Email** — derive `email = pattern(first, last, domain)`. Determine the
   dominant pattern for the domain from observed real emails in the contacts DB
   when available (e.g. `first.last@`, `flast@`); otherwise default `first.last@`.
   Stamp a confidence (`high` = observed pattern + known domain, `medium` =
   default pattern).
4. **Backstop** — keep `_domain_plausible` as the final gate; rely on the existing
   bounce machinery (`yardflow_bounce_harvest` / `yardflow_bounce_sweep` →
   `do_not_send` / `suppressed_domains`) + modex-gtm intake dedup to catch pattern
   misses.

**Risk note (the one to watch):** email accuracy is the residual. DDG+LLM gives
the right *person*; the local part is still pattern-derived. This is strictly
better than today's wrong-person-at-wrong-domain, mirrors what Casey did by hand,
and is caught downstream by bounce suppression. On any per-account failure (no
DDG result, no domain, LLM error) the receiver falls back to the current
synthesized+domain-gated path so an account never silently yields nothing.

Interface: `source_committee(account, limit)` unchanged signature; returns the
same contact dicts (`name`, `email`, `title`, `confidence`, `source="committee_discovery"`).

### Component ② — Signal-led angles (control plane, during drafting)

The receiver runs where signals live, so the lookup is local. For each target:
1. `signal = top_signal_for(domain)` — pull the highest-ranked current signal from
   `yardflow_intent.get_account(domain)` (SEC/patent/tradeshow/competitor/news).
2. `build_draft(target, persona, signal)` — if `signal` present, lead with a
   one-line "why now" derived from it, then the proximity line, the evergreen
   spine, and the pilot ask. If absent, lead with the proximity hook (Casey's
   chosen fallback). No em dashes; single-line subject; the subject also reflects
   the signal when present.

Interface: new pure `build_draft(target, first_name, signal=None) -> (subject, body)`;
`build_proximity_draft` becomes the `signal=None` branch.

### Component ③ — Daily auto-dispatch (modex-gtm, new Vercel cron)

`src/app/api/cron/dispatch-daily/route.ts` (cron in `vercel.json`, ~6am ET):
1. Load the ranked worklist (same source the `/discovery` UI uses).
2. Filter to **fresh** accounts: drop any with an existing EmailLog send, an open
   Gmail thread, or an existing `draft_queue_items` row (reuse the intake dedup
   predicates). Take the **top 50**.
3. Call `prepareClawdDispatch` / `dispatchDraftBatch` with a system owner
   (`casey@freightroll.com`) — the exact path the button uses.
4. Idempotent: dedup guarantees re-runs never double-draft. Auth via the existing
   cron secret. Log how many were dispatched vs skipped.

Sending stays manual (Casey approves in the Outbox). "Fewer clicks" applies to
**generation** (now zero). A bulk-approve affordance in the Outbox is a cheap
optional add but not required for v1.

### Component ④ — Hot-reply + bounce alerts (control plane)

Implement the stubbed `proactive_alerts.check_hot_replies()` and
`check_new_bounces()`:
1. `check_hot_replies()` — read the already-classified reply output
   (`yardflow_reply_today` / `artifacts/yardflow/replies/{date}.jsonl`), select
   `intent in {interested, meeting, redirect}` not yet alerted, push via the
   existing `_try_push` (MC, Telegram fallback) with account, person, intent,
   snippet, and suggested next move. Track alerted IDs to avoid repeats.
2. `check_new_bounces()` — read new rows from `do_not_send` / `suppressed_domains`
   since last run, push a concise bounce notice.
3. Wire both into `automation_scheduler` (or a `/cron` trigger) at ~15-minute
   cadence.

## Data flow summary (one morning)

1. 6:00 ET — modex-gtm cron picks 50 fresh accounts, dispatches the batch.
2. Receiver, per account: verified people → resolved domain → pattern email →
   top signal → signal-led draft → staged to `/api/cron/queue`.
3. Casey opens the Outbox to ~50–100 reviewed-ready drafts, approves + schedules.
4. Existing send + webhook/inbox detection runs.
5. Throughout the day, every ~15m, hot replies + bounces push to Casey's phone.

## Error handling

- ①: DDG/LLM/domain failure → per-account fallback to current sourcing; never
  abort the batch (receiver already wraps each target in try/except).
- ②: no signal → proximity fallback.
- ③: dispatch failure → log, retry next day; dedup keeps it safe.
- ④: push failure → log, continue; never crash the scheduler.

## Testing

- ①: unit tests with mocked `ddg_linkedin_people` / `rank_candidates_llm`; pattern
  resolution (observed vs default); domain-gate backstop retained; fallback path.
- ②: unit tests — leads with signal when present, proximity when absent, no em
  dashes, single-line subject.
- ③: unit tests — top-50 selection, freshness dedup (EmailLog / thread / queue),
  cron auth, idempotency.
- ④: unit tests — hot-reply selection + de-dupe of alerts, push payload shape
  (mocked push), bounce delta.
- E2E: reuse the existing harness (POST receiver with real token → assert drafts
  land in `draft_queue_items` with verified domains + signal-led copy) to validate
  the whole loop in production before enabling the cron.

## Rollout

1. Ship ①–④ behind flags off.
2. Enable ① + ② on the manual button first; verify draft quality via the E2E
   harness and a manual Hand-to-Clawd.
3. Enable ④ (alerts) — low blast radius.
4. Enable ③ (daily cron) at N=50 last, once ①–② quality is confirmed.

## Open questions

None blocking. N=50/day and verified-email-resolution-in-v1 are decided.
