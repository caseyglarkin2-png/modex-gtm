# Bay City Plant (Ziploc) — Bay City, MI (sc-johnson idx 2)

**Facility type:** Manufacturing Plant (Home Storage — Ziploc)
**Address:** 405 Marquette Dr, Bay City, MI 48706
**Resolved center:** 43.62050, -83.87050
**Confidence:** Medium

## Location resolution
The roster coordinate (43.619016, -83.872098) was a ROOFTOP geocode of 405
Marquette Dr and landed on the correct campus. Satellite probing (z14-z20)
plus the SC Johnson Bay City careers page confirmed the facility: a large,
mostly-fenced industrial campus on the east side of Bay City between the
residential grid and the Saginaw River. SC Johnson describes the site as
"more than 400 acres" with six production plants and ~400 team members
producing billions of Ziploc bags per year. Locked center at the developed
building cluster, 43.62050, -83.87050.

## Key views
- **Wide satellite (z14-16):** a spread-out campus — a large white-roofed
  warehouse in the north, a core cluster of production buildings in the
  centre, an L-shaped office building, R&D structures, and large amounts of
  undeveloped land making up the 400-acre figure.
- **Core cluster (z18):** several gable-roofed production buildings with
  trailers backed against their dock faces; one large building on the west
  edge with a continuous dock face.
- **North warehouse (z18-19):** big warehouse with a ring drive, a south dock
  face with trailers backed in, and a large trailer drop yard to the
  north/north-west — rows of parked trailers in a fan pattern.
- **Street View (multiple):** chain-link perimeter fencing is visible along
  the property edge (e.g. behind the warehouse and the brick R&D building),
  confirming a fenced campus. No manned guard booth was visible at the
  entrances probed; buildings front internal drives that connect to public
  roads.
- **Staging lots:** large empty paved overflow lots beside the warehouse.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The campus is perimeter-fenced (chain-link confirmed
  in Street View) with controlled access drives into the building cluster.
  Treated as a gated site rather than an open driveway.
- **guardShack = false / remoteGs = true (medium confidence).** No manned
  guard booth was positively identified at any probed entrance — the access
  drives appear to be fenced gates without a visible booth. Per the rubric,
  a gate with no guard shack implies kiosk / call-box / remote check-in, so
  `remoteGs` is set true. Both flags are listed uncertain; the campus is large
  enough that a staffed gate may exist out of the imagery probed.
- **dockDoors = "25-50".** Dock banks observed on at least three building
  faces (warehouse south face, west production building, core cluster);
  ≈45 doors estimated.
- **dropArea = "25-50" / dropYard = true.** Fan-pattern trailer rows near the
  warehouse and additional rows by the core buildings — clear dedicated
  trailer storage.
- **shipRcvSeparate = true.** Dock activity is split across physically
  separate buildings.
- **multipleFacilities = true.** Six production buildings plus warehouse,
  office and R&D on one campus.
- **fastLaneOpportunity = true.** Large empty paved staging lots leave room
  for an express lane.
- **railServed = true (medium).** Rail lines run along the east property edge
  with rail-served lots adjacent.
- **scale = false.** No truck scale identified.

## Yard zones & counts
- **Perimeter:** the ~400-acre campus property; the geofence box approximates
  the fenced extent (much of the 400 acres is undeveloped).
- **Truck gate:** warehouse access drive in the north.
- **Drop yards:** two boxed — the warehouse north drop yard and a core-cluster
  trailer row.
- **Dock aprons:** two boxed — warehouse south face and west production
  building face.
- **Staging:** paved overflow lots near the warehouse.
- **yardMetrics:** ≈45 dock doors, ≈70 trailers visible, ≈130 trailer
  capacity, ~2 truck gates, 8 buildings, ~400 acres, rail-served true.

## Web findings
SC Johnson Bay City careers page and the 2017 SC Johnson press release
("Major Investment in Michigan Factory") confirm Bay City as the central hub
for the Home Storage (Ziploc) business — 400+ acres, six production plants,
~400 employees, billions of Ziploc bags/yr exported to seven countries, plus
a 56,000 sq ft expansion. Ziploc's extreme-cube outbound makes this a
structurally high-trailer-count yard.

## Final confidence: Medium
Facility and footprint unambiguous; dock and drop-yard activity clearly
observed. The gate/guard determination is the soft spot — the campus is
fenced but no manned guard booth was confirmed, so `guardShack`/`remoteGs`
and the gate/lane counts are flagged uncertain.
