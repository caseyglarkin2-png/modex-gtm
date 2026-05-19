# Deep-Audit Dossier — General Mills, Allentown PA (idx 20)

## Location resolution
- Roster address: 2132 Downyflake Ln, Allentown, PA 18103.
- Roster geocode moved 88 m (ROOFTOP) and resolved correctly onto the large
  industrial building. Locked center ~40.5708, -75.4779.
- Web search confirms a General Mills cereal-breakfast-foods manufacturing
  listing at this address.
- **Ownership note:** the roster's Hyster GM plant list is stale. The building
  now carries "AAi" signage — American Atelier Inc., a hospitality/
  institutional furniture manufacturer — and business directories list
  American Atelier at 2132 Downyflake Ln alongside the historical GM listing.
  The physical building audited is the correct site the roster intended.

## Key views
- Wide satellite (z17/z18): a large interconnected industrial building among a
  cluster of similar buildings, with a rail line running NW-SE along the W
  edge. Employee parking on the N. Dock activity on the SW/W face.
- Entrance / parking (Street View, 2024-06): the building's main entrance and
  parking lot open directly onto the public road — "AAi" sign on the facade,
  no fence, no gate, no guard booth.
- SW dock face (z20): a dock canopy with trailers backed in; an open paved
  yard with scattered pallets/material (furniture-manufacturing yard clutter).
- S of the property: a large trailer drop yard exists ~150 m south but belongs
  to a SEPARATE neighboring facility, separated by wooded/grass land.

## Gate / guard-shack / dock determinations
- **truckGate = false** (uncertain). The parking lot and truck yard connect to
  the public road via open driveways — no barrier arm, sliding gate, fence
  line, or checkpoint pinch-point in satellite or Street View imagery. Open
  site. Flagged uncertain.
- **guardShack = false.** No guard booth or staffed structure near the
  entrances.
- **remoteGs = false.** No gate → no remote-gate scenario.
- **dockDoors = 10-25.** Dock activity on the SW/W building face under a dock
  canopy with trailers backed in; exact count uncertain.
- **dropArea = NONE / dropYard = false.** No dedicated on-site trailer drop
  yard for this building; the large drop yard ~150 m south belongs to a
  separate neighbor.

## Yard zones and counts
- `perimeter`: the GM building parcel, ~19 acres (~256 m N-S x ~279 m E-W).
- `truckGate`: open-driveway entrance area from the public road (boxed for
  reference even though no physical gate).
- `dropYards`: [] — none on-property.
- `dockAprons`: one box — SW/W dock-canopy face.
- `staging`: null.
- Metrics: ~12 dock doors, ~5 trailers visible (low activity), ~15 trailer
  capacity, 1 entrance, 1 building, ~19 acres, not rail-served.

## Web findings
- Dun & Bradstreet: General Mills cereal-breakfast-foods manufacturing at
  2132 Downyflake Ln. American Atelier Inc. (furniture manufacturer) is the
  current occupant per Lehigh Valley Chamber and business directories.

## Setting
Urban — within the Allentown metro area in a dense industrial/commercial
district. connectivityIssue = false.

## Final confidence: MEDIUM
Building positively identified and ownership history explained. Confidence
held to medium because the site is now a furniture manufacturer with modest
truck traffic, making the dock-door count an estimate, and the open-site
truckGate=false call rests largely on satellite plus a single parking-lot
Street View pano.
