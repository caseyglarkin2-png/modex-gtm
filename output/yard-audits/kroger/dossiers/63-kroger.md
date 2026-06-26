# Deep-Audit Dossier — idx 63

**Facility:** Home Chef Production Center (Relish Labs LLC dba Home Chef)
**Type:** Home Chef Facility
**Address:** 6901 W 65th St, Bedford Park, IL 60638
**Resolved coords:** 41.77270, -87.79190
**Confidence:** medium
**Method:** deep-audit

## Step 0 — Locating the facility
The supplied coords (41.770994, -87.817353) were ~2 km west, landing on a refinery/tank-farm and a residential strip — not a food production building. Web search resolved the exact address to **6901 W 65th St, Bedford Park IL** (Home Chef opened this ~103,000 sq ft production center in Feb 2018; the parcel is registered to Relish Labs LLC in the Village of Bedford Park business directory, and Waze/Apple Maps pin the same address). Note 6901 W 65th is also associated with a Lineage cold-storage facility — the address corridor hosts multiple food/cold buildings.

Satellite around the geocoded address showed an industrial corridor S of the W 65th St arterial. The audited building is the **tan/white modern spec warehouse on the east side of the N-S service road**, S of 65th St: a 2018-era white panel building with blue accent stripes, matching the Home Chef facade. A "For Lease" sign on the perimeter fence suggests part of the building may be marketed, but address + facade + build year align with the Home Chef production center.

## Key views
- **Wide satellite (z16/z17):** W 65th St runs E-W; three large warehouses sit south of it. The center tan building is the target; a white building (likely Lineage 7035) is to the W across the service road, a grey warehouse to the E.
- **Tight satellite (z18/z19):** Building long axis runs roughly N-S, tilted a few degrees. **Dock bank with trailers backed in along the WEST wall** (truck side); **employee parking lot along the EAST wall** (office/car side); landscaped buffer + drives at the N end toward 65th St.
- **Street View (W service road, pano jedZ3iuqhaTS5D_zsovA_A, 2025-06):** west building face with a **chain-link perimeter fence and a sliding gate** across the truck drive; trailers visible backed at docks behind the fence. No staffed booth visible.

## Determinations
- **truckGate = true** — chain-link sliding gate across the truck drive into the W dock court, perimeter-fenced.
- **guardShack = false / remoteGs = true** — no staffed booth visible at the gate; reads as unmanned (kiosk/app check-in implied). Low confidence: pano coverage is from the public road only, not inside the court.
- **dockDoors = 25-50** — a full dock bank (~28 doors estimated) runs the W building wall.
- **dropArea = 10-25** — 10-25 trailers along the W court; dropped vs. live split uncertain at this resolution.
- **postGateStaging = true** — paved court between the gate and dock wall gives interior holding room.
- **drivewayLong = true** — the gate→dock approach can hold a queue of 3+ trucks.
- **entryExitTogether = true**, entryLanes/exitLanes = 1/1, fastLaneOpportunity = false.
- **urbanRural = Urban** — dense Chicago metro fabric, residential directly N/W, contiguous industrial corridor.
- **scale / dropYard / multiStep / multipleFacilities / shipRcvSeparate = false**, **railServed = false** — no truck scale, no dedicated separate trailer-storage lot, single building, single dock cluster, no rail spur into the parcel.

## Yard zones & counts
- **Perimeter:** ~11.8 acres, the fenced parcel (building + W truck court + E parking lot), oriented to the building's slight N-S tilt.
- **truckGate zone:** the gated entrance on the W service road into the dock court.
- **dockApron:** a long thin quad hugging the W dock wall.
- **dropYards / staging:** not separately traced (court doubles as drop + staging).
- dockDoorCount 28, trailersVisible ~18, trailerParkingCapacity ~30, truckGateCount 1, buildingCount 1.

## Web findings
- Home Chef / Relish Labs production center, opened Feb 2018, ~103k sq ft, Bedford Park IL. Roles posted include Gatekeepers, Forklift/Machine Operators, Shipping & Receiving — confirms active dock/truck operations and a manned gate function.
- Same address corridor associated with Lineage cold storage (6901/7035 W 65th).

## Confidence
**Medium.** Location is positively resolved and the dock/gate geometry is clear from satellite + Street View. Uncertainty: guard-shack/remoteGs (no inside-the-court pano), the dropped-vs-live trailer split, and whether the whole building is Home Chef-occupied (leasing sign on the fence).
