# Deep-Audit Dossier — Niagara Bottling, Middleburg FL (idx 21)

## Facility
- **Name:** Niagara Bottling - Middleburg FL
- **Type:** Bottling / Manufacturing Plant
- **Address:** 565 Atlantis Dr, Middleburg, FL 32068
- **Resolved coords:** 30.13565, -81.82680 (building/yard center)
- **Archetype:** #7 — Gate + GS + Fast Lane Opportunity
- **Confidence:** high

## Location confirmation
Roster lat/lng (30.134287, -81.827665, ROOFTOP) landed at the south end of the
correct building. Satellite probes z16–z17 revealed a large NW-SE oriented
single-building industrial plant with a continuous dock face. Street View at
the entrance road confirmed the building outright: blue facade carrying the
red/orange "Niagara" logo. This is the ~$70M Niagara Bottling plant near
Jacksonville that opened in 2022. Locked center at 30.13565, -81.82680.

## Key views
- **Wide (z16/z17):** Single very large rectangular building, long axis NW-SE.
  Dock face and a long trailer drop row run the entire NE side. Retention
  ponds flank the property west and SE. New residential development to the E.
- **Dock face (z18):** Continuous dock-door rhythm along the full NE building
  face; many trailers backed in plus a parallel drop row of parked trailers.
- **Entrance (z19/z20, Street View):** A single wide truck driveway leaves the
  public road on the south side. Street View looking up the driveway shows a
  checkpoint structure spanning the lanes mid-driveway and chain-link
  perimeter fencing along the property edge.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Street View clearly shows a checkpoint/canopy structure
  across the truck driveway plus continuous perimeter fencing — a controlled
  entry, not an open driveway.
- **guardShack = true.** A booth/canopy is visible at the checkpoint spanning
  the lane; consistent with a manned gatehouse for a 2022-built plant.
  Flagged uncertain — overhead/Street View resolution is moderate.
- **remoteGs = false** (guard shack present).
- **dockDoors = "50+".** Continuous dock rhythm across the ~1100 ft NE face;
  estimate ~65 doors.
- **dropArea = "25-50".** A long trailer drop row parallel to the building.
- **fastLaneOpportunity = true.** The entry driveway is very wide (3+ lane
  width) with ample paved apron to add an express bypass lane.

## Yard zones and counts
- **perimeter:** ~690 m N-S x ~420 m E-W including retention ponds ≈ 56 acres.
- **truckGate:** checkpoint area mid-driveway on the south side.
- **dropYard:** long trailer parking strip along the NE building face.
- **dockApron:** strip in front of the NE dock bank.
- **staging:** wide paved area between the public road and the gate (pre-gate).
- dockDoorCount ~65, trailersVisible ~60, trailerParkingCapacity ~90,
  truckGateCount 1, buildingCount 1, railServed false.

## Web findings
Niagara Bottling's Middleburg (Clay County / Jacksonville-area) plant was a
~$70M investment that opened in 2022. Single-building greenfield bottling and
manufacturing operation. No rail spur.

## Setting
Rural / edge-of-town: Middleburg, FL, surrounded by woodland with a new
residential subdivision adjacent. Judged Rural.

## Final confidence
**High.** Building positively identified by Niagara branding in Street View.
Gate and guard shack supported by a visible checkpoint structure and perimeter
fencing; both flagged in uncertainFields due to moderate imagery resolution.
