# Deep-Audit Dossier — Target Regional Distribution Center Phoenix (T0588)

- **Facility:** Target Regional Distribution Center Phoenix (T0588), RDC
- **Address:** 25 N 75th Ave, Phoenix, AZ 85043
- **Resolved center:** 33.44760, -112.21810
- **Method:** deep-audit (satellite zoom 15-21 + Street View, Oct 2025 panos)
- **Confidence:** HIGH

## 1. Location confirmation
The geocoded point (33.44619, -112.217864) landed directly on the correct
building. The z16 overview shows the unmistakable **Target bullseye logo
painted on the white roof** of a very large single-story distribution box —
definitive identification. Web search corroborates an active Target RDC /
warehouse operation at 25 N 75th Ave, Phoenix AZ 85043 hiring hourly warehouse
operations under store/site code **T0588**. Building footprint (~1.5-1.7M sqft
class), long north dock wall, and a multi-row trailer drop yard are all
consistent with a regional distribution center, not an office or neighbor.

Setting: dense Phoenix industrial corridor (75th Ave / Lower Buckeye Rd area),
warehouses on all sides → **Urban**.

## 2. Key views
- **z16 / z15 overview:** Target bullseye on roof; building north-aligned;
  trailer yard on north face; employee parking on south; surrounded by other
  big-box warehouses.
- **z17 north view:** long north dock face with dozens of trailers backed in,
  plus extensive rows of parked trailers (drop yard) beyond.
- **z19 NE entrance:** the main controlled entrance off the north access road —
  a guard building with multiple inbound/outbound lanes and a covered
  pedestrian checkpoint; visitor/employee parking loop just inside.
- **z20 gate close-up:** a small standalone **guard booth** (black roof,
  ~1-2 stall footprint) sitting between hatched painted lane islands with
  directional arrows in the truck driveway — a staffed checkpoint inside the
  gate.
- **Street View (Oct 2025, access road N of site):** tall black steel
  perimeter security fence runs the full property edge; facility set back
  behind it. Sun glare limited a head-on gate-arm frame, but the fence + the
  satellite gate evidence are unambiguous.
- **Corner probes:** confirmed developed/fenced extent — N ~33.4508 (dock-yard
  edge / access road), S ~33.4458 (parking edge + drainage canal buffer),
  W ~-112.2222, E ~-112.2149. North of the trailer yard is a vacant graded
  parcel (not part of active ops).

## 3. Gate / guard-shack / remote determinations (rigorous)
- **truckGate = TRUE.** Controlled NE entrance: guard building + multi-lane
  pinch-point where the property meets the access road, plus continuous tall
  steel perimeter fencing around the whole site (Street View).
- **guardShack = TRUE.** z20 clearly shows a small staffed booth (multi-window,
  ~1-2 stall footprint) seated between hatched lane islands with painted entry/
  exit arrows just inside the gate. Distinct from the main building.
- **remoteGs = FALSE.** A physical staffed booth is present, so this is not a
  remote/kiosk check-in.
- **multiStep = TRUE (medium conf).** Two checkpoints: the guard building at
  the road entrance and a second interior booth at the truck-yard pinch-point.

## 4. Yard zones & counts (from z17-z21)
- **Perimeter:** ~88 acres developed (rectangular, north-aligned: building +
  north drop yard + south employee parking).
- **truckGate zone:** NE entrance apron / guard-booth area.
- **dropYard:** large north trailer-storage lot, many marked rows → dropArea
  "50+", dropYard = true.
- **dockApron:** long strip along the north building wall with trailers backed
  in → dockDoors "50+" (~90 positions estimated).
- **yardMetrics:** dockDoorCount ~90, trailersVisible ~180, capacity ~260,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~88, railServed false (no
  spur into the property).

## 5. Other flags
- entryExitTogether = true (single NE gate group); entryLanes/exitLanes ~2/2.
- drivewayLong = true (deep gate→dock approach holds 3+ trucks);
  postGateStaging = true; fastLaneOpportunity = true (wide apron, room for a
  bypass).
- backupSensitive = false (gate sits on an internal access road with ample
  stacking, not a busy public artery).
- scale = false; shipRcvSeparate = false (docks concentrated on north face);
  multipleFacilities = false.

## 6. Web findings
- Active Target RDC / warehouse, site code **T0588**, 25 N 75th Ave, Phoenix
  AZ 85043 (Target careers, AZ Job Connection, Waze/Apple/Yahoo listings).
- Hourly warehouse operations hiring (night/overnight/weekend shifts) →
  large, actively operating distribution facility.

## 7. Confidence
**HIGH.** Building identity certain (rooftop logo + address + web). Gate and
guard-booth structures clearly resolved in z19-z20 satellite and corroborated
by perimeter fencing in Street View. Only the second-checkpoint (multiStep) and
ship/rcv separation are medium-confidence and flagged in uncertainFields.
