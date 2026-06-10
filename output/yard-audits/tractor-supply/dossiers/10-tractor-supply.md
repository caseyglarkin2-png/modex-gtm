# Deep-Audit Dossier — Tractor Supply Distribution Center, Maumelle AR (idx 10)

**Address:** 150 Champs Blvd, Maumelle, AR 72113
**Resolved center:** 34.8695, -92.3805
**Facility type:** Distribution Center
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

## Step 0 — Building confirmation
Approximate supplied coords (34.866597, -92.384598) sat ~300 m SW of the actual
building, in the entrance/road area. Wide z16 satellite showed two industrial
buildings; the correct one is the large structure to the NE distinguished by a
full-roof solar array. Web research confirmed: this is Tractor Supply's
1.15M sq ft Maumelle DC (DC #850), a $175M LEED-Gold facility opened 2023 with a
~10,000-panel rooftop solar array, serving ~250 stores across the Southeast,
Midwest, and Texas. The rooftop solar array is the unmistakable fingerprint and
matches the building at 34.8695, -92.3805. Center locked there.

Sources: corporate.tractorsupply.com newsroom (construction/opening release),
maumellechamber.com member directory (DC #850, 150 Champs Blvd), usgbc.org
(LEED project), KATV (grand opening, 500 jobs, solar array on Champs Blvd).

## Key views
- **z16/z17 overview:** Building runs roughly E-W with a slight (~2-3 deg)
  rotation, east end nudged north. Paved truck yard wraps the south and east;
  employee parking and the office/entry are on the west; entrance road comes up
  from the SW off Champs Blvd. Property bounded by graded margin and woodland.
- **z20/z21 entrance (34.8676,-92.3837):** Channelized multi-lane entrance drive
  with painted directional lane arrows (down-arrow inbound lanes + up-arrow
  outbound lane), gate barrier cross-bars spanning the lanes, and a square median
  equipment cabinet. A small white booth structure sits at the head of the drive
  where it opens into the yard (~34.8680,-92.3835). This is a controlled, guarded
  checkpoint — not an open driveway.
- **Street View (pano QmOXdrHzAUarCWtaWv3Q0Q, captured 2023-12, on Champs Blvd
  at 34.86623,-92.38465):** Shows the TSC monument entrance sign, regulatory
  signage, the channelized entrance apron, and the gate canopy/booth in the
  mid-distance with the solar-roofed DC behind. Pano is construction-era so gate
  hardware was still being installed, but the built corporate-DC controlled
  entrance is unambiguous.
- **South face (z18/z19):** Continuous dock apron with a long regular rhythm of
  dock doors, many with trailers backed in.
- **North face (z18 nw2/ne2):** Dock band with trailers backed in on the north
  side as well — second dock cluster.
- **Yard (z18/z19):** Extensive marked trailer-drop stall rows across the south
  yard and the east wrap-around yard, many filled.

## Gate / guard-shack / dock determinations
- **truckGate = true.** z20 evidence: channelized lanes, painted lane arrows,
  barrier cross-bars across the truck lanes, median gate cabinet.
- **guardShack = true.** Small booth-footprint structure at the head of the
  entrance drive beside the lanes; consistent with a staffed guard booth at a
  new $175M corporate DC. (remoteGs = false accordingly.)
- **postGateStaging = true / drivewayLong = true.** Wide paved apron inside the
  gate and a long gate-to-dock approach that can stack 3+ trucks.
- **dockDoors = 50+.** 1.15M sq ft building with continuous dock aprons on both
  south and north faces; estimate ~120 doors.
- **shipRcvSeparate = true** (medium confidence) — distinct dock banks on two
  opposite building faces.

## Yard zones and counts (geofences)
- **perimeter:** 7-vertex ring tracing the cleared property boundary; ~69.9 ac
  (shoelace).
- **truckGate:** quad over the channelized entrance drive / booth area.
- **dropYards (2):** south trailer field + east wrap-around field.
- **dockAprons (2):** south dock strip and north dock strip, each a thin quad
  hugging the respective building wall at the building's angle.
- **staging:** post-gate paved holding apron inside the gate.
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~180,
  trailerParkingCapacity ~320, truckGateCount 1, buildingCount 1,
  siteAreaAcres 69.9, railServed false.

## Street View metadata
Single road pano covers the site: QmOXdrHzAUarCWtaWv3Q0Q (Champs Blvd,
34.86623,-92.38465, captured 2023-12). truckGate heading 30 deg, perimeter
heading 46 deg (both pointing from the pano toward the respective zone centroid).

## Web findings
- Tractor Supply DC #850, 150 Champs Blvd, Maumelle AR 72113. ~1.15M sq ft,
  $175M investment, ~500 jobs, LEED Gold, ~10,000-panel rooftop solar.
- 10th and largest DC in TSC's network; e-comm fulfillment + replenishment for
  ~250 stores (Southeast, Midwest, Texas).

## Setting / connectivity
Edge-of-town industrial site at the north edge of Maumelle, bordered by woodland
to the east and south. urbanRural = Rural per rubric (small-town/edge-of-town).
connectivityIssue = false: it sits in a developed industrial park near a metro
(greater Little Rock), so cellular coverage is expected to be adequate.

## Final confidence: high
Gate, guard shack, docks, drop yards, and perimeter all well supported by tight
satellite imagery and corroborating road-level Street View. Lower-confidence
items flagged in uncertainFields: exact entry/exit lane counts, ship/rcv
separation, and trailer parking capacity (overhead estimates).
