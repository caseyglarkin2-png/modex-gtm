# Deep-Audit Dossier — General Mills, Milwaukee WI (idx 12)

## Facility
- **Name:** General Mills - Milwaukee WI (Gardetto's / Chex Mix snack plant)
- **Type:** Manufacturing Plant (snacks)
- **Address:** 4625 S 6th St, Milwaukee, WI 53221
- **Resolved center:** 42.96105, -87.92190

## Step 0 — Location confirmation
Roster coords (42.96091, -87.920242, ROOFTOP, moved 890 m) landed at the SE
edge of the GM complex. Satellite probing (z16-z20) plus 2025-08 Street View
positively identified a large food-manufacturing complex with numbered loading
docks. Web search confirms General Mills operates the former Gardetto's plant
here (built 1968, acquired by GM 1999, ~260 employees; produces Chex Mix,
Bugles, Gardetto's, Muddy Buddies). Center re-pinned to the complex centroid.

## Key views
- **Wide satellite (z16-17):** GM complex occupies a block between S 6th St
  (east), W Loomis Rd (south), and a service road (north). Main production
  block plus a separate large building and long covered canopies to the west.
- **Tight satellite (z19-20):** North/northwest building face has dock doors
  with trailers backed in; a fenced trailer yard on the northwest side.
- **Street View (2025-08):** The north service road is an open quasi-public
  street — trucks and intermodal trailers (Swift containers) park along it.
  The dock face is brick with numbered bays (21-24+ visible) and trailers
  backed in. A chain-link fence with gates encloses the operational dock yard,
  but there is no barrier arm or guard booth at the property entrance.

## Determinations
- **Truck gate:** FALSE (flagged uncertain). The truck side is an open service
  road off S 6th St with no barrier arm or checkpoint at the property line.
  The dock/trailer yard is fenced with chain-link gates, but those are
  internal yard fences, not a controlled road-frontage entrance.
- **Guard shack:** FALSE. No staffed booth visible at any entrance.
- **Remote GS:** FALSE — no controlled gate.
- **Docks:** 25-50 band (~26 doors). Numbered bays confirmed in Street View;
  ship/receiving not clearly separated into distinct banks.
- **Drop yard:** TRUE — a fenced trailer-storage yard on the northwest side,
  plus trailers staging along the north service road.
- **Campus / multipleFacilities:** TRUE — main block plus a separate large
  west building and covered canopy structures (some west canopies may be a
  non-GM self-storage business; buildingCount flagged uncertain).
- **Staging:** Post-gate staging TRUE (paved yard inside the fence before
  docks); no dedicated pre-gate apron.
- **Driveway:** Long — the service road / yard holds a 3+ truck queue.
- **Urban/Rural:** Urban — dense south-Milwaukee industrial/residential fabric
  (6 miles south of downtown).
- **Rail:** No spur enters the property.

## Yard metrics
- dockDoorCount ~26, trailersVisible ~22, trailerParkingCapacity ~30
- truckGateCount 1, buildingCount ~3, siteAreaAcres ~18
- railServed false

## Web findings
General Mills Gardetto's plant, 4625 S 6th St, Milwaukee WI 53221; (414)
483-6000; built 1968, GM-owned since 1999; ~260 employees; snacks (Chex Mix,
Bugles, Gardetto's, Muddy Buddies) for North American Retail and C&F segments.

## Confidence
**High.** Facility unambiguously identified and corroborated. `truckGate`,
`exitLanes`, and `buildingCount` flagged uncertain — the operational yard is
fenced but road access is uncontrolled, and a west canopy structure may belong
to a separate business.
