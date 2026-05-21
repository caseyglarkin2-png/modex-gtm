# Deep-Audit Dossier — KDP Beverage Manufacturing & Distribution, Allentown PA

**Roster idx:** 4
**Facility type:** Manufacturing & Distribution - Beverage
**Address:** 7350 / 7356 Industrial Blvd, Allentown (Upper Macungie Twp), PA 18106
**Resolved coordinates:** 40.572414, -75.605843
**Confidence:** High

## Location confirmation
The roster carried a geocode flag (movedMeters 3237), but the roster pin
(40.572414, -75.605843) in fact sits correctly between the two large buildings
of KDP's Allentown campus. Web research confirms this is **"Park 100"**, a
two-building logistics site in Upper Macungie Township: 7350 Industrial Blvd
(warehouse/DC) and 7356 Industrial Blvd (manufacturing), combined ~1,541,280 sq
ft on 92 acres, built out on a former Kraft-Heinz site. KDP invested ~$220M;
the facility was Food Engineering's 2021 Plant of the Year (Lehigh Valley EDC,
LVB, WFMZ, Food Business News). Location locked.

## Key views
- **z14-z16 satellite:** The site sits inside a dense Lehigh Valley logistics
  park among many other huge warehouses.
- **z17 satellite:** Two enormous dark-roof buildings with extensive dock faces,
  a shared central truck court between them packed with trailers.
- **z18 N building:** Long dock bank, dozens of trailers backed in.
- **z18 S building:** Long dock bank plus rooftop process/HVAC equipment arrays
  - the manufacturing building.
- **z19-z20 truck-court / entrance probes:** Open paved truck court with
  trailers backed at docks (incl. green/yellow trailers) and rows of parked
  trailers in the central strip.
- **May 2025 Street View (Industrial Blvd, W frontage):** Open driveway entrance
  with a monument sign, landscaped frontage, no perimeter fence on the W side.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE (uncertain).** Truck access from Industrial Blvd is via
  open driveways and internal roads into the central truck court. No barrier arm
  or sliding gate visible at the road or truck-court entry in z19-z20 satellite
  or 2025 Street View. Flagged uncertain — a beverage plant of this scale
  plausibly runs manned check-in, but no physical gate/booth is visible.
- **Guard shack: FALSE (uncertain).** No guard-booth-footprint structure visible
  at any truck entrance. Flagged uncertain for the same scale-related reason.
- **Remote GS: FALSE.** No gate present in imagery.
- **Dock doors: 50+ band.** Both buildings carry very long dock banks; ~100+
  doors total estimated, exact count uncertain from overhead.
- **shipRcvSeparate: TRUE.** Separate manufacturing and warehouse buildings,
  each with its own long dock bank on opposite sides of the shared truck court.

## Yard zones and counts
- **Perimeter:** The full 92-acre two-building campus. ~92 acres.
- **Truck gate zone:** W truck-court entry off Industrial Blvd (open).
- **Drop yard:** Central truck-court strip between the two buildings, with long
  rows of parked trailers — 50+ band.
- **Dock aprons:** Two — the N (warehouse) building face and the S
  (manufacturing) building face.
- **Building count:** 2 (`multipleFacilities` true). **Rail:** none — no spur.
- `drivewayLong` true; `postGateStaging` true (deep open truck court);
  `entryExitSeparate` true (multiple driveways); `fastLaneOpportunity` true.

## Web findings
- Lehigh Valley EDC / LVB / WFMZ: KDP took over the former Kraft-Heinz Upper
  Macungie site; $200-220M investment; ~378-400 jobs.
- KDP press release: the Allentown plant is a cold-beverage production and
  distribution facility, 2021 Food Engineering Plant of the Year.

## Final confidence
**High** on location and on the overall layout (two-building campus, huge dock
banks, large central drop yard, no rail spur, Urban setting). The truck-gate and
guard-shack calls are negative on visible evidence but flagged uncertain — a
plant of this scale may run manned/controlled check-in not resolvable from
overhead and frontage Street View. Dock-door and trailer-capacity counts are
order-of-magnitude estimates.
