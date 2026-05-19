# Deep-Audit Dossier — Home Depot BDC, Baltimore MD (idx 30)

**Facility:** Home Depot Bulk Distribution Center (DC #5904)
**Address:** 7700 Rolling Mill Road, Baltimore, MD 21224
**Resolved coordinates (approx.):** 39.21970, -76.47730
**Confidence:** Medium — building identity not fully isolated (see below)

## Location confirmation
The supplied roster coordinate (39.301709, -76.509079) was a GEOMETRIC_CENTER
geocode moved 3,972 m — effectively a Baltimore city-area centroid that did
NOT point at the building; it landed on industrial/steel-yard land north of
the actual site.

7700 Rolling Mill Road is inside **Tradepoint Atlantic** — the 3,300-acre
logistics redevelopment of the former Bethlehem Steel mill on the Sparrows
Point peninsula in southeastern Baltimore County. Home Depot completed a
3-building, ~1.5 million sq ft distribution campus there in 2020-2021
(Baltimore Sun, HD IR release Aug 2021). One of the three is HD's FDC at 6311
Tradepoint Ave (the separate roster idx 2). The Bulk Distribution Center
#5904 is another building of that HD cluster.

Coordinates were re-located by imagery to a large HD-area distribution
building at ~39.2197, -76.4773 whose dock apron holds white trailers with
green roofs (HD-spec livery). **Caveat:** Tradepoint Atlantic now hosts 30+
tenants (Amazon, FedEx, Under Armour, Floor & Decor, McCormick, etc.) in
dozens of near-identical large white DCs, and Google Street View has no
interior coverage on Rolling Mill Road for signage confirmation. The
BDC-specific building therefore could not be definitively distinguished from
the HD FDC and a third HD building. Confidence is set to **medium** and the
building identity is flagged.

## Key views
- **Zoom 14-16 wide:** The Tradepoint peninsula is wall-to-wall large DCs;
  rail lines thread the campus; water on three sides. The HD cluster sits in
  the central/southwestern part near Rolling Mill Road / Tradepoint Ave.
- **Zoom 16-19 of the audited HD-area building:** A large rectangular DC with
  a long dock apron along its east face, trailers (several green-topped HD
  units) backed in and staged. Adjacent DCs of similar scale flank it.

## Gate / guard-shack determination
- **truckGate: true (inferred).** Tradepoint DCs are individually fenced with
  controlled truck entrances off the internal road grid; the specific gate
  for this building is inferred from campus pattern, not directly resolved.
- **guardShack: false / remoteGs: true.** Tradepoint Atlantic runs
  campus-level access control; no building-specific staffed booth resolved.
  Classified as remote / kiosk check-in at the building.
- **multiStep: false.**

## Yard zones & counts (estimates — see caveat)
- **Perimeter:** ~50 acres for the audited building and its trailer apron.
- **Dock doors:** estimated 50+ along the east apron.
- **Drop area / drop yard:** 50+ — trailers staged the length of the apron.
- **multipleFacilities: true** — HD's Tradepoint presence is a 3-building
  campus.
- **railServed:** false set pending confirmation — Tradepoint is heavily
  rail-served campus-wide but no spur was confirmed into this building.
- **urbanRural: Urban** — Baltimore metro, Sparrows Point peninsula.

## Web findings
Baltimore Sun (Aug 2021) and HD IR confirm HD completed three DCs totaling
1.5M sq ft at Tradepoint Atlantic, ~500 jobs. SupplierWiki HD DC list ties
DC #5904 to 7700 Rolling Mill Road as a non-conveyable Bulk Distribution
Center. No source pinned the BDC building's exact footprint or coordinates.

## Final confidence: Medium
The facility is confirmed to exist within the HD Tradepoint Atlantic campus,
but the specific BDC building could not be isolated from the FDC and a third
HD building using satellite imagery alone (no Street View signage, dozens of
look-alike DCs). Recommended for human review or an HD-source coordinate.
Geofence and yardMetrics are best-estimate for the audited HD-area building.
