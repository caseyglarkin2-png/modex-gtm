# Deep-Audit Dossier — CJ Logistics, Arlington TX (idx 19)

## Facility
- **Name:** CJ Logistics - Arlington TX
- **Type:** Distribution Center
- **Address:** 4001 New York Avenue, Arlington, TX 76015
- **Resolved center:** 32.6806, -97.0794

## Location confirmation
Roster geocode (32.680542, -97.079388, ROOFTOP, moved 231 m) landed on/beside
a large warehouse. Web search confirmed CJ Logistics America operates a
food-grade DC at 4001 New York Ave, Arlington TX (CJ open-space page, Cortera
profile, Waze "DSC Logistics" pin, CJ newsroom story on the Arlington
warehouse's five-year safety milestone). CJ occupies ~50,000 SF of a larger
multi-tenant building. Probed satellite z16-z20 and Street View (2024-2026).

## Site layout
- Single very large rectangular warehouse, oriented N-S, in a dense DFW
  industrial park.
- **South:** Office front and employee car parking; New York Ave beyond.
- **East:** A dock face fronting a wide truck court with trailers
  (orange Hobby Lobby trailers visible — a major co-tenant).
- **West:** A second dock face fronting a truck court along an internal
  park road.
- **North:** Car parking and an internal road; adjacent warehouses.

## Key views
- **z16/z18:** Confirmed large cross-dock warehouse among a cluster of
  Arlington industrial buildings.
- **z19/z20 east court:** Dock doors with trailers backed in; wide truck
  court with parked trailers and tractors (Hobby Lobby branding visible).
- **z19 west court:** A second bank of dock doors with trailers backed in.
- **Street View (2024-2026):** South office face is landscaped and open.
  East and south truck-court driveways are open curb cuts onto internal park
  roads — no barrier arm, no guard booth. Some partial chain-link fencing
  screens portions of the east dock court but does not gate the entrances.

## Gate / guard-shack / dock determinations
- **truckGate: false.** Open multi-tenant industrial park. No site-perimeter
  fence and no checkpoint/barrier at any driveway. Truck courts connect to
  internal park roads via open curb cuts.
- **guardShack: false.** No guard booth on the property.
- **remoteGs: false.** No controlled truck gate at all.
- **shipRcvSeparate: true.** Cross-dock building — distinct dock banks on the
  east face and the west face, each with its own truck court.
- **dockDoors: 50+.** Dock doors along both faces; estimated ~90 total
  (low-confidence overhead count).
- **dropArea: 10-25 / dropYard: true.** Trailers parked in the wide east
  truck court function as a drop yard, separate from the dock apron.

## Yard zones and counts
- **perimeter:** ~356 m x 347 m, ≈30.5 acres.
- **truckGate zone:** open SE driveway curb cut.
- **dropYards:** the east truck court.
- **dockAprons:** east dock-face strip and west dock-face strip.
- **dockDoorCount ~90**, **trailersVisible ~35**, **drop capacity ~40**,
  **buildingCount 1**, **railServed false**.

## Web findings
4001 New York Ave is a CJ Logistics America food-grade DC near the DFW
airport and intermodal yard, offering shuttle / critical-outbound asset-based
services. The facility achieved five consecutive years with no OSHA-related
safety incident (CJ newsroom, July 2024). CJ occupies ~50,000 SF; Hobby Lobby
trailers at the docks indicate a large co-tenant in the multi-tenant building.

## Confidence
**High.** Building identity, cross-dock layout, and open unfenced access are
clearly resolved from recent (2026) imagery. Dock count is an overhead
estimate; because CJ occupies only a portion, CJ-specific dock allocation
cannot be isolated.
