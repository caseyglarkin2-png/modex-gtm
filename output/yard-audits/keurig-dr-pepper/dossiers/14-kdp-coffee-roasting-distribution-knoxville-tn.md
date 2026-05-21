# Deep-Audit Dossier — idx 14

## KDP Coffee Roasting / Distribution — Knoxville TN

**Type:** Manufacturing & Distribution - Coffee
**Resolved location:** 3109 Water Plant Rd, Knoxville, TN 37914 — `35.943600, -83.824200`
**Gate verdict:** No controlled truck gate · **Guard shack:** None · **Confidence:** High

## Location resolution
Roster gave 5000 Western Ave (35.9727, -84.0032); the geocode itself flagged a 1701 m shift, and
Step-0 probes confirmed that point lands in a residential/wooded part of NW Knoxville — not a
plant. Web research (Waze, Manta, Dun & Bradstreet, Green Mountain Coffee press releases) shows
the actual facility is the former Green Mountain Coffee / Keurig Knox County plant at **3109
Water Plant Rd, Knoxville TN 37914**, in the **Forks of the River Industrial Park** — a 334,000
sq ft building on a ~31-acre parcel, built out in phases from 2008-2012 for K-Cup manufacturing
and coffee roasting/distribution. Street View **positively confirmed** it: the building front
carries the **"Keurig Dr Pepper" logo and address "3109"**. Center locked at 35.9436, -83.8242.

## Key views
- **Wide (z16):** Forks of the River Industrial Park — a cluster of large warehouses along the
  Tennessee River on the SE edge of Knoxville.
- **Building front (Street View 2025):** "Keurig Dr Pepper" branded warehouse, address 3109;
  dock-door bank with trailers backed in on the east end; employee parking fronting Water Plant Rd.
- **SE/south face (z18-z20):** A long dock-door row with many trailers backed in.
- **SW drop yard (z18/z19):** Rows of dozens of parked trailers, separate from the active docks.
- **Rail (z19):** A rail spur/siding runs along the SE side of the building with hopper/rail
  cars parked on it.

## Gate / guard-shack / dock determinations
- **truckGate = false:** The dock apron and truck yard open directly onto Water Plant Rd via wide
  unbarred driveways. No barrier arm, sliding gate, or checkpoint pinch-point — Street View shows
  employee parking and the dock bank fronting the road with no control point.
- **guardShack = false:** No booth structure at any driveway.
- **remoteGs = false:** No gate, so no remote check-in.
- **dockDoors = "25-50":** A long dock-door row on the SE/south face; ~34 doors estimated
  (approximate — flagged).
- **dropArea = "50+" / dropYard = true:** A large dedicated trailer drop yard SW of the building
  holds rows of dozens of parked trailers.
- **shipRcvSeparate = false:** Docks concentrated on a single SE/south building face.
- **railServed = true:** A rail spur with parked rail cars runs alongside the building.
- **fastLaneOpportunity = true:** Wide unbarred dock apron and yard with ample paved width.

## Yard zones and counts
- **Perimeter:** ~31 acres (matches the documented parcel) bounded by Water Plant Rd (NE), the
  rail line and drop yard (SW), woods and neighboring warehouses.
- **truckGate zone:** open driveway entrance off Water Plant Rd (no gate structure).
- **dropYards:** one large trailer drop yard SW of the building, past the rail line.
- **dockAprons:** one — the SE/south dock-door row.
- **staging:** the paved yard between the dock apron and the access driveways.
- **yardMetrics:** ~34 dock doors, ~70 trailers visible, ~110 trailer capacity, 1 truck access,
  1 main building, ~31 acres, rail-served.

## Web findings
- Green Mountain Coffee announced the Tennessee facility in 2008 and built it out in phases; it
  manufactures K-Cup portion packs and handles green-coffee roasting/blending/grinding.
- In January 2023, KDP completed a **$65M sale-leaseback** of this Knoxville distribution center
  (CoStar) — KDP continues to lease and operate the facility, so it remains an active KDP site.

## Final confidence
**High.** Facility positively identified via on-building KDP branding and matching documented
square footage/acreage. Layout, docks, drop yard, rail spur, and open (ungated) access are all
clearly visible. Only exact dock-door and trailer counts carry mild uncertainty and are flagged.
