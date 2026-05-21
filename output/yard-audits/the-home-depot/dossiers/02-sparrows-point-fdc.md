# Deep-Audit Dossier — Home Depot FDC, Sparrows Point MD (idx 2)

**Facility:** Home Depot Flatbed Distribution Center (DC #5830) — Baltimore-region FDC
**Roster address:** 6311 Trade Point Ave, Sparrows Point, MD 21219
**Roster coords:** 39.222006, -76.482682 (geocoding-api, ROOFTOP, movedMeters 1439)
**Resolved coords:** 39.22255, -76.48420
**Final confidence:** MEDIUM

---

## Step 0 — Location resolution

The roster geocode landed inside the Tradepoint Atlantic industrial megasite
(the redeveloped former Bethlehem Steel Sparrows Point mill) but ~1.4 km off the
actual building — the campus is huge and densely built with very large
warehouses (HD, Amazon, Under Armour, FedEx and others all occupy it).

HD press releases (Aug 2021) confirm HD completed a **3-building, ~1.5 million
sq ft campus at 6311 Tradepoint Ave**: an appliance facility, a **flatbed
delivery center (the FDC)**, and an online-fulfillment building, creating ~500
jobs. Roster idx 2 is specifically the FDC.

I identified the FDC as the long (~520 m), narrow, NE-SW-oriented warehouse
centered at ≈39.2225, -76.4842, distinguished by:
- A **large rooftop solar PV array** covering roughly half the roof.
- An **open-air bulk-material yard** along its NW side — rows of stacked
  lumber, blocks, pallets and oversized goods, the operational signature of a
  flatbed building handling drywall / lumber / roofing / concrete.

The two plain-roofed warehouses immediately NE and SE are the other HD campus
buildings (appliance / online) or adjacent Tradepoint tenants.

## Key views

- **z16-z17 satellite:** the solar-roofed FDC building with dock aprons and
  trailers backed in along both long faces; bulk-material storage rows to the NW.
- **z19 satellite of the truck-side:** dense trailer parking and stacked bulk
  materials, an apron full of trailers and staged loads on the building's NW
  side — heavy flatbed/bulk operation.
- **Street View (Tradepoint Ave / rail corridor, 2023):** the access road NW of
  the building runs alongside an **active rail line** with loaded rail cars and
  staged trucks — the site is rail-served and trucks queue/stage on this road.
- **z18 south-end satellite:** employee parking and an access-road loop at the
  building's south end; the truck gate sits on the SW approach.

## Gate / guard-shack determination

- **truckGate: true** — high confidence. This is a purpose-built 2021 enterprise
  HD FDC inside a controlled industrial campus; the truck approach pinches into
  a controlled entrance on the SW corner with a deep paved apron.
- **guardShack: true** — inferred from the HD-DC norm of staffed gate check-in;
  a discrete 1-3-vehicle booth structure could not be isolated unambiguously in
  the imagery, so it is listed in `uncertainFields`. `remoteGs` set false on the
  guardShack-present assumption.
- **preGateStaging / postGateStaging: true** — the rail-corridor access road
  provides outside-the-gate truck staging; the wide internal apron gives
  inside-the-gate holding before the docks.
- **drivewayLong: true** — deep approach, room for a 3+ truck queue.

## Yard zones and counts

- **Perimeter:** ~64 acres enclosing the FDC building, its bulk yard, dock
  aprons and trailer parking.
- **dockDoorCount ~70** across both long building faces (estimate — solar-array
  shading and trailer clutter obscure an exact count; listed uncertain).
- **trailersVisible ~110; trailerParkingCapacity ~240** — extensive drop yard.
- **dropArea: 50+** — large dedicated trailer/bulk drop yard on the NW side.
- **buildingCount 1; railServed true.**

## Web findings

- HD's Baltimore-region supply-chain expansion (2019 deal with Tradepoint
  Atlantic; campus completed Aug 2021) — the flatbed delivery center handles
  oversized/bulk products (lumber, concrete, insulation) direct to DIYers and
  Pro jobsites.
- A 2023 fire was reported at an HD warehouse at Tradepoint Atlantic (separate
  building) — confirms the multi-building HD presence on the site.

## Final confidence: MEDIUM

Building positively identified as the HD FDC via the solar roof + bulk-yard
signature and corroborating press. Gate is confidently present; guard-booth
structure and exact dock-door count are estimates, hence medium overall.
