# Deep-Audit Dossier — idx 34 · Kroger Tolleson Dairy (Dairy Plant)

**Address:** 500 S 99th Avenue, Bldg 3, Tolleson, AZ 85353
**Resolved building center:** 33.438630, -112.276560
**Confidence:** medium

## Step 0 — Building confirmation
The supplied point (33.439553, -112.277894) lands in the trailer drop yard of a
large shared industrial campus. The campus holds two distinct operations: the
huge white **Fry's / Kroger Distribution Center** (the building filling the top
of the wide frame) and, to its south-east, the **dairy/bottling plant (Bldg 3)**.

The dairy building was positively identified by its processing signature: a
cluster of vertical **milk storage silos** on the north side of the roof and
dense **rooftop ammonia refrigeration / process equipment** (condensers, tanks)
— hallmarks of a fluid-milk bottling plant, not a flat DC roof. Web research
confirms the **Tolleson Dairy Division of Kroger** at this address, a fluid-milk
and by-products bottling facility (Shambaugh design-build "Kroger Bottling
Facility"; EPA FRS / D&B / Bloomberg listings). Building center locked at
33.438630, -112.276560.

## Key views
- **z16/z17 campus:** distinguishes the DC (north) from the dairy plant
  (center-right) on one fenced campus; extensive trailer drop yards between them.
- **z18/z19 dairy:** rectangular processing building, near E-W aligned (slight
  rotation), milk silos top-center, refrigeration racks on roof.
- **z20 south face:** ~6-8 trailers backed into a dock bank on the south wall +
  employee parking; additional trailers staged in the drop area to the west.
- **z20 west face:** apron with dock canopies and a couple of trailers/tankers.
- **z19/z20 north edge:** multiple **rail tracks** run along the campus north
  boundary — campus is rail-served.
- **z20 interior:** an L-shaped yard/transportation **office** sits among the
  drop yards (fleet ops building), not a perimeter guard booth.

## Gate / guard / dock determinations
- **truckGate = true (uncertain):** the dairy is an interior building on a
  private, fenced, shared campus with a single controlled access off the north
  (Lower Buckeye) road. The entrance throat pinches between the trailer rows and
  the DC. No discrete gate arm was resolvable from satellite and Street View has
  **zero interior coverage** (the only nearby pano, 33.43566/-112.27696, sits
  ~330 m south across a vacant buffer and shows only a distant silhouette).
  Classified true on the fenced/controlled pinch-point.
- **guardShack = false:** no distinct 1-3-space guard booth at the perimeter;
  the only sizable interior structure is the yard office deep in the drop yards.
- **remoteGs = true:** gate present + no guard shack → kiosk / app check-in implied.
- **dockDoors = "10-25" (~16):** south-face dock bank with trailers backed in
  plus west-side bays; a bottling plant's moderate dock count, not a DC mega-bank.
- **dropArea = "25-50" / dropYard = true:** the dairy's finished-goods trailer
  area plus the campus-wide drop yards (hundreds of trailers campus-wide).

## Yard zones & counts
- **perimeter:** ~8.2 ac tight dairy-plant operational footprint (oriented ring),
  not the full shared campus.
- **truckGate:** entrance throat off the north access road.
- **dockApron:** south-face dock strip.
- **dropYard:** trailer storage west of the dairy building.
- dockDoorCount ~16 · trailersVisible ~60 · capacity ~120 · truckGate 1 ·
  buildings 1 · railServed true.

## Web findings
Tolleson Dairy Division of Kroger Inc (founded 2002), fluid-milk bottling at
500 S 99th Ave; underwent a design-build capacity-doubling project (Shambaugh).
Listed in EPA FRS, D&B, Bloomberg, Manta. Hourly manufacturing hiring (Indeed).

## Final confidence: medium
Building ID is high-confidence (clear dairy signature + corroborating web
records). Gate/guard/lane calls are medium at best: the campus is private with no
Street View interior coverage, so the controlled-access read relies on satellite
pinch-point geometry rather than a visible booth or arm. Flagged fields listed in
`uncertainFields`.
