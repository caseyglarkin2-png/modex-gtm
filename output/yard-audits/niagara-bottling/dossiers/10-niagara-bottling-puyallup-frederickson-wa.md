# Deep-Audit Dossier — Niagara Bottling, Puyallup (Frederickson) WA (idx 10)

## Resolved location
- **Address:** 19820 57th Ave E, Puyallup, WA 98375 (Frederickson)
- **Locked center:** 47.076030, -122.355800
- **Confirmation:** Roster coordinates landed accurately on the building. Street
  View (2024-05) of the east face shows three large cylindrical water-treatment
  silos — the unambiguous signature of a Niagara bottled-water plant — plus the
  office and employee parking. Web research confirms a ~311,000 sq ft Niagara
  Bottling plant at 19820 57th Ave E, opened February 2014, expanded multiple
  times (most recent a $35M line addition).

## Key views
- **Wide / full facility (z17):** Large white-roofed building. Loading docks
  along the **north face** with trailers backed in plus a trailer drop yard
  behind; a separate dock bank on the **south face**; office, employee parking,
  and water-treatment silos on the east side.
- **East face (Street View 2024-05):** Office plus three tall water-treatment
  silos.
- **Truck gate (NE side, Street View 2024-05):** The truck yard is enclosed by a
  black chain-link perimeter fence with a sliding gate across the truck entry
  drive; a truck is shown passing through; yellow bollards channel the lane; a
  canopy/check-in structure stands beside the gate drive.
- **North dock yard (z19):** Long dock-door row along the full north face with
  many trailers backed in, plus multiple rows of parked trailers (drop yard).

## Gate / guard-shack / dock determinations
- **truckGate = true.** Truck yard enclosed by a black chain-link perimeter
  fence; a sliding gate crosses the truck entry drive on the NE side (clearly
  visible in Street View). Yellow bollards channel the lane.
- **guardShack = false.** A canopy/check-in structure stands beside the gate
  drive, but no traditional multi-window manned guard booth is visible.
- **remoteGs = true.** Controlled sliding gate with a canopy check-in point and
  no manned booth implies kiosk / automated / remote check-in.
- **dockDoors = "25-50".** Long dock-door row along the full north face with many
  trailers backed in, plus a separate smaller dock bank on the south face;
  estimated ~42 total (approximate, flagged).
- **dropArea / dropYard = true, "25-50".** Multiple rows of parked trailers in the
  north truck yard — a substantial dedicated drop yard.
- **shipRcvSeparate = true (inferred).** Two physically separate dock clusters —
  a large north-face bank and a smaller south-face bank — suggesting separate
  ship/receive operations. Flagged.

## Yard zones and counts
- **Perimeter:** ~32 acres (Niagara parcel: building + fenced north truck yard +
  south dock apron + east employee parking).
- **truckGate:** single controlled entrance on the NE side.
- **dropYards / dockAprons:** north-face dock apron + drop yard, and the south-face
  dock apron.
- **staging:** paved area inside the gate ahead of the dock apron.
- **yardMetrics:** ~42 dock doors, ~40 trailers visible, ~55-trailer capacity,
  1 truck gate, 1 building, ~32 acres, no rail.

## Web findings
- Niagara Bottling Frederickson plant, 19820 57th Ave E, Puyallup WA — ~311,000
  sq ft advanced manufacturing/distribution; opened February 2014; >$112M capital
  investment; ~100 full-time employees; multiple expansions including a recent
  $35M line addition; phone (253) 847-4225.

## Final confidence
**High.** Facility positively identified by the water-treatment silos. Truck
gate is clearly fenced with a visible sliding gate. Guard-shack absence,
dock-door count, and the ship/receive-separate inference carry the residual
uncertainty (listed in uncertainFields).
