# Deep-Audit Dossier — General Mills, Hazleton PA (idx 19)

## Location resolution
- Roster address: 2 Chestnut Hill Drive, Hazleton, PA 18201. Roster geocode
  (40.952909, -75.974562) reportedly moved only 7 m but landed in **downtown
  Hazleton** — a dense residential/commercial grid with no industrial plant.
  That geocode was wrong.
- Web search resolved the true location: 2 Chestnut Hill Drive is in the
  **Humboldt Industrial Park, Hazle Township, PA 18202** (~3 km SW of the
  roster point). A Google Maps directions URL embedded precise coordinates
  ~40.9275, -76.0652. Confirmed center locked there.
- **Ownership note:** the roster's Hyster GM plant list is stale. This bakery
  plant was part of General Mills' frozen-dough / bakeries business, later
  divested (Pennant Foods → Fresh Start Bakeries → Aspire Bakeries). Web
  directories list both "General Mills" and "Fresh Start Bakeries North
  America" at the address. The physical building audited is the correct site.

## Key views
- Wide satellite (z17/z18): a large bakery plant building in the Humboldt
  Industrial Park, with a trailer drop yard on the NW (rows of ~15-25
  trailers), dock activity on the W/N building faces, employee parking on the
  SW, surrounded by woodland. A separate neighboring facility sits to the SW.
- Entrance (z19/z21): the truck access road comes off Chestnut Hill Drive and
  enters the trailer yard as an open paved driveway. No barrier arm, gate, or
  guard booth visible at the property line.
- Dock apron (z18/z20): trailers backed into the W and N building faces.
- No Street View coverage exists inside the industrial park; the only nearby
  pano is at the Chestnut Hill Dr intersection, too far to inspect the gate.

## Gate / guard-shack / dock determinations
- **truckGate = false** (uncertain). The access road enters the property as an
  open driveway — no barrier arm, sliding gate, or checkpoint pinch-point in
  z19-z21 imagery. Flagged uncertain because Street View cannot corroborate.
- **guardShack = false** (uncertain). No staffed booth visible near the
  entrance.
- **remoteGs = false.** No gate → no remote-gate scenario.
- **dockDoors = 10-25.** Doors on the W and N building faces (~6-10 per face),
  trailers backed in. Exact count uncertain.
- **dropArea = 10-25 / dropYard = true.** NW trailer drop yard with ~15-25
  parked trailers.

## Yard zones and counts
- `perimeter`: whole plant parcel, ~22 acres (includes some cleared/undeveloped
  land within the parcel; ~356 m N-S x ~210 m E-W gross).
- `truckGate`: open-driveway entrance area off Chestnut Hill Dr (boxed for
  reference even though no physical gate).
- `dropYards`: one box — NW trailer drop yard.
- `dockAprons`: one box — N/W building dock face.
- `staging`: null (internal yard is open pavement, captured as postGateStaging).
- Metrics: ~18 dock doors, ~24 trailers visible, ~40 capacity, 1 entrance,
  1 building, ~22 acres, not rail-served.

## Web findings
- FoodProcessing.cc / Yelp / business directories confirm a bread & bakery
  products manufacturing plant at 2 Chestnut Hill Dr, Hazle Township; plant
  manager Sean Anderson; phone (570) 384-1200.
- Industrial-park neighbors include Amazon, US Cold Storage, Niagara Bottling,
  ~1 mile from I-81.

## Setting
Rural — edge-of-town industrial park surrounded by woodland and open land.
connectivityIssue = false (near I-81 with major neighboring facilities).

## Final confidence: MEDIUM
Building positively identified and the divested-ownership history explained.
Confidence held to medium because no Street View exists to confirm the
gate/guard-shack call — the truckGate=false and guardShack=false determinations
rest on satellite imagery alone.
