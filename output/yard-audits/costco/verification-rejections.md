# Costco — FOV / facility verification rejections

Scrub date: 2026-06-18 (`verify-facility-prompt.md`, agent). Account: Costco Wholesale.

**Result: 0 of 11 sites rejected.** All 11 sites verified **confirmed** — each
resolves to a genuine Costco self-operated cross-dock DEPOT (large truck-bay
cross-docks with carrier appointment / 5am-2:30/3pm receiving hours), not a
retail warehouse CLUB. Divestiture/closure/relocation/WARN gauntlet run on every
site with no negative. Costco has no bankruptcy-restructuring era, so
`checkedBankruptcyEra` is false on all sites (no bankruptcy-era check applies).

No site was a store-mislabel: where a Yelp/aggregator "CLOSED" tag appeared
(Sumner, Monroe Twp 10 Costco Dr), it traced to a stale crowd-edited retail
miscategorization of the depot, contradicted by live receiving sources + active
Costco careers reqs — not a real closure.

## Rejections

(none)

## Data-quality flags carried on confirmed sites (NOT rejections)

- **#6 Costco Depot #288/289, Dallas TX (3730 Mountain Creek Pkwy)** — CONFIRMED
  operating (TDLR permit names Costco Wholesale Corp as owner; active 2024-2026
  yard expansion). BUT the roster's claim of a "2025 cold-addition permit adding
  16 cold dock doors" is **NOT corroborated**: the permit found (TDLR
  CW19-0600) is a 79-truck-stall parking expansion + retaining wall, not cold
  dock doors. Treat the 16-cold-door figure as unverified.
  [Tier 1: https://www.tdlr.texas.gov/TABS/Search/Print/TABS2024024465, 2024]

- **#8 Costco Wet Depot #265, Monroe Township NJ (12 Costco Dr)** — CONFIRMED and
  distinct from the paired Dry Depot #175 at 10 Costco Dr (both real, separate,
  operating). Tier-1 corroboration is an FDA/govt site profile naming "Costco
  Depot #265"; otherwise mostly Tier-3 aggregator listings. Confidence solid but
  no Costco-own locator/permit Tier-1 for the wet half specifically.
  [Tier 1: redica.com FDA site profile 100191611 (Costco Depot #265), 2024]

- **#11 Costco Depot, Monrovia MD (5236 Intercoastal Dr, "Depot 171")** —
  CONFIRMED operating (Novak GC build record + Frederick County coverage). The
  2023 county "new warehouse approval" headlines refer to an **expansion**
  building (593,400 sq ft e-comm/returns), NOT the original depot, which has
  operated since ~2010 (e-comm center completed fall 2018). No
  under-construction-only risk to the existing pin.
  [Tier 1: https://www.novakconstruction.com/projects/costco-depot/, 2018]

## Re-pin flags

(none) — all 11 pins resolve to the depot/DC, not a club store; no relocation
detected. SLC depot (5995 W 300 S, #584/585) verified distinct from the West
Valley retail club #622 via Costco's own locator.
