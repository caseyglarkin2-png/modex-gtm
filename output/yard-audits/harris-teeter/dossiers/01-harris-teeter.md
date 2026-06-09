# Deep-Audit Dossier — Harris Teeter Perishable DC, Indian Trail NC

- **Facility:** Harris Teeter Perishable Distribution Center (refrigerated section)
- **Type:** Perishable DC
- **Address:** 6001 W Highway 74, Indian Trail, NC 28079
- **Resolved center (perishable building):** 35.06564, -80.64932
- **Maps:** https://www.google.com/maps/@35.06564,-80.64932,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite z16-z21 + Street View, 2025-11 panos)
- **Confidence:** high

## Step 0 — Location confirmation & campus split
The supplied coordinates (35.065177, -80.645931) landed near the shared campus
entrance/parking, not on the perishable building. Satellite probing at z16-z17
plus web research (NC Commerce, Perishable News, Harris Teeter job postings for
"Perishable Warehouse Indian Trail Distribution Center") confirmed 6001 W Hwy 74
is ONE shared Harris Teeter DC campus that contains both a perishable
(refrigerated) section and a dry grocery section inside a single connected
mega-structure, plus a separate fleet/fuel/maintenance building near the gate and
a third large building in the SW corner.

The two halves are distinguishable by roof: the **bright white high-albedo cool
roof** on the NW half is the **perishable/refrigerated** section (insulated reefer
roof, reefer trailers backed into its docks); the **grey roof** on the SE half is
the **dry grocery** DC (sister agent). This audit geofences the **perishable
section only** — its building footprint, its NE/NW dock face, and its adjacent
reefer drop yard. The truck gate, ~250 m access drive, and guard shack are shared
by the whole campus and are included because every perishable truck passes
through them.

## Key views

- **z16/z17 campus overview** — established the whole campus: connected white+grey
  mega-DC to the west, trailer drop yards to the NE/SE, fleet/fuel building near
  the entrance, a railroad on the west edge, retention ponds, and a single
  tree-lined access drive running NE to a signalized US-74 intersection.
- **z17/z18 of the main building** — confirmed the white (perishable) / grey
  (grocery) roof split of one connected structure; dock lines run along the NE
  face of both halves.
- **z18/z19 of the perishable section** — continuous dock line on the NE face with
  **reefer trailers** backed in (visible reefer nose units); dock apron wraps
  around the NW corner; a reefer drop/parking lot sits to the NE.
- **z20/z21 of the gate throat** — guard booth beside the lane, a **yellow barrier
  arm**, a channelizing island, and lane markings where the access drive opens
  into the yard.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** The control point is an inner gate at the throat where
  the long private drive meets the yard (not at the public road). Satellite z21
  shows a guard booth, a yellow barrier arm across the lane, and a traffic island.
  Street View pano `LewhTCax-ZFpoxel2VkUmQ` (captured 2025-11) shows the gatehouse,
  a STOP sign, a "CAUTION Pedestrian Crossing" sign, painted lane markings, and
  chain-link perimeter fencing with a retention pond beyond. Unambiguous
  controlled entry.
- **Guard shack — TRUE.** A small staffed booth (~1-2 vehicle footprint,
  multi-window, STOP/check-in signage) sits beside the truck lane at the inner
  gate. Distinct from the main building. Therefore `remoteGs` = false.
- **Docks — "25-50".** ~38 dock doors estimated along the perishable building's NE
  and NW faces, with reefer trailers backed in. Band 25-50 (exact count uncertain
  where the perishable dock line transitions into the grocery section).
- **Ship/Rcv separate — false.** The perishable building works from a single
  continuous dock bank (NE/NW face), not two separate building faces.

## Yard zones & counts (perishable section)

- **perimeter** — oriented 6-vertex ring tracing the white-roof building plus its
  dock apron; ~11.7 acres. (Best single SV frame is the gate; the yard interior
  has no Street View coverage — `ZERO_RESULTS` at the perimeter centroid.)
- **truckGate** — rotated quad on the guarded inner gate throat.
- **staging** — post-gate paved holding yard between the gate and the docks
  (trucks visibly staged here in Street View).
- **dockApron** — long thin rotated quad hugging the NE/NW dock wall at the
  building's angle.
- **dropYard** — reefer trailer drop/parking lot NE of the docks.
- **yardMetrics:** dockDoorCount 38, trailersVisible ~60, trailerParkingCapacity
  ~90, truckGateCount 1, buildingCount 3 (campus), siteAreaAcres 11.7 (perishable
  footprint), railServed false (rail runs along the west edge but no spur enters
  the buildings).

## Classification highlights
- `postGateStaging`, `drivewayLong`, `fastLaneOpportunity` all TRUE — deep yard,
  ~250 m buffered drive, and a wide multi-lane gate apron with unused width for an
  express/bypass lane. `backupSensitive` false (a queue cannot reach US-74).
- `entryExitTogether` TRUE (single gate throat), `entryLanes`/`exitLanes` = 1/1.
- `multipleFacilities` TRUE (perishable + grocery + fleet/fuel + SW building).
- `dropYard` TRUE; `scale` / `multiStep` / `connectivityIssue` false.
- `urbanRural` = **Rural** (edge-of-town Indian Trail on the Charlotte metro
  fringe; rubric tie-break favors Rural). Listed as uncertain.

## Web findings
- Harris Teeter's Indian Trail DC contains both perishable and grocery facilities;
  ~580,000 sq ft, 360+ employees, serving ~104-125 stores across NC/SC/TN/GA/FL.
- A ~50,000 sq ft perishable-section expansion was announced (NC Commerce /
  Perishable News), confirming an active, growing refrigerated operation.
- Job postings explicitly reference the "Perishable Warehouse Indian Trail
  Distribution Center," corroborating the dedicated refrigerated section.

Sources: NC Commerce (commerce.nc.gov/node/2315); Perishable News (Union County
expansion); ZipRecruiter Harris Teeter perishable-warehouse posting; TruckMap /
Yelp facility listings for 6001 W Hwy 74.

## Final confidence: HIGH
Gate, guard shack, barrier arm, fencing, dock face and drop yard are all directly
visible in satellite and 2025-11 Street View. Main residual uncertainty is the
exact perishable-vs-grocery dock-door split where the two connected halves meet,
and the Urban/Rural judgment.
