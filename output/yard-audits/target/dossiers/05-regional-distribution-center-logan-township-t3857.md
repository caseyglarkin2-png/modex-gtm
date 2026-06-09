# Deep-Audit Dossier — Target Regional Distribution Center Logan Township (T3857)

- **Type:** RDC (Target regional fulfillment / flow center)
- **Address:** 300 Creekview Ave, Bldg H, Logan Township, NJ 08085
- **Resolved center:** 39.78155, -75.34450
- **Confidence:** HIGH
- **Method:** deep-audit (satellite z16–z21 + Street View + web)

## 1. Location confirmation
The geocoded point (39.781271, -75.344213) landed directly on the correct
building. Web search confirms 300 Creekview Ave is Target's ~1.1 million sq ft
Logan Township flow/distribution center (re-nj.com $265M sale; Target corporate
job posting T3857; warehouse.ninja listing; Waze/TruckMap entries). Satellite
imagery shows a single very large rectangular DC whose footprint fills the z17
frame — fully consistent with a 1.1M sq ft RDC. No risk of auditing a neighbor:
the building is unmistakable and matches the parcel/news description.

The building long axis runs NNW–SSE, rotated roughly 20° clockwise from north.
The property sits between wetlands/open water to the west and a Rt 322 / I-295
interchange ramp to the southeast; Creekview Ave bounds the north side.

## 2. Key views
- **wide-z16 / fullsite-z17** — whole property: main building, north drop yard,
  Creekview Ave, divided road and highway interchange to the SE.
- **west-face z18 / SW-corner z18** — continuous line of trailers backed into
  dock doors along the entire west wall; dock apron strip against the wetland.
- **east-face z18** — east side is employee/auto parking (rows of cars), NOT
  docks → single-sided dock building.
- **dropyard z18 / NW-corner z18** — separate fenced trailer-storage lot north
  of the building, packed with rows of parked trailers; its own gated access.
- **gatehouse / checkpoint z20 / canopy z21** — the south truck entrance.

## 3. Gate / Guard-shack / Remote determinations
- **truckGate = TRUE.** The south entrance (≈39.7787, -75.3421) shows a wide
  overhead canopy spanning multiple truck lanes with lane striping running
  through it, where the looping access drive from the interchange ramp meets
  the property. A controlled, channelized checkpoint — not an open driveway.
- **guardShack = TRUE.** A booth island sits beneath the canopy between the
  lanes (small white structure, ~1–2 stall footprint, separate from the main
  building ~700 m north). Classic staffed gatehouse with canopy.
- **remoteGs = FALSE.** A physical staffed booth is present, so this is a
  manned gate, not a kiosk/app-only remote check-in.
- Street View confirms the gate area sits on a private drive off the
  interchange ramp (public pano ~60 m east, captured 2026-04, shows the gate
  canopy/building through roadside trees but cannot enter the private lane).

## 4. Docks, yard zones, counts
- **dockDoors = 50+.** Trailers backed in along the full ~700 m west wall plus
  the NW face; comfortably 100+ doors. Estimated dockDoorCount ≈ 120.
- **dropArea / dropYard = 50+ / TRUE.** Dedicated fenced drop yard north of the
  building filled with rows of parked trailers (100+ stalls), distinct from the
  active west dock apron. Additional trailer storage with solar carports sits
  near the SW gate area.
- **dockApron** — long thin paved strip along the west wall (traced).
- **shipRcvSeparate = FALSE.** Single-sided docks (west only); east is parking.
- **postGateStaging = TRUE** — large paved yard inside the gate before docks.
- **drivewayLong = TRUE / backupSensitive = FALSE** — long looping approach
  from the ramp gives deep truck stacking; queue won't spill onto a public road.
- **fastLaneOpportunity = TRUE** — wide multi-lane canopied gate apron.
- **scale = FALSE, multiStep = FALSE, rail = FALSE, multipleFacilities = FALSE.**
- **urbanRural = Rural** — edge-of-town Logan Township amid farmland/wetlands.

## 5. yardMetrics (overhead estimates)
- dockDoorCount ≈ 120 | trailersVisible ≈ 240 | trailerParkingCapacity ≈ 200
- truckGateCount 1 | buildingCount 1 | siteAreaAcres ≈ 78 | railServed false

## 6. Web findings
- ~1.1M sq ft Target flow/fulfillment center; sold in a ~$265M deal (re-nj.com).
- Hiring hub (T3857) serving NJ/PA/DE metro; thousands of associates.
- Strategically sited at the NYC–DC midpoint with Philadelphia metro access.

## 7. Confidence
HIGH. Building identity is certain; gate, guard booth, single-sided west docks,
and north drop yard are all clearly visible in tight satellite imagery. Only the
precise inbound/outbound lane split at the gate is uncertain (listed in
uncertainFields) — it does not affect the core gate/guard/dock verdicts.
