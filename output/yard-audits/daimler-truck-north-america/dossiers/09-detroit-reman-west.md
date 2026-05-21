# Deep-Audit Dossier — idx 09

## Detroit Reman West — Tooele, UT

- **Account:** Daimler Truck North America
- **Type:** Remanufacturing plant (engines/components)
- **Roster address:** 100 South Lodestone Way, Tooele, UT 84074
- **Resolved center:** 40.52945, -112.34998
- **Method:** deep-audit | **Confidence:** medium

## Step 0 — Location confirmation

The roster coordinate (40.529445, -112.349796; ROOFTOP, moved 145 m) lands
squarely on the roof of a large white-roofed plant building in the Utah
Industrial Depot — the former Tooele Army Depot, built by the Army in the early
1990s and converted to commercial use by Penske in 1996. DTNA careers, the
Tooele Chamber and Yelp confirm this as Detroit Reman West, the second-largest
Detroit Reman plant (~330 workers, turbochargers and off-highway S-series
engines), at 100 South Lodestone Way. A z19 probe on the exact geocode point
confirms it is on the building roof.

## Key views

- **Wide z16:** A sprawling industrial-depot park of large rectangular
  buildings; the white Detroit Reman West building sits among them.
- **Main building z18:** Large white-roofed plant with attached office on the
  NE; trailer rows along the south/SW and heavy outdoor materials storage on
  the west.
- **South / SW z20:** Long rows of parked trailers (drop yard) and extensive
  outdoor core/component storage in stacked rows.
- **NE z18-z20:** Employee parking lot and a landscaped office entrance.
- **Street View (2015-2024):** Open desert depot roads; perimeter chain-link
  fencing on building faces; no checkpoint structure resolved.

## Gate / guard-shack determination

- **Truck gate: NO (flagged uncertain).** Perimeter chain-link fencing is
  visible on multiple building faces, implying controlled access, but Street
  View coverage at the entrances is sparse (mostly 2015-2018) and shows no
  barrier arm, sliding gate or guard booth. A gate is plausible for a
  330-worker DTNA plant but is not visually confirmed — recorded false, flagged.
- **Guard shack: NO (flagged uncertain).** No booth observed; coverage poor.
- **Staging:** No dedicated pre-/post-gate truck staging observed.
- **Fast-lane opportunity: NO.**

## Yard zones and counts

- **Perimeter geofence:** S 40.5266, W -112.3524, N 40.5310, E -112.3483 —
  ~55 acres, capturing the plant building, attached office, employee lots, the
  south/SW drop yards and the west outdoor storage yard.
- **Drop yards:** Trailer-storage rows on the south and SW sides.
- **Dock apron:** South/SW building face.
- **dockDoorCount ~22** (band 10-25) — dock doors along the south/SW face;
  approximate, partly obscured by parked trailers.
- **trailersVisible ~45**, **trailerParkingCapacity ~70** — dropArea 25-50.
- **truckGateCount 1** (one main truck-entrance area, not confirmed controlled),
  **buildingCount 1**, **railServed false** (the rail spur seen nearby serves a
  separate SE building, not this one).

## Web findings

DTNA, Tooele Chamber and Yelp confirm Detroit Diesel Remanufacturing-West at
100 South Lodestone Way, Tooele — the second-largest Detroit Reman plant
(~330 workers), focused on turbochargers and off-highway S-series engines used
in hydraulic fracturing and marine applications. The plant occupies a former
Army Depot building converted to commercial use. No public detail on the gate
layout.

## Final confidence

**Medium.** The facility is positively identified and the yard layout (drop
yards, outdoor core storage, dock face) reads clearly, but gate and guard-shack
determinations are limited by sparse Street View coverage and dock counts are
partly obscured by parked trailers. truckGate, guardShack, remoteGs, dockDoors,
ship/receive separation, connectivity and rail service are listed in
uncertainFields.
