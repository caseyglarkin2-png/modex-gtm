# DISCOVERY — Gap Report (Sprint 0)

> Refactor `/discovery` from a breadth-first discovery/scoring engine into a
> proximity-led GTM daily driver. This report maps the engine as built, scores
> the live page against the rubric, and confirms the two inputs Sprint 1+ depend
> on (the reference set and CRM depth). It is grounded in the committed code and
> the data that actually ships to the Vercel preview, not screenshots.

Generated: 2026-06-04 · Branch: `worktree-discovery-prox-gtm` (off `main`)

---

## 1. The engine, mapped

### 1.1 Scoring (`scripts/prospect-discovery/score-and-rank.ts`)

Each discovery gets an `icpScore` (0–100) = the sum of six dimensions. **Fit is
75 of the 100 points; proximity is 10.** This is the core of why the page is
fit-led, not proximity-led.

| Dimension | Max | Source / logic | Shape |
| --- | --- | --- | --- |
| **Vertical Match** | 25 | `VERTICAL_RULES` keyword sets + `KNOWN_BRANDS` (≈230 brands → vertical points). Food/bev/logistics = 25. | banded |
| **Enterprise Scale** | 25 | `estimatedRevenue` → else `KNOWN_BRANDS[].revB` → else Google `userRatingsTotal` proxy. ≥$10B = 25. | banded |
| **Network Complexity** | 25 | `estimatedFacilities` → else `KNOWN_BRANDS[].fac`. ≥50 facilities = 25. | banded |
| **Primo Proximity** | **10** | `findNearestPrimo()` over `PRIMO_SITES` (24 sites) → `scorePrimoProximity()`. | **stepped, capped at 10** |
| **Corridor Density** | 5 | `scoreCorridorDensity()` — neighbors within 5 mi. ≥10 = 5. | banded |
| **Place Type Bonus** | 10 | Google `types` (`establishment` + storage/warehouse) = 10. | banded |

**The proximity curve today** (`scorePrimoProximity`, the lever the whole
strategy turns on, worth at most 10 points):

```
≤  5 mi → 10      ≤ 25 mi → 5       > 50 mi → 0
≤ 10 mi →  8      ≤ 50 mi → 3
```

`tier`: A ≥70, B 50–69, C 30–49, D <30 (`assignTier`).

### 1.2 Proximity source — the reference set

- **`PRIMO_SITES`** — **24 hardcoded Primo Brands facilities** (factories + DCs),
  mirrored in `score-and-rank.ts` and `scripts/primo-proximity-gtm.ts`.
- `findNearestPrimo()` returns the single nearest site name + distance; that is
  the "Nearest Primo … 2.7 mi" shown in the drawer.
- **There is no broader "all live and deploying YardFlow sites" list in the
  repo.** Primo is the only reference anchor wired in. → **Decision for Casey, §6.**

### 1.3 Corridor logic

- `clusterIntoCorrridors()` — single-linkage clustering, 10-mi link radius.
- Each corridor: centroid, radius (max member distance), `totalProspects`,
  `tierACount`, `avgIcpScore`, top-5 by score. Sorted by `avgIcpScore ×
  totalProspects`. **429 corridors** in the live sample.

### 1.4 CRM awareness (today: a flag, not a state)

- **Dedup only.** `matchExistingAccount()` flags a discovery `isExistingAccount`
  if within 0.3 mi of a known facility (`roster.json` files) or a fuzzy
  name-match against `KNOWN_ACCOUNTS` (55 slugs). Output carries
  `existingAccountSlug`.
- The page **reads nothing live from HubSpot.** No stage, owner, last activity,
  or next step. The only HubSpot touch is a one-way **write**
  (`src/app/discovery/actions.ts` → push a Company, stamp `yardflow_icp_score`).
- A full HubSpot read library already exists and is reusable
  (`src/lib/hubspot/{deals,contacts,companies,owners,...}.ts`,
  `withHubSpotRetry`). It just isn't wired into discovery. → **§6 / Sprint 5.**

### 1.5 Data path to the page

- Pipeline writes `output/prospect-discovery/scored-prospects-<date>.{json,csv}`
  + a `weeded-out-<date>.json` audit. Dated files are **gitignored**.
- `loadLatestScored()` (`src/lib/discovery/data.ts`) prefers the newest dated
  file, else falls back to the **committed `SAMPLE-scored-prospects.json`** —
  which is what the Vercel preview/prod actually render.
- The full set (~7.6 MB, 8,135 rows) is shipped to the client and held in memory;
  filters run client-side (`filterProspects`). `DiscoveryHub` syncs tab/filter
  state to the URL via `history.replaceState` (no re-fetch).

---

## 2. Live numbers (the committed sample = what ships)

| Metric | Value |
| --- | --- |
| Total discoveries | **8,135** |
| Existing-account matches | 972 |
| Net-new | **7,023** |
| Tier A / B / C / D | **1,633** / 289 / 4,290 / 1,923 |
| Corridors | 429 |

**Saturation & noise, measured:**

- **22%** of net-new prospects score **0 on proximity** (>50 mi from any Primo
  site) — proximity is a garnish, not a driver.
- Net-new Tier A alone = **1,633** rows. A "target set" of 1,633 is a pile.
- **164** net-new Tier A rows are **carriers / 3PLs** (JB Hunt, Penske, Ryder,
  Schneider, XPO, Old Dominion, Estes, Saia…) — mixed in with shippers.
- **37** rows are truck-entrance / gate grain artifacts (e.g. "… (Truck
  Entrance)") that should collapse into their site.
- Max proximity contribution anywhere is 10/100 — confirms fit-led ranking.

> Note: a fresh local re-score (`corridor-scan-2026-06-04.json`, gitignored) gives
> 7,912 / 1,613 Tier A — same shape, slightly smaller. The committed sample
> (8,135) is the source of truth for the live page and this report.

---

## 3. Rubric, scored for real (≈8 / 20)

Mirrors `DISCOVERY_02_TARGET-AND-AUDIT-prox-gtm.md §3`, re-verified against the
committed code/data above.

| # | Criterion | Score | Evidence (from this repo) |
| --- | --- | --- | --- |
| 1 | Job clarity ("what do I do today") | **0** | Page opens on 8,135 rows + a map. No worklist, no "today," no next action. |
| 2 | Proximity logic | **2** | `findNearestPrimo` computes distance; 429 corridors clustered. Real, but only 10/100 of the score. |
| 3 | Reference layer | **1** | Primo only (24 sites), used as a score input — **not** a visible map layer. |
| 4 | Data fusion | **1** | `isExistingAccount` flag + slug only. No stage/owner/last-touch read from HubSpot. |
| 5 | Prioritization | **1** | Transparent breakdown, but fit-led (75/100), not re-weightable, saturates (14 net-new at 100, 215 ≥90). |
| 6 | Action | **0** | Drawer offers only "Open in Accounts" / "Push to HubSpot." No angle, outreach, or asset links. |
| 7 | Daily-driver fit | **0** | Static JSON snapshot. No "today," no my-slice, no action loop. |
| 8 | Trust | **1** | Dated + sourced (`generatedAt`, `inputFile`), but no per-row confidence; visible grain artifacts. |
| 9 | Scale & UX | **1** | Holds 8,135 rows client-side (7.6 MB); map caps at top 1,500. Workable, unwieldy. |
| 10 | Defensible data | **1** | Parcel/carrier noise, 164 Tier A carriers, 37 truck-entrance dupes, shipper/carrier mix. |

**Total ≈ 8 / 20.** Every point earned is on proximity + clustering (the
foundation to keep). Every zero is on the daily-driver job: **decide, act,
reflect the pipeline.**

---

## 4. The gaps to close (maps to the sprint plan)

1. **No worklist** → Sprint 3. Ranked "work these today," defaulted to Casey's
   sellable slice (Tier A/B, his corridors, near a reference).
2. **Wrong ranking shape** → Sprint 2. Proximity-led, continuous by distance,
   re-weightable, tie-broken so the 100s spread out.
3. **Uncurated data** → Sprint 1. One row per sellable site; dedup truck-entrance
   artifacts; segment shipper/carrier/3PL/parcel; demote parcel & last-mile;
   per-row confidence.
4. **Shallow CRM** → Sprint 5. Read stage, owner, last activity, next step.
5. **No action layer** → Sprint 4. Generated angle, draft outreach, `/for` +
   `/demo` links, log-a-touch, add-to-sequence.
6. **Narrow reference layer** → Sprint 6. Anchor to all live/deploying YardFlow
   sites; pin them with proximity rings + corridor hulls.
7. **No "my slice"/"today"** → Sprint 3. His targets, his corridors, his
   pipeline, opening on today.

---

## 5. What we reuse (do not rebuild)

The scoring engine, the proximity computation, the corridor clustering, the
Leaflet corridor map, the sortable/searchable table, the URL-synced filter bar,
the prospect drawer, the HubSpot push action, **and the full HubSpot read library
(`src/lib/hubspot/*`)** that Sprint 5 needs. The refactor re-aims these; it does
not replace them.

---

## 6. Inputs to confirm before Sprint 1/2 (the forks)

These two set the "ranking brain." Sprint 2 (re-aim the score) and Sprint 6
(reference layer) depend on them.

### 6.1 Reference set (Sprint 0.2 gate)
- **Wired today:** Primo Brands only, 24 geocoded sites. This *is* the live
  YardFlow reference (Primo is the live customer), so proximity is real today.
- **Open question:** are there **other** live/deploying YardFlow sites beyond
  Primo? If yes, Casey supplies the geocoded list and we broaden the anchor +
  the map layer. If no, we proceed on the 24 Primo sites and label the map layer
  honestly as "YardFlow live sites (Primo)."

### 6.2 Ranking brain / Spearhead (Sprint 0.1 → Sprint 2)
- **Recommended (audit doc):** lead with **reference proximity** (continuous by
  distance), with corridor density + pipeline momentum as secondary tie-breaks.
  Weaponizes the live-site proof; the engine already computes the input.
- Alternative: lead with **corridor density** (travel efficiency) instead.

### 6.3 CRM depth — local-access blocker (Sprint 0.3 gate)
- The HubSpot **read** library exists and supports stage/owner/last-activity
  (`deals.ts` reads `dealstage/amount/closedate`; add `hubspot_owner_id` +
  `notes_last_contacted`; `contacts.ts` reads role/lifecycle).
- **Blocker:** `HUBSPOT_ACCESS_TOKEN` is **not in local `.env.local`** (only in
  `.env.local.example` and in Vercel env, per project memory). So the Sprint 0.3
  "test read returns one known account with stage/owner/last-activity" gate
  **cannot run locally** — it must run on the Vercel preview, or Casey provides a
  read token locally. `HUBSPOT_SYNC_ENABLED` (default true) also gates the lib.
  This is a Sprint 5 concern; flagged now, not blocking Sprints 1–4.

---

## 7. Plan of record & sequencing

Per the kickoff LAW: atomic commits, the page stays working, a validation gate
before every commit, commit on green, a scoped PR off `main`, **no production
push without Casey's go**. Get sign-off on the worklist (through Sprint 4) before
the deeper CRM fusion (Sprint 5).

- **Sprint 1** — curate to a sellable target set (grain, segments, confidence).
- **Sprint 2** — re-aim the score (proximity-led, re-weightable, discriminating).
- **Sprint 3** — the worklist + "today"/my-slice framing (the core).
- **Sprint 4** — the action layer (angle, outreach, asset links, log-a-touch).
- → **Casey sign-off checkpoint.**
- **Sprint 5** — HubSpot pipeline depth (stage/owner/last-activity/contacts).
- **Sprint 6** — reference layer + map + daily-ritual polish.
