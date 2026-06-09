# Deep-Audit Dossier — Amazon CVG1 Fulfillment Center, Hebron KY

- **Roster idx:** 4 (Amazon)
- **Facility:** Amazon CVG1 Fulfillment Center
- **Type:** Fulfillment Center
- **Address:** 1155 Worldwide Blvd, Hebron, KY 41048 (Prologis Park West, Bldg F)
- **Resolved center:** 39.0846, -84.7129
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Facility confirmation

The supplied coordinates (39.084682, -84.713515) landed on the correct
building. A z16/z17 satellite sweep around the point shows one large
single-building distribution center in Prologis Park West, immediately NW of
the I-275 / I-71-75 interchange. Web search (FLEX Fulfillment, fbanearme,
Waze) corroborates 1155 Worldwide Blvd = Prologis Park West Building F, a
1M+ sq ft Amazon FC ~5 miles from the CVG air hub. This is a distinct site
from roster idx 5 (KCVG Air Hub, ~5 km SE on Wendell H Ford Blvd) — the
building audited here is the Worldwide Blvd fulfillment center, not the air
cargo sort.

True building center locked at **39.0846, -84.7129**. The structure is a long
rectangle whose long axis runs roughly NNW–SSE, tilted ~15–20° east of north,
~520 m long.

## Key views

- **Wide overview (z16/z17):** One building, no second large cluster on the
  parcel. Employee parking wraps the SW end; trailer/dock operations on the
  east face; wooded buffers on the S/SW down to the I-275 ramp.
- **East face (z18/z20, dock-n / dock-s):** A single continuous **dock bank**
  runs the full length of the east wall, fronted by a wide paved dock apron.
  Outboard of the apron is a long row of **marked angled trailer-parking
  stalls** (the drop yard). Mostly empty in the captured imagery.
- **West face (z20):** Roof units only — no dock doors on the west/back wall.
  Confirms a single dock cluster (east-only).
- **North end (z19, ne-apron / nentrance):** The internal yard road wraps the
  north end of the building and connects up to Worldwide Blvd. This is the
  property's single road connection.
- **Street View, Worldwide Blvd at the gate (2024-09, pano hQN79MxhzqdX3b7M4uvqRA):**
  Shows a continuous **black chain-link security fence** along the property
  line wrapping the trailer yard and dock apron, with a **single controlled
  entry drive** descending from Worldwide Blvd into the secured yard. The drive
  has a center median (in/out split).
- **Street View, 2016/2021 panos:** Same building as a generic spec warehouse
  with **no perimeter fence** and open parking — confirming the fence + gate
  are an Amazon-era security addition.

## Gate / guard-shack / dock determinations

- **truckGate = true.** The Amazon-added chain-link perimeter fence is breached
  by exactly one controlled drive off Worldwide Blvd at the north end. Fence +
  single gated opening into the fenced yard is a controlled truck entrance.
  (2024-09 Street View, pano hQN79MxhzqdX3b7M4uvqRA, heading ~200°.)
- **guardShack = false (low confidence).** No standalone road-side gatehouse
  footprint was positively confirmed at the gate throat in z20/z21 satellite or
  in Street View — the entry is partly screened by trees. A small structure on
  the dock apron reads as a yard-control / equipment shed, not a perimeter
  booth. Flagged uncertain.
- **remoteGs = true (uncertain).** Gate present, booth not confirmed → modeled
  as kiosk / Amazon-driver-app check-in. Would flip to guardShack if a manned
  booth sits behind the tree line.
- **postGateStaging = true.** Large paved internal yard between the gate and the
  dock doors provides ample post-gate queueing.
- **drivewayLong = true.** Long ramped approach from the road into a deep
  internal yard; holds 3+ trucks.
- **fastLaneOpportunity = true.** Wide entry apron and a deep/wide internal yard
  leave physical room for an express bypass lane.
- **dockDoors = "50+".** Single continuous dock bank along the ~520 m east wall.
  No trailers backed in to count one-by-one, but the building length and FC
  scale imply well over 50 doors (estimate ~110).
- **dropArea / dropYard = "50+" / true.** A long row of marked angled
  trailer-parking stalls runs the full east drop yard (~90-stall capacity),
  separate from the dock-door apron.
- **shipRcvSeparate = false.** All docks on a single (east) face — one cluster.
- **scale = false.** No weigh pad in the truck path.
- **urbanRural = "Rural".** Exurban industrial park beside a freeway
  interchange; not dense metro fabric.
- **multipleFacilities = false.** One building on the parcel.
- **railServed = false.** No rail spur into the property.

## Yard zones & counts

- **perimeter:** 7-vertex ring tracing the fenced Amazon parcel (building +
  east drop yard + dock apron + west employee lot + north entry drive).
  ~42 acres (shoelace from the traced ring).
- **truckGate:** quad over the single north entry drive off Worldwide Blvd.
- **dropYards:** one ring over the long angled-stall trailer lot on the east side.
- **dockAprons:** one long thin quad hugging the east dock wall at the building's
  angle.
- **staging:** none traced outside the gate (no clear pre-gate stalls).
- **yardMetrics:** dockDoorCount ~110, trailersVisible ~8, trailerParkingCapacity
  ~90, truckGateCount 1, buildingCount 1, siteAreaAcres ~42, railServed false.

## Web findings

- FLEX Fulfillment + fbanearme: CVG1 = Prologis Park West Bldg F, 1155
  Worldwide Blvd, Hebron KY 41048; 1M+ sq ft general FC; 24/7; phone
  (859) 384-5480; ~5 mi from CVG / the Amazon Air hub.
- Direct I-275 and I-71/I-75 access; positioned for Midwest distribution.

## Final confidence

**High** on facility identity, location, layout, dock side, drop yard, and the
existence of a controlled truck gate (clear 2024 fence + single gated drive).
**Lower** on guardShack vs remoteGs (booth screened by trees) and exact
entry/exit lane and dock-door counts — all listed in `uncertainFields`.
