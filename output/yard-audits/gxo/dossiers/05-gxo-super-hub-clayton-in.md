# Deep-Audit Dossier — GXO Super Hub, Clayton IN (idx 5)

## Resolved location
- **Address:** 2121 Gateway Pt, Clayton, IN 46118
- **Locked center:** 39.605400, -86.483484 (recentered slightly south from the
  ROOFTOP geocode onto the building centroid).
- Web research confirms: "GXO Super Hub" (GDI Construction project) at this
  address; GXO operates 24/7 and is hiring 2,000+ jobs across central Indiana.
  Mechatronics Maintenance roles advertised — a highly automated facility.

## How the location was confirmed
- z14/z16 satellite show an I-70 corridor industrial park with several large
  buildings; the GXO Super Hub is the single enormous DC building at the
  geocoded point (~520m x ~210m footprint, ~1.1M+ sq ft — the largest in this
  batch).
- TruckMap and BBB list the same 2121 Gateway Pt address for GXO.

## Imagery note
The building is newly completed and the truck courts are nearly empty of
trailers — the super-hub is ramping up. Marked trailer-parking stalls are
clearly painted; few are occupied. Street View predates the development (2023
panos show undeveloped rural road), so gate hardware could not be checked from
ground level. Confidence is **medium**.

## Key views
- **z16 full:** One enormous building. Truck courts wrap the north and south
  faces, each with rows of marked trailer-parking stalls. Retention ponds and
  perimeter fencing enclose the truck yard. Two other large buildings sit to
  the north (separate properties in the same park).
- **z17/z18/z19:** Dock doors with dock-door canopies on both the north and
  south long faces. Auto/employee parking and an office portion at the NE.
- **z20 corners:** Continuous perimeter fence + retention ponds around the
  truck courts; marked trailer stalls throughout.

## Gate / guard-shack / dock determinations
- **truckGate: true (inferred)** — The north and south truck courts are fully
  enclosed by perimeter fencing and ponds; access is via the NE industrial-
  park road. A controlled gate is inferred from the fully fenced truck yard;
  an exact barrier arm could not be crisply resolved. Flagged uncertain.
- **guardShack: false / remoteGs: true** — No standalone guard booth resolved.
  Treated as remote/kiosk check-in, consistent with a newly built, highly
  automated GXO super-hub.
- **dockDoors: 50+** — Continuous dock-door rhythm on two long faces of a
  ~520m building; ~220 doors estimated.
- **shipRcvSeparate: true** — Dock banks on opposite (north and south) faces.

## Yard zones and counts
- **Perimeter:** ~434m N-S x ~557m E-W ≈ 60 acres.
- **Truck gate:** NE access from the industrial-park road (truckGateCount ~2,
  one per truck court — flagged uncertain).
- **Drop yards:** north and south truck courts, extensive marked trailer
  stalls (~320 capacity estimated).
- **dockDoorCount: ~220** (estimate). **trailersVisible: ~8** (newly
  operational, flagged low-confidence).
- **buildingCount: 1.** **railServed: false.**

## Web findings
- "GXO Super Hub", GDI Construction project; 24/7 operation; GXO hiring 2,000+
  jobs in central Indiana; automated facility (Mechatronics roles).

## Final confidence: medium
Facility identity and the cross-dock super-hub layout are well established.
Gate and guard-booth specifics are inferred from a fully fenced truck yard
because the facility is newly completed (few trailers, no usable ground-level
Street View). Counts are honest overhead estimates.
