# Deep-Audit Dossier — 7-Eleven Fresh Food Production & Distribution, Eden Prairie MN (E.A. Sween)

- **Idx:** 11
- **Facility type:** Fresh Food Commissary (production + distribution)
- **Operator:** E.A. Sween Company (Deli Express / Market Sandwich / San Luis Burritos / Simply Delicious Bakery) — 7-Eleven fresh-food supplier and CDC partner
- **Address:** 16101 W 78th St, Eden Prairie, MN 55344
- **Resolved center:** 44.86065, -93.4823
- **Confidence:** High

## Location confirmation (Step 0)

The supplied city-level coordinates (44.860781, -93.481294) landed in the correct
industrial pocket but on the public road, not the building. I probed satellite
z16-z20 across the block and walked Street View along the facility frontage.

- The site is bounded on the **north** by US-212 / Flying Cloud Drive (a divided
  expressway with no direct facility access) and is served by the **W 78th St
  frontage/connector road** that meets US-212 at a signalized intersection on the
  northeast (a "No Outlet / No Pedestrian" sign confirms the frontage road dead-ends
  into this industrial cluster).
- Street View on the east frontage road (pano 44.86103, -93.48028, captured 2025-04)
  shows the **brick E.A. Sween building with company signage, a US flag, and employee
  parking** — positively identifying the operator.
- Web research (easween.com, BBB, Yelp, FMCSA USDOT 188852) confirms E.A. Sween's
  manufacturing + distribution HQ at 16101 W 78th St, supplying ready-to-eat
  sandwiches/burritos to convenience stores (7-Eleven) nationwide.
- The buildings immediately **south** ("K.R. Stokes," 1742 Front St, per a Street View
  yard sign) and the blue-roofed buildings to the southeast are **separate tenants**
  and were excluded from the geofence.

The audited footprint is the E.A. Sween campus: the east brick production/distribution
building, a connected/adjacent warehouse section, and a west secondary warehouse
(red overhead dock door) fronting the trailer drop yard, plus the central truck-side
parking/staging.

## Key views

- **Satellite z18-z20 overview:** Multi-building campus. East brick building has dock
  doors and box trucks/trailers backed in on the road-facing wall; the central paved
  area mixes employee parking with rows of staged/parked trailers; the west building
  (red door) anchors a trailer drop yard along the highway tree line.
- **Street View — east dock face (heading ~259-280°, 2025-04):** Decisive frame. Box
  trucks and a white van backed straight into a brick dock bank from an **open
  street-side apron**. No barrier arm, no gate, no booth. A second open driveway a few
  meters south feeds the same dock area.
- **Street View — office front (heading ~250°):** Open campus, bus shelter at the curb,
  employee lot, no controlled entry.
- **Street View — intersection (heading ~200°):** Signalized junction of the frontage
  road and US-212; "No Outlet" confirms the road serves only this cluster.

## Gate / guard-shack / dock determinations

- **Truck gate: FALSE.** Both truck access points (east dock entrance and west yard/dock
  access) open directly off the public frontage road with no barrier arm, no
  sliding/swing gate, and no checkpoint pinch-point. Drivers back to docks straight
  from the street-side apron.
- **Guard shack: FALSE.** No staffed booth at any entrance. The only small road-side
  structure is a passenger **bus shelter** at the office front — not a guard booth.
- **Remote GS: FALSE.** There is no gate at all, so there is no remote/kiosk-controlled
  gate.
- **Docks: 25-50 band.** ~8-10 doors on the east road-facing brick dock bank, ~4-6 at
  the west secondary warehouse (red overhead door), and ~10-15 more along the
  production building's west/north faces with trailers backed in. ~30 total is an
  honest overhead estimate (flagged uncertain).
- **Ship/receive separate: TRUE.** Two distinct dock clusters on different building
  faces/buildings (east production dock bank vs. west warehouse dock).

## Yard zones & counts

- **Perimeter:** ~13.7 acres, oriented polygon traced inside the tree/curb line from
  the NW trailer yard, east along the US-212 tree line, down the frontage road, around
  the south production building, and back west across the drop yard.
- **truckGate:** thin quad over the open east dock entrance off the frontage road
  (aligned to the entrance drive).
- **dropYards (2):** central trailer-staging rows + NW trailer rows along the highway,
  both aligned to the trailer rows.
- **dockAprons (2):** long thin quads hugging the east production dock wall and the west
  warehouse dock wall, each at the building's true angle.
- **staging:** paved holding apron inside the east dock entrance (postGateStaging).
- **yardMetrics:** dockDoorCount ~30; trailersVisible ~30; trailerParkingCapacity ~55;
  truckGateCount 2 (both open); buildingCount 3; siteAreaAcres 13.7; railServed false
  (no spur enters the property).

## Web findings

- E.A. Sween Company, family-owned since 1955; flagship Deli Express is the largest
  convenience-store sandwich brand; Eden Prairie is the production + distribution HQ
  supplying 7-Eleven and other c-stores, military commissaries, and institutional
  customers (easween.com, deliexpress.com, BBB profile).
- Operates its own private fleet (FMCSA SAFER / USDOT 188852), consistent with the
  on-site tractor and trailer activity observed.

## Final confidence

**High.** Operator and building positively confirmed via signage in Street View plus
web corroboration; gate/guard-shack/dock calls rest on clear 2025 Street View of the
open dock faces. Dock-door and trailer counts are honest overhead estimates and are
flagged in `uncertainFields`.

### 3-line summary
- **Gate:** FALSE — open dock entrances off the public frontage road, no barrier/gate/checkpoint.
- **Guard shack:** FALSE — no booth (only a bus shelter at the office front).
- **Confidence:** High.
