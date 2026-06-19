# H-E-B — Facility Verification Rejections

FOV scrub (current-operations) run 2026-06-18. H-E-B is privately held (no 10-K)
and has never been through bankruptcy, so `checkedBankruptcyEra: false` across all
sites. 16 sites verified: 13 confirmed, 0 probable, 3 rejected.

Rejected sites (do NOT image/geofence/classify):

- H-E-B eCommerce Fulfillment Center - San Antonio (idx 14, San Antonio TX,
  coords 29.42519 / -98.494592) — REJECTED: phantom / placeholder. No distinct
  stand-alone San Antonio-proper eFC exists in H-E-B's documented network (Katy,
  Houston x3, Plano, Leander, Cibolo, planned Frisco). The roster coordinate is a
  downtown San Antonio city centroid (same placeholder as idx 7), not an
  industrial facility. San Antonio-area online-grocery demand is served by the
  Cibolo eFC (idx 13). Recommend merge into idx 13 or remove.
  [Tier 1: https://newsroom.heb.com/h-e-b-opens-ecommerce-fulfillment-center-in-cibolo/, 2024-05;
   Tier 3: https://www.grocerydive.com/news/hebb-opens-ecommerce-fulfillment-facility-cibolo-texas/716304/, 2024-05]

- H-E-B Frisco Electronic Fulfillment Center (idx 15, Frisco TX, FM 423 & US 380 /
  899 University Dr) — REJECTED: future site, not yet built. TDLR project
  TABS2026005469 lists a 51,599 sq ft new-construction eFC with construction start
  7/6/2026 and completion 6/5/2027 — construction had not begun as of the audit
  window. Current-ops audit only.
  [Tier 1: https://www.tdlr.texas.gov/TABS/Search/Print/TABS2026005469, 2025-11;
   Tier 2: https://communityimpact.com/dallas-fort-worth/frisco/development/2025/12/11/h-e-b-set-to-build-51599-square-foot-electronic-fulfillment-center-in-frisco/, 2025-12]

- H-E-B Hempstead Distribution Campus (idx 16, Hempstead / Waller County TX, S of
  US 290, E of SH 6, adjacent RCR Hempstead Logistics Rail Park) — REJECTED: under
  construction, not yet operating. ~500-acre multi-phase ~$200M campus; as of 2026
  only ancillary support structures (central utility plant, gate/guardhouse,
  vendor processing center) are nearing completion per TDLR — the main Phase 1 DC
  is not yet operating. Current-ops audit only; recheck once Phase 1 opens.
  [Tier 1: https://www.tdlr.texas.gov/TABS/Search/Print/TABS2025014258, 2026;
   Tier 2: https://www.grocerydive.com/news/heb-building-texas-distribution-campus/714409/, 2024]

## Low-confidence / caveat flags (confirmed but flagged, NOT rejected)

- H-E-B eCommerce Fulfillment Center - Plano (idx 12) — confirmed operating but it
  is a STORE-INTEGRATED eFC attached to the Plano retail store (6001 Preston Rd).
  Only a grocery-store back-of-house dock, no dedicated freight yard. Low
  freight-yard suitability — score as a retail-store dock, not a freight building.

- H-E-B eCommerce Fulfillment Center - Cibolo (idx 13) — confirmed operating but
  STORE-INTEGRATED (connected to the Cibolo retail store, 850 FM 1103). Same
  caveat as Plano: grocery-store back-of-house dock, no real freight yard. Low
  freight-yard suitability.

- H-E-B eCommerce Fulfillment Center - Katy (idx 11) — confirmed (stand-alone
  freight eFC). Note: official address is 2102 Elrod Rd, Katy; the dataset's
  coordinate-derived address string differs slightly (same Katy locale). Worth
  correcting in the dataset.
