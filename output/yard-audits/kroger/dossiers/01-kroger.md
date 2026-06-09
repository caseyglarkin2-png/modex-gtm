# Deep-Audit Dossier — Kroger Great Lakes Grocery Distribution Center (Delaware, OH)

- **Facility:** Kroger Great Lakes Grocery Distribution Center
- **Type:** Grocery Distribution Center
- **Address:** 2000 Nutter Farm Ln, Delaware, OH 43015
- **Resolved center:** 40.28280, -83.02200
- **Method:** deep-audit (satellite + Street View, 2026 imagery)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied approximate coords (40.282434, -83.022306) landed directly on a
large industrial distribution complex. Wide z15/z16 satellite shows an isolated
two-building DC campus surrounded by farmland on the SE edge of Delaware, OH,
with extensive dock banks and trailer drop yards — fully consistent with a
grocery DC. Web search confirmed the Kroger Company Great Lakes Distribution
Center at 2000 Nutter Farm Ln, Delaware OH 43015 (740-657-2100), a 24/7 Midwest
grocery distribution center (krogerdc.com; Delaware Area Chamber; Waze/Yelp
listings). The Street View entrance pano shows a masonry monument reading
"GREAT LAKES DISTRIBUTION," positively identifying the site. Locked center at
40.28280, -83.02200.

## Key views
- **z15/z16 context:** Two large buildings (NW building and SE building) forming
  a campus, ringed by paved drop yards, two retention ponds (W and S), employee
  parking (N/center), and open farmland. A single main entrance off the E-W
  public road (Nutter Farm Ln) on the north side.
- **North entry (z17/z18):** Entry drive splits around a large teardrop median
  island into divided in/out lanes. A curved truck-parking loop sits NW of the
  entry (pre-gate staging). Employee lot center; truck checkpoint at the head of
  the drive.
- **Entry checkpoint (z20 + Street View, 2026-04):** Inbound truck lane on the
  east side shows trucks queued single-file; lanes are channelized with a row of
  traffic bollards across the approach. Street View down the drive (pano
  QTw3nP6ij-E3GnXCUCEf_w) shows the monument sign, light poles, a checkpoint
  canopy, and a small tan guard booth beside the lane.
- **NE/East docks (z19):** Dense, regular dock-door rhythm with dozens of
  trailers backed in along the SE building's north and east faces.
- **SE building (z18):** Continuous dock bank on the south face with trailers
  backed in; east face has a dock apron plus an adjacent east drop yard.
- **NW building (z18):** Dock doors on the east face; employee parking and
  retention pond to the west/south.
- **SW/rail (z17/z18):** A single rail line runs along the SW property boundary /
  right-of-way. It parallels the edge and does NOT spur into any building or
  dock — no rail-served docks.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Single controlled main entrance on the north side. The
  approach is channelized (bollard row across the drive), the drive is divided
  into separate in/out lanes around a median, and z20 satellite shows trucks
  staged single-file in the inbound lane — a clear checkpoint pinch-point.
- **guardShack = true.** A small ~1-2-vehicle-footprint tan booth sits beside the
  entry lanes just past the monument sign (visible in Street View pano
  QTw3nP6ij-E3GnXCUCEf_w, captured 2026-04), with a checkpoint canopy. remoteGs
  is therefore false.
- **dockDoors = 50+.** Both buildings carry continuous dock banks across multiple
  faces; total well over 50 (estimate ~220 doors).
- **dropArea / dropYard = 50+ / true.** Large north drop lot near the entry plus
  east-side rows and apron storage — hundreds of trailers parked without
  tractors.
- **shipRcvSeparate = true.** Two distinct buildings each with their own dock
  clusters on different faces.
- **multipleFacilities = true.** Two-building campus on one property.

## Yard zones & counts (estimates from z18-z21 imagery)
- **perimeter:** 7-vertex ring tracing the operational/paved footprint
  (buildings + yards + ponds that bound them); ~95 acres operational. Owned
  parcel including buffer farmland is larger.
- **truckGate zone:** quad over the north entry checkpoint / divided lanes.
- **dropYards:** (1) north drop lot near the entry; (2) east-side trailer rows.
- **dockAprons:** (1) NW building west apron; (2) SE building south apron;
  (3) SE building east apron.
- **staging:** pre-gate curved truck-parking loop NW of the entry.
- **Metrics:** dockDoorCount ~220; trailersVisible ~260; trailerParkingCapacity
  ~320; truckGateCount 1; buildingCount 2; siteAreaAcres ~95; railServed false.
- **streetViewMeta:** truckGate pano QTw3nP6ij-E3GnXCUCEf_w heading 185°
  (down the entry drive); perimeter pano MfQPGujuc4uWOvUY5IGbBA heading 56°
  (from the SW road toward the building). Both 2026-04, coverage OK.

## Web findings
24/7 Kroger Midwest grocery distribution center; significant regional employer;
order-selector warehouse operations. Listed across Delaware Area Chamber,
krogerdc.com, ZoomInfo, Waze, Yelp. Operational profile (24/7, large DC) is
consistent with the heavy dock/drop-yard footprint observed.

## Uncertain fields
- **scale:** No clear truck scale/weigh pad identified; left false.
- **connectivityIssue:** Rural setting but on a developed corridor near
  Delaware/US-23; coverage likely adequate, left false (medium confidence).
- **exitLanes:** Outbound lane count inferred from the median split.

## Final confidence
**High.** Facility positively identified by address, building footprint, and a
named monument sign in fresh (2026-04) Street View. Gate, guard booth, docks,
and drop yards are all directly observed.
