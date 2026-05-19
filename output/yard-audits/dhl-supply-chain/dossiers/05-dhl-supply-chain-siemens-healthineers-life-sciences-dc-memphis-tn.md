# Deep-Audit Dossier — idx 05

## Facility
DHL Supply Chain - Siemens Healthineers Life Sciences DC - Memphis TN
Life Sciences & Healthcare Distribution Center — 6200 Global Drive,
Memphis, TN 38141

## Location resolved
Roster coords (34.997694, -89.859658; geocode moved 64 m) landed directly on a
single rectangular warehouse in Memphis's southeast industrial submarket. Web
search confirms the DHL-operated Siemens Healthineers World Distribution
Center at 6200 Global Drive, Memphis TN 38141 — a 422,000 sq ft facility (~105
associates; Siemens Healthineers occupies ~260,000 sq ft). The building's
address sign reads "6200" in Street View — positive ID. Locked center ≈
34.99780, -89.85950.

## Key views
- **z17/z18** — Single rectangular warehouse with a paved truck yard wrapping
  the building; car parking on the north, east and south faces.
- **z20 west face** — Dock doors on the building's west face with a paved
  truck apron; box trucks and a trailer backed in.
- **Street View (2025-04)** — The whole ~24-acre parcel is enclosed by a black
  ornamental metal fence. A "RECEIVING" sign marks the dock side. The truck
  gate is a black metal cantilever sliding gate off Global Drive with a control
  pedestal / card-reader on a yellow bollard beside it. No guard booth.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Black metal cantilever sliding gate across the truck
  driveway off Global Drive, set in the property's ornamental perimeter fence —
  clearly confirmed in Street View 2025-04.
- **guardShack = false.** No staffed booth at the gate. Only the sliding gate
  and a control pedestal / card-reader bollard are present.
- **remoteGs = true.** Gate present + no guard shack + control pedestal at the
  gate = remote/kiosk/card-reader check-in.
- **dockDoors = 10-25.** ~14 dock doors on the building's west face, box
  trucks and a trailer backed in.
- **dropArea = 0-10 / dropYard = false.** Only a few trailers/box trucks in the
  yard; no dedicated trailer-storage lot.
- **shipRcvSeparate = false.** Single dock bank on the west face ("RECEIVING"
  sign); ship and receive share the cluster.

## Yard zones & counts
- Perimeter: fenced ~24-acre parcel.
- truckGate: west-side sliding gate off Global Drive.
- dropYards: none.
- dockAprons: one — west face.
- dockDoorCount ≈ 14; trailersVisible ≈ 4; trailerParkingCapacity ≈ 12;
  truckGateCount 1; buildingCount 1; rail not served.

## Web findings
DHL Supply Chain operates the Siemens Healthineers World Distribution Center,
6200 Global Drive, Memphis TN — 422,000 sq ft (first speculative DC built in
Memphis since 2007); Siemens Healthineers occupies ~260,000 sq ft under a
10-year service agreement; ~105 associates; automated storage/retrieval and
AR-assisted picking; supports 40 forward stock locations for 4-hour delivery
windows (Siemens Healthineers / DHL press releases, Area Development).

## Confidence
**high** — facility positively identified (address sign "6200" visible),
fenced perimeter and sliding truck gate clearly confirmed in 2025-04 Street
View, no guard booth. Dock count is an honest overhead estimate (flagged in
uncertainFields).
