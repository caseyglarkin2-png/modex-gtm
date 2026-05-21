# Deep-Audit Dossier — idx 11

## FedEx Ground Hub — Lewisberry PA
- **Type:** Ground regional sortation hub (Harrisburg market)
- **Roster address:** 510 Industrial Dr, Lewisberry, PA 17339
- **Locked coordinates:** 40.16450, -76.84050
- **Confidence:** high

## Step 0 — Location confirmation
The geocoded roster point (40.16478, -76.840081, ROOFTOP, moved 1111 m) landed
directly on a large industrial property. Wide z16/z17 satellite shows an
unmistakable FedEx Ground sortation hub: a long NE-SW central building ringed
by hundreds of trailers, multiple dock aprons and tractor lots. Street View on
the SW road (Industrial Dr) confirmed FedEx-branded trailers behind the tree
screen. Identification is positive — no relocation needed.

## Key views
- **z16/z17 overview:** Triangular ~62-acre property. Central sort building
  plus a secondary dock building to the NW; employee car parking on the E side;
  woods and a retention pond bounding the W/SW.
- **z20 truckent crop:** Central building shows a dense, regular rhythm of dock
  doors on both long faces with trailers backed in — a 50+ door facility.
- **z19/z20 gatehouse crop (~40.1640,-76.8358):** A multi-lane gate canopy
  with lane separators spans the E-side access driveway; a small white guard
  booth sits beside the lanes.
- **z21 gatetight crop:** Confirms the guard booth (≈1-2 vehicle footprint) and
  multiple controlled lanes with barrier/gate equipment and lane markings.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled multi-lane gate canopy on the E access road,
  clearly a checkpoint pinch-point with lane markings.
- **guardShack = true.** Small dedicated booth beside the gate lanes, separate
  from the main building. `remoteGs` therefore false.
- **dockDoors = 50+.** Continuous dock-door banks on both faces of the main
  building plus the secondary NW building; estimated ~150 doors total.
- **fastLaneOpportunity = true.** Wide gate apron with spare paved width for an
  express bypass lane.

## Yard zones and counts
- **perimeter:** whole triangular property inside the fence/wood line, ~62 ac.
- **truckGate:** the E-side gate-canopy / guard-booth area.
- **dropYards:** three large trailer-storage blocks (N rows, W/central rows,
  S edge rows) — hundreds of bare trailers.
- **dockAprons:** the two strips fronting the main sort building's long faces.
- **staging:** paved holding area inside the gate before the dock aprons.
- **Metrics:** ~150 dock doors, ~320 trailers visible, ~420 trailer capacity,
  1 truck gate, 4 buildings, ~62 acres, no rail spur.

## Web findings
Roster source: Yelp / Loc8NearMe listing for FedEx Ground at 510 Industrial Dr,
Lewisberry PA — consistent with a Harrisburg-market ground sortation hub. The
overhead footprint (long automated-sort building, very large drop-yard) matches
a regional ground hub.

## Final confidence
**High.** Facility unambiguous, gate and guard booth clearly resolved at z21.
Low-confidence items: exact entry/exit lane split (tree/shadow cover) and the
precise dock-door count — flagged in `uncertainFields`.
