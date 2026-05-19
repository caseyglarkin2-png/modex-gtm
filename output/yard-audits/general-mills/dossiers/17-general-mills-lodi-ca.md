# Deep-Audit Dossier — General Mills Lodi CA (idx 17)

## Resolved location
- Roster facility: General Mills, Lodi CA. Resolved to the former **General
  Mills Lodi Cheerios plant at 2000 W Turner Rd, Lodi, CA 95242**.
- Locked center: **38.14280, -121.30030**. Satellite confirms a sprawling
  ~1.1M sq ft multi-building industrial complex on 66+ acres fronting the south
  side of W Turner Rd — consistent with a former cereal manufacturing plant.
- **Facility status note:** General Mills closed the Lodi Cheerios plant in
  2015. The complex is now a repurposed multi-tenant industrial property
  (Bond Manufacturing and other tenants). It was audited as the physical
  freight site at the roster address; classification reflects the yard as
  imaged.

## Key views
- **Overview (z17-18):** The plant occupies a large block bounded by W Turner
  Rd on the north and single-family residential streets on the other three
  sides. Multiple connected/adjacent industrial buildings form the core; a
  long dock-served wing runs along the north frontage; a large numbered
  trailer drop yard sits on the west side, and process/utility structures
  cluster on the east/southeast.
- **Truck entrance (z19 + 2025-02 Street View):** Truck driveways open off W
  Turner Rd. The property is fully enclosed by continuous chain-link fence;
  the entrances are gated openings (rolling chain-link gates). Street View
  facing the yard (heading S) shows the chain-link-fenced yard with a red
  tractor and trailers backed against the building docks, plus a row of dry
  vans parked along the fence. No standalone guard booth is visible at the
  road. Gates were not clearly closed in the 2025-02 capture — medium
  confidence on the gate call.
- **Docks (Street View + z18-20):** The long north building face (along W
  Turner Rd) carries an extended dock bank — 30+ doors visible behind the
  frontage trees in Street View. A separate rail-served dock cluster sits on
  the east face.
- **Drop yard (z18-19):** The west-side yard holds two long rows of trailers
  (well over 50 visible) on a vast paved apron — the numbered trailer drop
  area cited in the property listing.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The property is fully enclosed by continuous chain-link
  fence; the truck driveways off W Turner Rd are gated openings with rolling
  chain-link gates. Medium confidence — gates not clearly closed in 2025
  Street View. Flagged uncertain.
- **guardShack = false / remoteGs = true.** No standalone guard-booth structure
  is visible at any entrance in satellite or Street View. As a repurposed
  multi-tenant site, check-in is implied to be tenant/self check-in at gated
  driveways. Flagged uncertain.
- **dockDoors = "25-50".** ~45 doors estimated — the north face shows 30+ doors
  in Street View, plus the east-face rail-served dock cluster. Honest band
  estimate. Flagged uncertain.
- **shipRcvSeparate = true.** Dock banks are split between the long north face
  along W Turner Rd and a separate rail-served dock cluster on the east face.
- **dropYard = true / dropArea = "50+".** A large numbered trailer drop yard on
  the west side; the property listing cites 196 trailer drops — firmly 50+.
- **railServed = true.** A UP Rail spur runs into the property; a
  railroad-crossing sign is visible on W Turner Rd at the dock face in Street
  View, and listings confirm UP Rail service.

## Yard zones and counts
- **perimeter:** ~61 acres inside the chain-link fence line
  (38.14130,-121.30330 → 38.14555,-121.29730).
- **truckGate:** gated driveway opening off W Turner Rd on the northwest side.
- **dropYards:** (1) the large numbered west-side trailer drop yard.
- **dockAprons:** (1) the long north-face dock apron along W Turner Rd;
  (2) the rail-served east-face dock cluster.
- **staging:** not separately boxed — the vast paved yard inside the gate
  serves as post-gate staging (postGateStaging = true; deep aprons →
  drivewayLong).
- **yardMetrics:** ~45 dock doors, ~60 trailers visible, ~196 trailer capacity
  (per listing), 2 truck gates, 4 buildings, ~61 acres, rail-served.

## Web findings
- General Mills closed the Lodi Cheerios plant in 2015 after decades of
  operation. The ~1.1M sq ft complex on 66+ acres was subsequently marketed and
  repurposed as a multi-tenant industrial property (Bond Manufacturing among
  the tenants). Property listings for the site cite UP Rail service and ~196
  trailer drop positions — both used to corroborate this audit.

## Confidence
**Medium.** The facility is positively identified and the building footprint,
fence line, drop yard, rail service, and dock faces are clear from satellite +
2025-02 Street View. Confidence is held at medium because: the site is a closed
plant repurposed for multi-tenant use, so gate operation and check-in cannot be
firmly characterized (`truckGate`, `remoteGs`, `entryLanes`, `exitLanes`,
`truckGateCount` flagged uncertain in the site JSON); and the dock-door count is
an approximate band estimate (`dockDoorCount` flagged uncertain).
