# Deep-Audit Dossier — Stop & Shop Cross-Dock, Chester NY (idx 07)

**Facility:** Stop & Shop Cross-Dock Chester NY (ADUSA Supply Chain)
**Type:** Cross-Dock (multi-temperature + freezer grocery DC)
**Resolved center:** 41.34525, -74.28625
**Address:** 14 Elizabeth Drive, Chester, NY 10918
**Method:** deep-audit (probe.ts satellite + Street View, web research)
**Confidence:** medium

---

## Step 0 — Location confirmation

The supplied coordinates (41.349722, -74.28646) landed ~300 m north of the
target, inside the Chester (Sterling Forest / Greycourt) industrial park among
several large buildings. Web research confirmed the facility: the ADUSA
Distribution Aug-2023 release and C&S Wholesale Grocers locations page describe
a former C&S multi-temperature + freezer cross-dock on Elizabeth Drive,
~600,000 sq ft, ~65M cases/yr serving Stop & Shop and Hannaford, with a yard of
350+ trailer spots and nearly 100 dock doors. Addresses 1 Elizabeth Dr
(perishable) and 14 Elizabeth Dr (freezer) are the same campus.

Walking satellite z15 → z16 → z17, the matching building is the large
single-roof DC south of the given point, centered at ~41.3452, -74.2862: a very
large light-roof warehouse with continuous dock banks, an extensive east-side
trailer drop yard, and a fenced perimeter ring road. This is the building
audited. (The solar-roofed building to its NW is a separate property.)

## Key views

- **Wide satellite (z15-z16):** the DC sits on its own fenced parcel off
  Elizabeth Drive, bordered by wetlands/retention ponds (W and S), open scrub
  and a rail line (E), and an industrial park (N/NW).
- **Tight satellite (z17-z21):** one large building; long dock banks on the
  south face with trailers backed in end-to-end; a second dock bank on the
  north/interior face; a large east trailer drop yard (dozens of rows of
  unhitched trailers); an overflow trailer row along the south yard; office +
  employee/visitor parking at the NE corner.
- **Street View (2025-04):** public panos exist only on the perimeter road
  along the south and east. SV-b shows the south dock face — a long line of
  trailers backed into doors behind chain-link fence with light poles and a
  fire hydrant at the road edge. SV-c / SV-d / SV-gate2 show continuous
  chain-link perimeter fence along the Elizabeth Drive frontage. SV-f / SV-
  nentry (looking SW/S across the lawn) show the building, dock trailers, and
  the north entrance apron.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE (medium confidence).** The property is fully fenced
  (chain-link confirmed on the south and the Elizabeth Drive frontage in
  multiple SV frames). Truck flow is consolidated onto a perimeter ring road
  that breaks the fence at a single wide paved apron on the north frontage off
  Elizabeth Drive. For a fenced ~600K sq ft cold-chain DC this strongly implies
  a controlled truck entrance. Caveat: the private ring road has no Street View
  coverage and the public-road panos sit back across a wide grass setback, so a
  physical barrier arm could not be directly resolved in any frame. Flagged in
  `uncertainFields`.
- **Guard shack — FALSE (low confidence).** No guard-booth structure was
  resolvable at the entrance throat in satellite z20-z21; the north entry area
  reads as office plus employee/visitor parking. Consistent with a kiosk / app
  / call-box check-in rather than a staffed booth.
- **Remote GS — TRUE.** Set true because there is a gate but no visible guard
  shack (implying remote/kiosk check-in). Pairs with the guardShack uncertainty.
- **Dock doors — 50+ band (~95 doors).** Continuous dock banks on the south
  face (trailers backed in end-to-end, SV-b) and a second interior/north bank.
  Corroborated by the "nearly 100 dock doors" figure in the ADUSA release.
- **Drop area / drop yard — 50+ band; dropYard TRUE.** Extensive dedicated
  trailer-storage lot on the east side (dozens of rows of unhitched trailers,
  ss07_dc_z18 / ss07_east_z18) plus a south overflow row. Release states 350+
  trailer spots.

## Yard zones and counts

- **Perimeter:** traced as a 5-vertex oriented ring around the fenced parcel
  (building + east drop yard + south yard), ~43.3 acres by shoelace.
- **Truck gate:** quad over the north-frontage entrance apron off Elizabeth
  Drive (~41.3473, -74.2856).
- **Drop yards:** (1) the large east trailer field; (2) the south overflow
  trailer row.
- **Dock aprons:** (1) the long south dock apron hugging the south wall; (2)
  the west/interior dock strip.
- **yardMetrics:** dockDoorCount ~95, trailersVisible ~280, capacity ~350,
  truckGateCount 1, buildingCount 1, siteAreaAcres 43.3, railServed false (a
  rail line runs along the east edge but no spur enters the property).

## Other classification calls

- **urbanRural — Rural.** Edge-of-town industrial park outside the village of
  Chester, surrounded by open land, wetlands, and a quarry.
- **fastLaneOpportunity — TRUE.** Very wide gate apron and large open paved
  frontage off Elizabeth Drive leave ample room to add an express/bypass lane.
- **drivewayLong — TRUE, postGateStaging — TRUE.** Deep approach from the fence
  break to the dock faces with a large interior paved yard for staging (3+
  trucks).
- **entryExitTogether — TRUE.** Single consolidated access point on the north
  frontage. entryLanes ~2 / exitLanes ~1 (both low confidence — no ground view).
- **shipRcvSeparate — FALSE (low conf).** As a cross-dock, inbound and outbound
  share the same dock banks; no clearly separate ship vs receive cluster.
- **scale / multiStep / multipleFacilities / backupSensitive — FALSE.** No
  truck scale, no second checkpoint, single building, gate set well back from a
  low-traffic road with deep stacking room.

## Web findings

- ADUSA Distribution Aug-2023 release (GlobeNewswire / Progressive Grocer /
  AJOT): former C&S facility transitioned to ADUSA on 2023-07-30; ~600,000 sq ft
  multi-temperature + freezer; ~65M cases/yr serving Stop & Shop and Hannaford;
  yard with 350+ trailer spots and nearly 100 dock doors; ~500 people on site.
- 2019: Ahold Delhaize USA purchased the Chester warehouse (plus two others)
  from C&S as part of a $480M supply-chain investment.
- C&S Wholesale Grocers locations page + Yelp list 1 Elizabeth Dr (perishable)
  and 14 Elizabeth Dr (freezer) at this campus.

## Final confidence

**Medium.** Building positively identified and well corroborated by web data;
counts cross-checked against the ADUSA release. The gate exists behind a fenced
perimeter but lacks direct ground-level confirmation of a barrier arm/guard
booth (no Street View on the private drive), so truckGate / guardShack /
remoteGs / entry-exit lane counts / shipRcvSeparate are flagged uncertain.
