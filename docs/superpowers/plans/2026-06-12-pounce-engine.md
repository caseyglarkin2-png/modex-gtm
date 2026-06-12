# Pounce Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-account trigger intelligence: read the news for every audited account daily, score each story for pounce-ability, ping #yardflow-intent on hot triggers, and rank accounts by initiative-fit so outreach timing and /for page framing always reflect what the prospect announced this week.

**Why (the founding failure):** On 2026-06-12 the /for/pepsico spear shipped citing January's digital-twin story while the June 8 PepsiCo+Gatik multi-year autonomous-freight agreement (the single best pounce signal of the year) sat in Google News, 4 days old, unread. A human (Casey) caught it with one search. The engine makes that search continuous, for every account, scored.

**Architecture:** modex-gtm (cron infra + Slack webhook + HubSpot token already live there). Google News RSS as the zero-auth source (`news.google.com/rss/search`), deterministic keyword-taxonomy scoring (no LLM dependency in the cron path), Slack pings via the existing `sendSlackNotification`, daily Vercel cron with the `isAuthorizedCronRequest` auth idiom. Stateless dedupe: each daily run scans a 36h window, so an item is seen by at most 2 runs and pinged once (pings are capped + sorted, and re-pings of identical URLs across adjacent runs are filtered with an in-window URL set; accepted residual: a story can ping twice on the window seam, never more).

**Tech stack:** Next.js route handler (modex), tsx scripts, Google News RSS, no new deps.

---

## Phase 1 — the engine (BUILT 2026-06-12, this session)

### Task 1: News source
**Files:** Create `src/lib/pounce/news.ts`
- [x] `fetchAccountNews(query)` fetches Google News RSS for the query, regex-parses `<item>` blocks into `{ title, url, source, publishedAt }`, decodes entities, never throws (returns `[]` on failure)
- [x] Validate: local run returns >0 items for "PepsiCo" and item 1 parses with a real Date

### Task 2: Trigger taxonomy + scoring
**Files:** Create `src/lib/pounce/score.ts`
- [x] Categories (weight): AUTONOMY 6 (gatik, autonomous, driverless, self-driving, robot truck, waymo, aurora, kodiak), YARD_DIRECT 6 (yard, yms, dock, detention, dwell, gate automation, trailer pool), DIGITAL_OPS 4 (digital twin, omniverse, ai-powered, automation, robotics, industry 4.0), NETWORK_CAPEX 4 (new plant, distribution center, greenfield, breaks ground, expansion, million square feet, opens facility), COST_RESTRUCTURE 3 (closure, closing, restructuring, layoffs, activist, productivity, cost cuts, network optimization), LEADERSHIP 3 (chief supply chain, csco, vp supply chain, appoints, names new), FREIGHT 2 (private fleet, trucking, carrier, transportation network, middle mile)
- [x] Boosts/penalties: account name in title +2; finance-noise downweight -6 (price target, stock, shares, dividend, analyst, betting) unless a supply-chain term co-occurs
- [x] Validate: the June 8 Gatik headline scores >= 8 (ping tier); a "price target raised" headline scores < 0

### Task 3: Scan orchestrator + watchlist
**Files:** Create `src/lib/pounce/scan.ts`
- [x] Watchlist = `getAllAccountMicrositeData()` (the audited /for accounts, ~57) with per-account query: `"<name>" (supply chain OR logistics OR distribution OR plant OR warehouse OR freight OR autonomous)`
- [x] `runPounceScan({ hours, slugs?, minScore })`: fetch each account (300ms politeness gap), filter to window, score, dedupe by URL, return `{ triggers (sorted), accountsScanned, errors }`
- [x] Validate: backfill run over 336h catches PepsiCo+Gatik at the top

### Task 4: Cron route + schedule
**Files:** Create `src/app/api/cron/pounce-scan/route.ts`, modify `vercel.json`
- [x] GET, `isAuthorizedCronRequest` guard; params: `hours` (default 36, max 720), `minScore` (default 8), `mode` (scheduled Bearer = apply, manual ?secret= = dryrun, override with `mode=apply`), `account` (slug filter)
- [x] Apply mode: Slack ping top triggers (cap 6/run) to #yardflow-intent: `🎯 POUNCE <account> — "<title>" (<source>) <url> [<categories>]`; always returns the full JSON report
- [x] `vercel.json` cron: `5 13 * * *` (daily 13:05 UTC = 9:05 ET, after the morning news cycle)
- [x] Validate: scheduled run pings Slack (verify after first cron fire); manual dryrun returns report without pings

### Task 5: Local backfill runner (the launch report)
**Files:** Create `scripts/pounce/backfill.ts`
- [x] `npx tsx scripts/pounce/backfill.ts [hours] [minScore]` → writes `output/pounce/report-<date>.md` (ranked accounts, triggers with links) + `.json`
- [x] Validate: 14-day backfill produces the launch pounce report; Gatik present

## Phase 2 — reach + activation (spec'd; X-scan rig script built)

### Task 6: X/Twitter feed scan via the CDP browser rig
**Files:** Create `yardflow-hubspot/x-scan.mjs`
- [x] Attaches to the logged-in Chrome rig (`chromium.connectOverCDP`), opens x.com Following timeline, scrolls N screens, extracts post text/author/time/url, matches against the watchlist names + taxonomy terms, writes `x-scan-<date>.json`. Runs only when the rig is up (Casey logged in). This is how we read Casey's actual feeds without an X API key.
- [ ] Validate (needs the rig running): catches a watchlist-account post from the Following feed

### Task 7: Spear-authoring news gate (process fix for the Gatik miss)
**Files:** Modify Flow-State- `scripts/onboard-for.mjs`
- [x] Onboarding output now prints a mandatory step 0 for the creative pass: run the pounce backfill for the slug and read the last 14 days before writing the spear
- [ ] Future: onboard-for curls the prod pounce endpoint directly (needs CRON_SECRET exposure decision — Casey)

### Task 8: Account heat + page activation (NOT BUILT — next sprint, Casey decisions)
- [ ] HubSpot: stamp high-score triggers as company Notes + a `last_trigger_at` / `trigger_fit` company property pair (needs property creation in portal settings — UI or admin scope)
- [ ] /for pages: a "LIVE SIGNAL" ribbon sourcing the account's latest trigger (native /for fetches `/api/pounce/latest?slug=` — needs a public read endpoint with caching)
- [ ] Weekly pounce digest email via the Gmail send pipeline (exists in modex) to casey@freightroll.com
- [ ] Earnings-call sweep: quarterly transcript scan per account (source TBD; IR pages + Motley Fool free tier)
- [ ] LinkedIn: no clean source; revisit via the CDP rig pattern (Casey's logged-in session) like X

**Decisions for Casey (Phase 2):** (1) expose CRON_SECRET to the local rig for manual prod runs, or keep local-report-only; (2) HubSpot property creation for trigger heat (portal settings change); (3) whether the LIVE SIGNAL ribbon on /for pages is wanted (it makes "we read your news" explicit to the prospect).
