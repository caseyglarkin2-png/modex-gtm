# Deep-Audit Dossier — Caterpillar Clayton NC Plant (idx 6)

## Resolved location
- Roster geocode `35.640458, -78.424314` (ROOFTOP) lands on the **Caterpillar Clayton plant**.
- Locked the main building center at **`35.6405, -78.4248`**.
- Confirmation: satellite shows a large single manufacturing building with **rows of finished yellow Caterpillar small wheel loaders** staged in the yard — directly confirms the BCP small-wheel-loader assembly plant at 954 NC-42 E. Web (Clayton Chamber, Waze, BBB) confirms Caterpillar Inc. at 954 NC-42 E, Clayton NC 27527; the Rapp Customer & Training Center is the separate distinctive-roof building on the SW of the campus.

## Key views
- **Wide (z15):** Large white-roofed plant building among woods/farmland on the edge of Clayton, off NC-42 E.
- **Core (z17):** Single large assembly building; extensive product-staging and material-laydown yards north and east.
- **North yard (z18-20):** Rows of finished yellow small wheel loaders, component laydown, and a curved row of parked trailers.
- **East face (z19):** Trailers backed in along the building, finished equipment staged, curving internal access road.
- **NC-42 Street View (2024-12):** Wooded buffer along the highway; an entrance driveway leads back to the plant.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Truck access is via a long entrance driveway off NC-42 E running back through woods to the plant; product-staging yards and dock aprons are reached through internal roads. The property is buffered from NC-42; access is controlled via the internal entrance.
- **guardShack = false / remoteGs = true.** No standalone guard booth resolvable from the public road — the driveway leads back into the property and the checkpoint is internal. Classified as a controlled internal gate without a road-visible booth. Low confidence.
- **Driveway:** `drivewayLong = true` — the entrance driveway runs a long distance through woods before reaching the plant.
- **Docks:** ~16 dock doors estimated (band 10-25) along the east building face, partly obscured by staged equipment — low confidence.

## Yard zones and counts
- **Perimeter:** ~130 acres, the plant campus including staging yards and parking.
- **Drop yards:** Extensive product-staging / material-laydown yards north and east, full of finished small wheel loaders; trailers backed in along the east face and a curved trailer row in the north yard. `dropYard = true`, `dropArea = 25-50`.
- **Rail:** No rail spur into the property — `railServed = false`.
- **Metrics:** dockDoors ~16, trailersVisible ~22, trailer capacity ~40, truck gates 1, buildings 3, rail-served false.

## Web findings
- Clayton Chamber / Waze / BBB: Caterpillar Inc., 954 NC-42 E, Clayton NC 27527; construction-machinery manufacturing; hosts a Caterpillar Visitor/Training Center (the Rapp Customer & Training Center).

## Final confidence
**Medium.** Location positively confirmed — finished Caterpillar small wheel loaders staged in the yard are unambiguous. Product-staging yards, dock area and the entrance driveway are clear. The guard-shack / remote-gate call and exact dock-door count are uncertain because the gate is internal and staged equipment obscures the dock face.
