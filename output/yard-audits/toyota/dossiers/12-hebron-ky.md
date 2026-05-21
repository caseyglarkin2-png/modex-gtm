# North American Parts Center Kentucky (NAPCK) — Hebron, KY

**Roster idx:** 12
**Facility type:** Parts procurement & distribution hub
**Address:** 2450 Wright Blvd, Hebron, KY 41048
**Resolved center:** 39.05330, -84.70900
**Confidence:** Medium

## Location confirmation

The roster geocode (39.053725, -84.707684, ROOFTOP) lands directly on a very
large distribution warehouse in the Hebron, KY industrial corridor near CVG
airport. Web research confirms NAPCK at 2450 Wright Blvd, Hebron — Toyota's
North American Parts Center Kentucky, a critical logistics hub that handles
the flow of 117,000+ service parts and accessories between assembly plants /
suppliers and 12 US Parts Distribution Centers. The building's scale (a huge
single-footprint warehouse with extensive dock banks and trailer yards) is
fully consistent with a national parts hub.

## Key views

- **Wide satellite (z16):** A massive single distribution warehouse with
  trailers backed in along the SW long face, extensive trailer drop yards to
  the SW and SE, and employee parking on the NE.
- **Building (z17-18):** Long dock banks with dozens of trailers backed in;
  large paved roof; truck aprons on the SW and SE faces.
- **SW drop yard (z19):** A cul-de-sac trailer-storage lot packed with rows of
  parked trailers.
- **SE area (z18):** Additional trailer rows and dock-side trailers.
- **Street View (2024-25):** NAPCK building (red-banded) set back from Aero
  Pkwy behind employee parking; a TransX trailer parked on the access road
  shoulder confirms heavy carrier traffic; the truck-side dock area is
  tree-screened from the public road.

## Gate / guard-shack determination

- **truckGate = true.** A large fenced Toyota parts hub set back from the
  public road; a controlled access road funnels carrier traffic onto the
  property. Truck access is gated.
- **guardShack = true (uncertain).** Set true on the strong operational prior
  that NAPCK — a critical national Toyota parts hub feeding 12 PDCs — runs a
  staffed truck-gate checkpoint. A distinct freestanding booth could not be
  positively isolated in the imagery because the truck-side access is
  tree-screened from public Street View coverage. Flagged in
  `uncertainFields`.
- **remoteGs = false** on the same logic; the guard-shack vs. remote-check-in
  split is the genuinely uncertain call here.
- One combined entry/exit (entryExitTogether); long approach drive
  (drivewayLong) with room inside the gate for staging (postGateStaging).
  Wide internal truck roads leave room for a fast lane.

## Yard zones and counts

- **Perimeter:** ~93 acres capturing the warehouse, drop yards, and parking.
- **Drop yards:** Two large trailer-storage areas — a SW cul-de-sac lot and a
  SE row complex — holding many dozens of trailers. dropArea band 50+,
  dropYard = true.
- **Dock doors:** A very large DC with dock banks on the SW and SE building
  faces — band 50+; the docks on two distinct faces suggest separate
  inbound/outbound clusters (shipRcvSeparate = true, medium confidence).
- **Buildings:** One single very large warehouse — not a multi-building
  campus.
- **Rail:** No rail spur into the property — railServed = false.
- **Setting:** Hebron, KY industrial corridor near CVG airport — edge-of-town
  industrial amid open land and other big-box DCs; classified Rural per the
  rubric. CVG corridor has good connectivity, so connectivityIssue = false.

## Web findings

- NAPCK: Toyota's North American Parts Center Kentucky — handles 117,000+
  service parts and accessories, supplying 12 US Parts Distribution Centers.
  A critical national logistics hub bridging assembly plants/suppliers and the
  downstream PDC network. Operates extended hours across the week.
- Sources: Toyota USA Newsroom ("Parts in Motion: Inside the North American
  Parts Center Kentucky Operations"), Northern Kentucky Chamber of Commerce,
  Chamber of Commerce / Waze listings.

## Final confidence: Medium

The facility is positively identified and is unambiguously a large controlled
fenced parts-distribution hub with extensive docks and drop yards. The
guard-shack vs. remote-check-in distinction could not be visually confirmed —
the truck gate is tree-screened from Street View — so `guardShack`,
`remoteGs`, and the count fields are flagged for human review.
