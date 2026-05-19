# FedEx Ground Hub - Keasbey NJ (idx 14)

## Resolved location
- **Audited center:** 40.50650, -74.32600 — FedEx Ground regional sortation hub, 6000
  Riverside Dr, Keasbey NJ (Woodbridge Township), on the Raritan River.
- **Roster coordinate** (40.50662, -74.325741) moved 1.2 km from the listed address
  (GEOMETRIC_CENTER geocode) but landed correctly on the FedEx complex.
- **Confirmed FedEx** by direct Street View branding: "FedEx Ground" on the office building
  and on numerous trailers in the yard (2019/2021 Street View). Web research confirms a 24/7
  FedEx Ground Distribution Center / sortation hub at this address.

## How it was confirmed / campus identification
- Step 0 satellite (z15-z18) showed a large logistics complex on the Raritan River. Street
  View at the roster coordinate immediately showed a FedEx office building with FedEx Ground
  trailers behind a chain-link fence.
- The property is a large FedEx Ground campus with **two distinct large sort-building
  clusters** — a northwest building with a big solar roof and a southeast building cluster,
  each with continuous dock banks and surrounding trailer fields — plus a central office
  building with a curved entry canopy. `multipleFacilities` marked true.

## Key views
- **z15-z16:** the FedEx campus between the Raritan River and an industrial area; two large
  solar-roofed sort buildings, vast trailer-parking fields, a large employee parking lot.
- **z17-z19:** continuous dock banks with hundreds of FedEx trailers backed in along multiple
  building faces; the central office building with a curved canopy walkway.
- **Street View (2019/2021):** confirmed FedEx Ground branding on the office and trailers; a
  chain-link-fenced trailer yard behind the office building.

## Gate / guard-shack / dock determinations
- **truckGate: true.** The FedEx trailer yard is enclosed by chain-link fencing (confirmed in
  Street View). The campus is controlled-access via private roads off Riverside Dr.
- **guardShack: true (medium conf).** A guard booth could not be isolated in satellite — the
  truck gate is internal to the secured campus and the available Street View (2019/2021) does
  not penetrate it. Marked true because a fenced FedEx Ground metro hub of this scale is
  universally guard-staffed at its truck entrance. Flagged in uncertainFields.
- **remoteGs: false** (guard shack assumed present).
- **truckGateCount: 2 (estimate).** Separate employee and truck entrances, possibly a gate
  per building cluster.
- **drivewayLong: true.** Long private campus access roads and deep paved internal approaches.
- **fastLaneOpportunity: true.** Very large paved gate/yard aprons with bypass-lane width.
- **postGateStaging: true.** Large paved holding/queue areas inside the fence before the docks.
- **dockDoors: 50+ (~320 estimated across both buildings).** Continuous dock banks.
- **dropArea: 50+ / dropYard: true.** Extensive trailer-parking fields around both buildings.
- **multipleFacilities: true.** Two distinct large sort-building clusters on one campus.
- **shipRcvSeparate: false.** Integrated ground-sort operation.
- **scale: false / multiStep: false.** No truck scale or second checkpoint observed.

## Yard zones and counts
- **perimeter:** ~125-acre box around the developed FedEx campus footprint.
- **truckGate:** boxed best-effort near the office/yard entry.
- **dropYards:** three boxes — west field, central/south field, northeast field.
- **dockAprons:** two boxes along the northwest and southeast building dock banks.
- **staging:** left null (post-gate holding folded into the dock-apron/yard).
- **yardMetrics:** ~320 dock doors, ~750 trailers visible, ~900 capacity, ~2 truck gates,
  2 buildings, ~125 acres, no rail spur.

## Web findings
- FedEx Ground Distribution Center, 6000 Riverside Dr, Keasbey NJ 08832 — a 24/7 FedEx Ground
  sortation/distribution hub serving the NY/NJ metro. No public square-footage/acreage figure
  found; site area estimated from imagery. (TruckMap, Dun & Bradstreet, Foursquare.)

## Final confidence: high
Facility identity (FedEx-branded), campus layout, fenced trailer yard and controlled entry
are clearly evidenced. Guard-shack call is medium-confidence (booth not isolated in imagery);
dock/trailer/gate counts and site area are honest estimates — all flagged in uncertainFields.
