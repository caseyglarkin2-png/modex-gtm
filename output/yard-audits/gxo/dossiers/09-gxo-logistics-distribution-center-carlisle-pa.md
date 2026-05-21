# Deep-Audit Dossier — GXO Logistics Distribution Center, Carlisle PA (idx 9)

## Resolved location
- Address: 1200 Distribution Dr, Carlisle, PA 17013
- Locked center: **40.20490, -77.23330**
- Roster ROOFTOP geocode (40.204958, -77.234885) landed on the roof of the SOUTHERN of two
  adjacent GXO buildings. GXO operates both 1200 Distribution Dr and 1301 Distribution Dr
  (the roster itself notes the adjacent 1301 building); idx 9 is the southern building =
  1200 Distribution Dr.
- Confirmed via web research: GXO operates distribution centers at 1200 and 1301 Distribution
  Drive, Carlisle PA 17013 (GXO jobs site, BBB profile, Buzzfile).
- Setting: a large I-81 logistics park in Cumberland County, surrounded by farmland and other
  big-box DCs.

## Key views
- **Context / wide (z15-16):** Large I-81 logistics park; identified the two adjacent GXO
  white-roofed buildings.
- **Southern building (z16-17):** Large cross-dock DC running E-W; dock banks with trailers
  on the north face and the south face; office/parking at the NW; trailer drop yard off the
  SE corner.
- **Drop yard (z17):** Dedicated herringbone trailer-parking lot at the SE end with dozens
  of trailers.
- **Gate (z19-21 + Street View 2021):** SW driveway has a controlled entrance — chain-link
  sliding gates across the lanes with a center island and a "NO TRUCKS" sign segregating a
  car lane. Continuous chain-link perimeter fencing encloses the truck yard. No guard booth.
- **Street View (2021/2023):** Confirms the fenced yard, dock faces with trailers, and the
  gated SW entrance.

## Gate / guard-shack / dock determinations
- **truckGate: true** — SW driveway has chain-link sliding gates across the lanes; the whole
  truck yard is fenced. A clear controlled entrance.
- **guardShack: false** — No staffed booth structure at the gate; Street View and high-zoom
  satellite show gates, island, and signage only.
- **remoteGs: true** — Gate present with no guard booth implies remote check-in
  (kiosk / badge / app).
- **dockDoors: 50+** — Two long dock banks on the N and S faces; ~110 estimated.
- **shipRcvSeparate: true** — Cross-dock building with separate dock clusters on opposite
  faces, each with its own fenced yard.

## Yard zones and counts
- **perimeter:** ~78 acres covering the building, both truck yards, and the SE drop yard.
- **truckGate zone:** the gated SW driveway.
- **staging:** the wide divided approach road outside the SW gate (pre-gate staging).
- **dropYard:** the SE herringbone trailer lot (`dropArea` 50+).
- **dockAprons:** N-face apron and S-face apron, both deep enough for 3+ truck stacking.
- **yardMetrics:** ~110 dock doors, ~90 trailers visible, ~180 capacity, 1 truck gate,
  1 building, ~78 acres, not rail-served.

## Web findings
- GXO jobs site / BBB / Buzzfile: GXO operates DCs at 1200 and 1301 Distribution Drive,
  Carlisle PA 17013.
- (Note: a separate GXO Carlisle facility at 100 Carolina Way was reported closing in 2026 —
  a different location, not this site.)

## Final confidence
**high** — building positively identified; cross-dock layout, fenced yard, gated entrance,
and drop yard all read clearly from satellite + Street View. `dockDoorCount` and exact
`entryLanes`/`exitLanes` listed uncertain (large building, honest overhead estimate).
