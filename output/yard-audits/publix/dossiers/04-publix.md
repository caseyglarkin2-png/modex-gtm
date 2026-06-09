# Deep-Audit Dossier — Publix Refrigerated DC, Deerfield Beach FL (idx 04)

- **Facility:** Publix Refrigerated DC Deerfield Beach FL
- **Type:** Refrigerated DC (produce, dairy, frozen distribution)
- **Address:** 777 SW 12th Ave, Deerfield Beach, FL 33442
- **Resolved center:** 26.30818, -80.12254
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View + web)

## Step 0 — Location confirmation

The supplied coordinates (26.308146, -80.123169) landed directly on a large
white-roofed distribution complex with extensive trailer parking on all sides —
no correction needed. Web search confirmed the Publix Distribution Center at
777 SW 12th Ave, Deerfield Beach FL 33442 (Yelp/TruckMap/411 listings, phone
(954) 429-0122), described as the warehouse where Publix produce, dairy and
frozen foods are distributed — consistent with a refrigerated DC. The site sits
between a rail line on the west and I-95 / a drainage canal on the east, bounded
by SW 10th St on the south, in the dense Deerfield Beach (Broward County)
industrial fabric. Refrigeration equipment (tanks/condensers) along the west
dock face corroborates the refrigerated-DC type.

## Key views

- **Wide (z16/z17):** Single large connected DC building in the center, a
  separate large building to the north, employee parking on the east, drop
  yards north and southeast, rail buffer west, I-95/canal east.
- **Entrance (z19/z21):** Divided entrance drive off SW 10th St with a gatehouse
  in the median. Painted STOP bars, directional arrows, and IN/OUT/TRUCKS lane
  markings on the pavement. The booth has a distinct teal/green roof.
- **Street View (pano nu1a7-CdR8tF7t-i8oCgBQ, 2024-05):** From the public road
  apron looking north, the entrance splits into a left "Publix VEHICLES" lane and
  a right "TRUCK DELIVERIES" lane around the landscaped gatehouse median; a white
  Publix box truck is captured entering. A staging pano (ilke5VipMTbJmL8ihheLng,
  2024-06) covers the pre-gate apron.
- **North (z17/z18):** Packed trailer drop yard between the two buildings; the
  north building shows its own east-facing dock doors (red door markings).
- **Southeast (z18):** Large angled (herringbone) trailer drop yard full of
  parked trailers, plus an ancillary structure; canal and I-95 beyond.
- **West (z18):** Trailers backed into the west dock face; refrigeration plant;
  rail line behind a green buffer and fence — no spur into the property.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled, lane-marked checkpoint where the divided
  driveway meets SW 10th St. Satellite shows STOP bars, arrows, and IN/OUT/TRUCKS
  text; Street View shows split signed lanes around the gatehouse. Not an open
  driveway.
- **guardShack = true.** A small staffed booth (teal/green roof, ~1-2 stall
  footprint) sits in the entrance median beside the lanes, distinct from the main
  building (visible in z19/z21 satellite and behind the median tree in SV).
  Therefore **remoteGs = false**.
- **entry/exit separate (entryExitSeparate = true).** Inbound and outbound are
  physically split into separate signed lane groups around the gatehouse median
  (Publix VEHICLES vs TRUCK DELIVERIES). Estimated 2 inbound lanes, ~1 outbound
  (exit split partly obscured — flagged uncertain).
- **drivewayLong = true / preGateStaging = true / postGateStaging = true /
  fastLaneOpportunity = true.** The entrance apron is very wide and deep with
  ample stacking room before the booth and unused paved width for an express
  bypass; open paved yard inside the gate provides post-gate queue space.
- **dockDoors = "50+".** ~120 doors (honest overhead estimate) across the main
  building's east, west and south dock banks plus the north building's east face.
- **shipRcvSeparate = true.** Distinct dock clusters on different building faces.

## Yard zones and counts

- **perimeter:** 5-vertex ring around the campus fence line; ~76.4 acres.
- **truckGate:** quad over the divided entrance / gatehouse off SW 10th St.
- **dropYards (2):** north drop yard (~14.5 ac, between the buildings) and the SE
  angled drop yard (~5.4 ac).
- **dockAprons (2):** west apron of the main building and east apron of the main
  building (long thin quads hugging the dock faces).
- **staging:** pre-gate apron between the public road and the booth.
- **yardMetrics:** dockDoorCount 120, trailersVisible ~165, trailerParkingCapacity
  ~200, truckGateCount 1, buildingCount 2, siteAreaAcres 76.4, railServed false.
- **multipleFacilities = true / dropYard = true.** Campus with two large building
  clusters and dedicated trailer-storage lots.

## Web findings

Yelp, TruckMap and 411 listings confirm the Publix Distribution Center at the
address; phone (954) 429-0122; M-F operation; described as the produce/dairy/
frozen distribution warehouse. Driver reviews mention unloading wait times,
consistent with a busy guarded DC.

## Uncertain fields

- **exitLanes** — outbound lane count estimated (median landscaping obscures it).
- **scale** — no truck scale identified, but cannot be fully ruled out from
  overhead imagery.

## Final confidence: high

Imagery clear at z16-z21, Street View available at the gate, facility identity
unambiguous, and the gate/guard-shack/dock calls are all backed by direct visual
evidence.
