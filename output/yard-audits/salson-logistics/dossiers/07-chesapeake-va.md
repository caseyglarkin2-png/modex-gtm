# SalSon Logistics — Chesapeake VA (Norfolk) — Deep-Audit Dossier

**Facility:** SalSon Logistics - Chesapeake VA (Norfolk)
**Type:** Drayage Terminal / Container & Trailer Yard (Norfolk VA port market)
**Address:** 3832 South Military Highway, Chesapeake, VA 23321
**Resolved coordinates:** 36.770500, -76.376100
**Confidence:** Medium

## Location confirmation
The roster coordinates (36.771399, -76.375373) landed inside a large yard full
of trailers and containers. Web research established that **3832 S Military
Highway is a multi-tenant industrial/trucking address** shared by several
companies — M&J Transport, Sheridan Logistics Inc, CDS Trucking, Time Dispatch,
and **SalSon Logistics (listed on LogiCore as the Norfolk location)**. It is
not a single SalSon-owned site; SalSon occupies a portion of this shared
drayage complex. Street View along the access road positively confirmed the
address: a wooden **"3832" property marker with a bank of mailboxes** stands at
the open driveway entrance. The locked coordinate is the centroid of the
multi-tenant container/trailer yard.

## What the imagery showed
- **Satellite (z17-z19):** A sprawling, mostly unpaved gravel/dirt yard with
  rows and rows of parked trailers and intermodal containers, organized into
  several sub-yards connected by internal dirt lanes. Only small office/support
  structures — no dock-door warehouse. A used-vehicle/parking lot sits at the
  NW corner. A rail line runs along the west edge but no spur enters the yard.
- **Street View (S Military Hwy / access road, 2026-04):** The main yard is set
  well back from S Military Hwy behind a treeline. The access road shows the
  "3832" sign with mailboxes and an **open dirt/gravel driveway** leading into
  the complex — no barrier, no gate, no booth at the road.

## Gate / guard-shack determination
- **truckGate: false** — The complex entrance is an open, uncontrolled
  dirt/gravel driveway with no barrier arm, sliding gate, or checkpoint
  pinch-point at the public road in 2026-04 Street View. Individual tenant
  sub-yards may have their own fencing internally, but the audited entrance is
  uncontrolled. Flagged uncertain — SalSon's specific sub-parcel could not be
  isolated.
- **guardShack: false** — No guard booth anywhere at the entrance; the only
  structure at the road is the wooden address sign and mailbox bank.
- **remoteGs: false** — There is no truck gate, so remoteGs is false by rule.
- **drivewayLong: true** — The internal dirt access road into the yard is long
  and deep with abundant queue room.

## Yard zones & counts
- **Perimeter:** ~16 acres covering the full multi-tenant 3832 S Military Hwy
  complex. SalSon's tenant footprint is a subset.
- **Drop yard:** The entire site is a container/trailer/chassis drop yard
  (dropArea 50+, dropYard true) — hundreds of units in rows.
- **Dock apron:** None — no dock-door warehouse (dockDoors NONE).
- **yardMetrics:** ~220 trailers/containers visible across the imagery,
  capacity ~400; ~4 small buildings; multi-tenant; not rail-served.

## Web findings
SalSon's Norfolk-market presence is a drayage operation. The LogiCore listing
gives 3832 S Military Hwy and flags food-grade (FDA) handling, drayage,
transloading and inventory control — but the physical site is an open
container/trailer yard, not a warehouse. A LoadMatch directory entry pairs
"Salson Logistics" with "Total Transportation Services - TTSI" at Chesapeake,
consistent with a shared drayage-carrier yard. This is a trailer/chassis pool
and dray staging yard serving the Port of Virginia, not a DC.

## Final confidence
**Medium.** The address and the general site are confirmed, and the imagery
clearly shows an open multi-tenant container/trailer drayage yard. SalSon's
exact sub-parcel within the shared complex could not be drawn precisely, so the
classification characterizes the whole 3832 S Military Hwy yard. Gate and
guard-shack calls are flagged uncertain accordingly.
