# Deep-Audit Dossier — Niagara Bottling, Jupiter FL (idx 23)

## Facility
- **Name:** Niagara Bottling - Jupiter FL
- **Type:** Bottling / Manufacturing Plant
- **Address:** 15832 Corporate Rd N, Jupiter, FL 33478
- **Resolved coords:** 26.90430, -80.28400 (building/yard center)
- **Archetype:** #1 — Gate + GS (no other distinguishing flag)
- **Confidence:** high

## Location confirmation
The roster lat/lng (26.904603, -80.284117, ROOFTOP) landed directly on the
correct building. Web search confirmed the Niagara Bottling Jupiter plant at
15832 Corporate Rd N in the Palm Beach Park of Commerce — ~409,486 sq ft,
running 24/7, producing private-label bottled water. Satellite and Street
View matched: a single large industrial building with an extensive south
dock face and a fenced perimeter. Locked center at 26.90430, -80.28400.

## Key views
- **Wide (z16/z17):** Single standalone industrial building on its own fenced
  parcel, surrounded by woodland in the commerce park. Dock yard on the south
  face.
- **Dock face (z18/z19):** Long continuous dock-door run along the south
  building face. Two rows of trailers — backed into the docks plus a full
  drop row in the yard.
- **NW access road / gate (z18/z20):** The access road descends from the NW
  and enters the secured yard through a checkpoint. Satellite z20 shows a
  canopied gatehouse/booth structure beside the lane.
- **Street View (2021-02):** Continuous chain-link perimeter fencing around
  the property, trailers backed into docks, trailers staged on the access
  road approach.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A controlled checkpoint exists where the NW access
  road enters the fenced yard; continuous perimeter fencing confirms a
  secured site, not an open driveway.
- **guardShack = true.** Satellite z20 shows a small canopied booth beside
  the gate lane — a staffed-booth footprint.
- **remoteGs = false** (guard shack present).
- **dockDoors = "50+".** Long continuous south dock face; estimate ~75 doors.
- **dropArea = "50+".** Heavy trailer drop yard with multiple rows of parked
  trailers south of the docks.
- **dropYard = true.** Dedicated trailer-storage rows separate from active
  dock staging.
- **fastLaneOpportunity = false.** The gated access road is a standard width;
  no obvious unused paved apron for a bypass.

## Yard zones and counts
- **perimeter:** ~355 m N-S x ~310 m E-W ≈ 60 acres.
- **truckGate:** checkpoint on the NW access road.
- **dropYard / dockApron:** south-face apron and trailer drop rows.
- **staging:** access-road approach outside the gate (pre-gate staging).
- dockDoorCount ~75, trailersVisible ~90, trailerParkingCapacity ~110,
  truckGateCount 1, buildingCount 1, railServed false.

## Web findings
Niagara Bottling Jupiter is a ~409,486 sq ft plant within the Palm Beach Park
of Commerce, operating 24/7 and producing private-label bottled water for
major retailers. Single-building plant. No rail spur.

## Setting
Rural / semi-rural: the Palm Beach Park of Commerce is an isolated industrial
park in NW Palm Beach County surrounded by woodland, well outside dense metro
fabric. Judged Rural.

## Final confidence
**High.** Building positively confirmed via web search and imagery. Gate and
guard shack supported by a visible canopied gatehouse structure and
continuous perimeter fencing. Truck scale flagged uncertain.
