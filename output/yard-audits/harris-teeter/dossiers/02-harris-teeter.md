# Yard Audit Dossier — Harris Teeter Grocery DC, Indian Trail NC

- **Facility:** Harris Teeter Grocery Distribution Center (dry-grocery half of the Indian Trail DC campus)
- **Type:** Grocery Distribution Center
- **Address:** 6001 W Highway 74, Indian Trail, NC 28079
- **Resolved center (gray-roof dry-grocery mass):** 35.06480, -80.64920
- **Gate / guard booth:** 35.06605, -80.6448
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied coordinates (35.065177, -80.645931) landed on the campus. Wide
satellite (z15-z16) showed one large fenced industrial campus on the SW side of
W Hwy 74, bounded by a rail corridor on the SW and woods on the other sides,
with a long private access drive from the highway intersection at the NE corner.
Web research (Supermarket News, NC Commerce, AndNowUKnow) confirms this single
6001 W Hwy 74 site contains **both** Harris Teeter's perishable (refrigerated)
DC and its dry-grocery DC, with a ~317,000 sf dry-grocery expansion; the
complex is ~580,000 sf, serves ~104 stores across NC/SC/TN/GA/FL, and employs
360+. Positively the right building.

### Campus split (per task instruction)
The "two DCs" are **not** two free-standing buildings — they are joined under one
continuous stepped/L-shaped roof sharing one NE dock face and one yard:
- **Bright-white reflective-roof western mass** = older perishable / refrigerated
  section (white membrane roof typical of cold storage).
- **Gray-roof southeastern mass** = the dry-grocery expansion, with a large empty
  concrete apron extending SW toward the rail line.

This audit covers the **dry-grocery (gray-roof) portion** plus the shared gate,
drop yard, dock face, and staging apron. A sister agent covers the perishable
building. Because the campus is a single fenced parcel with shared gate/yard, the
perimeter geofence and yardMetrics describe the whole shared campus; the
classification reflects the dry-grocery operation as seen on the ground.

## Key views
- **z16 / z15 overview:** one rotated complex (long axis ~NW-SE, dock/yard face
  ~NE), rail on SW, woods buffer, access drive from NE.
- **z18 building close-ups:** L-shaped footprint, white (perishable) + gray (dry)
  masses, continuous dock line with trailers backed in along the NE face.
- **z19/z20 gate:** small canopied booth in the center of a widened checkpoint
  with a tractor-trailer queued at it.
- **z18 drop yard:** long parallel rows of parked trailers, 100+ trailers.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** Street View (2018-11 pano `rwhp4WnvSx-haTD0vStnaA`) shows
  yellow/black barrier arms spanning the lanes and chain-link perimeter fencing.
  Satellite shows the drive pinching into a controlled checkpoint.
- **guardShack = TRUE.** The Street View frame clearly shows a manned guard booth
  (multi-side windows, US flag on top) with a guard standing beside an inbound
  truck. Confirmed in z20 satellite as a small canopied structure with a truck
  stopped at it. `remoteGs = false`.
- **drivewayLong = TRUE.** Long tree-lined private approach (~250 m) from the W
  Hwy 74 intersection down to the gate; Street View shows a tractor-trailer
  climbing it. Easily holds 3+ trucks. `postGateStaging = true` (large paved
  apron inside the gate before the docks).
- **entry/exit:** single checkpoint group → `entryExitTogether = true`,
  ~2 inbound / 1 outbound lanes (approx), `fastLaneOpportunity = true` (wide
  multi-lane apron with unused paved width).
- **dockDoors = 50+.** Continuous dock line down the entire NE face of the
  combined complex, dozens of trailers backed in across multiple banks.
- **dropArea = 50+ / dropYard = true.** Large dedicated on-site trailer-storage
  lot, long parallel rows, well over 100 trailers parked without tractors.
- **scale:** a rectangular pad near the checkpoint could be a scale but is not
  confirmable from imagery — left false, flagged uncertain.

## Yard zones measured
- **perimeter:** 7-vertex rotated ring around the full shared fenced campus ≈
  **53.2 acres**.
- **truckGate:** small quad at the booth/checkpoint, aligned to the entry drive.
- **dropYards:** one ring over the main trailer block, rotated to the trailer rows.
- **dockAprons:** long thin quad hugging the NE dock wall at the building angle.
- **staging:** the large concrete apron SW of the gray (dry-grocery) building.
- **streetViewMeta:** both perimeter and truckGate use the gate pano
  `rwhp4WnvSx-haTD0vStnaA` (the driver's arrival frame); headings 237° / 272°.

## yardMetrics
- dockDoorCount ≈ 90 (combined complex, overhead estimate)
- trailersVisible ≈ 140
- trailerParkingCapacity ≈ 180
- truckGateCount = 1
- buildingCount = 2 (perishable + dry-grocery masses) on one campus
- siteAreaAcres = 53.2
- railServed = false (rail line runs alongside SW edge; no spur into the yard)

## Web findings
- Single 6001 W Hwy 74 campus = perishable + dry-grocery DC; ~580k sf total,
  ~317k sf dry-grocery expansion (Supermarket News, NC Commerce, AndNowUKnow,
  Perishable News).
- Serves ~104 stores across NC/SC/TN/GA/FL; 360+ employees; open 24/7.
- Driver reviews (TruckMap): appointment-based, fast unloading (often <1 hr),
  overnight parking in the lower lot — consistent with the large drop yard.

## Final confidence: HIGH
Gate, guard shack, long driveway, drop yard, and dock face are all directly
confirmed in satellite + Street View. Uncertain: presence of a truck scale,
exact lane counts, and ship/receive separation (flagged).
