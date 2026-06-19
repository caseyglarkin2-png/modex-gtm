# Niagara Bottling — FOV verification rejections / flags

Run date: 2026-06-19. Protocol: `scripts/yard-audit/verify-facility-prompt.md`.
Verified all 30 sites in `sites/*.json` via real web research (company plant
locator / careers pages, dated econ-dev + trade press, closure/WARN/under-
construction gauntlet). `checkedBankruptcyEra = false` for all (Niagara is
privately held and never went through bankruptcy).

## Counts (of 30)
- **confirmed:** 28
- **probable:** 2 (flagged below)
- **rejected:** 0

## Rejected sites
None. No site was found closed, sold, divested, idled, run by a different
operating company, or (after final research) only announced/under construction.

The one a-priori risk — site 30 Elko New Market MN, which the deep-audit notes
flagged as under construction in all available satellite imagery — did NOT get
rejected: current research shows Phase 1 came online in summer 2025. It is
carried as **probable** (operating per a Jan-2026 dated local report, but no
clean standing Tier-1) rather than confirmed, and is flagged for re-audit.

## Low-confidence / flagged (probable) sites — verify before relying on the geofence

- **Niagara Bottling - Ontario CA** (site 01, coord 34.0748,-117.532) — PROBABLE.
  Niagara clearly operates manufacturing in Ontario CA (42 live plant-floor reqs:
  Production Operator, Forklift, Plant Maintenance, Injection Operators). But there
  is no dedicated Tier-1 plant locator page for Ontario, and the supplied coord
  drifts ~5-6 km from Niagara's known Ontario plant addresses (2560 E Philadelphia
  St / 5675 E Concours Ave). Confirm the pin lands on the production plant, not the
  corporate office, before trusting the yard geofence.
  [Tier 2: https://www.indeed.com/q-niagara-bottling-l-ontario,-ca-jobs.html, 2026-06]

- **Niagara Bottling - Elko New Market MN** (site 30, coord 44.5676,-93.29) — PROBABLE.
  $125M, 425,000 sqft plant in Park I-35 Industrial Park. Internal deep-audit notes
  said it was under construction in all available imagery (Phase 1 targeted 2025) and
  that the truck yard, dock face, aprons, and gate were still graded dirt — the yard
  classification fields are placeholder defaults, not observations. Current research
  shows Phase 1 has been operating since summer 2025, so it is NOT rejected, but the
  imagery is construction-stage and the standing Niagara careers req URL now returns
  410. Re-audit the yard once post-completion satellite/Street View imagery (2026+)
  is available; do not rely on the current yard metrics/classification.
  [Tier 2: https://streets.mn/2026/01/06/protecting-our-wells-and-groundwater-in-elko-new-market/, 2026-01-06]

## Notes / near-misses cleared during the gauntlet
- The only recent Niagara layoff/WARN activity surfaced was at the **Ocala FL**
  facility (acquired Silver Springs Bottled Water, Sept 2025; ~85-job layoff
  Oct 2025) and historic CA (Diamond Bar) / WA (Burlington) notices — none of
  these is in this roster.
- **Kansas City** has two genuinely distinct operating Niagara plants — 149th St
  (built 2019, south metro) and Airworld Dr (opened 2021, Platte County north near
  KCI). Sites 11 and 12 are both real, not a duplicate/phantom.
- **Gahanna OH** is the real Columbus-metro PET plant (operating since 2013); there
  is no separate Groveport Niagara facility.
- **Newnan GA** (Coweta County) is an 11-year operating plant (production since
  Dec 2014), not a recent announcement.
- Several sites (Los Lunas, Mooresville, Temple, Seguin, Upper Macungie) had recent
  "construction/expansion" press — all confirmed as expansions of existing operating
  plants, not new not-yet-operating builds.
