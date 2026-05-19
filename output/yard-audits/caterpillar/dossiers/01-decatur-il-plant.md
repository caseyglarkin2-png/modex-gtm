# Deep-Audit Dossier — Caterpillar Decatur IL Plant (idx 1)

## Resolved location
- Roster coordinates `39.856341, -88.916917` landed on the **Norfolk Southern / city rail yard ~2.3 km SSW** of the actual plant — not the facility.
- Resolved the true plant to **`39.8788, -88.9100`**, the large Caterpillar manufacturing campus at **N 27th St & E Pershing Rd, Decatur IL** (TruckMap lists it as 3000 N 27th St; the Building DE-D address is 3125 N 27th St).
- Confirmation: satellite shows a 3M+ sq ft multi-building heavy-equipment plant with a paved **test-track oval**, rows of finished mining trucks staged outside, and rail spurs into the site — consistent with the 797F mining-truck / large wheel loader / motor grader plant in the dossier.

## Key views
- **Wide (z14-16):** Sprawling campus bounded by N 27th St (west), a residential subdivision (north), open farmland (east), and an extensive rail yard (south). 9+ distinct large buildings plus the test track.
- **Core (z16):** Central assembly building is the dominant structure; product staging and material laydown yards fill the open ground between buildings and rail.
- **West frontage Street View (2024-08):** Continuous slatted chain-link perimeter fence runs the length of the west road; large fenced employee parking lots front the road. No road-visible gate on the west.
- **NW Street View:** Trailer drop yard along the fence — Meijer, MHS, McElroy trailers parked nose-out.
- **SW corner:** A wide entrance driveway at ~`39.8748,-88.9158` (signalized intersection) feeds a long internal road into the plant.
- **South:** Multiple rail spurs run into the property with rail cars and material laydown — facility is rail-served.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The whole campus is enclosed by a continuous slatted perimeter fence (confirmed in Street View). Truck access is via the wide SW entrance driveway; the controlled checkpoint sits deep inside the fence line.
- **guardShack = false / remoteGs = true.** No guard booth is visible from any public road — the gate/checkpoint is set well inside the property. For a fenced, security-conscious manufacturing campus this implies an internal/deep checkpoint rather than a road-edge booth. Low confidence on this pair.
- **Driveway:** `drivewayLong = true` — the SW approach runs several hundred feet from the public road, ample queue depth.
- **Docks:** ~22 dock doors estimated (band 10-25), spread across the central building's east face and the north building; many partly obscured by backed-in trailers and laydown material. `shipRcvSeparate = true` — distinct dock banks on different building faces.

## Yard zones and counts
- **Perimeter:** ~360 acres, the fenced campus from the south rail yard to the north residential edge, N 27th St to the east staging fields.
- **Drop yards:** North trailer yard (30+ trailers, multiple carriers) + a second cluster near the east dock face. `dropYard = true`, `dropArea = 25-50`.
- **Staging:** Paved interior staging between the SW entrance and the buildings.
- **Metrics:** dockDoors ~22, trailersVisible ~38, trailer capacity ~70, truck gates 2, buildings 9, rail-served true.

## Web findings
- TruckMap and TradeAtlas list the Caterpillar Decatur plant at 3000 N 27th St / 27th & Pershing.
- Caterpillar Careers: Decatur produces large wheel loaders, mining trucks and motor graders; 2,000+ employees.
- Herald-Review reporting confirms the ~3M sq ft Decatur campus as Cat's largest North American plant.

## Final confidence
**Medium.** Location positively resolved and the campus layout, fencing, rail service, drop yard and docks are all clear. The guard-shack / remote-checkpoint call and exact lane counts are uncertain because the gate is set deep inside the property and not visible from public roads.
