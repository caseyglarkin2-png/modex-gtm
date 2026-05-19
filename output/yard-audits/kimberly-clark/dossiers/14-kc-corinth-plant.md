# Deep-Audit Dossier — K-C Corinth Plant, Corinth MS (idx 14)

## Resolved location
- Roster coordinates (34.935342, -88.490748, geocode precision ROOFTOP, moved 54 m) landed **directly on the K-C Corinth industrial campus** — correct.
- Web research (Area Development, Mississippi Development Authority) confirms the **Kimberly-Clark nonwovens plant at 610 Pinecrest St, Corinth, MS 38834** — a nonwovens manufacturing facility producing components for Huggies, Pull-Ups, Poise, Depend and WypAll, with $140M+ in expansion investment announced 2020-2021.
- **Locked center: 34.93560, -88.49080.**

## Key views
- **Wide z16/z17 overview:** A multi-building industrial campus running N-S along Pinecrest St on the edge of Corinth — residential, ball fields and woods surround it. A rail corridor passes through the woods to the NE.
- **Campus z17/z18/z19:** Multiple manufacturing buildings — several gray-roofed plants, a large white-roofed building (the recent expansion), and smaller support structures. Heavy trailer parking fills the lanes between buildings and lines the building faces.
- **Street View (2025-11):** The campus is enclosed by a continuous chain-link perimeter fence. Truck entrance drives off Pinecrest St have **chain-link double swing gates** across the drive (seen open in the imagery), with "No Trespassing" signage and a K-C signboard. Trucks and trailers visible inside; a large water tank stands near the entrance. No staffed guard booth at any gate.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Continuous chain-link perimeter fence; truck entrances have chain-link double swing gates across the drive — a controlled gated entry.
- **guardShack = false.** No staffed guard booth at any entrance — the gates are unmanned chain-link swing gates.
- **remoteGs = true.** Gate present, no guard shack — set true (kiosk / badge / phone check-in implied).
- **dockDoors = 10-25 (flagged uncertain).** Loading docks face the internal lanes between buildings; the multi-building layout and tight lanes make exact counting difficult. Estimated ~22 doors.
- **dropArea = 50+ / dropYard = true.** Heavy trailer parking — dozens of trailers staged across the campus lanes and along building faces (~70 visible). Functions as a distributed drop yard separate from active dock positions.
- **drivewayShort = true.** The truck approach from the gated entrance to the dock lanes is short (1-2 trucks).
- **postGateStaging = true.** Open paved/gravel lanes inside the gates allow trucks to hold before docking.
- **multipleFacilities = true.** A campus of multiple distinct manufacturing and support buildings.
- **truckGateCount = 2 (flagged uncertain).** At least two entrance drives off Pinecrest St serve the campus.
- **scale = false; railServed = false; multiStep = false.** A rail corridor runs through the woods NE of the site but no spur enters the property.
- **urbanRural = Rural.** Small-town industrial setting on the edge of Corinth.

## Yard zones & counts
- **Perimeter:** ~24 acres covering the fenced K-C campus along Pinecrest St.
- **Truck gate zone:** the gated entrance drive off Pinecrest St near the water tank.
- **Drop yards:** trailers distributed across the campus lanes — represented as two main zones (north and central lanes), ~70 trailers visible, capacity ~95.
- **Dock aprons:** lanes fronting the manufacturing buildings (north cluster and central/south cluster).
- **Buildings:** ~9 distinct structures across the campus (gray-roofed plants, the white-roofed expansion building, support buildings).
- **Metrics:** ~22 dock doors, ~70 trailers visible, capacity ~95, ~2 truck gates, no rail.

## Web findings
- Area Development and the Mississippi Development Authority confirm the K-C Corinth nonwovens plant at 610 Pinecrest St — a production campus with a $140M expansion (2020) and a further expansion adding 33 jobs (2021). The plant produces nonwoven components for Huggies, Pull-Ups, Poise, Depend, WypAll and Block-it brands, plus WypAll industrial wipers.

## Final confidence: **high**
Facility positively identified at the rooster's rooftop coordinates and corroborated by web research. The gated chain-link entries and absence of a guard booth are clearly visible in recent Street View. The dock-door count, building count, and exact gate count are the soft calls (flagged in `uncertainFields`) due to the dense multi-building layout and tight internal lanes.
