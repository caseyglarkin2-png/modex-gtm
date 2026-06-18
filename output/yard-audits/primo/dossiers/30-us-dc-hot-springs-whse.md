# Site 30 — US DC Hot Springs (WHSE)

**Type:** DC / Warehouse
**Operator:** Mountain Valley Spring Water / BlueTriton (Primo Brands)
**Resolved location:** 121 Technology Pl, Hot Springs National Park, AR 71913
**Locked center:** 34.51570, -93.12380
**Confidence:** High

## How the site was resolved
The supplied coordinates (34.5037, -93.0552) sat in dense downtown Hot Springs along
Central Ave — z17 satellite showed only small commercial/retail blocks, no warehouse
with docks. That matches the known Mountain Valley HQ/visitor center area (150 Central
Ave), which is an office/retail building, not the DC.

Web research surfaced a distinct "Mountain Valley Warehouse" at **121 Technology Pl,
Hot Springs National Park, AR 71913** (Wanderlog place 16690230; TruckMap; LoopNet
parcel APN 200-44950-012-000; driver reviews complaining about loading appointments and
wait times). Google geocoded that address to a ROOFTOP point at 34.5157, -93.1243,
which lands on the central two-building warehouse complex of the Hot Springs industrial
park, ~5 km WNW of downtown. This is a separate building from both:
- idx-29 legacy bottling plant (283 Mountain Valley Water Pl, Hot Springs Village), and
- idx-31 new ~200k sqft Primo factory.

A related "Trooper Warehouse" (106 Trooper Dr) exists nearby but the 121 Technology Pl
complex is the truck DC with the active dock activity, so that was locked.

## What the key views showed
- **z17/z18/z19 satellite:** A campus of two large warehouse buildings — a central/eastern
  building carrying the main dock bank and an L-shaped western building — set in an
  industrial park ringed by woods. Other buildings in the park are separate tenants.
- **z20/z21 dock crop (NW face of the main building):** A continuous dock apron with ~7-9
  tractor-trailers (orange tractors, white box trailers) backed in over a bank of ~12-16
  doors. Clear active loading dock.
- **Street View — pano bEbZKAxSNWYBe7cHw9S9cg (2023-11), on the access road N of the building:**
  An OPEN access road running straight to the dock apron and yard. No barrier arm, no
  sliding/swing gate, no checkpoint pinch-point. Only a one-way "Do Not Enter" road sign on
  a median post; a portable toilet and dumpster beside the lane. No guard booth.
- **Street View — 2025-08 pano (further E):** Confirmed the broader park; chain-link fencing
  appears only around a separate adjacent vehicle/equipment lot (FedEx/box trucks), not the
  Mountain Valley dock approach.

## Gate / guard-shack / dock determinations
- **truckGate: FALSE** — open, ungated industrial access road (Street View, 2 vintages, high confidence).
- **guardShack: FALSE** — no booth-sized multi-window structure anywhere at the entrance.
- **remoteGs: FALSE** — no gate at all, so no remote/kiosk check-in implied.
- **dockDoors: 10-25** — main building NW dock bank ~12-16 doors + a few more across the
  west building/north wing; honest total ~18. Banding is the main uncertainty (near the
  10-25/25-50 line).

## Yard zones and counts
- **Perimeter:** 8-vertex oriented ring tracing the two-building complex + aprons, rotated
  parallel to the structures (buildings run NW-SE; dock face runs NE-SW). ~11.3 acres.
- **Dock apron:** thin oriented quad hugging the NW dock wall of the main building.
- **Truck gate zone:** the open access pinch where the road enters the yard (no physical gate).
- **dropYards:** none traced — trailers present are tractor-attached at the docks, no
  dedicated bobtail storage lot.
- **yardMetrics:** dockDoorCount ~18, trailersVisible ~9, trailerParkingCapacity ~30,
  truckGateCount 1, buildingCount 2, siteAreaAcres 11.3, railServed false.

## Web findings
Mountain Valley/Primo runs distribution out of Hot Springs; driver reviews of the
121 Technology Pl warehouse describe appointment-based loading with occasional long waits
and last-minute warehouse/appointment changes — consistent with a manually coordinated,
ungated DC (a YardFlow fit: open gate, appointment friction, no check-in control).

## Final confidence: High
Location positively identified (ROOFTOP geocode + multiple sources + matching satellite +
Street View). Gate/guard-shack calls are high confidence from ground-level imagery. Dock-door
band, drop-area band, ship/receive separation, and trailer capacity are the softer estimates
(listed in uncertainFields).
