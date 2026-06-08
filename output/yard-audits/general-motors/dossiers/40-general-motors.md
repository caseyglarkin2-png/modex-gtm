# GM CCA - Denver Parts Distribution Center, Aurora CO (idx 40)

**Type:** Parts Distribution Center (GM Customer Care & Aftersales)
**Resolved location:** 39.7468, -104.7124
**Address:** 23400 E Smith Rd, Aurora CO 80019
**Confidence:** high

## Step 0 - Identification

The roster gave only "Aurora, CO." Web research resolved the GM Customer Care &
Aftersales (CCA) Denver Parts Distribution Center to **23400 E Smith Rd, Aurora
CO 80019** - a ~404,000 sq ft PDC opened in 2003, built at the E-470 / I-70
interchange (GM media facility page; Saunders Construction project page; UAW
Local 431). The Waze/Google place for "GM Service and Parts Operations" points
to the E Smith Rd corridor on the NE edge of Aurora.

Satellite probing of that corridor found a single large white-roof warehouse at
**39.7468, -104.7124** that matches every detail: frontage on the E-470/I-70
side, office + employee parking on the NW end, and one long continuous dock face
on the south. Positively matched (not the neighboring spec warehouses, which are
larger cross-dock buildings with different roof colors and dock layouts).

## Key views

- **Wide z16/z17:** GM building sits in the Porteos / Majestic-style logistics
  cluster just south of E Smith Rd, with open prairie north and east.
- **z18 centered + z18/z19 south face:** one continuous dock-door bank runs the
  full south wall with ~30+ trailers backed in and a parallel drop-trailer row
  in the truck court.
- **Street View (north + west roads, 2026-04 and 2021-08 panos):** the entire
  property is wrapped in a continuous black ornamental metal fence with masonry
  pilasters. The warehouse and its south truck court sit behind this fence.
- **NW entry z20:** landscaped office/car entry drive meets the public road;
  employee parking lot on the NW.
- **SE / rail z18:** a single rail spur curves off the mainline north of the
  site and runs south through the gap between the GM building and the eastern
  neighbor.

## Gate / guard / dock determinations

- **truckGate = true.** The whole parcel is fenced; the secured south truck
  court is entered at the building's SW corner where the court meets the
  perimeter road. This is a controlled, fenced entry, not an open driveway.
- **guardShack = false (uncertain).** No distinct staffed booth is resolvable at
  the truck entrance; fence/pilaster screening and tree cover obscure the inner
  gate in both overhead and Street View. Flagged uncertain.
- **remoteGs = true (lower confidence).** Gate present, no confirmable booth ->
  kiosk / badge / app check-in implied for a secured GM PDC.
- **dockDoors = 50+ (~52 est).** Single long continuous south dock bank running
  the full ~900 ft wall, dense door rhythm, many trailers backed in. Overhead
  estimate, flagged uncertain.
- **dropArea = 25-50 / dropYard = true.** A dedicated drop-trailer row parallel
  to the dock apron inside the south court (~40-50 trailers, no tractors).
- **shipRcvSeparate = false.** All loading from one south dock face.
- **postGateStaging = true; drivewayLong = true.** The internal south court is
  deep and full-length, holding a long inside queue before the doors.

## Yard zones measured

- **perimeter:** fenced ~27-acre parcel, building oriented roughly E-W with a
  slight tilt; ring traced to the fence line.
- **truckGate:** SW-corner controlled entry to the secured court.
- **dockApron:** long thin quad hugging the full south dock wall.
- **dropYard:** parallel drop-trailer row south of the apron.
- **yardMetrics:** dockDoorCount ~52, trailersVisible ~60, capacity ~70,
  1 truck gate, 1 building, ~27 acres, railServed=false.

## Rail note

A rail spur runs along the property's east edge (off the mainline to the north)
but does not visibly enter the GM building - no rail dock door or interior car
spot. It appears to serve the broader rail-served park, so **railServed is set
false** for this specific GM building, with the adjacent spur noted.

## Web findings

- GM media: Denver Parts Distribution, Aurora CO; serves GM dealers / ACDelco.
- Saunders Construction: "400,000-sq-ft GM Parts Distribution Center, built at
  E-470 and I-70," 20,000 sq ft office.
- 404,000 sq ft, opened 2003, UAW Local 431, 23400 E Smith Rd, Aurora CO 80019.

## Final confidence

**high** on identity, location, fencing, dock face, and drop yard.
Uncertain: guardShack / remoteGs (screened entry), exact dock-door count, lane
counts.

---
3-line summary:
- Gate: YES - fully fenced parcel, secured south truck court entered at SW corner.
- Guard shack: NOT confirmed - no resolvable booth; remote/kiosk check-in implied.
- Confidence: high.
