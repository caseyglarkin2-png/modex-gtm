# SalSon Logistics — Houston TX — Deep-Audit Dossier

**Facility:** SalSon Logistics - Houston TX
**Type:** Drayage Terminal / Truck & Trailer Parking Yard (Houston port market)
**Address:** 8357 Liberty Rd, Houston, TX 77028
**Resolved coordinates:** 29.806200, -95.275000
**Confidence:** High

## Location confirmation
The roster coordinates (29.805027, -95.276484) landed on open fields just SW of
the actual yard, next to a rail corridor. Web research resolved the site
definitively: **8357 Liberty Rd is "Outpost" / "Secure Trailer Lots"** — a
commercial **16-acre semi-truck, trailer and commercial-vehicle parking yard
with ~500 spaces** in northeast Houston, near I-10 and the 610 Loop. SalSon's
LogiCore "Houston warehouse" listing uses this same 8357 Liberty Rd address but
records **dock doors: "No"** — meaning SalSon does not operate a dock-door
warehouse here; it uses the Outpost truck-parking yard as its Houston drayage
trailer pool / staging yard. The locked coordinate is the centroid of the
trailer-parking yard NE of the roster point.

## What the imagery showed
- **Satellite (z17-z19):** A large unpaved dirt/gravel lot packed with neat rows
  of parked trailers and trucks — a pure parking/storage yard. No dock-door
  warehouse; only a small office/support structure. The yard is bounded by
  Liberty Rd on the south, a rail corridor beyond, and open fields to the west
  and north. The current imagery shows the yard expanded and more developed vs.
  earlier years.
- **Street View (Liberty Rd, 2021-03):** The yard frontage on Liberty Rd is
  enclosed with continuous metal-panel perimeter fencing. A gravel driveway gap
  is visible as the gated entrance. No guard booth at the gate.

## Gate / guard-shack determination
- **truckGate: true** — The yard is fully fenced (metal-panel perimeter fence
  along Liberty Rd) with a gravel driveway gap serving as the gated truck
  entrance. This is a controlled truck entrance.
- **guardShack: false / remoteGs: true** — No staffed guard booth is visible at
  the gate. Outpost truck-parking yards run as self-service facilities with
  app-/keypad-based access, so check-in is remote. Flagged uncertain because the
  most recent Street View is 2021.
- **drivewayLong: true** — The internal entry into the 16-acre yard is long and
  deep with abundant queue room.
- **dockDoors: NONE** — No dock-door building; this is a parking/staging yard.

## Yard zones & counts
- **Perimeter:** ~16 acres per the Outpost / LoopNet listing.
- **Drop yard:** The entire site is a truck/trailer parking and drop yard
  (dropArea 50+, dropYard true), rated for ~500 vehicle spaces.
- **Dock apron:** None.
- **yardMetrics:** ~160 trailers/trucks visible in the captured imagery,
  capacity ~500; 1 small building; 1 truck gate; not rail-served (a rail line
  runs adjacent but no spur enters the yard).

## Web findings
8357 Liberty Rd operates under multiple names — Outpost, Secure Trailer Lots,
Liberty Truck & Trailer Storage Depot — and is marketed as a secure 16-acre,
500-space truck/trailer/commercial-vehicle yard for enterprise and midsize
fleets, priced per acre or per space. SalSon's Houston drayage operation
(food-grade, drayage, transload per LogiCore) uses this yard as its trailer
pool / staging point serving the Houston port market. It is a leased/third-party
parking yard, not a SalSon-developed warehouse campus.

## Final confidence
**High.** The address resolves cleanly to the Outpost truck-parking yard, and
both satellite and Street View confirm a fenced, gated, dock-less trailer-
parking yard. The guard-shack call relies on 2021 Street View and the known
self-service nature of Outpost yards, so it is flagged uncertain.
