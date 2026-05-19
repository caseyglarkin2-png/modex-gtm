# Deep-Audit Dossier — Constellation Beer DC, Jacksonville FL (idx 03)

## Facility
- **Name:** Constellation Beer DC - Jacksonville FL
- **Type:** Distribution Center (beer, rail-served)
- **Address:** 600 Whittaker Road, Imeson Industrial Park, Jacksonville, FL 32218
- **Roster source:** Jacksonville Daily Record 2022 — 469,830 sq ft warehouse on 24 acres,
  ~1.5 mi east of I-95; first Constellation DC in North Florida; receives beer by rail,
  distributes by truck; 54 docks plus trailer yard and guard house.

## Step 0 — Location confirmation
The roster geocode (30.423756, -81.632383, ROOFTOP, moved 204 m) landed directly on the
correct building. Web research confirms the facility:

- Jacksonville Daily Record (Feb 2022): Constellation Brands leased the 469,830 SF
  warehouse at 600 Whittaker Road in Imeson Industrial Park — first North Florida DC,
  24 acres, ~1.5 mi east of I-95, 32-ft clear, 54 docks, trailer parking, direct rail
  access, secured with a guard house.
- CBRE / REBusinessOnline / Commercial Property Executive corroborate the 469,800 SF
  building, 600 Whittaker Rd, with the same spec sheet.

**Locked center:** 30.42385, -81.63238 (building centroid).

## Key views
- **z16/z17 overview:** A single large warehouse oriented N–S, sitting in the built-out
  Imeson Industrial Park surrounded by comparable distribution warehouses. Office front
  on the N face (Whittaker Rd); truck court on the E side; rail spur and rail-side docks
  on the W side.
- **z18/z19 W side:** A rail spur runs N–S directly alongside the W face; the W dock
  face is configured for rail-side unloading — confirms "direct rail access."
- **z18/z19 E side:** A wide concrete truck court runs along the E face with dock doors,
  car parking near the building, and trailers parked on the court.
- **z19/z21 NE entrance:** The truck court entrance off Whittaker Rd has a landscaped
  median island carrying a **guard booth** with **gate arms** across the lane; a vehicle
  is stopped at the checkpoint in the imagery.
- **Street View (2025-02):** Ground-level view of the truck entrance confirms a small
  white guard booth, gate arm(s) across the truck lane, and a vehicle queued at the
  booth. The N face shows the office/glass-entrance front along Whittaker Rd.

## Gate / guard-shack / dock determinations
- **truckGate:** TRUE — controlled, gated truck entrance at the NE corner off Whittaker
  Rd, with gate arms across the lane (z21 satellite + Street View).
- **guardShack:** TRUE — a staffed guard booth sits on the entrance island beside the
  truck lane (z21 satellite + Street View); roster explicitly cites a "guard house."
- **remoteGs:** FALSE — the gate is staffed by a guard booth, not a remote kiosk.
- **dockDoors:** "50+" — roster cites 54 docks; dock rhythm visible on both E and W
  faces is consistent.
- **shipRcvSeparate:** TRUE — true cross-dock: rail-side receiving on the W face,
  truck-side shipping on the E face — two dock banks on separate building faces.

## Yard zones & counts
- **perimeter:** ~390 m × ~307 m box around the building, truck court and rail apron —
  ~25 acres, consistent with the roster's 24 acres.
- **truckGate zone:** NE-corner gated/guarded entrance off Whittaker Rd.
- **dropYards:** One — the E-side truck court doubles as a trailer drop/parking yard.
- **dockAprons:** Two — the E truck apron and the W rail-side dock apron.
- **staging:** Left null — no distinct pre-gate staging area; queuing occurs inside the
  gate on the truck court (postGateStaging = true).
- **yardMetrics:** dockDoorCount 54, trailersVisible ~12, trailerParkingCapacity ~60,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~25, railServed true.

## Web findings
- Jacksonville Daily Record, CBRE, and REBusinessOnline all corroborate the building,
  address, square footage, 54 docks, trailer yard, rail access, and guard house. This is
  Constellation's first North Florida DC; beer arrives by rail and is distributed by
  truck.

## Final confidence
**HIGH.** Building identity is certain (ROOFTOP geocode + multiple corroborating
sources). The gate, guard shack, cross-dock layout, and rail access are all directly
confirmed in current satellite and 2025-02 Street View imagery. Only minor counts
(trailers visible, exact entry/exit lane count) are approximate.

## 3-line summary
- Gate verdict: TRUE — controlled, gated truck entrance with gate arms off Whittaker Rd.
- Guard-shack verdict: TRUE — staffed guard booth on the entrance island (confirmed in
  satellite + Street View; roster cites a guard house).
- Confidence: HIGH.
