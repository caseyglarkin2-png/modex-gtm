# Deep-Audit Dossier — idx 12

## FedEx Ground Hub — Grove City OH
- **Type:** Ground regional sortation hub (Columbus market)
- **Roster address:** 2969 Lewis Centre Way, Grove City, OH 43123
- **Locked coordinates:** 39.90360, -83.09660
- **Confidence:** high

## Step 0 — Location confirmation
The geocoded roster point (39.904117, -83.095111, ROOFTOP, moved 239 m) landed
inside a multi-tenant industrial park with several big-box warehouses. The
FedEx Ground facility had to be disambiguated from the neighboring tenants.
2025 Street View on Lewis Centre Way (sv4, sv9) shows a clearly FedEx-branded
long, narrow building — the classic FedEx Ground cross-dock form (long N-S,
dock doors on both long faces). Web search confirms FedEx Ground at 2969 Lewis
Centre Way. The correct building is the long narrow cross-dock west of the
large square big-box warehouse; locked center 39.90360, -83.09660.

## Key views
- **z16/z17 context:** Multi-tenant industrial park, Columbus suburbs. FedEx
  building is a long narrow cross-dock; large square warehouses to the E are
  other tenants.
- **z18 fedex-main / final:** Confirms dock doors and trailers along BOTH long
  faces; trailers parked in apron rows and a W-side drop yard.
- **2025 Street View sv6 / sv8:** Truck yard on the W side is enclosed by a
  chain-link perimeter fence with a gate across the truck driveway; a yellow
  FedEx trailer and yard equipment visible inside.
- **Street View sv4 / sv9:** FedEx branding visible on the building face,
  confirming identity; office/employee parking on the road side.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Chain-link perimeter fence and a gate across the
  W-side truck driveway, visible in 2025 Street View.
- **guardShack = false; remoteGs = true.** No staffed booth observed at the
  gate — a fenced/gated yard with unmanned check-in (kiosk / app implied).
- **dockDoors = 50+.** Continuous dock-door rhythm on both long faces of the
  cross-dock; estimated ~90 total — count approximate, flagged uncertain.
- **fastLaneOpportunity = false.** Single curved driveway, no spare multi-lane
  apron at the gate.

## Yard zones and counts
- **perimeter:** the fenced FedEx parcel, ~22 acres.
- **truckGate:** the W-side gated truck driveway near the NE corner.
- **dropYards:** one W-side trailer-storage block.
- **dockAprons:** two strips fronting the building's E and W dock faces.
- **staging:** paved holding area inside the gate before the dock apron.
- **Metrics:** ~90 dock doors, ~70 trailers visible, ~110 trailer capacity,
  1 truck gate, 1 building, ~22 acres, no rail.

## Web findings
Loc8NearMe, Grove City Chamber and FedEx local pages confirm a FedEx Ground
courier/ground operation at 2969 Lewis Centre Way (Columbus metro). 347 reviews
on Birdeye — a customer-facing ground package operation, consistent with a
regional ground sortation/cross-dock hub.

## Final confidence
**High.** Facility identity confirmed via FedEx building branding in recent
Street View; gate confirmed via 2025 imagery. Low-confidence items: exact
dock-door count, entry/exit lane counts, and the drop-area band — flagged in
`uncertainFields`.
