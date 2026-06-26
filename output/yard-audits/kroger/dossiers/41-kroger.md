# Deep-Audit Dossier — King Soopers Bakery (idx 41)

**Facility:** King Soopers Bakery (Kroger commercial bakery / bread + cake plant)
**Type:** Bakery Plant
**Address:** 60 Yuma St, Denver, CO 80223 (Valverde neighborhood)
**Resolved center:** 39.71625, -105.01255
**Confidence:** high
**Method:** deep-audit (satellite z16-20 + Street View, 2024-2025 panos)

## Step 0 — Location confirmation
The supplied coords (39.717537, -105.015006) landed in the correct industrial corridor but the longitude was slightly west of the building. Web search confirmed 60 Yuma St = King Soopers Commercial Bakery, a $50-100M Kroger bread/cake manufacturing plant (250-499 employees) in Valverde. Satellite sweep pinned a very large blue-roof + white-roof industrial complex centered ~39.7163, -105.0126. Street View positively confirms the building: KING Soopers branded trailers along the fence, a "King Soopers" facade sign, and a "Now Hiring" banner. The eastern car-salvage lot and the SE Grainger building are separate parcels and were excluded.

## What the key views showed
- **Overview (z17):** Single very large bakery complex (blue roof N, white roof S, contiguous), ~N-S oriented, lightly rotated to the street grid. Trailer yards on the west, a large open paved staging/circulation yard on the north, the east dock wall facing a road, and the south frontage facing Habitat/Athmar park.
- **East dock wall (Street View):** Long continuous bank of ~25-30 loading docks with trailers backed in, behind chain-link fence — the primary ship/receive face. Diagonal trailer docks also present on the east in z18.
- **West (Street View + sat):** Employee parking + trailer drop yard with rows of KING Soopers trailers behind chain-link fence with barbed wire.
- **North (sat):** Big open paved yard for maneuvering/staging and trailer parking, with the active rail line/yard running NE *outside* the property (no spur enters).
- **South:** White-roof wing with docks + employee parking facing the public road and park.

## Gate / guard-shack / dock determinations
- **truckGate = true:** The whole property is enclosed by chain-link fence with privacy screen and barbed wire (verified W, E, NE). Vehicle access is through gated openings — a NE entrance off the main road into the north staging yard, and a west entrance into the trailer yard. truckGateCount = 2.
- **guardShack = false / remoteGs = true:** Street View from six-plus angles (N, NE, E, SE, SW, W; 2024-2025) shows NO staffed guard booth and NO barrier arm at any entrance. Openings read as fenced but open/uncontrolled, implying remote/kiosk check-in. (Flagged uncertain — a booth could sit deeper in the yard out of street-view sight.)
- **Docks = 50+:** East wall alone ~25-30 doors; additional east diagonal docks plus west and south dock banks push the total well past 50. shipRcvSeparate = true (distinct east vs west/south dock clusters).

## Yard zones & counts
- **Perimeter:** ~27.5 acres, traced as an oriented ring following the fence; NE corner rounds where the rail clips it.
- **Drop yards:** West trailer yard (large, KING Soopers trailers) and the north staging/parking yard. dropYard = true.
- **Dock aprons:** Long apron strip along the east dock wall and a secondary apron on the west bank.
- **Staging:** Large paved north yard = post-gate staging (postGateStaging = true); driveway/approach holds 3+ trucks (drivewayLong = true). fastLaneOpportunity = true given the wide open NE apron.
- **Metrics:** ~55 dock doors, ~70 trailers visible, ~120 trailer capacity, 1 building, 2 truck gates, no rail spur into property.

## Web findings
Kroger/King Soopers commercial bakery, 60 Yuma St; bread + cake manufacturing; ~250-499 staff; OSHA + EPA P2 records confirm an active manufacturing plant at this address.

## Final confidence: high
Building identity, scale, dock magnitude, fenced perimeter, and urban setting are unambiguous. Lower-confidence items (flagged): exact guard-shack/remote-gate status, lane counts, and rail-served (rail is adjacent, not connected).
