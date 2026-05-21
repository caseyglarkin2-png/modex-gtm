# Deep-Audit Dossier — Niagara Bottling, Imperial PA / Findlay Township (idx 25)

## Facility
- **Name:** Niagara Bottling - Imperial PA (Findlay Township)
- **Type:** Bottling / Manufacturing Plant
- **Address:** 201 Solar Dr, Imperial, PA 15126
- **Resolved coords:** 40.44190, -80.29597 (building/yard center)
- **Archetype:** #3 — No Gate / No GS
- **Confidence:** high

## Location confirmation
The roster lat/lng (40.441904, -80.295974, ROOFTOP) landed on the correct
building. Web search confirmed the Niagara Bottling Imperial plant at 201
Solar Dr in the Findlay Industrial Park near Pittsburgh International Airport
(~$64M plant). Street View confirmed the building directly: blue facade with
the Niagara logo and bulk water silos at the NW corner. Locked center at
40.44190, -80.29597.

## Key views
- **Wide (z16/z17):** A single standalone industrial building on its own
  parcel in the Findlay Industrial Park, surrounded by other large warehouses
  and woodland. Dock yard on the E/NE face.
- **Dock face (z18/z19):** Long continuous dock face along the E/NE side with
  trailers backed in plus a full second drop row of parked trailers.
- **Entrance (z18/z20, Street View 2025-05):** The access road off Solar Dr
  enters the property; the building entrance and silos are clearly visible.
  Employee parking at the NW corner; the truck route is a perimeter road
  wrapping the building to the E dock yard.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Street View (2025-05) at the entrance shows the
  driveway running straight from the public road into the property with only
  directional signs and a speed-limit sign — no barrier arm, no sliding gate,
  no checkpoint pinch-point. An open entrance.
- **guardShack = false (uncertain).** No staffed guard booth identified at the
  entrance or along the truck route. A small structure near the
  perimeter-road/dock-yard junction is not clearly a guard booth — flagged
  uncertain.
- **remoteGs = false** (no gate, so no remote check-in classification).
- **dockDoors = "50+".** Long continuous E/NE dock face; estimate ~65 doors.
- **dropArea = "50+".** Heavy trailer drop yard along the E face with multiple
  rows of parked trailers.
- **dropYard = true.** Dedicated trailer-storage rows in the E dock yard.

## Yard zones and counts
- **perimeter:** ~445 m N-S x ~340 m E-W ≈ 50 acres.
- **truckGate:** open entrance off Solar Dr at the SW (no barrier).
- **dropYard / dockApron:** E/NE-face dock yard with trailers.
- **staging:** wide paved truck route / apron inside the property (post-gate
  staging); no clear pre-gate staging.
- dockDoorCount ~65, trailersVisible ~75, trailerParkingCapacity ~95,
  truckGateCount 1, buildingCount 1, railServed false.

## Web findings
Niagara Bottling Imperial PA is a ~$64M plant in the Findlay Industrial Park
near Pittsburgh, producing bottled water; integrated bottling operation.
Single-building plant. No rail spur.

## Setting
Rural: the Findlay Industrial Park sits in a hilly, partly wooded area near
Pittsburgh International Airport, away from dense metro fabric. Judged Rural
per the small-town-industrial tiebreak.

## Final confidence
**High.** Building positively confirmed via Niagara branding in recent
(2025-05) Street View. The open truck entrance is clearly shown — no barrier,
no guard booth — supporting archetype #3. Guard shack and truck scale flagged
in uncertainFields.
