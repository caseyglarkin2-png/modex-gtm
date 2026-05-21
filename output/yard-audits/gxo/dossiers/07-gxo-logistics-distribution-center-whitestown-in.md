# Deep-Audit Dossier — GXO Logistics Distribution Center, Whitestown IN (idx 7)

## Resolved location
- Address: 5490 Industrial Ct, Ste 300, Whitestown, IN 46075
- Locked center: **39.96345, -86.38215**
- Roster geocode (39.962504, -86.383939, ROOFTOP) landed on the SW corner of the correct
  building; locked center moved to the building centroid.
- Confirmed via web research: LoopNet lists 5490 Industrial Ct as a **628,206 SF** warehouse,
  36-ft clear height, 257 parking spaces, **76 dock doors**, single warehouse block. GXO jobs
  site confirms an active GXO operation here ("Lebanon and Whitestown" — gxo.jobs/Boone).
- Building identity: a large cross-dock distribution building in the AllPoints at Anson
  logistics park, NW of Indianapolis, immediately west of I-65. Surrounded by other mega-DCs.

## Key views
- **Context / wide satellite (z16-17):** Large multi-building logistics park. Identified the
  GXO building as the big rectangular structure SE of the park's central retention ponds.
- **Building overview (z17):** Cross-dock layout — dock banks with trailers backed in on both
  the NW long face and the SE long face; large paved truck yards on both sides; office/parking
  at the W end.
- **Dock faces (z18-19):** Long regular rhythm of dock doors with many trailers backed in on
  the NW face; matching bank on the SE face.
- **Entrances (z19-20):** NW and SE truck-yard driveways are open paved approaches connecting
  to the perimeter park road. The park's main boulevard entry to the NE is a landscaped public
  road, not a facility gate.
- **Street View (2019):** Confirms the two large buildings across the retention pond; road is
  the public park road.

## Gate / guard-shack / dock determinations
- **truckGate: false** — No barrier arm, sliding/swing gate, or checkpoint pinch-point at
  either the NW or SE truck-yard entrance; both are open driveways. Listed uncertain.
- **guardShack: false** — No small staffed booth at any entrance. A small orange structure
  near the NW dock face reads as a maintenance/utility unit, not a gate booth.
- **remoteGs: false** — No gate present.
- **dockDoors: 50+** — LoopNet specifies 76; satellite corroborates two long dock banks.
- **shipRcvSeparate: true** — Cross-dock building: two separate dock clusters on opposite
  long faces, each with its own truck yard.

## Yard zones and counts
- **perimeter:** ~55 acres, the full property including both NW and SE truck yards.
- **dropYards:** Two — the NW yard and the SE yard, both large paved lots holding many
  trailers (`dropArea` 50+).
- **dockAprons:** Two — the apron in front of the NW dock bank and the apron in front of the
  SE dock bank; both deep enough to stack 3+ trucks (`drivewayLong`).
- **yardMetrics:** 76 dock doors (per LoopNet), ~45 trailers visible, ~140 trailer capacity,
  2 truck gates, 1 building, ~55 acres, not rail-served.

## Web findings
- LoopNet / Showcase: 628,206 SF, 36-ft clear, 76 dock doors, 257 car spaces, sprinklered.
- GXO jobs site (gxo.jobs/Boone): active GXO Whitestown operations alongside Lebanon.
- Property sits in AllPoints at Anson, a major Whitestown logistics park on I-65.

## Final confidence
**high** — building positively identified and corroborated by LoopNet leasing data (matching
SF, dock count, cross-dock layout). `truckGate`/`entryLanes`/`exitLanes`/`truckGateCount`
listed uncertain — entrances are clearly open driveways but exact lane counts and any
soft controls cannot be confirmed from overhead imagery.
