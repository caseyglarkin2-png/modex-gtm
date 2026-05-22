# Kraft Foods - Jacksonville - Portion Control (FL)

**Facility type:** Packaging Supply (Heinz Portion Control / Portion Pac — small-portion ketchup, mustard, dressings, jams for foodservice)
**Address:** 7500 Forshee Dr, Jacksonville, FL 32219
**Resolved center coordinate:** 30.38142, -81.77445
**Archetype:** #3 — No Gate / No GS
**Confidence:** high

## How I confirmed the location

The supplied approximate coordinate (30.3826522, -81.7738688) placed the pin in the woods just north of the actual building. A satellite probe at zoom 16-17 around the pin showed one obvious large industrial building immediately south of Forshee Dr. Web search confirmed Kraft Heinz Foods Co. (Portion Control Division, dba Portion Pac) sits at 7500 Forshee Dr — built 1996, 307,849 sqft on a 676,307 sqft (~15.5 acre) lot, owned by H J Heinz Company L P (Jaxdailyrecord, Yellow Pages, Buzzfile, ClustrMaps). The building footprint, parcel boundary, and adjacency to Forshee Dr all match. Building center locked at lat 30.38142 / lng -81.77445.

## Key views

- **Wide zoom 17 overview** (`tmp/kh-jax/final-overview-z17.png`) — single rectangular industrial building, surrounded by tree buffers, with employee parking on the west and trailer yard/docks on the east and south. Single connection to Forshee Dr at the north.
- **Centered zoom 18** (`tmp/kh-jax/center-z18.png`) — clear view of the full east dock face with ~30 trailers backed in, plus loading area on the south.
- **East dock face zoom 19-20** (`tmp/kh-jax/east-docks-z19.png`, `east-docks-z20.png`) — regular rhythm of ~30 dock bays running north-south along the east face; trailers present at most positions; vehicle parking strip in front of the dock building used by yard hostlers.
- **SW corner zoom 19** (`tmp/kh-jax/sw-corner-z19.png`) — dedicated drop yard with ~10-13 trailers in marked stalls; small auxiliary dock bank (6-8 doors) along south face.
- **North entry zoom 19-21** (`tmp/kh-jax/north-entry-z19.png`, `entry-z20.png`, `guardshack-z21.png`, `guardshack2-z21.png`) — single driveway off Forshee Dr; no barrier arm, no sliding gate, no guard booth resolved. Driveway splits inside the property into a west spur (employee lot) and a south/east spur (truck loop to docks).
- **Street View on Forshee Dr** (captured 2025-03, `sv-forshee-driveway2-s.png`) — confirms the entry is open: I see two yellow channelizing bollards in the driveway centerline but no gate hardware, no booth, no fence across the entry.

## Gate / guard-shack determination

**truckGate = false.** The Forshee Dr driveway is wholly open. No barrier arm, sliding gate, swing gate, or pinch checkpoint. The two yellow bollards Street View shows in the centerline are flexible lane-channelizers, not a vehicle barrier — they keep inbound/outbound lanes separated but do not stop a truck. Per the rubric ("An open driveway with no control = false"), this is no gate.

**guardShack = false.** A small structure on the driveway shoulder appears in zoom-20 imagery, but at zoom 21 it resolves as a sign monument or utility cabinet, not a windowed guard booth with the ~1-3 parking-space footprint of a staffed shack. No personnel visible in Street View. Flagged uncertain because the structure could not be 100% ruled out as an unstaffed kiosk, but the Street View confirms no staffed booth presence at the gate apron.

**remoteGs = false.** Per rubric, when there is no truck gate the field is false regardless of any kiosk presence. Settles cleanly into Archetype #3.

## Yard layout and counts

- **dockDoorCount = 38.** ~30 doors along the east face (full-length bank with regular dock-leveler pattern, trailers backed in at most positions), plus ~6-8 along the south face. Banded "25-50".
- **trailersVisible = 32.** At the moment of imagery: ~25 along the east dock face, ~5 at south-face docks, ~2-3 in the SW drop yard.
- **trailerParkingCapacity = 45.** Sum of dock positions (38) plus the SW drop-yard stalls (~10-15) implies the site could hold ~45 trailers between docks and the drop yard.
- **truckGateCount = 1.** Single property entrance.
- **buildingCount = 1.** Single contiguous ~308k-sqft manufacturing building.
- **siteAreaAcres = 14.6.** Computed from the perimeter geofence (~228 m N-S × ~259 m E-W ≈ 59k m² ≈ 14.6 acres). Matches the public 15.5-acre lot record within imagery-perimeter error.
- **railServed = false.** A rail line runs along Old Kings Rd just east of the property, but I traced no spur entering the Kraft parcel. Outside the property line.

## Yard zones (geofences)

- **perimeter** S 30.38055, W -81.77580, N 30.38260, E -81.77310 — the full Kraft parcel, bounded by Forshee Dr on the north, a tree buffer / Old Kings Rd corridor on the east, woods/wetlands on the south, and the employee-parking edge on the west.
- **truckGate** at the north entry off Forshee Dr.
- **dropYards[0]** captures the SW-corner trailer-storage area.
- **dockAprons** — two boxes: the long east-face apron and the south-face apron.
- **staging** — null (no pre-gate stack; trucks queue inside the loop).

## Other classification calls

- **postGateStaging = true** — wide paved truck loop south and east of the building provides queue space.
- **drivewayLong = true** — internal loop drive from the Forshee entry to the east dock face is ~250 m of paved travel, easily holds 3+ trucks.
- **entryExitTogether = true** — single property connection, trucks and cars share the entry then split inside.
- **entryLanes = 1**, **exitLanes = 1** — one in, one out, divided only by bollards.
- **shipRcvSeparate = true (uncertain)** — two distinct dock clusters on different building faces (the large east bank and the smaller south bank) suggests separated shipping vs. receiving. Flagged uncertain because a single ops mode spread across two faces is also plausible.
- **dropYard = true** — clear dedicated trailer-storage lot at the SW corner, separate from active dock staging.
- **urbanRural = "Rural"** — edge-of-Jacksonville industrial fringe, surrounded by heavy woods; per rubric, borderline industrial-with-woods → Rural.
- **connectivityIssue = false (uncertain)** — Despite Rural classification, this is Jacksonville metro fringe along I-295 / Pritchard Rd industrial corridor; cellular should be fine. Flagged uncertain.
- **multipleFacilities = false** — single building on the Kraft parcel; the very large Walmart-style DC south of the property is a separate company on a separate parcel.
- **scale = false** — no truck scale pad anywhere on the truck path.
- **multiStep = false** — no checkpoint, let alone two.

## Web findings

- 7500 Forshee Dr, Jacksonville, FL 32219 (Buzzfile, Yelp listing for Portion Pac at the same address, phone 904-695-1300).
- Kraft Heinz Foods Company, Portion Control Division — manufactures small-portion condiments (ketchup packets, mustard packets, dressings, jams) for restaurants and hotels (IndustryNet, MetroJacksonville article).
- Property owned by H J Heinz Company L P; building constructed 1996; 307,849 sqft on a 676,307 sqft lot (ClustrMaps public records).
- Not the same as the downtown Jacksonville Kraft Heinz facility (which Jax Daily Record reported demolishing a 100-year-old building in 2026) — that's a different Heinz site in Downtown Jacksonville.

## Final summary

- **Gate:** none — open driveway with channelizing bollards only.
- **Guard shack:** none — no staffed booth at the entry.
- **Confidence:** high.
