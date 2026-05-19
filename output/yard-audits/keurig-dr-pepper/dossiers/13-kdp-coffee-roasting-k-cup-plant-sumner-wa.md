# Deep-Audit Dossier — idx 13

## KDP Coffee Roasting / K-Cup Plant — Sumner WA

**Type:** Manufacturing - Coffee/K-Cup
**Resolved location:** 3418 142nd Ave E, Sumner, WA 98390 — `47.225300, -122.242500`
**Gate verdict:** No controlled truck gate · **Guard shack:** None · **Confidence:** High

## Location resolution
Roster gave 3424 142nd Ave E (47.2250, -122.2414); some business listings give 3324. Step-0
satellite probes landed at a street intersection in the Sumner industrial district. Street View
along 142nd Ave E **positively confirmed** the facility: the warehouse front carries the
**"Keurig Dr Pepper" logo and company name**, with the building number **"3418"** marked on the
office portion. The roster coordinate was ~140 m south of the actual building front. Center
locked at 47.2253, -122.2425. This is an active KDP coffee roasting / K-Cup manufacturing and
distribution building.

## Key views
- **Wide (z16/z17):** Dense distribution district — rows of large warehouses with extensive
  intermodal-container and trailer yards (the Sumner/Puyallup Valley logistics hub).
- **Building front (Street View 2025):** "Keurig Dr Pepper" branded office front facing 142nd
  Ave E; employee car parking along the front; an "Industrial Space Available" leasing sign.
- **North face (z19):** A long dock-door row with trailers backed in, fronting a very large
  trailer/intermodal-container drop yard.
- **South face (z19):** A second long dock-door row with trailers backed in; another drop yard.
- **Truck yard (Street View, north of building):** Tractor/trailer yard wide open to 142nd Ave E
  — no barrier arm, no guard booth.

## Gate / guard-shack / dock determinations
- **truckGate = false:** The building's truck yard and the drop yards open directly onto 142nd
  Ave E through wide, unbarred driveways. No barrier arm, sliding gate, or checkpoint pinch-point.
- **guardShack = false:** No booth structure at any driveway — open multi-tenant industrial-park
  access.
- **remoteGs = false:** No gate, so no remote check-in.
- **dockDoors = "50+":** Cross-dock warehouse with long dock-door rows on both the north and
  south building faces; ~64 doors estimated (approximate — flagged).
- **dropArea = "50+" / dropYard = true:** Extensive trailer and intermodal-container drop yards
  north and south of the building, many dozens of units in organized rows.
- **shipRcvSeparate = true:** Dock banks on physically separate building faces (north vs south).
- **fastLaneOpportunity = true:** Very wide unbarred yard aprons with multiple lanes of paved
  width — ample room for an express bypass lane.

## Yard zones and counts
- **Perimeter:** ~26 acres bounded by 142nd Ave E (east), neighboring warehouses (west), and the
  drop yards (north/south) — derived from the locked center coordinate.
- **truckGate zone:** open driveway entrance off 142nd Ave E to the north yard (no gate structure).
- **dropYards:** two — the large north intermodal/trailer yard and the south trailer yard.
- **dockAprons:** two — the north dock row and the south dock row.
- **staging:** the central cross-drive / yard area between the dock faces.
- **yardMetrics:** ~64 dock doors, ~110 trailers/containers visible, ~180 trailer capacity,
  2 truck access points, 1 main building, ~26 acres, not rail-served.

## Web findings
- Puyallup/Sumner Chamber of Commerce lists Keurig Dr Pepper at 3424 142nd Ave E, Sumner — a
  food & beverage member. Haskell has done K-Cup packaging-line controls work in Sumner. The site
  functions as a coffee roasting / K-Cup manufacturing and distribution building.

## Final confidence
**High.** Facility positively identified via on-building KDP branding. Layout, cross-dock
configuration, drop yards, and open (ungated) access are all clearly visible. Only the exact
dock-door and trailer counts carry mild uncertainty and are flagged.
