# Deep-Audit Dossier — Barnes & Noble, Monroe Township NJ DC

**Roster idx:** 1
**Facility:** Barnes & Noble - Monroe Township NJ DC
**Type:** Distribution Center / E-commerce Fulfillment Center
**Address:** 1 Barnes & Noble Way, Monroe Township, NJ 08831
**Resolved center:** 40.35820, -74.46510
**Method:** deep-audit · **Confidence:** medium

## Step 0 — Location confirmation

The roster pin (40.358049, -74.464912, geocoded ROOFTOP) landed directly on the
roof of a very large single-building distribution center in the Docks Corner /
Cranbury-Monroe industrial submarket, alongside the NJ Turnpike and Route 33.
Web search confirmed "Barnes & Noble Distribution, 1 Barnes & Noble Way, Monroe
Township NJ 08831" at this location (Yellowpages, Chamber of Commerce, Waze,
Loc8NearMe). The building footprint derived from the perimeter geofence works
out to ~73.5 acres, matching the dossier's stated 73-acre footprint and ~1.15M
sq ft building — a strong independent corroboration. Location locked at the
building centroid 40.35820, -74.46510.

## Key views

- **Wide z15-z16:** Single massive rectangular DC running roughly E-W. Employee
  parking and a 2-story office front on the NORTH face; loading docks along the
  full SOUTH face. Separate (non-B&N) large warehouses to the NE and SE.
- **North face (z17-z18, Street View):** Office front with a large employee
  parking lot. Access drive enters from the public-road intersection (Docks
  Corner Rd) into the parking field. No gate or booth at the front entrance.
- **South face (z18-z20):** A long continuous bank of loading-dock doors with
  many trailers backed in. Wide paved apron in front. One-way arrow markings on
  the apron show directional truck flow.
- **SW corner (z19-z20):** Dedicated trailer drop yard — rows of trailers
  (orange/blue/white) parked in marked stalls without tractors.
- **SE corner (z18-z20):** Additional trailer parking in marked stalls; a
  fenced utility/electrical equipment yard (transformers, storage containers) —
  NOT a guard or check-in structure.
- **West side (Street View):** Continuous chain-link perimeter fence behind a
  treed buffer; no entrance on this side.
- **East side (Street View):** Internal perimeter loop road runs along the
  building's east face between fence lines — the truck route from the front to
  the south docks.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE (medium confidence).** The property is fully chain-link
  fenced (confirmed via Street View on the west, visible in satellite along the
  south). The dock yard is a secured enclosure; the truck route necessarily
  crosses the fence line, implying a controlled gate. No barrier-arm or
  sliding-gate structure was directly captured — Street View covers only public
  roads and the east perimeter road, not the truck-yard entrance. Inferred from
  the fenced perimeter; flagged uncertain.
- **Guard shack — FALSE.** No staffed booth found anywhere in satellite
  (z18-z21) or Street View. The SE structure cluster is a utility equipment
  yard, not a check-in booth.
- **Remote GS — TRUE.** Gate present without a booth implies kiosk/app
  check-in. Flagged uncertain.
- **Dock doors — 50+.** A continuous bank of loading doors spans the entire
  south face. Dossier states 115 doors; overhead estimate ~110.
- **Drop yard / drop area — TRUE / 25-50.** Dedicated trailer-storage stalls at
  the SW and SE corners, full of dropped trailers, separate from the dock apron.

## Yard zones and counts

- **Perimeter:** ~534 m N-S x ~559 m E-W -> 73.5 acres (matches dossier).
- **Truck gate zone:** NE corner, where the front parking transitions to the
  east perimeter truck route.
- **Drop yards:** two — SW corner and SE south edge.
- **Dock apron:** continuous strip along the south building face.
- **dockDoorCount ~110 · trailersVisible ~55 · trailerParkingCapacity ~90 ·
  truckGateCount 1 · buildingCount 1 · siteAreaAcres 73.5 · railServed false.**
- A rail line runs E-W south of the site but in a separate corridor outside the
  fence with no spur — not rail-served.

## Web findings

Confirmed as Barnes & Noble Distribution (book/magazine distributor, phone
732-656-7200; operating hours roughly 6:00 AM-12:30 AM Sun-Fri, closed Sat).
Listed across Yellowpages, Chamber of Commerce, Waze, Manta. East-coast retail
+ national e-commerce hub per the roster source notes (CenterPoint Properties
property page; ~1.15M sq ft, 73 acres, 115 doors).

## Final confidence

**Medium.** Building identity is certain (address confirmed, footprint area
matches the 73-acre dossier figure). Dock and drop-yard reads are clear. The
gate verdict relies on inference from the fenced perimeter because no gate
structure could be directly imaged — Street View does not cover the internal
truck route. truckGate, remoteGs, entryLanes, exitLanes and postGateStaging are
flagged uncertain.
