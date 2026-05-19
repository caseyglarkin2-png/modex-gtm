# General Mills (Blue Buffalo) - Richmond IN (idx 9)

## Resolved location
- **Roster coords were wrong.** The roster pin (39.828255, -84.898477, geocode precision APPROXIMATE) sits in downtown Richmond — no industrial building.
- Web research (PetfoodIndustry, EDC of Wayne County, Citymapper, Waze) places the **$200M Blue Buffalo natural pet food plant** at **4878 / 4748 W Industries Rd** in the **Wayne County Midwest Industrial Park** on the west side of Richmond, just south of I-70.
- Probed satellite west of Richmond; found a large industrial campus with a tall production tower. **Locked center 39.8550, -84.9645.**
- The plant is a **400,000 sq ft** facility on a **125-acre campus**, opened **2018**, with a **169,000 sq ft expansion** started 2023; produces BLUE dry dog/cat food (>1M lb/day), ~200 employees.

## Key views
- **z16 overview:** Three building clusters — a production tower and main plant (NW/center), a long warehouse on the SW running NW-SE, and a standalone building to the NE (the expansion/R&D). A loop road encircles the main plant.
- **z17/z18 SW dock face:** A long continuous dock bank on the W/SW wall of the warehouse with ~30-40 trailers backed in; a separate long row of drop trailers parked along the W side of the loop road.
- **NE building (z17):** Has its own dock face on its W side with trailers and a separate employee parking lot — distinct ship/receive cluster.
- **2024-08 Street View (W Industries Rd):** Confirms a continuous chain-link perimeter fence enclosing the whole property. Street View covers the public road only and does not extend onto the private access road.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A single private access road off W Industries Rd (SE side) feeds an encircling loop road. The entire 125-acre campus is perimeter-fenced (chain-link, confirmed in multiple 2024-08 Street View frames). Controlled truck entrance.
- **guardShack: false / remoteGs: true** — No staffed booth resolvable; Street View does not reach the entrance driveway. Defaulted to remote check-in. Both flagged uncertain.
- **dockDoors: 50+** — Main warehouse SW dock bank (~30-40 doors) plus the NE expansion building's dock face. Total over 50.
- **dropArea: 25-50 / dropYard: true** — A long perpendicular drop-trailer row along the W loop road.
- **shipRcvSeparate: true** — Two physically separate dock clusters on different buildings.
- **multipleFacilities: true** — Three distinct building clusters; a campus.
- **drivewayLong: true, fastLaneOpportunity: true** — Long approach plus a wide encircling loop road; ample room for a bypass lane.

## Yard zones and counts
- **perimeter:** ~122 acres (matches the reported 125-acre campus).
- **truckGate:** SE-side access-road entrance off W Industries Rd.
- **dropYards:** W-loop trailer row and a SW-end staging row.
- **dockAprons:** main warehouse SW apron and the NE building's W apron.
- **yardMetrics:** dockDoorCount ~50, trailersVisible ~70, capacity ~90, 3 buildings, 1 truck gate, not rail-served.

## Web findings
- $200M plant, 400k sq ft, 125 acres, opened 2018; 169k sq ft expansion (2023); ~200 jobs; >1M lb/day dry pet food capacity.

## Final confidence
**High.** Building identity, scale, multi-building campus layout, dock faces, and perimeter fencing are all clearly confirmed by satellite and corroborated by web research and 2024-08 Street View. Only the entrance check-in arrangement (guard booth vs. remote) and a possible truck scale could not be visually resolved — those fields are flagged.
