# Deep-Audit Dossier — GXO Logistics Distribution Center, Lebanon IN (idx 6)

## Resolved location
- Address: 135 S Mount Zion Rd, Lebanon, IN 46052
- Locked center: **40.0413, -86.4853**
- Roster geocode (40.039161, -86.483804, ROOFTOP) landed in the SE employee parking lot of the
  correct building; locked center moved ~270 m NW to the building centroid.
- Confirmed via web research: LoopNet lists 135 S Mount Zion Rd as "Building 7," a warehouse
  of **589,616 SF on a 49.19-acre parcel**. GXO/City of Lebanon press release confirms GXO
  operates a returns center here with a planned $11M expansion (spring 2025 start).
- Building identity: a white-roofed distribution building running NW-SE, parallel to and
  immediately SW of I-65, in the Boone County logistics corridor. Footprint and dock layout
  are consistent with a ~590k SF DC. (A much larger 1M+ SF gray-roofed building lies to the
  SE — a separate, unrelated facility, not this address.)

## Key views
- **Wide satellite (z16-18):** Multi-building logistics park along I-65. Identified the GXO
  building as the white-roofed NW structure.
- **Building overview (z18):** Docks on the SW long face with trailers backed in; a row of
  ~10 parked trailers at the NW end; large employee parking lots on the SE side; retention
  pond at the SE.
- **Dock face (z19-20):** Bank of dock doors along the SW face, multiple sections, trailers
  backed in. Heavy roof HVAC clutter and shadow limit an exact count.
- **Entrances (z20):** SW truck driveway and SE car-entry driveway both open paved approaches;
  no barrier arm, sliding gate, or guard booth visible at either.
- **Street View:** Only pano nearby is 2013 (pre-construction) — could not corroborate gate.

## Gate / guard-shack / dock determinations
- **truckGate: false** — No barrier arm, sliding/swing gate, or checkpoint pinch-point visible
  at the SW truck driveway or SE entrance in current Maxar imagery. Open driveways. Listed in
  `uncertainFields` because Street View is pre-construction and cannot confirm.
- **guardShack: false** — No small 1-3-vehicle-footprint staffed booth at any entrance.
- **remoteGs: false** — No gate, so no remote check-in inference.
- **dockDoors: 50+** — ~50-60 dock positions counted along the SW face across multiple
  sections; banded 50+ (count low-confidence due to shadow/HVAC).

## Yard zones and counts
- **perimeter:** ~49 acres, the full fenced/graded property along the SW side of I-65.
- **dropYard:** A row of ~10+ trailers parked at the NW end plus trailers staged along the
  SW yard drive — a dedicated drop/storage area (`dropArea` 10-25).
- **dockApron:** The SW yard drive in front of the dock face — wide, deep (`drivewayLong`),
  with unused paved width (`fastLaneOpportunity`).
- **yardMetrics:** ~55 dock doors, ~28 trailers visible, ~70 trailer capacity, 1 truck gate,
  1 building, 49.2 acres, not rail-served.

## Web findings
- LoopNet / CompStak: "Building 7," 589,616 SF, 49.19 acres.
- City of Lebanon (Mar 2025): GXO expansion, $11M capex, 400+ jobs, completion Q4 2027 —
  consistent with a cleared/graded expansion pad visible at the SW corner.
- GXO jobs site: Lebanon facility is a returns/reverse-logistics center for a sporting-goods
  brand.

## Final confidence
**high** — building positively identified and corroborated by parcel records; layout,
dock band, and zones read clearly from satellite. `truckGate`/`entryLanes`/`exitLanes` and
the exact dock count are listed as uncertain because Street View predates construction.
