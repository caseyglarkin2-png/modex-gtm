# Deep Audit - US PL Ontario Factory (Primo Brands / BlueTriton)

- **Slug:** us-pl-ontario-factory  (NN 01)
- **Type:** Bottling plant (PL) - Primo Brands / BlueTriton (formerly Nestle Waters / Arrowhead)
- **Resolved address:** 5772 E Jurupa St, Ontario, CA 91761  (APN 0238-133-12)
- **Resolved center:** 34.03635, -117.59140
- **Method:** deep-audit  |  **Final confidence:** medium
- **Maps:** https://www.google.com/maps/@34.03635,-117.5914,400m/data=!3m1!1e3

## Location resolution & how confirmed
Web search confirmed the facility three ways: the LoopNet listing for 5772 Jurupa St,
Ontario CA 91761 (APN 0238-133-12, a 360,000 sqft single-tenant industrial building);
the Rexford Industrial property page (5772 Jurupa Street, Inland Empire-West, acquired
$54.0M, single-tenant) tenanted by the Arrowhead bottling plant; and Waze, which labels
the address "Arrowhead Bottling Plant." Cortera and BlueTriton/Primo hiring posts list a
500-1,000 employee bottling/production site at this address, now operated by Primo Brands
after the BlueTriton-Primo merger.

The supplied coordinates (34.0365, -117.5931) landed on the west public road / parking
frontage. Satellite probing one block east located the actual 360k sqft building, center
~34.03635, -117.59140. Jurupa St (a 6-lane arterial) forms the north boundary; the lot is
nearly north-aligned with only slight rotation, so geofences are kept as tight rectangles.

## What each key view showed
- **z17/z18 wide (p05, p10):** large white-roofed single building filling its block,
  bounded by Jurupa St (N), a west cross street with employee parking (W), an east internal
  street (E), and a shared drive aisle (S) separating it from a SEPARATE gray cross-dock
  building to the south. Employee parking on both the W and E sides.
- **West side (p16, sv01, sv09, sv10):** office/employee front. Glass office frontage,
  a covered main entry canopy, large employee parking lot, multiple OPEN curb-cut driveways
  from the west cross street. sv09 (SW corner) shows an open ungated driveway - stop sign and
  hydrant only, no barrier, no booth.
- **North side along Jurupa (sv02, sv07, sv08, p07):** long blank tilt-up wall; no docks,
  no entrance. The east yard behind it is screened by a continuous concrete wall.
- **East side / truck yard (p06, p09, p12, p13, p14, p21, z20-21):** the dock + yard side.
  A dock canopy/awning runs along the north portion of the east face with ~2 trailers backed
  in; stacked lumber/pallets and green/red containers in the yard; the rest of the east area
  is employee parking. The whole yard is enclosed by the screen wall.
- **East internal street (sv13/sv14/sv15):** the walled yard frontage; the actual gate panel
  is screened by pine trees and the street itself has no Street View pano (coverage snaps one
  block east to the next building's back wall).
- **South side (p11, p17):** blank south wall + shared drive aisle; the heavily-docked gray
  building below is a different facility and was excluded.

## Gate / guard-shack / dock determinations (with evidence)
- **truckGate = TRUE (medium).** The east truck/dock yard is fully enclosed by a continuous
  ~8ft tilt-up concrete screen wall along the entire Jurupa frontage, wrapping the NE corner
  onto the east internal street (sv07/sv08/sv11/sv12/sv13, z21 p21). A walled, screened yard
  with a single controlled vehicle break = a gated truck entrance. The gate panel itself
  could not be captured head-on (no pano on the east internal street + tree screening), so the
  call rests on the walled-yard configuration and is flagged uncertain.
- **guardShack = FALSE (medium-high).** No booth-sized structure (1-3 vehicle footprint,
  multi-side windows) at any entrance in any satellite or Street View frame. The west entry is
  open/ungated; the east yard wall shows no guard booth.
- **remoteGs = TRUE.** Gate present, no guard booth -> kiosk / call-box / office-buzzer check-in
  implied. Inherits the truckGate uncertainty.
- **dockDoors = 0-10.** Modest dock operation on the east face north portion under a canopy
  (~8-10 doors, 2 trailers backed in). N/S/W faces are blank walls. The big dock bank visible
  nearby belongs to the separate south building.
- **dropArea = 0-10 / dropYard = FALSE.** East yard is mostly employee parking + pallet
  staging; only a handful of drop trailers, no dedicated trailer-storage lot.

## Yard zones & counts measured
- **perimeter:** fenced Primo parcel, ~270m E-W x ~170m N-S, ~11 acres.
- **truckGate zone:** NE wall break to the east-street yard entrance.
- **dropYard / dockApron:** east-face canopy apron + adjacent open yard.
- **yardMetrics:** dockDoorCount ~10, trailersVisible ~4, trailerParkingCapacity ~15,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~11, railServed false.
- **Street View panos:** perimeter = lIxKWKmy00QN_Y9B0mPqkQ (2023-12, west front, heading 90);
  truckGate = DsZtiqPF10384vYZKV6q8w (2025-02, Jurupa NE corner, heading ~187 toward the
  walled yard).

## Web findings
- 360,000 sqft single-tenant industrial building, owned by Rexford Industrial (APN 0238-133-12).
- Operated as a bottling/production plant by Primo Brands / BlueTriton (legacy Nestle Waters /
  Arrowhead). 500-1,000 employees; active seasonal production-technician hiring (ZipRecruiter,
  BlueTriton careers), consistent with the large employee-parking footprint seen on site.

## Final confidence: medium
Imagery is high-resolution and Street View covers Jurupa St and the west cross street well.
The single blind spot is the east-internal-street truck gate (no pano + tree screening), which
is the only reason truckGate / remoteGs are medium rather than high. Everything else (guard
shack absence, urban setting, modest single-cluster docks, employee-parking-dominated yard,
no rail, single building) is high-confidence from the satellite + Street View evidence.
