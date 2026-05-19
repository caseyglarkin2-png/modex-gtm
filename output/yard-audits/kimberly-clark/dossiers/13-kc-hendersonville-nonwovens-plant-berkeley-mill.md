# Deep-Audit Dossier — K-C Hendersonville Nonwovens Plant (Berkeley Mill), Hendersonville NC (idx 13)

## Resolved location
- Roster coordinates (35.318728, -82.460953, geocode precision APPROXIMATE, moved 361 m) landed in **downtown Hendersonville** — a commercial block, not a plant.
- Web research (PR Newswire, Henderson County Partnership for Economic Development, Yelp) gave the address: **32 Smyth Ave, Hendersonville, NC 28792** — the historic Balfour Mills site (founded 1924 by Capt. Ellison Adger Smyth, hence "Smyth Ave"), purchased by a K-C subsidiary in 1946 and renamed Berkeley Mills.
- Satellite probe found a large nonwovens manufacturing plant roughly 3 km NW of downtown Hendersonville in the Balfour area, with extensive trailer yards and a rail spur — consistent with the K-C Berkeley Mill.
- **Locked center: 35.34630, -82.46880.**

## Key views
- **Wide z15/z16 overview:** A large rural-edge industrial complex bounded by a rail corridor (W), woods and grassland (N/E), and a small-town residential / light-industrial fabric beyond. A continuous chain-link perimeter fence encloses the whole property.
- **Drop-yard z18/z19/z20:** Multiple gravel and paved trailer-storage lots packed with hundreds of trailers in organized rows — on the NE, the south end, and the SW. Clearly a high-volume drop-yard operation.
- **Rail z18:** A rail spur runs into the property on the SW side; rail cars / boxcars observed parked adjacent to the trailer yard along the rail corridor.
- **Street View (2024-2025):** A "Kimberly-Clark" monument sign at the campus frontage; a dedicated K-C wayfinding sign on the access road reading **"TRUCK ENTRANCE — 1/4 MILE NORTH — DOCKS 1-6"**; the plant set back behind a grass buffer with a continuous chain-link perimeter fence on every road frontage.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The site has a dedicated, signed truck entrance with internal truck routing ("DOCKS 1-6"), and the entire property is enclosed by a continuous chain-link perimeter fence. The truck entrance gate sits on the internal access road, well back from public roads.
- **guardShack = false (flagged uncertain).** The truck entrance gate is behind a wood/grass buffer that Street View on public roads does not reach, so no guard booth could be directly photographed. Marked false (none observed).
- **remoteGs = true (flagged uncertain).** Gate present with no guard shack observed — set true (likely kiosk / badge check-in). Soft call since the gate itself was not directly imaged.
- **dockDoors = 25-50.** Estimated ~36 doors across multiple building faces — a dock bank on the SW ("Docks 1-6") and additional docks on the NE face, with trailers backed in.
- **dropArea = 50+ / dropYard = true.** A very large drop-yard operation — multiple lots, ~240 trailers visible, capacity ~320.
- **drivewayLong = true; fastLaneOpportunity = true.** A long internal access road from the signed entrance to the docks holds a 3+ truck queue; wide internal roads leave room for an express lane.
- **shipRcvSeparate = true (flagged uncertain).** Dock activity is split between the SW ("Docks 1-6") and NE building faces, suggesting separate shipping/receiving clusters.
- **railServed = true.** A rail spur enters the property.
- **scale = false; multiStep = false; multipleFacilities = false** (one large interconnected complex).
- **urbanRural = Rural.** Edge-of-town industrial site surrounded by woods and grassland.

## Yard zones & counts
- **Perimeter:** ~78 acres covering the building, drop yards, rail siding, parking and grass buffer inside the fenced property.
- **Truck gate zone:** the signed truck entrance on the internal access road, NW of the building.
- **Drop yards:** three distinct trailer-storage lots (NE, south, SW), ~240 trailers visible, capacity ~320.
- **Dock aprons:** SW building face ("Docks 1-6") and NE building face.
- **Staging:** open paved area between the truck entrance and the docks.
- **Buildings:** one very large interconnected manufacturing complex plus minor support structures (counted as 3).
- **Metrics:** ~36 dock doors, ~240 trailers visible, capacity ~320, 1 truck gate, rail-served.

## Web findings
- PR Newswire and the Henderson County Partnership for Economic Development confirm the K-C nonwovens plant in Henderson County (a 2018 production-expansion announcement). The Berkeley Mill produces nonwoven materials for K-C's North American adult and feminine care brands — Depend, Poise, and U by Kotex. The site has run since 1924 (as Balfour Mills) and became K-C's Berkeley Mills in 1946.

## Final confidence: **high**
Facility positively identified and re-located; the dedicated signed truck entrance, full perimeter fence, large drop yards, and rail spur are all clearly visible. The guard-shack / remote-GS determinations are the principal soft calls because the gate itself sits beyond Street View reach (flagged in `uncertainFields`), along with the dock count and ship/receive split.
