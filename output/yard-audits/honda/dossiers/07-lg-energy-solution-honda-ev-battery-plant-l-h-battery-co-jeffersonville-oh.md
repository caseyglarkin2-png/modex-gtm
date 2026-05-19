# Deep-Audit Dossier — LG Energy Solution-Honda EV Battery Plant (L-H Battery Co.), Jeffersonville OH

**Roster idx:** 7
**Type:** EV Battery Cell Plant (Joint Venture)
**Address:** Jefferson Township, Fayette County, west of Ohio SR 729, south of I-71, Jeffersonville, OH 43128 (no published street number)
**Resolved center:** 39.62480, -83.57000 (centroid of the main battery building)
**Confidence:** low

## Location confirmation
The roster pin (39.653047, -83.562103, GEOMETRIC_CENTER) landed on the village
of Jeffersonville itself, not the plant. Web research (lgeshonda.com, Honda/LGES
groundbreaking releases, Dayton Daily News, Statehouse News Bureau) places the
L-H Battery Company plant "west of Ohio 729 and south of Interstate 71, easily
visible from the interstate" in Jefferson Township, Fayette County —
approximately 40 miles southwest of Columbus. Satellite probes confirmed a
massive single-building industrial plant under construction at ~39.6248,
-83.5700, bracketed by I-71 to the NW and SR 729 to the E. The building center
was relocated ~3.5 km south-southwest of the roster pin.

## Key views
- **z14 full** — entire plant property under construction (winter Maxar
  imagery): one very large building, surrounding graded laydown areas, a
  roundabout main entrance on the SW.
- **z16 building** — vast rectangular battery building; snow-covered roof;
  construction equipment, cranes and scaffolding still present.
- **z18 east face** — a long building wing with a dock apron; a small number of
  trailers parked along it; heavy construction laydown immediately east.
- **z18 south face** — internal road, electrical/transformer equipment yard,
  and a large parking lot to the south.
- **z19 SR 729 side** — temporary construction trailers and parking; the
  permanent truck gate / guard structure is not yet formed or is obscured.

## Gate / guard-shack / dock determinations
- **truckGate = true (flagged uncertain).** The property is set behind a
  roundabout main entrance and ringed with buffer land; a $3.5B EV cell plant
  will run controlled access. The specific gate structure is NOT resolvable in
  construction-phase, snow-covered imagery.
- **guardShack = true (flagged uncertain).** Assumed on facility-class grounds
  (high-security battery plant); not directly imaged.
- **remoteGs = false** — guard shack assumed present.
- **dockDoors = 25-50** — an east-facing dock apron with trailers is visible but
  door count is obscured by snow; ~35 is a rough mid-band estimate.
- **dropArea = 10-25 / dropYard = false** — limited settled trailer parking;
  most open ground is construction laydown rather than an established drop yard.
- **railServed = false** — no rail spur entering the property.
- **multipleFacilities = false** — single primary building with a connected
  utility/support wing.
- **scale = false / multiStep = false** — none identified.

## Yard zones and counts
- **Perimeter:** core fenced plant property ≈ 290 acres (announced site is
  larger; figure approximate).
- **Drop yard / dock apron:** one east-side apron strip with limited trailer
  staging.
- **Staging:** internal area south of the building.
- **Metrics:** ~35 dock doors, ~25 trailers visible, ~120 trailer capacity,
  1 truck gate, 2 buildings, rail-served = false. ALL counts are low-confidence
  estimates from construction-phase imagery.

## Web findings
L-H Battery Company, Inc. — JV formally established Jan 13 2023; $3.5B
investment, ~2,200 jobs; building footprint equivalent to ~78 football fields.
LG Energy Solution agreed to sell its JV stake to Honda (2025). Construction was
"nearly complete" as of February 2026 per Honda news. Plant supplies EV cells
for Honda's Ohio EV Hub.

## Final confidence
**Low.** The facility is positively located and identified, but it is a
brand-new plant still under construction in all available imagery (winter,
snow-covered, construction laydown everywhere). Truck gate, guard booth, dock
build-out and trailer yard are not yet settled or are obscured. Operational
classifications are best-effort facility-class inferences. **Recommend re-audit
once non-winter, post-construction imagery is available.**
