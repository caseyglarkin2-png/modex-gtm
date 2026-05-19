# Deep-Audit Dossier — Bob Evans Farms, Lima OH Plant

**Facility:** Bob Evans Farms - Lima OH Plant
**Type:** Manufacturing plant (refrigerated sides — mashed potatoes & macaroni
& cheese; former Kettle Creations facility)
**Address:** 651 Commerce Pkwy, Lima, OH 45804
**Resolved coordinates:** 40.696800, -84.095300
**Confidence:** High
**Archetype:** Gate + Remote GS (no guard shack)

## Location confirmation (Step 0)

The supplied geocode (40.696965, -84.095537, ROOFTOP) landed on the large plant
building. Satellite at z16-z20 shows a single very large connected
food-processing building with extensive trailer parking. Street View along
Commerce Pkwy (captured 2024-10) shows the building branded "Bob Evans" in red
script on the west elevation — positive ID. Note: the smaller white building
immediately to the west is a separate company, "Logoplaste" (plastics
packaging), clearly labeled in Street View — it was excluded from the audit.
Web research confirms 651 Commerce Pkwy is the former Kettle Creations plant,
acquired by Bob Evans in August 2012 for $50M; ~150,000 sq ft after expansions,
~300 employees, 5 production lines, ~130M lb/yr of mashed potatoes and mac &
cheese.

## Key views

- **Wide satellite (z16-z18):** Edge-of-town industrial park on the south side
  of Lima, just south of I-75, surrounded by farm fields. One dominant plant
  building with employee parking on the west and trailer yards on the NE/SE.
- **Tight satellite (z19-z20):** Large south-facing dock bank with ~12-15
  trailers backed in; dedicated trailer-storage lots on the NE corner (rows of
  parked trailers) and SE corner; a stormwater retention pond near the SW
  entrance.
- **Satellite z21, entrance:** A chain-link perimeter fence encloses the
  trailer yard; the truck driveway off Commerce Pkwy crosses the fence at a
  gate opening near 40.6953, -84.0952. No booth structure visible beside it.
- **Street View, Commerce Pkwy (2024-10):** Confirms "Bob Evans" branding, the
  chain-link fence, the trailer yard, and the single truck driveway. Street
  View does not penetrate the private drive.

## Gate / guard-shack / dock determinations

- **Truck gate: TRUE.** Single truck driveway off Commerce Pkwy passes through
  a gate in the chain-link perimeter fence enclosing the trailer yard. Gate
  opening visible in satellite z21.
- **Guard shack: FALSE (uncertain).** No booth structure visible beside the
  gate in satellite z20/z21 or from the road in Street View. The private drive
  is not Street-View-covered, so this is an overhead-imagery call — flagged
  uncertain.
- **Remote GS: TRUE.** Gate present, no guard shack — implies unmanned /
  remote check-in (sliding gate, call-box, or app).
- **Docks: 25-50 band.** Large dock bank on the south building face; ~28 doors
  estimated. Exact count uncertain from overhead angles.
- **Drop area: 50+ band.** Dedicated trailer-storage lots on the NE and SE
  corners, full of parked trailers without tractors — well over 50 stalls.
- **Drop yard: TRUE.** Distinct trailer-storage lots separate from the active
  dock apron.

## Yard zones and counts

- **Perimeter:** ~23.5 acres enclosing the plant building, employee parking,
  dock apron, and the NE/SE trailer-storage lots. Chain-link fenced.
- **Truck gate:** small box at the Commerce Pkwy driveway / fence crossing.
- **Drop yards:** two — NE corner lot and SE corner lot.
- **Dock apron:** the wide paved strip along the south building face.
- **Staging:** post-gate staging exists (long internal drive + wide apron) but
  no discrete pre-gate stall area; staging box left null.
- **yardMetrics:** dockDoorCount ~28; trailersVisible ~55; trailerParking
  capacity ~70; truckGateCount 1; buildingCount 1; siteAreaAcres ~23.5;
  railServed false.

## Web findings

- Former Kettle Creations facility; acquired by Bob Evans August 2012 for $50M.
- ~150,000 sq ft after expansions (50,000 sq ft added ~2013); 5 production
  lines; ~300 employees.
- Processes ~500,000 lb of potatoes/day; ~130M lb/yr finished product (~115M
  lb mashed potatoes), 23+ SKUs of mashed potatoes and mac & cheese.

## Final confidence

**High.** Facility positively identified by on-building branding and corroborating
web research. Gate is clearly present in satellite imagery; guard-shack call is
made from overhead imagery (no booth visible) and flagged uncertain because the
private drive lacks Street View coverage. Dock count and trailer capacity are
honest overhead estimates.
