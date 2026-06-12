# PBNA - Knoxville TN — Deep-Audit Dossier

**Facility:** Pepsi-Cola Metropolitan Bottling Co (Pepsi Beverages Co), 3501 Middlebrook Pike, Knoxville TN 37921
**Locked center:** 35.96240, -83.96690 (main building; roster GEOMETRIC_CENTER was on-property)
**Audited:** 2026-06-12 · method: deep-audit (satellite z17-z20 + Street View 2026-01)

## Location confirmation
Roster point landed on a ~10.6-acre plant/DC bounded by Middlebrook Pike (south) and
a local road (east). Street View shows a PEPSI trailer at the entrance, Pepsi truck
inside the fence, and a signed "TRUCK ENTRANCE". Identity certain.

## Entrance / gate / guard shack
- **Single truck gate on the east road** (~35.9627, -83.9658): chain-link perimeter
  fence (barbed wire), a **sliding gate** across the truck drive, and a blue "TRUCK
  ENTRANCE" sign (SV 2026-01, gate open at capture). → `truckGate: true`.
- **No guard booth** at the throat in SV or z20 overhead → `guardShack: false`,
  `remoteGs: true` (gate without shack; check-in is presumably at the building or
  remote). Booth deeper inside cannot be fully excluded — flagged.
- Gate sits ~25-30m off the public road: a 2-truck queue reaches the street →
  `backupSensitive: true`. Single shared throat, 1 lane each way, no spare width for
  a bypass (`fastLaneOpportunity: false`). Inside the gate the yard is deep
  (`drivewayLong: true`, `postGateStaging: true` - open paved holding before docks).

## Docks and yard
- **East face of main building**: ~8-12 OTR dock positions (trailers backed in).
- **North canopy building**: covered route-truck loading bank (~12-15 bays) with the
  route fleet staged along it — ship/receive physically separate (`shipRcvSeparate:
  true`, medium). Total est. ~22 doors → band **10-25** (boundary case, flagged).
- **Drop trailers**: ~25 visible — NE yard rows near the gate (incl. third-party CFI
  trailers) plus scattered positions west. `dropArea: 10-25` (boundary), `dropYard:
  true`.
- Employee cars front the south lawn along Middlebrook Pike; residential parcels
  buffer the north and west.

## Geofences
- **Perimeter**: 7-vertex ring, ~10.6 acres (shoelace): north tree line at the
  residential buffer, east road fence at the gate, Middlebrook Pike right-of-way
  (south), west yard edge.
- Truck-gate quad on the east throat; one NE drop-yard ring; two dock aprons (east
  OTR face, north route canopy), each parallel to its dock wall.
- Street View: pano `_js7aX8Kddho6S3mSpszdQ` (east road, 2026-01) covers perimeter,
  gate (heading 266 = driver arrival frame), and drop yard; pano
  `rhVRvR4zXuZcrDNkKxIi6g` views the dock-apron area from the south.

## Web corroboration
D&B lists Pepsi-Cola Metropolitan Bottling Co at Middlebrook Pike; Knoxville Chamber
lists Pepsi Beverages Company (roster sources). Layout matches a metro
bottling/distribution branch with a route fleet.

## Verdict
Gated (slide gate) but unmanned entrance — the classic remote-gate profile; tight
single throat with street spillback risk; modest drop yard. **Confidence: high.**
Uncertain: guardShack/remoteGs (interior booth possible), dock and drop bands,
ship/rcv separation.
