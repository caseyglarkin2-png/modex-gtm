# Deep-Audit Dossier — Anheuser-Busch Brewery, Cartersville GA (idx 8)

## Resolved location
- **Facility:** Anheuser-Busch Cartersville Brewery, 100 Busch Dr NE, Cartersville, GA 30121
- **Locked center:** 34.25700, -84.78300 (main brewery / warehouse mass)
- **Roster coords were ~4.9 km off** (geocode `movedMeters` 4905) — they fell SW of the campus. Confirmed correct building via satellite (large brewing/packaging complex with extensive trailer yards) and Street View at the public-road intersection 34.2538,-84.7863, which shows the "Budweiser" sign on the brewhouse.
- Opened 1993; AB's newest brewery. 48 products shipped to 32 states; $230M+ invested since 2020, plus a $9.2M expansion announced Sept 2025.

## Key views
- **z15/16 wide:** Large wooded campus off I-75, set well back from public roads, surrounded by farmland and forest. Pond on the E edge.
- **z17 center:** Main warehouse/brewhouse mass with a very large multi-row trailer yard on the NE side.
- **z19-20 trailer yard:** Dozens of trailers in regular marked rows — red Budweiser dry vans and white reefers; ~180 visible.
- **z19-20 dock zones:** Dock canopies/awnings along the NE warehouse face; a secondary dock cluster with trailers backed in on the SE building face.
- **z19/20 entrance:** Private access road ~700 m long from the public road; divided entry/exit with chevron channelization and a small median structure at the split.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Single controlled entrance to a fenced industrial campus; the private access road splits into channelized entry/exit lanes with chevron markings at the property approach.
- **guardShack = true (satellite-inferred, medium confidence).** A small guard-booth-sized structure sits in the median at the entry/exit split. Street View coverage stops at the public road so this could not be ground-confirmed; flagged in `uncertainFields`.
- **remoteGs = false.** Guard booth present.
- **entryExitSeparate = true** — divided entry and exit lanes at the road split.
- **dockDoors = 50+** — dock canopies and backed-in trailers along the NE warehouse face plus the SE secondary dock; ~60 estimated.
- **scale = true (medium confidence)** — a scale-house-sized structure on the truck route near the trailer yard.

## Yard zones and counts
- **Perimeter:** ~70 acres developed footprint within forest, S 34.25320 / W -84.78870 / N 34.26150 / E -84.77900.
- **Drop yards:** two large trailer-storage zones NE of the warehouse; capacity ~260 trailers, ~180 visible — `dropYard = true`, `dropArea = 50+`.
- **Dock aprons:** NE warehouse face and SE building face.
- **Staging:** post-gate paved area between the access road and the dock zone.
- **Buildings:** main brewhouse/warehouse, packaging hall, ancillary structures, and a detached building NE of the trailer yard — `multipleFacilities = true`, buildingCount 4.
- **Rail:** no rail spur visible into the property — `railServed = false`.

## Web findings
Active, growing brewery (PRNewswire, anheuser-busch.com newsroom, Atlanta News First, Sept 2025). No signs of wind-down — opposite, an expansion.

## Final confidence: HIGH
Identity, layout, dock and yard scale all clearly resolved. `guardShack` and `scale` are satellite-inferred (no private-road Street View); `dockDoorCount` is an overhead estimate — all flagged.
