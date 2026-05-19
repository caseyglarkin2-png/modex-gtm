# FedEx Ground Dallas Hub - Hutchins TX (idx 13)

## Resolved location
- **Audited center:** 32.65760, -96.70650 — FedEx Ground Dallas Hub, 1101 E Cleveland St,
  Hutchins TX (Dallas metro logistics corridor, east of I-45).
- **Roster coordinate** (32.656667, -96.706918) moved 1.4 km from the listed address
  (GEOMETRIC_CENTER geocode) but landed correctly on the hub.
- **Confirmed FedEx** by direct Street View branding: "FedEx" on the building face (2026
  Street View). Web research confirms one of the largest FedEx Ground hubs: 720,000+ sq ft on
  a 102-acre site, ~230,000 packages/day, ~1,600 workers.

## How it was confirmed / building identification
- Step 0 satellite (z15-z17) showed a large sort building with a distinctive blue
  solar-paneled roof, ringed by extensive trailer-parking fields, inside an industrial campus.
- The campus also contains several neighboring large warehouses with different occupants, so
  the perimeter box was drawn to enclose only the FedEx property (the solar-roof building and
  its surrounding trailer fields and parking).

## Key views
- **z15-z16:** the FedEx hub at the center of a logistics campus beside I-45; trailer fields
  on the north, west and south; employee parking on the south/southwest; drainage canals and
  retention ponds bordering the property.
- **z17-z19:** continuous dock banks with hundreds of FedEx trailers backed in along multiple
  building faces; ancillary buildings near the northeast.
- **Street View (2026, perimeter roads):** confirmed FedEx branding; a continuous chain-link
  perimeter fence with barbed-wire top enclosing the whole site; employee parking visible
  inside the fence.

## Gate / guard-shack / dock determinations
- **truckGate: true.** The site is fully enclosed by chain-link fence with barbed wire
  (definitively confirmed in multiple Street View frames). The campus is controlled-access via
  private roads.
- **guardShack: true (medium conf).** A guard booth could not be isolated in satellite — the
  truck gate sits deep inside the secured campus and Street View does not penetrate it. Marked
  true because a fenced FedEx Ground regional hub of this magnitude (one of the network's
  largest) is universally guard-staffed at its truck entrance. Flagged in uncertainFields.
- **remoteGs: false** (guard shack assumed present).
- **truckGateCount: 2 (estimate).** Separate employee-vehicle and truck-yard entrances are
  typical at hubs this large.
- **drivewayLong: true.** Long private access roads and deep paved internal yard approaches.
- **fastLaneOpportunity: true.** Very large paved gate/yard aprons with bypass-lane width.
- **postGateStaging: true.** Large paved holding/queue areas inside the fence before the docks.
- **dockDoors: 50+ (~280 estimated).** Continuous dock banks on multiple building faces.
- **dropArea: 50+ / dropYard: true.** Vast trailer-parking fields wrapping the building.
- **shipRcvSeparate: false.** Single integrated sort building.
- **scale: false / multiStep: false.** No truck scale or second checkpoint observed.

## Yard zones and counts
- **perimeter:** ~103-acre box (documented 102-acre site) around the FedEx building and yard.
- **truckGate:** boxed best-effort at the south/southwest campus entry.
- **dropYards:** three boxes — north field, east field, west/southwest field.
- **dockApron:** one box along the main dock banks.
- **staging:** left null (post-gate holding folded into the dock-apron/yard).
- **yardMetrics:** ~280 dock doors, ~700 trailers visible, ~850 capacity, ~2 truck gates,
  1 building, ~103 acres, no rail spur.

## Web findings
- FedEx Ground Dallas Hub, Hutchins TX: 720,000+ sq ft on 102 acres; one of the largest and
  busiest FedEx Ground facilities; processing capacity raised from 200,000 to 230,000+
  packages/day; ~1,600 package handlers and workers. (MHL News, FleetOwner, FreightWaves,
  Flintco project pages, City of Hutchins.)

## Final confidence: high
Facility identity (FedEx-branded), scale, layout, perimeter fence and controlled entry are
clearly evidenced. Guard-shack call is medium-confidence (booth not isolated in imagery);
dock/trailer/gate counts are honest estimates — all flagged in uncertainFields.
