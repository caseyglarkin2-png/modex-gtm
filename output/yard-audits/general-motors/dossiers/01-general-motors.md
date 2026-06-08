# GM - Factory ZERO (Detroit-Hamtramck Assembly), Detroit MI

**Type:** Vehicle Assembly Plant
**Address:** 2500 E Grand Blvd (E General Motors Blvd), Detroit, MI 48211
**Resolved center:** 42.3805, -83.0475
**Maps (satellite):** https://www.google.com/maps/@42.38050,-83.04750,400m/data=!3m1!1e3
**Confidence:** high

## Location confirmation
The roster street-address geocode landed near the residential/freeway SE edge of the parcel, not on the plant. Web research (Wikipedia, GM Authority, GM.com/factoryzero, Ghafari project page) confirmed the facility: GM's $2.2B Factory ZERO EV assembly plant, a 3.5M sq ft complex on the Detroit/Hamtramck border that builds the GMC Hummer EV, Cadillac Escalade IQ, Chevrolet Silverado EV and GMC Sierra EV (capacity ~270,000 vehicles/yr). Satellite probing (z14-z18) positively re-pinned the large light-roofed assembly mass centered ~42.3805,-83.0475. The site is a rounded ~380-acre parcel bounded by a multi-track rail corridor on the N/NW, the I-94 (Edsel Ford) freeway on the S, and St Aubin / industrial streets on the E.

## What each view showed
- **Wide / full (z14-15):** Single large parcel with the assembly complex in the center, encircled by a perimeter buffer/road; rail+highway corridor on the W/NW, freeway on the S, dense Detroit/Hamtramck residential and industrial fabric all around. Urban.
- **Building core (z16, 42.3805/-83.0475):** The multi-section assembly building - the body shop, general assembly, battery and EV shops as connected masses.
- **West face (z17-18):** Material-receiving dock aprons, a retention pond, the perimeter road, and the rail corridor beyond. Inbound/receiving side.
- **East yard (z17-18, 42.3795/-83.0395):** Large paved finished-vehicle lots full of staged EVs in rows AND multiple rows of dry-van / drop trailers backed against dock structures - the active outbound + drop-trailer side.
- **NE (z17, 42.3835/-83.0375):** A separate body-shop / supplier building cluster, plus **rail spur tracks running down into the property** from the north corridor, and a trailer staging area.
- **North (z18) & Holbrook (z18):** The north boundary is a multi-track Conrail/CN rail yard; Street View (pano sAYPIeSwj-... 2024-09 and jnWp2cncPSxr... 2022-11) shows loaded railcars on those tracks. Employee parking lot at the NW.
- **South / SE (z18):** I-94 freeway frontage with a wide grass buffer and large solar arrays on the SE paved acreage - no truck gate on the freeway side.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Continuous secured perimeter: Street View along the NE industrial street shows chain-link fence with a concrete jersey-barrier base, plant buildings and dock doors immediately behind. Truck movement is via controlled internal access drives off the perimeter ring (a NW dock approach and a NE/E yard approach), not open public-street driveways.
- **guardShack = true (uncertain).** GM assembly plants of this scale and security ($2.2B EV flagship) uniformly staff security gatehouses at controlled entrances. The encircling public features - rail corridor (N), freeway (S), embankment/underpass (W) - prevent a clean frontal Street View of the interior guard gate, so the booth could not be crisply isolated. Flagged uncertain but the high-confidence call.
- **entryExitSeparate = true.** Distinct controlled drives at different points of the property line (west material face vs. east/NE finished-vehicle + rail yard).
- **dockDoors = "25-50".** ~45 loading doors counted across the west receiving face and east dock banks / supplier building (overhead estimate, uncertain).
- **shipRcvSeparate = true.** Inbound material docks on the west face; finished-vehicle outbound + trailer/rail yard on the east - physically separate clusters.

## Yard zones & counts measured
- **Perimeter:** 7-vertex oriented ring tracing the rounded parcel (rail N/NW, freeway S, St Aubin E). ~380 acres (documented historical site ~365 ac; ring includes buffer).
- **truckGate zone:** NW controlled dock/material approach off the perimeter road.
- **dropYards (2):** east drop-trailer rows (dry vans backed to docks / staged in rows) and the NE rail-served trailer area.
- **dockAprons (2):** west receiving apron and east outbound dock apron, each a thin quad parallel to the building face.
- **yardMetrics:** dockDoorCount ~45, trailersVisible ~60, trailerParkingCapacity ~180 (shared with finished-vehicle staging), truckGateCount 2, buildingCount 4, siteAreaAcres ~380, railServed true.

## Web findings
- Wikipedia / GM Authority: Detroit/Hamtramck Assembly = Factory ZERO; GM's largest single-plant investment ($2.2B); ~270k vehicles/yr; all-EV product line.
- Ghafari (architect): 3.5M sq ft; included a 268k sq ft body-shop expansion, 54k sq ft battery storage shop, EV light-commercial shop, motor-position switch expansion - confirms the multi-shop campus footprint.
- TruckMap lists the facility at 2500 E Grand Blvd with truck routing - consistent with active freight/drop-trailer operations.

## Final confidence
**high.** Facility unambiguously identified and re-pinned; layout, rail service, dock clusters, and drop-trailer yards are clear in z17-18 imagery. guardShack, exact dock-door count, entry/exit lane counts, and scale are flagged uncertain (interior gate not visible from public Street View).

---
**3-line summary:**
- Gate: truckGate = true - secured fenced campus, controlled internal access drives, separate entry/exit points.
- Guard shack: guardShack = true (uncertain) - implied by GM assembly security standard; interior gate not visible from public roads.
- Confidence: high.
