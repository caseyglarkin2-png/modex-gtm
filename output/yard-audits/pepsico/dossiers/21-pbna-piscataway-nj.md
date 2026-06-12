# PBNA - Piscataway NJ — Deep-Audit Dossier

**Facility:** Pepsi-Cola Metropolitan Bottling Co (PBNA), 2200 New Brunswick Ave, Piscataway NJ 08854
**Locked center:** 40.57735, -74.44230 (main building rooftop; roster GEOMETRIC_CENTER point was on-property)
**Audited:** 2026-06-12 · method: deep-audit (satellite z17-z20 + Street View 2025-09/10)

## Location confirmation
Roster point landed on a ~37-acre single-tenant campus: a very large solar-paneled
production/warehouse building, a north fleet building, an SE office annex, trailer
yards west and south, and big car lots east. The black perimeter fence, monument-sign
entrance, and route-fleet vans match the known PBNA company-owned NJ production site.
No competing candidate nearby. Identity confirmed (high).

## Entrance / gate / guard shack
- **North drive** (New Brunswick Ave, ~40.5789, -74.4431): open landscaped driveway
  into fleet/employee parking — no barrier, no booth (Street View 2025-09 + z20).
- **East drive** (~40.5772, -74.4394): monument-sign car entrance into the east lots —
  no barrier visible.
- The perimeter is fenced (black metal fence along the east road), so control may
  exist at an interior fence line that overhead/SV cannot resolve. Verdict as visible:
  `truckGate: false`, `guardShack: false`, `remoteGs: false` — **flagged uncertain**,
  the main reason this site is `confidence: medium`.

## Docks and yard
- **South-face dock bank**: long bank with trucks backed in (~25-35 doors).
- **North-face bank**: ~15-20 positions along the drive between the main building and
  the north pad. Two separate clusters → `shipRcvSeparate: true` (inferred).
  Total est. ~45 doors → band **25-50**.
- **Drop yards**: west trailer yard (~25 trailers in rows) and a long south trailer
  row (~25), plus trailers along the north pad (some under solar-carport-like
  canopies — excluded from rings due to ambiguity). ~85 trailers visible, capacity
  ~120 → `dropArea: 50+`, `dropYard: true`.
- Long internal drives, generous paved width → `drivewayLong: true`,
  `fastLaneOpportunity: true`, `backupSensitive: false`.

## Geofences
- **Perimeter**: 8-vertex ring (~37.6 acres) following the New Brunswick Ave curve
  (north), the public road fence line (east), the yard fence above the mowed field
  (south), and the brush line (west).
- Truck-gate quad on the north drive throat (the truck-capable entrance); two
  drop-yard rings (west yard, south row); two dock-apron strips (south face, north
  face), each parallel to its dock wall.
- Street View: pano `_0qpR6tiaid3We13FlWJZg` on New Brunswick Ave covers both the
  perimeter (heading 169) and the north entrance (heading 159). No pano coverage for
  the interior drop yards / dock aprons.

## Web corroboration
D&B lists Pepsi-Cola Metropolitan Bottling Co at this address (roster source);
company-owned NJ production site. The scale (37 acres, solar roof, fleet of route
trucks) matches a metro production + distribution plant.

## Verdict
Open-entrance verdict (no visible gate or guard shack at either curb cut) on a large
fenced campus — flagged: an interior checkpoint may exist beyond Street View reach.
Heavy drop-yard operation. **Confidence: medium** (gate call is the soft spot).
