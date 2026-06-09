# Deep-Audit Dossier — 7-Eleven CDC Lewisville TX (E.A. Sween Dallas)

- **Facility:** 7-Eleven Combined Distribution Center Lewisville TX (operated by E.A. Sween Company)
- **Type:** Combined Distribution Center (fresh-food, refrigerated)
- **Address:** 1301 Ridgeview Dr, Suite 100, Lewisville, TX 75057
- **Resolved center:** 33.025900, -96.981250
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Location confirmation (Step 0)
The supplied city-level coords (33.026075, -96.981654) landed inside a dense
Lewisville industrial park. Web research and address geocoding (LoopNet APN
R74002; Yelp/Waze/CareerBuilder listings) confirmed E.A. Sween Co at **1301
Ridgeview Dr, Suite 100**. This is a large **multi-tenant flex/industrial
building** — the north (Ridgeview-facing) frontage carries other tenants'
signage (a "Staples" sign is visible in Street View; Xerox, CPI One Point, and
Bakery Express also list this address). E.A. Sween runs the fresh-food CDC that
delivers sandwiches, milk, bread and bakery to 7-Eleven and other c-stores 365
days a year; its dock and refrigerated route-fleet yard occupy the **east /
southeast** side of the building. The audit geofences that operating footprint,
not the whole park.

Building footprint read from z17/z18 imagery: a single large rectangular
structure, long axis NNW-SSE, slightly rotated off cardinal (~10-15°). Center
of building ~33.0259, -96.9815.

## Key views
- **z16/z17/z18 overview** — single big building; employee/visitor parking and
  office frontage on the north and west, the truck operation on the east/SE.
- **z19 SE yard** — diagonal rows of white refrigerated box trucks and trailers
  (the E.A. Sween route fleet), a circular tank/salt-dome structure, and a blue
  ancillary structure. This is the active drop yard.
- **z20/z21 east wall** — long bank of dock doors with trailers/box trucks
  backed in along the east building face.
- **Street View, Ridgeview Dr (north), pano hRvBXvOPn3GQl8_I4H-sdg, May 2025** —
  office frontage with Staples signage; confirms multi-tenant flex front.
- **Street View, eastern public street, pano gJ4XoG4YpHw35OFyMNGvOg, May 2025** —
  the truck/service gate into the SE yard.

## Gate / guard-shack / dock determinations
- **Truck gate — YES.** Multiple Street View headings (250-290°) from the
  eastern public street show a **black metal sliding/swing gate** across the
  truck driveway, set in a corridor between precast screen walls leading west
  into the yard. Perimeter fencing/screen walls enclose the yard.
- **Guard shack — NO.** No staffed booth (1-3-stall footprint, multi-side
  windows) sits beside the gate in any view. The gate is unattended.
- **Remote / automated check-in — YES (remoteGs).** Gate present, no guard
  shack, implying kiosk / call-box / app check-in.
- **Docks — 25-50 band.** A long, regular bank of dock doors runs along the
  east building face with trailers backed in (~34 counted from overhead;
  estimate). Single dock cluster (east face); no confirmed separate ship/rcv
  bank.

## Yard zones and counts
- **Perimeter (8.6 ac)** — oriented ring around the E.A. Sween operating
  footprint: building + north apron + east/SE truck yard, bounded by the east
  tree line and the south building edge.
- **Drop yard** — SE lot of parked refrigerated route trucks/trailers,
  ~38 trailers visible, capacity ~55.
- **Dock apron** — long thin zone hugging the east wall where trucks back in.
- **Staging** — paved holding area east of the dock apron, inside the gate.
- **Truck gate** — single gated driveway on the SE/east, one in/out lane.
- **Metrics:** dockDoorCount ~34, trailersVisible ~38, capacity ~55,
  truckGateCount 1, buildingCount 1, railServed false.

## Web findings
E.A. Sween Company (HQ Eden Prairie, MN; founded 1955) runs EAS Combined
Distribution Centers delivering fresh food daily to convenience stores; the
Lewisville CDC serves the north-Texas / DFW 7-Eleven network. Overnight
route-delivery driver postings ($23.50/hr) confirm an active refrigerated
route-truck fleet operating out of this site — consistent with the SE drop
yard full of box trucks.

## Setting
Dense Lewisville / north-DFW industrial fabric, surrounded on all sides by
other large distribution and flex buildings → **Urban**; no connectivity
concern. No truck scale and no rail spur observed.

## Final confidence
**High.** Facility positively identified; gate and absence of guard shack
confirmed from clear May-2025 Street View. Lower-confidence items: exact dock
door count (overhead estimate) and whether ship/rcv are physically separated —
flagged in `uncertainFields`.

### 3-line summary
- Gate: YES — black sliding gate across the SE truck driveway, perimeter fenced.
- Guard shack: NO — unattended gate (remote / kiosk check-in).
- Confidence: high.
