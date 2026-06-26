# Deep-Audit Dossier — idx 50 · Pontiac Foods (Kroger Manufacturing)

**Type:** Grocery Plant
**Address:** 813 Bookman Road, Elgin, SC 29045
**Resolved center:** 34.13200, -80.86060
**Method:** deep-audit (satellite; no usable Street View)
**Confidence:** medium

## Step 0 — Facility confirmation
The supplied coords (34.132161, -80.860521) land on the east edge of a large
white-roofed manufacturing building. Web research confirms Pontiac Foods at 813
Bookman Rd is a **Kroger Manufacturing division** that produces coffee, spice,
rice & beans, and convenience pouch products (gravy/dressing/soup mixes) — a true
food-manufacturing **plant**, consistent with the building footprint. The
white-roofed building on the WEST is Pontiac Foods. A separate, newer, longer
warehouse sits immediately to the EAST across a shared access drive (a distinct
operation, not part of this parcel) — it was excluded from the geofence.

## Key views
- **z16/z17 overview:** Single ~600 ft plant building oriented roughly N-S (tilted
  ~10-15° NNW-SSE), employee parking on the east, drop yard + retention pond at
  the south, open farmland/treeline to the west, residential subdivision to the
  north across a perimeter road.
- **z18-z20 east face:** Dock doors with trailers backed in along the east/SE
  wall; process/tank area at the NE building corner; wide paved dock apron.
- **z19 south end:** Gravel/unpaved **drop yard** holding ~15-18 parked trailers
  (no tractors), bounded by a retention pond.
- **z19 NE corner / perimeter-road junction:** Access driveway connects the lot to
  the E-W perimeter road below the subdivision — **no barrier arm, sliding gate,
  or guard booth** is visible; reads as an open shared driveway.

## Gate / guard / dock determinations
- **truckGate: false** — No visible barrier, swing/sliding gate, or checkpoint
  pinch-point at the access-drive/perimeter-road junction in z19 imagery. Open
  driveway. (Flagged uncertain: no SV coverage to ground-confirm.)
- **guardShack: false** — No small staffed-booth structure beside the entrance.
- **remoteGs: false** — No gate, so no remote check-in inference.
- **postGateStaging: true** — Large paved apron between the east dock face and the
  employee lot offers interior holding before the docks.
- **dockDoors: 25-50** — ~10-14 trailer positions counted on the east face plus
  additional south-end doors on a ~600 ft building; best overhead estimate ~32.
- **dropArea / dropYard: 10-25 / true** — Dedicated SE gravel trailer-storage lot.
- **shipRcvSeparate: false** — Single dock bank on the east/south face.
- **scale / multiStep / multipleFacilities: false** — none observed.
- **urbanRural: Rural** — Edge-of-town Elgin SC outside the Columbia metro;
  adjacent farmland and lake; small-town industrial setting.

## Street View
No usable coverage. Every pano returned by the `sv` probe sits on residential
subdivision streets ~700 m north of the plant (captured 2025-10); none show the
plant access road or the Bookman Rd frontage. `streetViewMeta.hasCoverage` set
to false for both perimeter and truckGate; no pano ids invented.

## Yard zones & counts (from perimeter polygon)
- **perimeter:** 7-vertex oriented ring tracing the parcel inside the
  field/treeline (W), perimeter road (N), shared access drive (E), and drop
  yard/pond (S). ~24.5 acres.
- **truckGate:** quad over the NE access-drive entrance off the perimeter road.
- **dropYards:** one ring over the SE gravel trailer-storage lot.
- **dockAprons:** one long thin quad hugging the east dock wall at building angle.
- **yardMetrics:** dockDoorCount ~32, trailersVisible ~28, capacity ~40,
  truckGateCount 1, buildingCount 1, railServed false.

## Web findings
Pontiac Foods Inc, 813 Bookman Rd, Elgin SC 29045; (803) 699-1600; a Kroger
Manufacturing food-production plant (coffee/spice/rice/pouch products).

## Final confidence: medium
Building identity and layout are unambiguous. Gate/guard calls rest on overhead
imagery only (no Street View of the entrance), so truckGate/guardShack/remoteGs
and the exact dock-door and lane counts are flagged uncertain.
