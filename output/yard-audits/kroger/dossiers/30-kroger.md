# Deep-Audit Dossier — Mountain View Foods (Kroger), Denver CO

**Index:** 30 · **Type:** Dairy Plant · **Operator:** Kroger Manufacturing (Mountain View Foods)
**Address:** 10241 E 51st Ave, Denver, CO 80239
**Resolved center:** 39.79360, -104.87290 · **Confidence:** high
**Method:** deep-audit (satellite z16-z20 + Street View 2023-10 + web research)

## Step 0 — Location confirmation
The supplied/geocoded point (39.7903, -104.8738) lands ON E 51st Ave, on the
SOUTH curb between two industrial complexes, not on the building. Satellite
sweep at z16-z18 plus web research resolved the actual plant. Web confirms
Mountain View Foods is a Kroger dairy plant, ~215,000 sq ft on ~12 building
acres, producing milk, flavored milk, half & half, cream, OJ, aseptic dairy
and broth (USDA FSIS-listed; first US dairy plant with robotic case
pack/pick/palletize).

The correct building is the large WHITE refrigerated plant ~280 m NORTH of the
road, identifiable by rooftop refrigeration packs and a cluster of round
storage silos on its north/west faces (dairy signature). It sits at roughly
39.7936, -104.8730. The large TAN distribution center immediately to the EAST
is a SEPARATE facility (own property line, ~1M+ sq ft) and was excluded from
the geofence. Street View north from E 51st Ave confirms a fenced trailer yard
fronting the white plant.

## Key views
- **z17/z18 site overview:** White plant center; internal road runs NW-SE with
  trailer drop rows lining the west and south; retention pond SW of building;
  single entrance driveway to E 51st Ave at the south; tan DC borders the east.
- **z19/z20 building faces:** West face shows ~15 trailers backed into dock
  doors; south face shows ~8-10 backed in. Round silos confirm dairy use.
- **z20 west yard:** Diagonal marked drop-trailer stalls (parked trailers, no
  tractors) — a dedicated drop yard, not active dock staging.

## Gate / guard-shack / dock determinations
- **truckGate = FALSE.** The single truck entrance off E 51st Ave is an OPEN,
  uncontrolled driveway apron. Street View (2023-10, pano
  `l4o8zBK14S9-X3Cj4xC22g`) looking N/NW into the drive shows NO barrier arm,
  NO sliding/swing gate across the lane, and no checkpoint pinch-point. The
  property perimeter is chain-link fenced, but the entrance opening is open.
- **guardShack = FALSE.** No staffed booth at the entrance. A freestanding
  white info/check-in sign panel sits beside the drive, but there is no booth
  structure. Archetype reads as No Gate / No Guard Shack (Jake's `#3` family).
- **remoteGs = FALSE.** No controlled gate exists, so a remote/kiosk gate does
  not apply; the roadside sign is informational.
- **docks:** ~15 doors backed on the WEST face + ~8-10 on the SOUTH face →
  ~25-30 total → band **25-50** (count approximate, flagged). Two distinct dock
  banks on different faces → `shipRcvSeparate = true` (medium confidence).

## Yard zones & counts
- **perimeter:** 7-vertex ring tracing the fenced plant property (E 51st Ave on
  the south, vacant land west, tan DC east, parking/pond north). ~27 acres.
- **truckGate:** rotated quad over the single entrance drive off E 51st Ave.
- **dropYards (3):** west-road drop rows, south-apron drop rows, and an east
  drop strip between plant and DC — each a rotated quad parallel to its rows.
- **dockAprons (2):** long thin quads hugging the west and south dock walls.
- **staging:** null (post-gate yard is open; no discrete pre/post-gate stall
  block traced).
- **yardMetrics:** dockDoorCount ~28, trailersVisible ~130, capacity ~160,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~27, railServed false.

## Street View coverage
Coverage exists only on E 51st Ave (the public road). The plant interior has no
panos (ZERO_RESULTS at building/yard centroids). Both perimeter and truckGate
streetViewMeta therefore reuse the entrance road pano `l4o8zBK14S9-X3Cj4xC22g`
at heading 0 (north) — the exact frame a driver sees on arrival.

## Web findings
- USDA FSIS establishment "Kroger Mountain View Foods," Denver CO.
- ~215,000 sq ft, ~12 building acres; fresh/organic milk, flavored milk, half &
  half, cream, OJ, aseptic dairy, broth; first US dairy plant with fully
  robotic case pack/pick/palletize. Phone 303-375-3900.

## Final confidence: HIGH
Facility positively identified and corrected from the off-road geocode. Gate and
guard-shack calls rest on direct, recent Street View of the actual entrance.
Uncertain: exact dock-door count and presence of a truck scale (flagged).
