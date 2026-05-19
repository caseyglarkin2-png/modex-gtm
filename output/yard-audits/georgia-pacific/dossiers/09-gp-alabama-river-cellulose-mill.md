# Deep-Audit Dossier — GP Alabama River Cellulose Mill, Perdue Hill AL (idx 09)

## Resolved location
- **Locked center:** 31.5800, -87.4830
- **Address:** 2830 Hornady Drive, Monroeville, AL 36460 — at Claiborne in
  Monroe County, on the east bank of the Alabama River, off Highway 84 /
  Lena Landegger Hwy.
- The roster point (31.515011, -87.494842, GEOMETRIC_CENTER) was ~7 km SSW of
  the actual mill, landing in rural farmland/forest near Perdue Hill town.
  Step-0 satellite + web research (the mill is at Claiborne, not Perdue Hill
  proper) located the large pulp mill complex on the river. Confirmed as the
  Alabama River Cellulose mill — operating since 1978, ~1 million tons/yr of
  fluff and market pulp, ~3,000 direct/indirect jobs, subject of GP's $800M
  modernization (2025-2027) to become the largest softwood pulp mill in the US.

## Key views
- **z14/z15 overview** — Large pulp mill on the Alabama River: process/recovery
  buildings, a woodyard, settling-pond complex, landfill, all surrounded by
  forest. Extremely isolated, far from any town.
- **z16/z17 woodyard crops** — Woodyard with log piles; a rail yard with dozens
  of rail cars along the NE edge; structures near the woodyard entrance
  consistent with a truck scale / check area.
- **z19/z20 NE crops** — A very large trailer drop yard: hundreds of semi-
  trailers parked in colorful rows (white roofs / varied side colors),
  confirmed as trailers at z20 by their ~53 ft proportions.
- **z19 rail crops** — Large rail yard with many loaded/empty rail cars.
- **Street View** — None available; the mill is too remote (ZERO_RESULTS within
  400 m on the access road).

## Gate / guard-shack / dock determinations
- **truckGate: TRUE** — A single controlled access road off Highway 84 /
  Lena Landegger Hwy runs through a long forest buffer into the mill; controlled
  industrial entrance.
- **guardShack: TRUE (uncertain)** — Not directly confirmed (no Street View),
  but a 3,000-job pulp mill of this scale operates a staffed gatehouse by
  standard practice.
- **scale: TRUE (uncertain)** — Pulp mills weigh inbound wood loads; structures
  consistent with a scale/check area appear at the woodyard entrance.
- **drivewayLong: TRUE** — Long forest-buffered private access road gives ample
  queue depth.
- **dockDoors: 10-25** — Market-pulp mill ships baled pulp; dock banks on the
  baleline/warehouse building are limited, ~18 estimated (uncertain).
- **dropArea: 50+ / dropYard TRUE** — Hundreds of trailers in a dedicated drop
  yard NE of the process buildings.
- **railServed: TRUE** — Large rail yard with dozens of cars; rail is a primary
  mode for this cellulose mill.
- **connectivityIssue: TRUE (medium confidence)** — Mill is extremely isolated,
  forest on all sides, no nearby town; cellular coverage likely weak.
- **multipleFacilities: TRUE** — Large multi-building campus.

## Yard zones / counts
- Perimeter geofence (~610 acres) covers the developed footprint (process,
  woodyard, trailer yard); excludes outlying landfill/ponds.
- truckGate box near the woodyard access checkpoint.
- dropYards boxed at the large NE trailer yard.
- dockApron box at the baleline/warehouse building.
- yardMetrics: ~18 dock doors, ~220 trailers visible, ~350 capacity, 1 truck
  gate, ~20 buildings, ~610 acres, rail-served.

## Web findings
- Alabama River Cellulose — operating since 1978; one of the largest pulp
  operations in North America; ~1M tons/yr fluff & market pulp; $800M GP
  modernization announced Sept 2025 (Q4 2025-2027) to make it the largest
  US softwood pulp mill; ~3,000 direct/indirect jobs in Monroe County.

## Confidence
**Medium.** Facility positively identified after correcting a ~7 km geocode
error; trailer yard, rail, woodyard and layout clearly visible. No Street View
(too remote), so guardShack and the truck scale are inferred from operational
norms; dock-door count and lane counts are estimates.
