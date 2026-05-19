# Deep-Audit Dossier — CJ Logistics, Secaucus NJ (idx 20)

## Facility
- **Name:** CJ Logistics - Secaucus NJ
- **Type:** Distribution Center
- **Address:** 901 Castle Road, Secaucus, NJ 07094
- **Resolved center:** 40.7717, -74.0806

## Location confirmation
Roster geocode (40.772188, -74.080865, ROOFTOP, moved 101 m) landed on a
large dark-roofed warehouse. Web search confirmed 901 Castle Rd as the **CJ
Logistics America NJ Secaucus Center** — the CJ open-space spec sheet states
107,929 SF of warehouse, 188,615 SF total property (~4.33 acres), 19 exterior
docks, 19 trailer positions, 4 drive-in doors, 20 ft clear height. Probed
satellite z17-z21 and Street View (2019, 2024).

## Site layout
- Single large rectangular warehouse, oriented NW-SE, in the very dense
  Secaucus / NJ Meadowlands industrial fabric.
- **South / SW:** Dock face and a fenced truck yard with parked trailers and
  tractors; Castle Rd beyond.
- **SE:** A second dock face with trailers backed in.
- **North / NE:** Building wall; adjacent warehouses and a rail corridor.
- The whole property is wrapped by a chain-link perimeter fence.

## Key views
- **z17/z18:** Confirmed single large warehouse among a tight cluster of
  Meadowlands warehouses.
- **z19 building:** Docks with trailers backed in on the SW and SE faces.
- **z20/z21 yard:** South truck yard packed with trailers, tractors and
  vans; chain-link fence with a driveway gate opening.
- **Street View (2019, 2024) Castle Rd:** Continuous chain-link perimeter
  fence; the truck driveway enters through a gate opening in the fence. A
  small structure sits at the SW corner of the yard. No clear staffed guard
  booth at the gate.

## Gate / guard-shack / dock determinations
- **truckGate: true.** The property is fully enclosed by a chain-link
  perimeter fence; the truck driveway off Castle Rd passes through a fence
  gate opening — a controlled truck entrance.
- **guardShack: false.** No clearly staffed guard booth visible at the gate
  in Street View; the small SW-corner structure is not positioned as a gate
  booth.
- **remoteGs: true.** Gate present, no guard shack — kiosk / call-box / app
  check-in implied.
- **dockDoors: 10-25.** CJ spec sheet states 19 exterior docks (plus 4
  drive-in doors) — matches the band. Docks on the SW and SE faces.
- **dropArea: 10-25 / dropYard: true.** South truck yard holds ~20 parked
  trailers; functions as a drop yard.

## Yard zones and counts
- **perimeter:** ~245 m x 135 m, ≈8.2 acres (full building + south yard;
  CJ's cited parcel is ~4.33 acres — the building appears multi-tenant and
  larger than CJ's 107,929 SF lease).
- **truckGate zone:** the Castle Rd fenced-gate driveway.
- **dropYards:** the south truck yard.
- **dockApron:** strip along the SW/SE dock faces.
- **dockDoorCount 19** (per spec sheet), **trailersVisible ~20**,
  **buildingCount 1**, **railServed false**.

## Web findings
901 Castle Rd is the CJ Logistics America NJ Secaucus Center (Branch),
phone 201-643-1051. Per the CJ open-space sheet: 107,929 SF warehouse,
80,000 SF available, 19 exterior docks, 19 trailer positions (2 with loading
strips), 4 drive-in doors, 20 ft clear. Listed under Panjiva/ImportInfo as
"CJ Logistics Freight America, 901 Castle." CJ specializes in Tire, Military
and CPG here.

## Confidence
**Medium.** Building identity and the chain-link perimeter fence are clear,
and the CJ spec sheet corroborates the dock count. The lack of a visible
guard booth supports a remote (kiosk) check-in classification, though the
gate hardware could not be fully resolved through roadside trees. Site area
is approximate because the building appears to be multi-tenant and exceeds
CJ's cited 4.33-acre parcel.
