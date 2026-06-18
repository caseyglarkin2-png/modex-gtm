# Coca-Cola FOV Verification — Rejections & Watch Notes

Run date: 2026-06-18. Method: per-site web research (divestiture/closure gauntlet +
positive operator ID), per `scripts/yard-audit/verify-facility-prompt.md`.

## Rejections

**None.** All 30 audited sites are legitimate, currently-operating Coca-Cola-system
yards (KO-direct concentrate plants or independent franchise-bottler production/DC
sites). Zero sites were a competitor, a closed/demolished site, or a phantom.

The Coca-Cola bottling system is franchised, so most "Coca-Cola" plants are run by
independent bottlers (Coca-Cola Consolidated, Coca-Cola UNITED, Reyes, Liberty,
Swire). These are still real Coca-Cola network yards and were not rejected; the
operating bottler is captured in each site's `verification.rationale`. Operator is
tagged `self` only for KO-direct sites and `3PL` for the independent bottlers.

## Operator nuance / corrections (NOT rejections, but flag for accuracy)

- **05 — Mobile Production Center (Mobile, AL)** — Attributed to Coca-Cola
  Consolidated in the roster, but **Consolidated divested its Mobile manufacturing
  in the 2017 territory swap** (received Memphis/West Memphis). Mobile is now in
  **Coca-Cola UNITED** territory and UNITED operates + expanded it ($48M, 2021).
  Still a confirmed Coca-Cola yard; operating bottler corrected to UNITED in the
  rationale. [Tier 2: SEC 8-K 2017 / Tier 1: madeinalabama 2021-03]

- **07 — Bishopville Production Center (Bishopville, SC)** — Operated by **South
  Atlantic Canners (SAC)**, an 8-bottler Coca-Cola cooperative of which Consolidated
  is a member-owner, not Consolidated outright. Active and expanding ($28.7M, by
  2027). Confirmed Coke-network bottling plant. [Tier 1 Consolidated 2024-10 / Tier 3
  SC Commerce 2023-05]

- **16 — Birmingham "Production Plant" (Birmingham, AL)** — **No longer a production
  plant.** Coca-Cola UNITED pulled bottling out in 2020 and repurposed the site to
  warehouse/loading; it remains UNITED's HQ + an active distribution/warehouse yard.
  Confirmed yard, but the "Production Plant" label is outdated. [Tier 2 alabamanewscenter
  2020-09 / Tier 1 UNITED locator 2026]

## Watch flags (confirmed, but time-sensitive for deal context)

- **28 — Maspeth Production Plant (Queens, NY), Liberty** — Operating, but Glassdoor
  layoff chatter and an active NLRB discharge/layoff case suggest workforce
  contraction. Worth a pre-call check; not a rejection.

- **30 — Denver Production Plant (Denver, CO), Swire** — Operating in 2026 but
  earmarked for replacement by a new Colorado Springs plant (groundbreaking 2026).
  Finite runway; relevant to deal timing, not a current rejection.

## Lower-confidence tenancy (sites still confirmed)

- **14 (Erlanger, KY)**, **24 (Downey, CA)**, **25 (San Leandro, CA)** — tenancy
  recorded as `unknown` (owned-vs-leased not explicitly sourced); operation itself is
  confirmed.
- **26 (Rancho Cucamonga, CA)** — currently a Reyes distribution center mid-rebuild
  into a 620k sq ft production campus; operations temporarily relocated to Fontana
  during 2025-2027 construction. Still a Reyes yard; confirmed.
