# Deep-Audit Dossier — idx 54

## Facility
- **Name:** Harris Teeter Distribution Center, Indian Trail NC
- **Type:** Distribution Center (grocery DC; Harris Teeter / Kroger banner)
- **Address:** 6001 W Hwy 74, Indian Trail, NC 28079
- **Resolved center:** 35.0640, -80.6470
- **Confidence:** high

## Step 0 — Location confirmation
Probed satellite at the supplied approx point (35.065177, -80.645931). A large
industrial DC complex sat directly under it. Web search confirmed Harris Teeter
Distribution Center at 6001 W Hwy 74: open 24/7, scheduled-appointment unloading,
on-site security, overnight parking in a "lower lot." Imagery (very large grocery
DC building + multiple dock buildings + extensive trailer lots) matches a
large-grocery distribution center. Correct building locked.

## Layout
The campus is oriented ~45° (NW–SE), not square to north — the perimeter polygon
and all sub-zones are traced at that true orientation. A massive primary DC
building anchors the west/SW, with two additional dock buildings and dedicated
trailer lots extending NE/E toward the gate. A rail line runs along the SW
property edge (adjacent, no clear spur into the site → railServed false).
Total fenced property ≈ 117.8 acres.

## Gate / guard shack (high confidence)
Street View (captured 2018-11) on the access road at the property entrance shows
the truck checkpoint head-on:
- **Truck gate:** orange/white barrier arms across multiple lanes; a Harris
  Teeter box truck is mid-check-in through the inbound lane.
- **Guard shack:** a small, multi-window staffed booth with signage sits beside
  the gate lanes — classic guard-booth footprint, not the main building.
- **Fencing:** chain-link perimeter fence runs left and right from the gate.
- **Lanes:** ~2 inbound / ~2 outbound at a single combined entry/exit point
  (entryExitTogether). Wide paved apron in front → preGateStaging + room for a
  fast/express lane (fastLaneOpportunity true). Deep gate→dock approach holds a
  3+ truck queue (drivewayLong).

→ `truckGate: true`, `guardShack: true`, `remoteGs: false`.

## Docks & yard
- **Dock doors:** banks of doors with trailers backed in along the main building
  NE face plus two satellite dock buildings → "50+" band (count ~90, estimate).
- **Drop yard:** multiple dedicated lots full of parked trailers (no tractors)
  NE/E of the main building → dropYard true, dropArea "50+".
- **Ship/Rcv separate:** distinct dock banks on different building faces →
  shipRcvSeparate true.
- **Buildings:** ~4 distinct building clusters → multipleFacilities true.
- **Trailers visible:** ~220 across captured imagery; capacity ~300.
- **Scale / multi-step:** no truck scale or second checkpoint observed → false.

## Web findings
TruckMap / Yelp / Foursquare: 24/7 operation, appointment-based unloading
(arrive before 11am or risk reschedule), efficient/friendly security, fast
unloads (often <1 hr), overnight parking in lower lot, restrooms. Consistent
with a guarded, high-throughput grocery DC.

## Setting
Edge-of-town industrial off US-74, surrounded by woods, a pond, and farmland with
some adjacent retail/residential at the highway. Judged **Rural** per the
small-town-industrial tie-break.

## Final confidence: high
Gate, guard shack, and docks are directly visually confirmed. Door/trailer counts
are honest overhead estimates (flagged). Rail-served marked false (adjacent line,
no clear spur).
