# Yard Audit Dossier — Costco Depot, Tracy CA (Depot 179)

- **Facility:** Costco Depot, Tracy CA — Dry Depot (NorCal regional cross-dock)
- **Address:** 25862 S Schulte Ct, Tracy, CA 95377
- **Resolved center:** 37.716976, -121.522634 (roster coords confirmed accurate)
- **Maps:** https://www.google.com/maps/@37.716976,-121.522634,400m/data=!3m1!1e3
- **Confidence:** high
- **Method:** deep satellite audit (z15–z20) + Street View + web research

## Location confirmation (Step 0)
Roster coordinates landed directly on the central truck spine of a large
distribution campus. Web research confirmed 25862 S Schulte Ct, Tracy CA 95377
as **Costco Depot 179** (Panjiva buyer reports, Costco/CEQA records). CEQA filings
("Tracy Costco Depot Project" / "Annex") describe a multi-building program: the
main depot, an annex for high-turnover merchandise / pallet repair / return-to-
vendor, and an e-commerce DDC for large/bulky items — matching the 3+ large
buildings seen in imagery. No coordinate correction was needed; the supplied
lat/lng sits at the heart of the facility.

## What the key views showed
- **z15/z16 wide:** Edge-of-town Tracy industrial park. Costco campus is the
  dominant cluster. Farmland to the south and east; the California Aqueduct /
  Delta-Mendota canal runs NW–SE along the SW boundary. Clearly a rural fringe
  setting despite the dense industrial park immediately north.
- **z17/z18 mid:** Three large buildings — an angled cross-dock depot (NW), a
  giant DC warehouse (center-east), and an annex/DDC building (south). A central
  N–S truck drive separates the depot from the DC, lined with trailers backed
  into the DC's west dock face. Employee parking on the west side.
- **z19/z20 central checkpoint (roster coords):** A large flat **canopy** spans
  the truck lanes with a small **guard booth** (~1-vehicle footprint) beside it,
  E–W lane markings with directional arrows, and trucks queued at the checkpoint.
  This is the primary guarded gate.
- **z18/z20 dock face:** DC west face shows a continuous line of dock doors with
  tractors/trailers backed in (50+ band). Cross-dock depot building adds a long
  additional door bank.
- **z18 SW drop yard:** Large canal-side trailer yard, rows aligned NW–SE
  parallel to the canal.
- **z18 east edge:** A very large multi-row trailer drop yard — hundreds of
  parked trailers — bounded by the DC building.
- **z17 SE:** A second smaller guard/gate structure controls access to the east
  drop yards (a separate checkpoint stage), plus the annex/DDC building.

## Street View
Public-road coverage is limited to the **S Schulte Ct cul-de-sac frontage**
pano `wXQePY-JhcdhnUjTG8rQKw` (captured 2019-03, at 37.72021, -121.52258).
- Heading 180/135 from there shows the depot's green-and-white **office front**
  across the road — an open frontage, no barrier arm at the public edge (the
  truck control is the internal canopy checkpoint, not the street line).
- The internal guarded checkpoint returns **ZERO_RESULTS** for Street View
  metadata (private drive, no coverage). A 2024 pano exists across the canal to
  the SW (37.7147, -121.5278) but is too far to show the gate.
- `streetViewMeta.perimeter` -> this frontage pano, heading **170°** (bearing
  from pano toward the campus centroid). `streetViewMeta.truckGate` ->
  `hasCoverage: false` (no pano resolves at the internal gate).

## Gate / guard-shack / dock determinations
- **truckGate = true.** Central canopy checkpoint on the truck spine with lane
  markings and directional arrows; a second checkpoint serves the east yards.
- **guardShack = true.** Small windowed booth beside the canopy lanes
  (~1-vehicle footprint), plus a second guard structure at the SE checkpoint.
  `remoteGs = false` (booth is staffed).
- **multiStep = true.** Two checkpoint stages — primary canopy gate, then the
  separate SE gate into the east trailer yards.
- **dockDoors = "50+".** DC west face plus cross-dock depot bank; estimated
  ~140 doors total across faces (approximate, flagged).
- **shipRcvSeparate = true.** Distinct dock banks on different building faces
  and separate east drop yards.

## Yard zones and counts (geofenced)
- **perimeter:** 6-vertex oriented ring tracing the whole ~120.5-acre campus,
  following the north road, the east drop-yard edge, the south annex line, and
  the NW–SE canal on the SW.
- **truckGate:** rotated quad over the central canopy checkpoint, aligned to the
  E–W lanes.
- **dropYards:** (1) SW canal-side yard (NW–SE aligned), (2) large east
  multi-row yard, (3) north laydown yard.
- **dockAprons:** (1) DC west-face apron (long thin N–S quad), (2) cross-dock
  depot apron (angled to the building).
- **staging:** post-gate holding area just inside the central checkpoint.
- **yardMetrics:** dockDoorCount ~140, trailersVisible ~600, capacity ~800,
  truckGateCount 2, buildingCount 3, siteAreaAcres 120.5, railServed false.
  Counts are honest overhead estimates; door count, capacity, and exit-lane
  count flagged in `uncertainFields`.

## Web findings
- Costco Depot 179; phone (209) 835-5222. Driver-facing notes mention designated
  truck parking, a **staging area** for dock access, restrooms/handwashing for
  drivers, and **early check-in** encouraged (consistent with a guarded check-in
  gate and queue staging).
- CEQA "Tracy Costco Depot" / "Annex" records confirm the multi-building campus
  (depot + annex + e-commerce DDC), supporting `multipleFacilities = true`.
- Active import/cross-dock buyer activity (international shipments) corroborates
  high-throughput cross-dock operations.

Sources: Panjiva (Costco Depot 179 / Tracy Depot buyer reports), Costco.com Tracy
location, CEQAnet Tracy Costco Depot Project + Annex, Wikimapia "Costco Depot".

## Final confidence
**high.** Facility positively identified, layout and the gate/guard-shack/dock
calls are well-supported by z19–z20 satellite. Imagery-derived counts (door
count, trailer capacity, exit-lane count) and the scale check are the only
soft spots, flagged in `uncertainFields`.
