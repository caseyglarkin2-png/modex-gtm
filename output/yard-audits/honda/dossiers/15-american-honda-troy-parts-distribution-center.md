# Deep-Audit Dossier — American Honda Troy Parts Distribution Center (idx 15)

## Facility
- **Name:** American Honda - Troy Parts Distribution Center (PDC)
- **Type:** Parts Distribution Center
- **Address:** Commerce Center Boulevard area off I-75, Troy, OH 45373
- **Resolved coordinates:** 40.048500, -84.237200 (center of the PDC warehouse —
  the northern of two adjacent Honda warehouses)

## Step 0 — Location confirmation
The roster idx-15 coordinates landed in a residential/commercial area east of
I-75 — wrong location. Web research clarified the picture: American Honda runs
TWO sprawling warehouses off Commerce Center Blvd in Troy:
- The **Parts Distribution Center (PDC)** — 534,000 sq ft, operating since 1986.
- The **Midwest Consolidation Center (MCC)** — 549,000 sq ft, built 2007 on
  ~60 acres adjacent to the older PDC; 151 Commerce Center Blvd.
Satellite shows two large adjacent Honda warehouses. The MCC roster coordinates
(idx 16: 40.042289, -84.238128) point at the southern building, and the MCC was
built "adjacent to the older parts center" — so the PDC is the NORTHERN building
(~40.0485, -84.2372) and the MCC is the southern one. Coordinates were locked on
the northern warehouse.

## Key views
- **z15/z16 wide:** Two large Honda warehouses west of I-75 separated by a
  pond/greenspace; the northern (PDC) is L-shaped with extensive trailer rows.
- **z17-z19 PDC building:** Large warehouse with dock-door banks on the north
  and east faces, trailers backed in; long trailer drop yards on the west and
  east holding dense rows of colored Honda trailers.
- **z19/z20 entrance:** Internal access road from the public road into the
  campus; a small guard-booth-footprint structure beside the road; a large paved
  staging lot between the public road and the building.
- **Street View (Commerce Center Blvd area, 2024-06):** Honda PDC monument sign
  and American flag at the campus entrance; the warehouse visible behind a
  chain-link perimeter fence; rural-feeling road with a water tower nearby.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence).** The PDC campus is fenced with a
  controlled entrance — Honda monument sign and flag at the entry road, plus a
  small guard-booth structure beside the internal access road. No Street View
  inside the gate to confirm a specific barrier arm, hence medium confidence.
- **guardShack = true (medium confidence).** A small building consistent with a
  staffed guard booth sits beside the entrance access road.
- **remoteGs = false.** A guard-booth structure appears present.
- **dockDoors = 50+.** 50+ doors estimated across the north and east faces.
- **dropArea = 50+.** Extensive drop yards hold well over 50 Honda trailers.
- **dropYard = true.** Multiple dedicated trailer-storage lots.
- **preGateStaging = true.** Large paved staging lot outside the building.
- **postGateStaging = true.** Ample internal aprons before the docks.
- **multipleFacilities = true.** Two-building Honda campus (PDC + MCC).
- **railServed = false.** No rail spur.

## Yard zones and counts
- **Perimeter:** ~80 acres — the PDC campus (building, drop yards, staging lots).
- **Drop yards:** three boxes — west drop yard, SW drop yard, and east drop yard.
- **Dock aprons:** two boxes — north dock face and east dock face.
- **Staging:** the large paved staging lot between the public road and building.
- **Truck gate box:** the controlled entrance access road with the guard booth.
- **yardMetrics:** ~55 dock doors, ~120 trailers visible, ~180 capacity, 1 truck
  entrance, 1 building, ~80 acres, not rail-served.

## Web findings
- The Troy PDC has supplied Honda/Acura dealers since 1986; 534,000 sq ft; one
  of two Honda parts facilities off Commerce Center Blvd feeding a national
  network of sister parts centers.

## Final confidence
**Medium.** The PDC was positively located and its distribution-yard
infrastructure is clear in imagery. The PDC-vs-MCC building assignment is a
reasoned inference (PDC = north building) rather than a labeled confirmation,
and the gate/guard-shack calls rest on satellite evidence plus the entrance
signage — no Street View exists inside the secured perimeter. Flagged in
uncertainFields.
