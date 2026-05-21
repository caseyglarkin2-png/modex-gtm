# FedEx Ground Hub - Hagerstown MD (idx 10)

## Resolved location
- **Audited center:** 39.63850, -77.79150 — FedEx Ground regional sortation hub, 11825 Newgate
  Blvd, Newgate Industrial Park, Hagerstown MD.
- **Roster coordinate** (39.639503, -77.792408) moved 8.4 km from the listed address
  (GEOMETRIC_CENTER geocode) but landed correctly on the hub. Step 0 satellite immediately
  showed a large sort building ringed by trailer fields.
- **Confirmed FedEx** by direct Street View branding: "FedEx Ground" on the building face and
  "FedEx" logos on dozens of trailers backed into the dock doors (2024 Street View on Newgate
  Blvd). Web research confirms the facility: 325,000 sq ft, 114-acre site, ~22,500 packages/hr.

## Key views
- **z15-z16 orientation:** large sort building with trailer-parking fields on the west, north
  and east; rural-edge industrial park surrounded by farmland and woods; a separate large
  blue-roofed warehouse to the northeast (different occupant).
- **z17-z19:** dock doors with FedEx trailers backed in along multiple building faces; partial
  solar panels on the roof; employee parking on the north; ancillary buildings near the
  southeast entry.
- **Street View (Newgate Blvd):** confirmed FedEx Ground branding; a continuous chain-link
  perimeter fence (with a brick retaining wall on the west) enclosing the whole site.
- **Entry:** single private access road off the Newgate Blvd intersection, painted dashed
  lane markings on the approach, a sign monument at the access road.

## Gate / guard-shack / dock determinations
- **truckGate: true.** The site is fully enclosed by a chain-link perimeter fence (confirmed
  in multiple Street View frames). A single controlled private access road serves the site,
  with painted lane markings on the approach.
- **guardShack: true (medium conf).** A guard booth could not be isolated in satellite — the
  checkpoint is set well back from the public road and Street View does not enter the private
  drive. Marked true because a fenced FedEx Ground regional hub of this scale is universally
  guard-staffed at the main entrance; flagged in uncertainFields.
- **remoteGs: false** (guard shack assumed present).
- **drivewayLong: true.** Long private access road plus a deep paved internal approach.
- **fastLaneOpportunity: true.** Wide multi-lane gate apron with bypass room.
- **postGateStaging: true.** Large paved holding area inside the fence before the docks.
- **dockDoors: 50+ (~160 estimated).** Continuous dock banks on multiple faces.
- **dropArea: 50+ / dropYard: true.** Hundreds of trailers in marked rows around the building.
- **shipRcvSeparate: false.** Single integrated sort building.
- **scale: false / multiStep: false.** No truck scale or second checkpoint observed.

## Yard zones and counts
- **perimeter:** ~115-acre box (documented 114-acre site).
- **truckGate:** boxed at the southeast access-road entry.
- **dropYards:** three boxes — west/northwest trailer field, north trailer field, east field.
- **dockAprons:** two boxes along the main building dock banks.
- **staging:** left null (post-gate holding folded into the dock-apron area).
- **yardMetrics:** ~160 dock doors, ~400 trailers visible, ~500 capacity, 1 truck gate,
  1 building, ~115 acres, no rail spur.

## Web findings
- FedEx Ground Hagerstown hub: 325,000 sq ft on 114 acres; processes ~22,500 packages/hour
  with high-speed conveyors and camera scan tunnels; >400 employees/contractors; one of
  FedEx Ground's centralized distribution hubs. (MHL News, FleetOwner, Transport Topics.)

## Final confidence: high
Facility identity (FedEx-branded), layout, perimeter fence and controlled entry are clearly
evidenced. Guard-shack call is medium-confidence (booth not isolated in imagery); dock/trailer
counts are honest estimates — all flagged in uncertainFields.
