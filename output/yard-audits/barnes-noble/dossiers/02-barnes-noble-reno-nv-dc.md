# Deep-Audit Dossier — Barnes & Noble, Reno NV DC

**Roster idx:** 2
**Facility:** Barnes & Noble - Reno NV DC
**Type:** Distribution Center / West-Coast Replenishment Center
**Address:** 12660 Old Virginia Rd, Reno, NV 89521
**Resolved center:** 39.41870, -119.75050
**Method:** deep-audit · **Confidence:** high

## Step 0 — Location confirmation

The roster pin (39.418826, -119.750481, geocoded ROOFTOP) landed directly on a
large white-roofed distribution warehouse in the Damonte Ranch industrial park
in south Reno, alongside Interstate 580 / US-395. Web search confirmed "Barnes
& Noble Distribution Center, 12660 Old Virginia Rd, Reno NV 89521" at this
location — the West Coast replenishment / e-commerce hub (Panjiva buyer report,
Reno-Sparks Chamber of Commerce, Barnes & Noble Reno Distribution Center
Facebook page; lease renewed Nov 2025 per the roster source). Single ~601K sq
ft building. Location locked at the building centroid 39.41870, -119.75050.

## Key views

- **Wide z15-z16:** Single large rectangular DC in a cluster of warehouses
  along I-580. Apartment complexes immediately to the north; other (separate)
  warehouses to the SW and SE.
- **North / west faces (z18):** Employee parking and an access road; no docks
  on these faces.
- **South face (z18-z20):** The loading-dock face — a continuous bank of dock
  doors with ~20+ trailers backed in. A dock apron and a row of trailer parking
  sit south of the doors; employee parking with solar carport canopies beyond.
- **Entrance driveway (Street View 2015 / 2022 / 2025):** The site's vehicle
  entrance off the public road. The 2022 and 2025 panos clearly show a
  yellow-and-white striped BARRIER ARM across the driveway lane with yellow
  protective bollards and a STOP sign. The 2015 pano shows the same driveway
  with NO arm — the gate was added after 2015.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE (high confidence).** Street View directly shows a
  barrier-arm gate across the entrance driveway lane (yellow/white striped arm,
  flanking bollards, STOP sign). Confirmed in both the 2022 and 2025 panos.
- **Guard shack — FALSE.** No staffed booth at the entrance in any pano
  (2015/2022/2025) or in satellite imagery. The barrier arm stands alone.
- **Remote GS — TRUE.** A barrier-arm truck gate with no guard booth indicates
  badge/card or remote/app check-in.
- **Dock doors — 25-50.** Continuous bank of loading doors along the south
  face; ~20+ trailers visible backed in. Roof glare prevents an exact count;
  estimated ~38 doors. Flagged uncertain.
- **Drop area — 10-25.** A row of trailer parking south of the dock apron holds
  dropped trailers. Not a large dedicated drop lot, so the dropYard flag is left
  false.

## Yard zones and counts

- **Perimeter:** ~467 m N-S x ~335 m E-W -> ~38.5 acres (includes building,
  dock apron, trailer parking and solar-canopy employee parking).
- **Truck gate zone:** the entrance driveway off the public road on the south
  side, where the barrier arm sits.
- **Drop yard:** trailer-parking row south of the dock apron.
- **Dock apron:** continuous strip along the south building face.
- **Staging:** long paved driveway approach between the public road and the
  barrier arm (pre-gate waiting room).
- **dockDoorCount ~38 · trailersVisible ~22 · trailerParkingCapacity ~35 ·
  truckGateCount 1 · buildingCount 1 · siteAreaAcres 38.5 · railServed false.**

## Web findings

Confirmed as Barnes & Noble's Reno Distribution Center — services West Coast
stores and online orders. Open Mon-Fri 7:30 AM-4:00 PM, closed weekends; phone
775-327-6500. Damonte Ranch facility off Damonte Ranch Parkway along I-580;
~601K sq ft; lease renewed November 2025 (DCG / Northern Nevada Business Weekly).

## Final confidence

**High.** Building identity is certain (address confirmed by multiple sources,
location matches Damonte Ranch). The truck gate is directly confirmed by Street
View imagery — a barrier-arm gate with no guard booth. Dock-door count is the
main soft spot (roof glare); dockDoors, dropArea and entry/exit lane counts are
flagged uncertain, but the gate, guard-shack and overall layout reads are
solid.
