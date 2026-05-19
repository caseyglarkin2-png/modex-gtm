# Deep-Audit Dossier — idx 26: FedEx Freight Hub - Memphis TN

## Resolved location
- **Roster address (incorrect):** 2851 Bartlett Rd, Memphis, TN 38134 — RANGE_INTERPOLATED geocode at 35.203323, -89.868928. Satellite at that point showed a small commercial strip / vacant land near a rail line in central Memphis (38112 area), with no LTL freight terminal.
- **Correct facility:** FedEx Freight LTL hub, **461 Winchester Rd, Memphis, TN 38109** (FedEx Freight terminal code **MEM**).
- **Locked center:** 35.05305, -90.04885.
- **How confirmed:** FedEx Freight's own service-center listing for TN lists "MEMPHIS (MEM) — 461 Winchester Rd, Memphis, TN 38109-3951." Satellite at that address shows a large LTL break-bulk terminal — long cross-dock buildings with doors on both faces and a huge trailer yard. Street View (2025-12) along Winchester Rd shows FedEx Freight tractors and trailers (FedEx logos) and FedEx Freight building signage. This is the correct site.

## Key views
- **Overview / wide (z16-17):** Property fronts the south side of Winchester Rd. Two long cross-dock terminal buildings (one L-shaped, one long diagonal) plus a small office block; an extensive gravel/paved trailer yard fills the southern two-thirds; employee parking in the upper-left near the road.
- **Entrance (z20-21):** Wide driveway/apron off Winchester Rd into a front employee/visitor parking lot ("STOP" pavement markings, marked stalls incl. handicapped). An inner fence line with gate openings separates the front lot from the secured trailer yard; small booth-footprint structures sit beside the inner gate openings, plus an angled visitor check-in stall block.
- **Docks (z19-20):** Classic LTL cross-dock — trailers backed into doors along both long faces of the terminal buildings; "VAP BREAKDOWN" and "DROP" pavement markings; dolly/pup staging strips.
- **Street View (2025-12):** Whole property fenced with black privacy screening; FedEx Freight tractor-trailer entering/exiting at the driveway; FedEx Freight signage visible.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The property is fully fenced (black privacy screen). An inner controlled gate line separates the front parking apron from the secured trailer yard, with defined gate openings (z21).
- **guardShack = true (medium confidence).** A small ~1-vehicle-footprint booth structure sits beside the inner gate opening at the parking/yard boundary. Privacy fencing blocks ground-level confirmation, so this is flagged uncertain.
- **remoteGs = false** (guard shack present).
- **dockDoors = "50+".** Major LTL break-bulk hub: two long cross-dock buildings with doors on both long faces; estimated ~220 total doors. Comparable FedEx Freight hubs run ATL ~304, STL ~240 doors.
- **dropArea / dropYard = true, "50+".** Large dedicated trailer-storage yard south of the docks holding several hundred parked trailers and pup trailers.

## Yard zones and counts
- **Perimeter:** S 35.0508 / W -90.0508 / N 35.0552 / E -90.0470 → ~490 m × ~346 m ≈ **41.9 acres**.
- **truckGate zone:** the inner controlled gate / booth area off the Winchester Rd entrance apron.
- **dropYards:** the large gravel trailer yard across the southern property.
- **dockAprons:** two — one along each cross-dock building's working face.
- **staging:** the breakdown/VAP staging strip between the docks and the trailer yard.
- **yardMetrics:** dockDoorCount ~220, trailersVisible ~320, trailerParkingCapacity ~600, truckGateCount 1, buildingCount 3, siteAreaAcres 41.9, railServed false (rail runs along the east edge but no spur enters the yard).

## Web findings
- FedEx Freight operates two Memphis-area terminals: **MEM** (461 Winchester Rd, 38109) and **NEM / NE Memphis** (3050 Carrier St, 38116). The roster names this "FedEx Freight Hub - Memphis TN" in the FedEx Freight HQ market; the Winchester Rd MEM site is the larger break-bulk hub and matches the "hub" designation.

## Final confidence
**High.** Facility positively re-identified and relocated; layout, gate, and LTL cross-dock characteristics clearly read from imagery. Guard-shack call and exact lane/door counts flagged in `uncertainFields` due to privacy fencing and overhead-only resolution.
