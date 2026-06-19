# GXO — Facility Verification Rejections & Low-Confidence Flags

FOV scrub run 2026-06-18 (agent). GXO is a contract-logistics 3PL spun off from
XPO in 2021 (XPO/RXO are now SEPARATE companies). 3PL contracts churn, so every
site was run through the closure/contract-loss/wrong-operator gauntlet.

Result: 30 sites — **17 confirmed, 3 probable (flagged), 10 rejected.**
All operators tagged `3PL`, tenancy `leased`. Citations live in each site JSON.

## Rejected (10) — do NOT image / geofence / classify

- **02 — Abercrombie & Fitch DC (Goodyear AZ, 16920 W Commerce Dr)** — REJECTED:
  address mismatch. 16920 W Commerce Dr is the Amazon PHX5 facility (Goodyear
  Crossing II). GXO's actual A&F DC is at 17780 W Thomas Rd in PV303.
  [Tier 2: https://www.yourvalley.net/stories/abercrombie-fitch-to-open-715000-square-foot-distribution-center-in-goodyear,263654 , 2021-08]

- **04 — GXO DC (Fairburn GA, 7300 Oakley Industrial Blvd)** — REJECTED: GXO
  permanently ceased operations and laid off all 69 employees (WARN Jan 8 2024;
  separations ~Mar 10 2024).
  [Tier 2: https://www.supplychaindive.com/news/gxo-logistics-supply-chain-ceases-operations-georgia-facility/704975/ , 2024-01-23]

- **11 — GXO DC (Middletown PA, 200 Capital Lane)** — REJECTED: GXO filed a WARN
  and closed 200 Capital Lane on Apr 15 2025 (~91 jobs); no current GXO reqs.
  [Tier 2: https://www.abc27.com/local-business/logistics-company-in-cumberland-county-to-cease-operations/ , 2025-03]

- **13 — IKEA DC (Westampton NJ, 100 Ikea Dr)** — REJECTED: wrong operator. The
  Westampton IKEA DC is IKEA-self-operated (IKEA Distribution Services Inc.).
  GXO's IKEA contract site is Quakertown PA (site 08), not this building.
  [Tier 2: https://gxo.com/news_article/gxo-distribution-center-named-no-1-in-ikeas-global-network/ , 2023-08 ; Tier 3 NLRB: https://www.nlrb.gov/case/04-RC-088236 , 2012]

- **14 — GXO DC (West Jefferson OH, 202 Park West Dr)** — REJECTED: GXO is
  closing the site; WARN filed Mar 3 2026, ~102 employees, effective May 2 2026.
  [Tier 2: https://hoodline.com/2026/03/west-jefferson-warehouse-gut-punch-as-gxo-logistics-axes-100-plus-jobs/ , 2026-03]

- **21 — GXO DC (Fort Worth TX Sylvania, 4320 N Sylvania Ave Ste 100)** —
  REJECTED: no Tier-1 confirmation of current GXO operation. Building (Mercantile
  Distribution Center 1) is actively marketed for lease (vacancy signal); XPO
  also co-listed at the address (operator ambiguity; XPO is a separate company).
  Only aggregator/Ste-100 listings tie GXO here.
  [Tier 2: https://www.loopnet.com/Listing/4320-N-Sylvania-Ave-Fort-Worth-TX/29392230/ , 2026-06]

- **22 — GXO DC (Fort Worth TX Everman, 1401 Everman Pkwy)** — REJECTED: GXO
  leased this in 2022 for the Comcast contract, then lost the contract and ceased
  operations there (105 WARN layoffs effective ~Jun 30 2023).
  [Tier 1: https://fortworthreport.org/2023/05/22/gxo-logistics-plans-to-lay-off-105-in-fort-worth/ , 2023-05]

- **24 — GXO DC (Houston TX West Greens, 4800 W Greens Rd)** — REJECTED: building
  is dominated by oil/gas tenants (Cameron, a Schlumberger company); no credible
  source places a GXO operation here. GXO appears only in aggregators.
  [Tier 2: https://www.officespace.com/tx/houston/1192601-4800-w-greens-rd , 2026-06]

- **25 — GXO DC (Grapevine TX, 4220 Diplomacy Rd)** — REJECTED: address mismatch.
  GXO's documented Grapevine facility is 2425 Esters Blvd; no source ties GXO to
  4220 Diplomacy Rd.
  [Tier 3: https://racklify.com/warehouses/gxo-logistics-in-grapevine-tx/ , 2026-06]

- **26 — GXO DC (Arlington TX, 3996 Scientific Dr)** — REJECTED: wrong operator.
  3996 Scientific Dr is an RXO/XPO last-mile terminal (RXO and XPO are separate
  companies from GXO). GXO's own DFW DC list excludes Arlington.
  [Tier 2: https://truckmap.com/place/xpo-logistics-inc-3996-scientific-drive-arlington-tx-76014-usa , 2025 ; https://find-open.com/arlington/rxo-4882832 , 2025]

## Probable — LOW CONFIDENCE (ship caveated + capped, or re-check before use)

- **18 — GXO DC (Fontana CA, 10746 Commerce Way)** — PROBABLE/FLAG: GXO tied to
  this old multi-tenant building only via map POI + employer directory; no
  Tier-1 job req pinned to the exact building, but no closure found.
  [Tier 3: https://www.waze.com/live-map/directions/us/ca/fontana/gxo , 2026-06]

- **23 — GXO DC (Houston TX Railwood, 9255 Railwood Dr)** — PROBABLE/FLAG: only
  Tier-3 aggregators tie GXO to 9255 Railwood; GXO's own Houston careers point to
  other addresses. It is a real 300k SF DC and no closure was found, so not
  rejected, but treat as unverified.
  [Tier 3: https://www.evopra.com/warehouses/usa/houston/gxo-logistics , 2026-06]

- **27 — GXO DC (West Valley City UT, 2179 S Commerce Center Dr)** — PROBABLE/FLAG:
  GXO link is aggregator-only; no GXO careers posting at the address and the
  building is actively listed for lease + multi-tenant (re-tenancy flag). No GXO
  closure/loss found either.
  [Tier 3: https://www.loopnet.com/Listing/2179-S-Commerce-Center-Dr-West-Valley-City-UT/4378808/ , 2026]
