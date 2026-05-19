# Deep-Audit Dossier — Kenco American Standard DC, Hutchins TX (idx 24)

## Resolved location
- Address: 801 E Wintergreen Road, Hutchins, TX 75141
- Locked center: 32.63560, -96.69640 (center of the warehouse)
- Roster coordinate (32.635388, -96.69556, ROOFTOP) landed on the building;
  confirmed correct via satellite + web search.
- A ~625,000 SF Dallas-area distribution center for American Standard Brands
  (kitchen/bath products); Kenco Logistics manages and operates it.

## Key views
- z16/z17 wide: a single very large warehouse in a Hutchins industrial park
  off I-45, with dock doors on all four faces and trailers backed in around
  the entire perimeter — a heavy cross-dock / drop-yard operation.
- z18/z19 all faces: dock banks with trailers backed in on the N, S, E, and W
  faces; long rows of unhitched drop trailers at the north end and around the
  building.
- Street View 2026-02 / 2026-04 (S, W, E roads): a continuous chain-link
  perimeter fence encloses the dock yard on every side; the dock faces sit
  directly behind the fence.

## Gate / guard-shack / dock determinations
- **truckGate: true** — the entire dock yard is enclosed by a continuous
  chain-link perimeter fence on all four sides. Truck access is through sliding
  gates in that fence. Kenco's published scope of work for this site explicitly
  includes "spotter and yard management" and "contract security" — confirming a
  controlled, access-managed yard.
- **guardShack: false** — no dedicated 1-3-car guard booth is clearly visible
  at any gate in the available imagery. Flagged uncertain: "contract security"
  is contracted, so a guard may be posted at a gate not fully resolved.
- **remoteGs: true** — controlled truck gate but no identifiable guard booth,
  implying kiosk / app / posted-security check-in.
- **dockDoors: "50+"** — dock doors on all four faces of a ~625,000 SF building
  with trailers backed in all around; well into the 50+ band (est. ~130).
- **dropArea / dropYard: "50+" / true** — extensive trailer drop yard with long
  rows of unhitched trailers at the north end and around the building.
- **scale / multiStep: false** — no truck scale or second checkpoint visible.
- **multipleFacilities: false** — single very large warehouse on its own
  parcel; adjacent warehouses to the west are separate properties.
- **railServed: false** — no rail spur enters the property.

## Yard zones and counts
- perimeter: the full fenced parcel — approx 54 acres.
- truckGate: SW entrance area off E Wintergreen Road (sliding gate in fence).
- dropYards: north-end trailer storage rows.
- dockAprons: paved strips along the south/east face and the west face dock
  banks.
- yardMetrics: ~130 dock doors, ~130 trailers visible, ~200 trailer capacity,
  1 main truck gate, 1 building, ~54 acres, no rail.

## Web findings
- MHL News / LogisticsOnline: American Standard Brands awarded management and
  operation of its newly-established ~625,000 SF Hutchins, TX distribution
  center to Kenco Logistic Services. Kenco's scope: warehouse inbound/outbound
  operations, repackaging, packaging of toilet kits, spotter and yard
  management, contract security, and material handling equipment.
- Manta / D&B: Kenco American Standard, 801 E Wintergreen Rd, Hutchins TX 75141.

## Final confidence: HIGH
Building positively identified and corroborated by Kenco's published scope of
work. Imagery is clear and recent (2026). The fully fenced/secured yard and
"contract security" confirm a controlled truck gate. The only uncertain calls
are guardShack vs remoteGs (no booth clearly resolved) and exact lane counts.
