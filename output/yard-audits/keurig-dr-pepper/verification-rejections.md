# Keurig Dr Pepper — FOV Verification Rejections

Per-site facility verification (FOV scrub) run 2026-06-19 against
`scripts/yard-audit/verify-facility-prompt.md`. 22 sites checked.

**Verdicts: 16 confirmed, 2 probable (flagged), 4 rejected.**

---

## Rejected (4) — do NOT image, geofence, classify, or ship

- **KDP Coffee Roasting & K-Cup Plant — Spartanburg/Moore SC** (Building 500,
  3220 Moore Duncan Hwy, Tyger River Industrial Park) — REJECTED: future /
  under-construction. This is a NEW leased ~203,000 sq ft spec building (Sept
  2024, $141M "K-Rounds" expansion), separate from KDP's existing operating
  Spartanburg K-Cup plant. Co-tenant Crown plans to begin operations "at the
  start of 2026"; full development "complete in 2027." No confirmed K-Rounds
  production today; June 2025 imagery showed a spec building with a Colliers
  leasing sign. A current-ops audit of a build-out is invalid.
  [Tier 2: https://whosonthemove.com/crown-forklift-joins-keurig-dr-pepper-at-tyger-river-industrial-park-in-moore-sc/, 2025]
  [Tier 1: https://governor.sc.gov/news/2024-09/keurig-dr-pepper-continues-growing-spartanburg-county-operations, 2024-09]
  NOTE: KDP's *existing* Spartanburg K-Cup plant (different building, ~285
  employees) IS operating — but it is not this audited building.

- **KDP Coffee Plant — Waterbury VT** (33 Coffee Lane, Pilgrim Park) — REJECTED:
  closed + vacated + re-tenanted. KDP/Keurig closed the Waterbury early-production
  facility in 2019 and did not reopen its leased Waterbury offices (workers
  permanently remote since Sept 2021); the Pilgrim Park space is now occupied by
  other businesses. No KDP-operated freight yard here today (it was also a
  non-freight office campus).
  [Tier 2: https://www.waterburyroundabout.org/business-archive/kqlobr1818ucn4y92ynu9ah13n905a, 2021-09]
  [Tier 2: https://vtdigger.org/2019/02/01/as-layoffs-go-into-effect-keurig-closes-waterbury-early-production-facility/, 2019-02-01]

- **KDP Coffee Roasting Plant — Castroville CA** (11480 Commercial Pkwy) —
  REJECTED: divested + re-tenanted. Keurig Green Mountain liquidated the
  Castroville coffee roasting/blending/packaging equipment in a 2017
  Rabin/Capital Recovery Group surplus auction ("Surplus to needs of Keurig
  Green Mountain, Inc."); the building has since been subdivided and re-tenanted
  with other coffee companies (Hillside Coffee of California, The Coffee
  Plantation). KDP does not operate here today.
  [Tier 2: https://www.bidspotter.com/en-us/auction-catalogues/capital-recovery-group-rabin/catalogue-id-bsccapi10077?archiveSearch=True&page=3, 2017-09-28]
  [Tier 3: https://clustrmaps.com/a/3jap7d/, 2025-01]

- **KDP Distribution Center — Evansville IN** (2600 S Kentucky Ave) — REJECTED:
  no verifiable KDP freight facility. No Tier-1 positive after a genuine search —
  only aggregator/registry listings (Cortera, Indeed) reference the address. The
  audit's satellite check found an empty parking lot and a generic industrial
  building with no beverage signage, no docks-with-trailers, and no truck yard —
  consistent with a registered/administrative or route address, not an active
  warehouse. Historic Evansville Dr Pepper/RC distribution ran through Royal
  Crown Bottling Corp (1100 Independence Ave), which was renamed "Vision
  Beverage" in 2020 and stopped distributing KDP brands.
  [Tier 3: https://start.cortera.com/company/research/m2n5sso6k/keurig-dr-pepper-inc/, 2025]
  [Tier 3: https://www.warntracker.com/company/keurig-dr-pepper, 2024-12]

- **KDP Distribution Center — Fontana CA** (no resolvable address) — REJECTED:
  no verifiable KDP freight facility. KDP's only Fontana CA presence is a
  Merchandiser Stocker careers req — a route/territory role serving retail
  stores from a personal vehicle, NOT a KDP-occupied building. The "92-acre
  former Kraft-Heinz campus + 811k SF manufacturing build" that an early pass
  attached to Fontana is actually KDP's **Allentown PA** plant (the Dennis Group
  project page and WFMZ both place it in Upper Macungie / Allentown PA). The
  roster's Fontana entry traces to an Indeed city-list artifact. No real building
  to audit.
  [Tier 1: https://careers.keurigdrpepper.com/en/job/fontana/merchandiser-stocker/42849/91336228016, 2025]
  [Tier 1 (the campus is Allentown, not Fontana): https://dennisgroup.com/project/keurig-dr-pepper/, 2021]

---

## Probable (2) — ship caveated + capped (lower confidence)

- **KDP Mott's Plant — Aspers PA** (45 Aspers North Rd) — PROBABLE. Mott's/KDP
  apple-products plant; no Tier-2 closure/divestiture found (the only KDP plant
  closure on record is Windsor VA, 2025), but no fresh Tier-1 dated positive
  within ~24 months was located. Ship caveated.
  [Tier 3: https://www.yellowpages.com/aspers-pa/mip/keurig-dr-pepper-559325254, 2026]

- **KDP Cowpens K-Cup Packaging — Cowpens SC** (no resolvable address) —
  PROBABLE. KDP's K-Cup packaging operation in Spartanburg County SC is
  confirmed live, but no Tier-1 source names a "Cowpens" facility specifically;
  the documented KDP coffee complex is in Moore (~20 mi SW). The Cowpens pin is
  most likely a mis-geocode of the Spartanburg complex. The exact Cowpens
  address is unverified — pin before geofencing.
  [Tier 1: https://governor.sc.gov/news/2024-09/keurig-dr-pepper-continues-growing-spartanburg-county-operations, 2024-09]

---

## Address / data flags on CONFIRMED sites (resolve before modeling)

- **Northlake IL (Site 09)** — operation is unambiguous (capital project + active
  NLRB case "The American Bottling Company d/b/a Keurig Dr Pepper" + Local 727),
  but the exact street address is not Tier-1 pinned (~401 N Railroad Ave / N Wolf
  Rd). Pin via parcel before geofencing.
- **Waco TX (Site 10)** — confirmed operating at 100 Aviation Pkwy, but the
  audit mis-attributed Allentown PA's 92-acre Kraft-Heinz / 811k SF manufacturing
  build to Waco. That building is in Allentown. Verify Waco's actual building
  scope/SF before modeling yard metrics.
- **Sumner WA (Site 13)** — confirm exact street number (on-site 3418 vs nearby
  3324/3424 listings, same campus).
- **Sumner WA + Knoxville TN (Sites 13, 14)** — coffee plants exposed to KDP's
  announced coffee-business spinoff (JDE Peet's). Forward ownership risk only;
  both are currently operating.
