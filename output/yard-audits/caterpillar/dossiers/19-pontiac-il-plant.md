# Deep-Audit Dossier — Caterpillar Pontiac IL Plant (idx 19)

## Resolved location
- Roster gave 1300 4H Park Rd, Pontiac, IL 61764, lat/lng 40.887546,-88.651789
  (geocode ROOFTOP, movedMeters 71). The point landed directly on the plant
  building — accurate.
- Confirmed via Panjiva (Caterpillar Engine Systems Inc., 1300 4H Park Rd) and
  Illinois State Fire Marshal UST records. The plant has operated since 1978,
  assembling and testing fuel injectors and fuel pumps for Cat products.
- **Locked center:** 40.88670, -88.65180 (main plant building).

## Key views
- z16-z17 probes: a large single manufacturing building with sawtooth/north-light
  roof sections, employee parking on the E and SW sides, an attached cluster of
  process/utility buildings on the SW (water treatment, support structures),
  surrounded by farmland with a residential subdivision adjacent to the N.
- z18-z20 E/NE side: dock activity — a dock canopy structure with material storage,
  a few trailers, and a small yard.
- z19-z20 of the entrance: a controlled access road from 4H Park Rd into the
  fenced property.
- Street View (2022, 2025): chain-link perimeter fencing around the plant, a
  Caterpillar monument sign, and a Caterpillar-branded water tower; the plant sits
  behind a grassy buffer.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The plant is a chain-link-fenced manufacturing facility with
  a controlled entrance road from 4H Park Rd; Caterpillar signage and water tower
  confirm the site.
- **guardShack = false / remoteGs = true (LOW CONFIDENCE — flagged).** No guard
  booth was positively imaged at the gate. remoteGs set true on a remote-check-in
  assumption; both flagged uncertain.
- **dockDoors = "0-10".** This is a precision-component plant (fuel injectors), not
  a distribution facility — modest dock activity on the E/NE side with a dock
  canopy and a few trailers. Estimated ~10 doors — flagged.
- **postGateStaging / drivewayLong = true.** The access road and internal paved
  area give room for truck stacking inside the gate.

## Yard zones and counts
- **Perimeter:** ~68 acres fenced campus including parking (box 40.8840-40.8888 N,
  -88.6555 to -88.6490 W).
- **Drop yard / dock apron:** small trailer/material area at the E dock; no large
  dedicated drop lot (dropYard = false).
- **buildingCount = 2** (main plant + attached SW utility/process cluster).
- **railServed = false** — no spur into the property.
- **urbanRural = Rural** — Pontiac IL is a small town; the plant is edge-of-town
  surrounded by farmland.

## Web findings
- Caterpillar Pontiac (Caterpillar Engine Systems Inc.): established 1978; assembly
  and testing of fuel injectors and fuel pumps for Cat products. Address 1300 4H
  Park Rd, Pontiac, IL 61764.

## Final confidence: medium
Facility positively identified and located on accurate ROOFTOP coordinates; fenced
controlled entrance and dock activity imaged. Guard-shack determination could not be
confirmed and is flagged; dock-door count is an honest overhead estimate.
