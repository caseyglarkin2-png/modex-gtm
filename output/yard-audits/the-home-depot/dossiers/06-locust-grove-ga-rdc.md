# Deep-Audit Dossier — Home Depot RDC, Locust Grove GA (idx 6)

**Facility:** Home Depot RDC #5250 (Rapid Deployment Center)
**Address:** 3150 Hwy 42 South, Locust Grove, GA 30248
**Resolved center:** 33.36300, -84.11900
**Confidence:** Medium

## Location resolution
**The roster geocode (33.216581, -83.930773) was wrong by ~25 km** — it
landed in rural farmland/woodland SE of Locust Grove with no industrial
building anywhere near it (confirmed by z15/z17 satellite of that point).

The correct facility was re-resolved by web research:
- HD DC #5250 / "RDC 5250" is a **657,518 sq ft** distribution center on
  **~130 acres** at 3150 Hwy 42 South, Locust Grove, GA (Henry County),
  immediately off I-75, ~36 miles south of downtown Atlanta.
- The property was bought by Monmouth REIT for **$96.7M** in Dec 2020, net-
  leased 20 years to Home Depot U.S.A.
- HD careers and Work Safety Index list "5250 Locust Grove RDC" as an active
  HD rapid-deployment facility.

The building was located on satellite at ~33.363, -84.119 — a large
distribution building set behind a rail line and tree buffer, with extensive
undeveloped land around it (land-to-building ratio ~9x, consistent with the
130-acre figure).

## Imagery limitations
Satellite imagery of this site is **significantly cloud-affected** at every
zoom (z16–z19). The building outline, the long SE-face dock bank, and trailer
rows are readable, but the truck-entrance/gate area is partially to fully
obscured by cloud in all available tiles. Street View covers only public Hwy
42 / the adjacent road; the DC sits behind a railroad embankment and tree
buffer, so the gate is not visible from any public pano (panos dated 2023–25
all show the building across an open field/rail line, no gate).

## What the imagery showed
- **Building:** One large rectangular RDC running roughly NW–SE, ~480 m on its
  long axis. A continuous bank of loading-dock doors with trailers backed in
  runs along the long SE face; a second dock bank is visible on the SW face.
- **Docks:** 50+ band — estimated ~130 doors across the SE and SW faces.
- **Trailers / drop yard:** A trailer parking area sits NE of the building;
  exact count is cloud-obscured (estimated 10–25 in the drop area, ~90 trailers
  total visible).
- **Setting:** Edge-of-town Locust Grove industrial pocket, surrounded by
  woodland, farmland, and a few subdivisions; classed Rural.

## Gate / guard-shack determination
The gate could not be directly imaged (cloud cover + public-road sightline
blocked by rail and trees). Determination is **inferred** from HD's standard
RDC operating model: HD's own security-guard role descriptions for its DC
network describe staffed truck check-in — guards working "outbound (checking
trucks into the yard) and inbound (checking them out)" through a gate. RDC 5250
is a high-intensity rapid-deployment center; a controlled, guard-staffed truck
gate is the HD norm at this facility class.

- **truckGate: TRUE (inferred, flagged uncertain)** — standard for an HD RDC.
- **guardShack: TRUE (inferred, flagged uncertain)** — HD RDC security guards
  staff truck check-in.
- **remoteGs: FALSE** — guard booth assumed present.

## Yard zones & counts
- **Dock doors:** 50+ (~130 estimated).
- **Drop area:** 10–25 band (cloud-obscured, uncertain).
- **Trailers visible:** ~90; **capacity** ~200.
- **Truck gates:** 1.
- **Buildings:** 1.
- **Site area:** 130 acres (authoritative — Monmouth REIT disclosure).
- **Rail:** A rail line runs along the SW edge but no spur enters the property
  — railServed false.

## Other classification notes
- **shipRcvSeparate: TRUE** — dock banks on two different building faces.
- **drivewayLong / preGateStaging / postGateStaging: TRUE** — 130-acre site
  gives deep ring-road approach and ample staging room.
- **fastLaneOpportunity: TRUE** — ~9x land-to-building ratio; abundant unused
  paved/undeveloped width near the entrance for an express lane.
- **scale / multiStep / multipleFacilities: FALSE** — none observed.

## Web findings
HD DC #5250 is confirmed as the Locust Grove RDC (HD careers, SupplierWiki HD
DC list, Work Safety Index). Monmouth REIT's 2020 acquisition release gives the
authoritative size (657,518 sq ft) and acreage (130). HD security-guard
reviews confirm the gated truck-check-in operating model across HD's RDC
network.

## Final confidence
**Medium.** The facility is positively identified and the building, docks, and
yard are characterized, but persistent cloud cover and a blocked public-road
sightline meant the truck gate and guard booth could not be directly observed
— those calls are inferred from HD's standard RDC model and are flagged in
`uncertainFields`. The roster geocode required correction.
