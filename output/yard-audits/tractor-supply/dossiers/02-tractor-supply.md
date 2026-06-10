# Deep-Audit Dossier — Tractor Supply Distribution Center, Waco TX

- **Facility:** Tractor Supply Distribution Center Waco TX (Distribution Center)
- **Address:** 2801 Corporation Pkwy, Waco, TX 76712
- **Resolved center:** 31.48635, -97.16035
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied coordinates (31.486413, -97.160092) landed directly on a single very
large rectangular distribution building with extensive trailer parking — consistent
with a regional DC, not an office. Web search confirmed Tractor Supply Co.
Distribution Center at 2801 Corporation Pkwy, Waco, TX 76712 (Greater Waco Chamber,
Waze, Yelp, Birdeye listings all match the address and the DC use). The building sits
in a business park SW of central Waco, just west of I-35, with the access road
(Corporation Pkwy) running along its NE side. Locked center at 31.48635, -97.16035.
The parcel is rotated roughly 30° off north (long axis NW-SE), so all geofences were
traced as oriented polygons rather than north-aligned boxes.

## Key views
- **Wide satellite (z16-17):** One large DC building on a rotated parcel; massive
  trailer drop yard on the SW/W side (many rows), dock banks on the NE and SW faces,
  office + employee parking on the SE, wooded creek to the south, I-35 to the east.
- **NE face (z18-20 + Street View):** Continuous black metal perimeter fence along
  Corporation Pkwy; long dock wall with trailers backed in (CFI, Swift carriers
  visible — confirms active freight DC). A rail line runs parallel between the road
  and the property.
- **Gate Street View (pano 4FCsQp4AotyqmOmfOonT_A, 2022-04, heading ~306-340):** The
  truck entrance off Corporation Pkwy — see gate/guard determinations below.
- **SE side:** Office with a canopy pedestrian entrance and a large employee car lot;
  the truck driveway loops around the south corner to reach the SW dock face and drop
  yard.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The Street View arrival frame at the truck drive shows **two
  red/white striped barrier arms** across separate lanes with a **raised concrete
  median island** between them, where the truck driveway meets Corporation Pkwy. Clear
  controlled checkpoint.
- **guardShack = true.** A small staffed **guard booth** sits on the left side of the
  gate lanes — ~1-2 vehicle footprint, windows on multiple sides, a STOP sign and
  traffic cones at the lane. It is set beside the gate, distinct from the main
  building.
- **remoteGs = false** (a manned booth is present).
- **entryExit:** together — one combined gate complex with an in lane and an out lane
  split by the median island at a single property-line point. entryLanes ≈ 1,
  exitLanes ≈ 1 (low confidence on exact split).
- **Staging:** postGateStaging true (wide paved apron inside the gate before the dock
  approach); no street-side pre-gate staging. drivewayLong true — deep gate-to-dock
  approach and large internal yard hold a 3+ truck queue, so not backup-sensitive.
- **Docks:** dockDoors = **50+**. Long NE dock wall with a continuous trailer-backed
  bank (40+ doors) plus a second dock bank on the SW face. Two distinct dock banks on
  different building faces → shipRcvSeparate = true (medium confidence).
- **Drop yard:** dropArea = **50+**, dropYard = true. A dedicated trailer-storage lot
  on the SW/W side with many rows of parked trailers (well over 50 stalls), separate
  from active dock staging.
- **No truck scale** observed in the truck path (scale = false). **No multiStep** — the
  gate is the only checkpoint; no second booth/scale house before the docks.

## Yard zones and counts (overhead estimates)
- **perimeter:** 7-vertex oriented ring tracing the fenced parcel (building + drop yard
  + parking + gate apron). ~**31 acres**.
- **truckGate:** quad over the gate/guard-booth complex off Corporation Pkwy.
- **dropYards:** one ring over the large SW trailer-storage lot.
- **dockAprons:** two rings — the NE dock-wall apron and the SW dock-wall apron, each
  hugging the building wall at its true angle.
- **staging:** quad over the paved holding apron just inside the gate.
- **yardMetrics:** dockDoorCount ~110, trailersVisible ~220, trailerParkingCapacity
  ~180, truckGateCount 1, buildingCount 1, siteAreaAcres 31.0, railServed true.

## Street View metadata
- **truckGate:** pano `4FCsQp4AotyqmOmfOonT_A`, heading 306° — the driver's arrival
  view of the barrier arms + guard booth.
- **perimeter:** pano `XL_4LnFTXma6MOih6Mxf8Q`, heading 223° — Corporation Pkwy view
  toward the NE dock face.

## Web findings
Greater Waco Chamber, Waze, Yelp, Birdeye and Foursquare all confirm Tractor Supply
Co. Distribution Center at 2801 Corporation Pkwy, Waco, TX 76712 (phone (254)
420-4848 / (254) 759-3900). Reviews describe an unloading/door-assignment process
("less than an hour once assigned a door") and designated truck parking — consistent
with the gated, guard-checked, large-drop-yard layout observed.

## Final confidence: high
Facility identity, gate, guard shack, dock scale and drop yard are all directly
evidenced. Lower-confidence items (flagged in uncertainFields): exact entry/exit lane
counts, trailer parking capacity, ship/receive separation, and the rail-served call
(spur runs alongside the parcel; may serve the corridor rather than terminating in the
building).
