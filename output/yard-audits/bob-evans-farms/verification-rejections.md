# bob-evans-farms — verification rejections

FOV scrub run 2026-06-18 (verify-facility-prompt.md). 7 sites checked.
Operating entity confirmed as Bob Evans Foods / BEF Foods, Inc. (Post Holdings
Refrigerated Retail segment, owned since 2017) — NOT the Bob Evans Restaurants
chain (sold to Golden Gate Capital 2017). None of the audited sites are
restaurants or restaurant commissaries.

## Rejected

- Bob Evans Farms - Forney TX Transportation Outpost (Forney/Sunnyvale, TX — no
  pin) — REJECTED: unmappable + no Bob-Evans-operated yard to audit. The audit
  JSON has null coords and no geofence; the company's about-us page names a
  "small outpost in Forney, Texas" but discloses no address. The actual physical
  TX freight site Bob Evans drivers work from is Lineage Logistics' Dallas
  (Sunnyvale) cold-storage DC (367 Long Creek Rd, Sunnyvale TX 75182, ex-Millard,
  Bob Evans a 3PL customer/driver-domicile since 2010) — a third-party facility,
  not a Bob-Evans-controlled yard. No auditable Bob Evans site exists here.
  [Tier 1: https://www.bobevansgrocery.com/about-us/ , 2026-06 — names outpost, no address]
  [Tier 3: https://www.onelineage.com/facilities/dallas-sunnyvale , 2026-06 — physical site is a Lineage 3PL DC]

## Low-confidence / flagged (shipped, capped)

- Bob Evans Farms - Springfield OH Transportation Hub — CONFIRMED but
  `confidence: medium` (snow-cover satellite imagery, no Street View). The fleet
  terminal is verified current and self-operated (FMCSA USDOT 911163 ACTIVE,
  MCS-150 updated 2026-02-27, at 6088 Green Field Dr; NLRB cases naming "yard
  jockeys"). Distinct from the ~2012-closed Springfield sausage plant. Imagery
  quality is the only cap, not the operator/operation question.

## Confirmed (no problems)

- Xenia OH plant (sausage) — Bob Evans Foods, owned. Tier-1: bobevansgrocery.com + Post careers.
- Lima OH plant (mashed potatoes / mac & cheese; ex-Kettle Creations) — Bob Evans Foods, owned (651 Commerce Pkwy). Tier-1 + Dec-2024 trade feature.
- Hillsdale MI plant (sausage) — Bob Evans Foods, owned (200 N Wolcott St). Tier-1: company page + Post FY2023 10-K Item 2 + live reqs + 2026 packaging expansion.
- Sulphur Springs TX plant (mac & cheese / refrigerated sides) — Bob Evans Foods, owned (1109 Industrial Dr E). Tier-1 + Feb-2025 plant safety milestone.
- Rigby ID plant (refrigerated/frozen potato products; ex-Potato Products of Idaho) — Post Holdings/Bob Evans, owned (acquired 2025-03-03). Wrong-operator risk explicitly resolved.
