# GM - Flint Metal Center, Flint MI - Deep-Audit Dossier (idx 21)

## Identity & location (Step 0)
- **Roster address was imprecise.** The roster listed "6200 Bristol Rd, Swartz Creek, MI 48473." Probing satellite around that point showed only small commercial buildings, not a 1.6M-sq-ft stamping plant.
- **Web research** (GM facilities page, Waze, UAW Local 659 / americanautoworker listings) resolved the real plant address to **2238 W Bristol Rd, Flint, MI 48507/48550**. GM describes the Flint Metal Center as 1.6 million sq ft on 85.6 acres, opened 1954, producing sheet-metal stampings for full-size trucks/SUVs (Silverado/Sierra HD program).
- **Locked center: ~42.9748, -83.7935.** The satellite imagery there shows an unmistakable very large white-roofed metal/stamping complex with truck docks, trailer yards, employee parking, and rail loading. The fenced campus also abuts GM Flint Engine South operations to the east, so the controlled perimeter reads as one large multi-building campus.
- Confidence on identity: **high**.

## Key views
- **Wide / extent (z15, 42.975,-83.793):** the full fenced property - building mass center-right, deep tree/lawn buffer along the south (W Bristol Rd) frontage, golf course south across the road, farmland and low-density residential around. Rail along the N/NE and a parallel line along the SE.
- **Overview (z16, 42.9755,-83.7945):** two main building masses (west stamping building + east building), a north trailer/material drop yard, an east parking lot with trailers and solar canopies, and dock faces with trailers backed in on the SW, south, and SE faces.
- **East access / SE dock (z18, 42.976,-83.7875):** clear bank of dock doors with ~10-15 trailers backed in along the SE building face; rail line immediately SE.
- **South entrance (z18, 42.9725,-83.7945):** the main truck/employee entrance drive off W Bristol Rd, intersection, visitor parking, and a long row of 15+ trailers along the building's SW dock face.
- **Gatehouse zoom (z20, 42.973,-83.795):** visitor lot plus a paved secured truck lane and fence line on the building (west) side with staged trailers.
- **North (z17, 42.979,-83.791):** confirmed rail line along the north edge with rail-served loading and a steel-coil/die laydown yard plus trailer rows on the building's north face.

## Gate / guard / dock determinations
- **truckGate = true.** This is a fully fenced, controlled-access GM legacy manufacturing campus. Entrance drives come off W Bristol Rd at the south frontage (behind a deep tree-screened lawn buffer) into secured, paved truck routes; perimeter fencing and gated lanes are visible around the building. Two distinct access points (separate in/out) read on the south frontage -> `entryExitSeparate: true`.
- **guardShack = true (flagged uncertain).** Campuses of this type operate staffed gatehouses at their truck/employee entrances as standard practice. The frontage is so heavily tree-screened that Street View (panos along W Bristol Rd, 2025-10) never reaches the interior gate, so the booth could not be individually resolved - listed in `uncertainFields`. `remoteGs` is therefore false.
- **Street View limitation:** every Bristol Rd pano (e.g. `lIkENTcM7MVxHhnqt24lgA` @ 42.97200,-83.79454) looks across a deep grass/tree buffer; no public pano enters the property. The truckGate streetViewMeta uses that pano at heading 355 (looking north into the entrance) as the best driver's-eye arrival frame.
- **dockDoors = 50+.** Long trailer rows backed into dock doors on the SW stamping face, the south frontage face, and the SE east-building face (15+ trailers per face). Estimated ~70 doors total.
- **dropArea / dropYard = true, 50+.** A large north trailer + steel-coil/die laydown yard and a separate east lot of parked trailers (solar canopies adjacent). Well over 50 trailer positions.
- **shipRcvSeparate = true.** Dock banks sit on physically separate building faces.
- **postGateStaging / drivewayLong = true.** Deep paved internal approaches hold 3+ trucks before the docks.
- **fastLaneOpportunity = true.** Wide aprons and multiple entrance drives leave room for an express/bypass lane.

## Yard zones & counts (measured from imagery)
- **perimeter:** 5-vertex ring tracing the fenced campus (building + yards + parking), slightly rotated to the rail-aligned NE edge. ~**244.7 acres** (full controlled campus; the stamping building itself is GM's stated 85.6 ac / 1.6M sq ft).
- **truckGate:** quad over the south entrance drive off W Bristol Rd.
- **dropYards:** (1) north trailer/material yard ~22 ac; (2) east trailer + solar lot ~17 ac.
- **dockAprons:** west stamping dock apron (SW face) and east-building SE dock apron, traced parallel to their building faces.
- **yardMetrics:** dockDoorCount ~70, trailersVisible ~90, trailerParkingCapacity ~160, truckGateCount 2, buildingCount 3, **railServed true**.

## Web findings
- GM Flint Metal Center: 1.6M sq ft, 85.6 acres, opened 1954, UAW Local 659; stamps sheet metal for HD/LD trucks, full-size SUVs and crossovers. Recent ~$233M die investment tied to next-gen Silverado/Sierra HD. Sits on the Bristol Rd industrial corridor adjacent to Flint Engine South (2100 Bristol Rd) - the two read as one fenced campus from above.

## Setting
- **urbanRural = Rural.** Edge-of-town Flint/Swartz Creek line: farmland, woods, a golf course, and low-density single-family homes surround the site. `connectivityIssue = false` (it is on a developed corridor with adjacent commercial/residential, so cellular coverage should be adequate).

## Final confidence
- **high** on identity, location, gate presence, rail, docks, and drop yards.
- Uncertain (flagged): exact guard-booth resolution, presence of a truck scale, precise entry/exit lane counts, exact dock-door count, and multi-step interior checkpoints.

---
**3-line summary**
- Gate: YES - fully fenced controlled-access GM stamping/engine campus, secured truck drives off W Bristol Rd, separate in/out.
- Guard shack: LIKELY YES (staffed gatehouse standard for this campus type) but not individually resolvable through tree-screened frontage - flagged uncertain.
- Confidence: HIGH.
