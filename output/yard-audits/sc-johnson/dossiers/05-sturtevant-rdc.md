# Deep-Audit Dossier — SC Johnson Sturtevant Regional Distribution Center

**Facility:** Sturtevant Regional Distribution Center
**Address:** 2600 Enterprise Dr, Sturtevant, WI 53177
**Resolved center:** 42.70360, -87.91160
**Type:** Regional Distribution Center (aerosol storage)
**Audit method:** Satellite (z16–z20) + Street View (Jun 2019) + web research
**Confidence:** High

---

## 1. Location resolution

The roster supplied coordinates of 42.704751, -87.90962 (geocode moved 1,024 m).
Those coordinates land on the **NE office/parking corner** of the property, not
the building footprint. Satellite probing around the point identified the
correct structure ~250 m to the SW: a single very large white-roof warehouse.

Identity confirmed via the **EPA Risk Management Plan record** for the
"Sturtevant Regional Distribution Center" at 2600 Enterprise Dr and
LoopNet / Colliers / CommercialCafe listings: a **552,000 sq ft SCJ-owned
aerosol-storage warehouse**, LEED-Gold, 32-ft clear height, **55 loading docks
and 118 tractor-trailer staging positions**. The RMP exists because the
building stores LPG-propellant (propane/butane/isobutane) aerosol finished
goods. The site sits adjacent to the Waxdale plant complex, ~1 km SW of the
roster point. Locked center: 42.70360, -87.91160.

## 2. What the key views showed

- **Wide satellite (z16–z17):** A single dominant warehouse running E–W, with a
  separate smaller SCJ-occupied building immediately to the SW inside the same
  fenced parcel. Office and employee parking with a retention pond occupy the
  NE corner. Truck aprons wrap the north and south long faces.
- **Tight satellite (z18–z20), south face:** A continuous bank of dock doors
  with many trailers backed in (orange/blue trailers clearly visible). A wide
  paved drop yard runs the full length of the south face with parked trailers.
- **Tight satellite, north face:** A second continuous dock bank with trailers
  backed in and a north drop yard — this is a **cross-dock** building.
- **Street View along Enterprise Dr (south, Jun 2019):** The south drop yard is
  fully enclosed by **chain-link perimeter fencing** — multiple headings show
  continuous fence with J.B. Hunt / Schneider trailers parked directly behind
  it. The road is a public industrial street.
- **Street View, NE/E access road:** The perimeter loop road circles the
  building; office parking on the NE; no staffed booth at any point walked.

## 3. Gate / guard-shack determination

- **truckGate = true.** The truck yards on both long faces are enclosed by a
  continuous chain-link perimeter fence with gate openings where the internal
  loop road enters the yards. This is a controlled-access fenced compound, not
  an open driveway.
- **guardShack = false.** No staffed booth (1–3-vehicle footprint, multi-window
  structure) was found at any gate across the multiple Street View headings
  walked along the south, east and NE roads.
- **remoteGs = true.** Gate present, no guard shack → entry is controlled by the
  gates/fence with remote check-in (kiosk / badge / app) implied. The whole
  parcel is SCJ-owned, so access control is at the yard fence rather than a
  public-road booth.
- **multiStep = false** (no second checkpoint observed; flagged as not fully
  confirmable from overhead imagery).

## 4. Yard zones and counts

- **Perimeter:** Captures the 552k sq ft warehouse, both north and south truck
  yards, the SW secondary building, and the NE office/parking. ≈ 33 acres.
- **Drop yards:** Two — one along the full south face, one along the full north
  face — both full of parked trailers without tractors.
- **Dock aprons:** Two, one per long face, in front of the continuous dock
  banks.
- **dockDoorCount ≈ 60** (web research confirms 55 docks; cross-dock split N/S).
- **trailersVisible ≈ 70** across the captured imagery.
- **trailerParkingCapacity ≈ 118** (web research: 118 staging positions).
- **truckGateCount = 2** (south-yard gate + north/east loop gate).
- **buildingCount = 2** (main RDC + SW secondary SCJ building).
- **railServed = false** — no rail spur runs into the parcel.

## 5. Web findings

EPA RMP "Sturtevant Regional Distribution Center" — storage/distribution
warehouse for SC Johnson aerosol consumer products; LPG propellant on site
drives the RMP filing. LoopNet/Colliers/CommercialCafe: 552,000 sq ft,
LEED-Gold NC+EB, 32-ft clear, 55 docks, 118 trailer staging positions, 12,000
tons of bottom ash in the sub-base, 100% renewable electricity. Riley
Construction lists the Johnson/Diversey distribution center as a project. The
site is an SCJ-owned RDC adjacent to the Waxdale aerosol plant.

## 6. Final confidence

**High.** Building identity, footprint, dock layout and metrics are all
corroborated by both imagery and web sources. The fenced-compound /
remote-check-in classification is well supported by Street View. Lane counts
and `multiStep` are the only soft fields (flagged in `uncertainFields`).

**3-line summary**
- Gate: TRUE — chain-link-fenced truck compound, gate openings on the loop road.
- Guard shack: FALSE — no staffed booth at any gate → remote check-in (remoteGs).
- Confidence: HIGH.
