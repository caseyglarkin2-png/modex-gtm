# Yard Dossier — Costco Wet Depot #265, Monroe Township NJ

- **Facility:** Costco Wet Depot #265 (refrigerated cross-dock)
- **Address:** 12 Costco Dr, Monroe Township, NJ 08831
- **Resolved center:** 40.35808, -74.46500
- **Maps (satellite):** https://www.google.com/maps/@40.35808,-74.46500,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite + Street View)
- **Confidence:** high

## Location confirmation

The supplied roster coords (40.356226, -74.462509) land on the **SE face of the
large light-gray-roof warehouse** at 12 Costco Dr. Two adjacent Costco depots
share this industrial park off the NJ Turnpike:

- **10 Costco Dr — Dry Depot #175:** the very large building to the north, with a
  rooftop **solar array** and dock doors on its south face.
- **12 Costco Dr — Wet Depot #265 (this audit):** the light-gray rectangular
  building south of the dry depot.

The decisive tell is a **bank of refrigeration condenser units** mounted on the
wet depot's south wall at its SE corner (visible at z19-z20), the signature of a
refrigerated cross-dock. Web sources confirm the address split (Dry #175 = 10,
Wet #265 = 12). Only the wet building and its yard were audited.

## What the key views showed

- **Wide (z16):** isolated, single rectangular building rotated only slightly
  off north; long axis runs roughly E-W. Employee parking on the north side,
  truck yard and dock apron on the south, open buffer land west, access road
  east. Golf course and woods immediately south.
- **South face (z20):** a continuous loading-dock bank runs nearly the full
  ~340 m south wall with regular dock-leveler rhythm and trailers backed in. A
  paved truck lane with directional arrows fronts the apron.
- **SW corner (z19):** dock apron plus a dedicated **trailer drop block** with
  rows of orange/white/dark trailers parked without tractors.
- **East road (z20):** a small ~1-vehicle **white booth** sits beside the truck
  perimeter road at ~40.35708, -74.46199, next to a striped speed table and
  crosswalk — the truck check-in / guard pinch-point.
- **North entrance (Street View, 2025-06):** the building with a monument sign
  and an open car-entrance driveway off Costco Dr; no guard control on the
  employee side (control is on the truck side).

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** Costco depots are appointment-only, guarded truck
  operations; driver reviews specifically praise this site's check-in/out as
  among the best on the East Coast. Overhead imagery shows a controlled truck
  pinch-point (booth + hatched pavement + crossing) on the east perimeter road.
- **Guard shack — TRUE (medium confidence).** A small booth with a
  ~1-vehicle footprint sits at that pinch-point. Staffed-vs-kiosk cannot be
  fully resolved from overhead, so `guardShack` is flagged uncertain; `remoteGs`
  is false because a physical booth is present.
- **Dock doors — 50+ (~85 est.).** Long continuous south-face dock bank.
- **Drop area — 25-50.** Marked tractor-less trailer rows on the SW apron;
  `dropYard` = true.
- **Post-gate staging — true:** paved truck road / apron between the gate pinch
  and the dock doors gives queue room (driveway reads long, 3+ trucks).
- **Ship/Rcv separate — false:** a single south dock bank.
- **Fast-lane opportunity — true:** wide paved truck road/apron with spare width.

## Yard zones & counts

- **Perimeter:** ~60 acres (traced polygon: building + south truck yard + drop
  block + north employee lot + buffer land).
- **Drop yard:** one block along the SW apron.
- **Dock apron:** long thin quad hugging the south wall at the building angle.
- **Truck gate:** small quad over the east-road booth pinch-point.
- **dockDoorCount ~85, trailersVisible ~42, trailerParkingCapacity ~110,
  truckGateCount 1, buildingCount 1, railServed false.**

## Web findings

- Costco Wet Depot #265, 12 Costco Dr, Monroe Twp NJ 08831; phone
  (732) 992-2070; hours Mon-Sat ~05:00-14:30, closed Sun; appointment / live
  load-unload; secured paved truck parking. Reviews highlight an excellent,
  fast check-in/out system — consistent with a guarded gate.
- Address split corroborated: Dry Depot #175 at 10 Costco Dr; Wet Depot #265 at
  12 Costco Dr.

## Street View

- Public Street View covers only the internal car road (Costco Dr north
  entrance) and the east blank-wall road; the private south truck road has no
  coverage. The **north entrance pano `OQa6dk03-14O3aB-N4SE2Q` (2025-06)** is
  used for the perimeter view (heading 190°, toward the building). No pano
  confirms the truck gate/booth, so the truckGate Street View is marked
  `hasCoverage: false`.

## Final confidence

**High.** Facility unambiguously identified (reefer-condenser tell + address
research); docks, drop yard, perimeter, and the truck-gate pinch-point are all
read directly from imagery. The only soft calls are guard-booth staffing,
exit-lane count, and exact staging extent, all flagged in `uncertainFields`.
