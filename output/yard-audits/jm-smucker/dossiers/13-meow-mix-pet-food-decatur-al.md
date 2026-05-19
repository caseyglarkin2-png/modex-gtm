# Deep-Audit Dossier — Meow Mix Pet Food, Decatur AL (idx 13)

## Resolved location
- **Roster input:** "1200 Market St NE, Decatur, AL 35601" — geocoded 34.607163, -86.968268 (ROOFTOP, moved 190 m).
- **Confirmed building:** Satellite probes land on a large white ~200,000 sq ft manufacturing building on the Tennessee River riverfront in Decatur, with an adjacent dock building, a chain-link-fenced trailer yard, a processing/tank cluster, and rail tracks along the south/east edge.
- **Web confirmation:** This is the J.M. Smucker Meow Mix plant (operating entity Meow Mix Decatur Production LLC) at 1200 Market St NE — produces ~40% of Smucker's cat food, ~600 tons/day, ~200,000 sq ft, with a recent $21.4M expansion (admin building + new manufacturing equipment). **Locked center: 34.6068, -86.9685.**

## Key views
- **z16 context:** Riverside industrial corridor on the edge of Decatur — Tennessee River to the north, multi-track rail to the south, neighboring heavy-industrial plants. Small-city industrial setting.
- **z17/z18 overview:** White plant building plus an adjacent dock building; a large chain-link-fenced trailer yard with rows of drop trailers to the SW/W; processing tanks to the SE; a separate large round grain-storage tank complex further SE (treated as a distinct grain-elevator operation, excluded from perimeter).
- **z19-z21 tight:** Multi-track rail yard with hopper cars along the south/east edge; a spur serves the plant's bulk-ingredient receiving. Trailer yard packed with 50+ drop trailers. Dock building face partly washed out by white-roof glare.
- **Street View (Market St NE & rail-side road, 2022-10/11):** Low admin/office building at the Market St frontage with landscaping; chain-link perimeter fencing around the trailer yard with sliding gates; Knight Transportation trailer in the yard; hopper cars on the adjacent rail tracks.

## Gate / guard-shack / dock determinations
- **truckGate: true** — Fully chain-link-fenced property with sliding chain-link gates at the truck entrances (visible from Market St and the rail-side road). At least two truck access points (Market St SW, rail-side road E) → truckGateCount = 2.
- **guardShack: false** — No staffed booth at any truck gate in Street View 2022 or satellite z21. The Market St frontage structure is a low admin/office building, not an entry booth; a green-roofed building near the trailer yard is not positioned as a gate booth. Flagged uncertain.
- **remoteGs: true** — Controlled gates, no guard booth → kiosk / app check-in.
- **dockDoors: 10-25** — ~18 doors estimated; white-roof glare limited the count, flagged uncertain.
- **dropArea: 50+** — The fenced trailer yard holds 50+ drop trailers.
- **railServed: true** — Multi-track rail yard with hopper cars and a spur serving bulk-ingredient receiving. Unambiguous.

## Yard zones and counts
- **Perimeter:** Meow Mix operational footprint (plant + dock building + trailer yard + process area), ~401 m N-S × ~339 m E-W ≈ **33.6 acres**. The large round grain-storage tanks further SE are excluded as a separate operation.
- **truckGate zone:** the Market St SW entrance.
- **dropYards:** one large fenced trailer drop yard W/SW of the plant.
- **dockAprons:** one apron along the dock building face.
- **staging:** internal yard depth serves as post-gate staging.
- **Metrics:** dockDoorCount ~18, trailersVisible ~55, trailerParkingCapacity ~75, truckGateCount 2, buildingCount 3, railServed true.

## Web findings
- decaturdaily.com and company directories confirm the Meow Mix plant at 1200 Market St NE, Decatur — ~200,000 sq ft, ~40% of Smucker's cat-food output (~600 tons/day), $21.4M expansion (17,000 sq ft admin + 9,000 sq ft manufacturing). Note: a Yelp listing marks "The Meow Mix Company" as CLOSED, but that reflects a stale storefront listing — the plant is an active Smucker manufacturing site per current company/news sources.

## Final confidence
**High.** Facility positively identified, web-corroborated, and rail-served status is unambiguous. Guard-shack, the exact dock count, presence of a scale, and per-gate in/out lane assignment are flagged uncertain — all reflecting imagery limits (roof glare, no staffed-booth visibility), not doubt about the site.

- Gate verdict: YES — chain-link sliding gates at multiple truck entrances
- Guard-shack verdict: NO guard shack (remote / unmanned check-in)
- Confidence: high
