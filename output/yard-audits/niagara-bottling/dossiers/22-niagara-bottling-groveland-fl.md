# Deep-Audit Dossier — Niagara Bottling, Groveland FL (idx 22)

## Facility
- **Name:** Niagara Bottling - Groveland FL
- **Type:** Bottling / Manufacturing Plant
- **Address:** 7633 American Way, Groveland, FL 34736
- **Resolved coords:** 28.63920, -81.82750 (Niagara building/yard center)
- **Archetype:** #1 — Gate + GS (no other distinguishing flag)
- **Confidence:** high

## Location confirmation
The roster lat/lng (28.638988, -81.827331, ROOFTOP) sits inside a multi-tenant
industrial park with several large warehouses. Web search confirmed the
address and that Niagara has operated in Groveland since 2007. Satellite
probes and Street View resolved the correct building: the standalone large
building carries bulk storage silos/tanks (water-bottling tanks) on its
SE/E side, and the gated truck driveway leads directly to it. Neighboring
buildings are separate tenants. Locked center at 28.63920, -81.82750.

## Key views
- **Wide (z16/z17):** Multi-building industrial park. The Niagara building is
  the large central structure; dock face and angled trailer rows run along
  its west side.
- **Building (z18):** Continuous angled dock bays along the west face with
  many trailers backed in; perimeter road around the building.
- **Entrance driveway (Street View, 2025-04):** The truck driveway leaves the
  south public road and runs north into the property. A gate, stop sign,
  perimeter chain-link fencing, and a canopied guard booth are clearly
  visible at the checkpoint. Bulk silos visible behind confirm a bottling
  plant.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Street View shows a controlled checkpoint — gate,
  stop sign, and perimeter fencing where the driveway meets the yard.
- **guardShack = true.** A small canopied guard booth sits beside the gate
  lane on the building side — a clear staffed-booth footprint.
- **remoteGs = false** (guard shack present).
- **dockDoors = "50+".** A long run of angled dock bays along the west face;
  angled geometry makes exact counting hard — estimate ~55 doors.
- **dropArea = "10-25".** Trailers parked in angled drop rows along the west
  apron.
- **fastLaneOpportunity = false.** The gated driveway is a standard width
  with no obvious unused paved apron for a bypass.

## Yard zones and counts
- **perimeter:** ~350 m N-S x ~340 m E-W ≈ 42 acres.
- **truckGate:** checkpoint near the SW corner of the building.
- **dropYard / dockApron:** west-face apron with angled dock bays and parked
  trailers.
- **staging:** short pre-gate stretch between the public road and the gate.
- dockDoorCount ~55, trailersVisible ~40, trailerParkingCapacity ~70,
  truckGateCount 1, buildingCount 1, railServed false.

## Web findings
Niagara Bottling established Groveland operations in 2007; ~134 full-time
employees. Water bottling / manufacturing. Single-building plant within the
American Way / Christopher C. Ford Commerce Park area. No rail spur.

## Setting
Rural / edge-of-town: Groveland, FL, a small city; the industrial park sits
amid woodland and pasture. Judged Rural.

## Final confidence
**High.** Building positively identified (silos + gated driveway leading to
it). Gate and guard shack clearly visible in recent (2025) Street View.
Dock-door and drop-area counts flagged uncertain due to angled-bay geometry.
