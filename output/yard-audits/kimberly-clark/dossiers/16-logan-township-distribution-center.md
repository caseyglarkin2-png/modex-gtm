# Deep-Audit Dossier — idx 16

## K-C Logan Township Distribution Center — Logan Township, NJ

**Roster coords:** 39.747335, -75.310914 (APPROXIMATE — WRONG, see below)
**Locked center:** 39.7385, -75.4135
**Type:** Distribution center (~600,000 sq ft, LEED-certified)
**Gate verdict:** No truck gate / no guard shack visible — open driveways
**Archetype:** No-Gate DC with large drop yard and split ship/receive
**Confidence:** MEDIUM

---

## Step 0 — Location confirmation (coordinates corrected)

The roster coordinates landed in the **Bridgeport residential village**, a
small-town street grid ~9 km NE of the actual facility — clearly not a
distribution center. Geocode was APPROXIMATE and wrong.

Web research resolved the true site. Blue Rock Construction (the DC's general
contractor) and Trident Sustainability both document the facility as
**"Building GHI at LogistiCenter at Logan"**, a 599,500 sq ft, LEED-certified
build-to-suit developed by Dermody Properties in 2007 for Kimberly-Clark, at
**2651 Oldmans Creek Road, Logan Township NJ 08085**, just off I-295. Multiple
later sources show Amazon leased ~1M sq ft at the same 2651 Oldmans Creek Rd
address (Amazon fulfillment center "TEB3"). The building audited here is that
DC structure — the facility the roster targets — regardless of current tenant.

Satellite probing of the LogistiCenter at Logan / Logan North logistics park
located a single large white-roofed warehouse, oriented N–S, at ~39.7385,
−75.4135. Its footprint (~450–510 m × ~130–190 m) is consistent with a
single-tenant ~600k–1M sq ft DC. Coordinates locked there.

## Steps 1–3 — Imagery review

- **Wide / mid satellite:** A dense Class-A logistics park (LogistiCenter at
  Logan) of many big-box warehouses, set among farmland on the rural SW edge of
  Gloucester County, hugging the I-295 corridor.
- **Tight satellite (z16–z19):** The locked building is a long N–S DC with a
  near-continuous line of dock doors on BOTH its east and west long faces,
  trailers backed in along each. North end is the office front with employee
  parking; trailer drop-yard lanes lie south of the building and along the east
  yard, full of parked trailers without tractors.
- **Street View (2019-09, 2019-10 and 2026-04):** The building fronts a public
  road with open driveways and landscaped employee parking — no perimeter
  fence, no barrier arm, no guard booth at the property line. A blue
  "TRUCK ENTRANCE" directional sign marks the truck route into the yard, but
  the entrance itself is uncontrolled. The dock face is visible up close from
  the road (trailers backed in, blue/white building band).

## Gate / guard-shack / dock determinations

- **truckGate = false** — No barrier, sliding gate or pinch-point checkpoint
  visible at the property line in any imagery. Open driveways only. *Low
  confidence* — a manned booth could sit deeper in the yard beyond Street View
  reach; flagged in `uncertainFields`.
- **guardShack = false** — No booth structure observed.
- **remoteGs = false** — No gate, so no remote check-in implied.
- **dockDoors = 50+** — Continuous dock banks down both ~450–510 m long faces;
  overhead estimate ~110 doors total (loose).
- **shipRcvSeparate = true** — Two dock banks on opposite (physically separate)
  building faces.
- **dropYard = true / dropArea = 50+** — Dedicated trailer-storage lanes south
  of and east of the building, full of parked trailers without tractors.
- **postGateStaging = true, drivewayLong = true** — Deep paved truck approach
  with 3+ trucks of stacking room inside the property before the docks.
- **fastLaneOpportunity = true** — Wide paved yard aprons leave room for an
  express/bypass lane.

## Yard zones & metrics

- **Perimeter:** ~39.7340–39.7423 N, −75.4162 to −75.4108 W — the full DC
  property: building, both dock aprons, north employee parking, south drop
  yard. ≈ 101 acres.
- **truckGate:** Small box at the NE entrance driveway off the public road.
- **dropYards:** Two — the south trailer lot and the east trailer-storage yard.
- **dockAprons:** Two — one along the east dock face, one along the west.
- **yardMetrics:** dockDoorCount ~110, trailersVisible ~130, capacity ~150,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~101, railServed false. All
  counts are honest overhead estimates; door/capacity counts flagged
  low-confidence.

## Web findings

- 599,500 sq ft LEED-certified build-to-suit, Dermody Properties, 2007, for
  Kimberly-Clark — "Building GHI at LogistiCenter at Logan."
- LogistiCenter at Logan is a 1,100-acre, Class-A master-planned business park,
  ~5.5M sq ft planned, off I-295 ~10 min from NJ Turnpike Exit 2.
- Amazon later took ~1M sq ft at 2651 Oldmans Creek Rd (FC "TEB3").

## Final confidence

**MEDIUM.** The facility is positively identified and the yard layout, docks
and drop yards are clearly read from current imagery. Confidence is held at
medium because (a) the roster coordinates were wrong and the building was
resolved by address research rather than a precise geocode, and (b) the
truck-gate / guard-shack determination relies on Street View that may not reach
a checkpoint deeper inside the yard.
