# Deep-Audit Dossier — NFI Distribution Center, Savannah GA (idx 12)

- **Account:** NFI Industries
- **Facility:** NFI Distribution Center Savannah GA (Rincon / Effingham County)
- **Type:** Distribution Center
- **Address:** Old Augusta Commerce Center, Logistics Pkwy, Rincon GA (Savannah metro)
- **Resolved center:** 32.257032, -81.202145
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View)

## Step 0 — Facility confirmation

The point landed in the Old Augusta Commerce Center, a master-planned ~4.7M SF /
6-building logistics park on the Rincon / Effingham County edge of the Savannah
metro, off the I-95 / Hwy 21 corridor that feeds the Port of Savannah. JLL / sale
listings describe the NFI building as a modern 2022 Class-A spec cross-dock with
102 dock levelers and 270 trailer parking spaces (expandable to 307). Satellite
confirms a single large cross-dock building with dock banks on both long faces,
fronting the internal Logistics Pkwy. Locked center ~32.25703, -81.20215.

## Key views

- **z18 overview:** single large building on a diagonal (NE-SW long axis), set
  inside the commerce park, ringed by pine forest and undeveloped parcels. Dock
  banks on both long faces; broad paved truck courts.
- **z19/z20 dock faces:** continuous dock-door rhythm on both the NE and SW long
  faces — a true cross-dock — with trailers backed in and parked along the courts.
- **z20 access drive (NE end):** a single access drive connects the NE-end court
  openly to the internal commerce-park parkway (Logistics Pkwy). No barrier arm,
  slide gate, or guard-booth footprint resolvable across the truck path.
- **Street View:** rural two-lane approach; the park road serves the building
  with open access. No Street View pano covers the building's own truck entrance
  (no coverage recorded for the traced zones).

## Gate / guard-shack / dock determinations

- **truckGate = false.** No barrier arm, slide gate, or checkpoint structure
  visible across the truck path in z19-z20 satellite. The access drive connects
  openly to Logistics Pkwy. Modern 2022 Class-A spec cross-dock with open
  access; flagged uncertain (a slide gate, if present, is not resolvable).
- **guardShack = false.** No 1-3-stall guard booth anywhere on the truck path;
  the only structures are the main building and a small utility enclosure.
- **remoteGs = false.** No gate present to be remotely controlled.
- **entryExitTogether = true; entryLanes 2 / exitLanes 2.** Single access drive
  off the parkway at the NE end serves both directions; lane counts estimated.
- **dockDoors = 50+ (102).** JLL/sale listings state 102 dock levelers; counted
  on both long faces, consistent.
- **dropArea = 50+; dropYard = true.** 270 trailer parking spaces (expandable to
  307) per JLL; drop trailers visible in the NW drop yard and along the courts.
- **shipRcvSeparate = true.** Cross-dock — dock banks on both opposite long
  faces (NE and SW).
- **postGateStaging = true; drivewayLong = true; fastLaneOpportunity = true.**
  Deep paved truck courts (~190 ft per JLL) on both faces; wide NE-end apron
  leaves room for a bypass/express lane.
- **scale = false, rail = false, multipleFacilities = false, multiStep = false.**
  No truck scale, no rail spur into the property, single building.
- **urbanRural = Rural.** Commerce-park edge of the Savannah metro, surrounded by
  pine forest; Street View shows a rural two-lane road.
- **backupSensitive = false.** Deep interior courts give ample stacking room.
- **connectivityIssue = false (low conf.).** Rural but inside an active
  master-planned park near the I-95 corridor; carrier coverage likely adequate.

## Yard zones & counts

- **perimeter:** 5-vertex ring tracing the leased parcel within the larger park.
  ~48.5 ac.
- **truckGate:** quad over the NE-end access throat off Logistics Pkwy (open).
- **dropYards (1):** trailer-storage expanse NW of the building toward the
  adjacent DC.
- **dockAprons (2):** long thin quads hugging the NE and SW dock faces.
- **streetViewMeta:** no pano coverage for the traced zones (hasCoverage false).
- **yardMetrics:** dockDoorCount 102, trailersVisible ~45, trailerParkingCapacity
  270, truckGateCount 1, buildingCount 1, siteAreaAcres 48.5, railServed false.

## Web findings

- NFI Savannah / Rincon: 2022 Class-A cross-dock, 102 dock levelers, 270 trailer
  spaces (exp. 307), inside the ~4.7M SF Old Augusta Commerce Center, I-95 / Hwy
  21 corridor serving the Port of Savannah (JLL / sale listings).

## Final confidence

**High.** Building and spec corroborated by JLL/sale listings; the open-access
cross-dock layout is clearly read. Lower-confidence items — exact lane counts and
whether an unseen slide gate exists — are flagged in `uncertainFields`.

### 3-line summary
- Gate: FALSE — open access drive to Logistics Pkwy; no barrier arm or checkpoint visible.
- Guard shack: FALSE — no booth; no gate => remoteGs false.
- Confidence: HIGH.
