# Deep-Audit Dossier — Caterpillar East Peoria IL Plant (idx 2)

## Resolved location
- Roster geocode `40.673305, -89.598969` (GEOMETRIC_CENTER, moved 2.4 km) lands **inside the historic Caterpillar East Peoria works** on the east bank of the Illinois River — close enough.
- Locked plant center at **`40.6730, -89.5955`**.
- Note: the roster address "100 NE Adams St" is actually the Caterpillar **downtown Peoria HQ / Visitors Center** across the river, not the manufacturing plant. The East Peoria works is the correct manufacturing campus.
- Confirmation: satellite shows a sprawling old multi-building industrial plant with rooftop monitor skylights (classic machine-shop / assembly architecture), large Cat component laydown yards (track-type tractor undercarriage parts / castings), and an adjacent rail yard with spurs.

## Key views
- **Wide (z14-15):** Plant occupies the riverfront flat between the Illinois River (west/north) and a large rail yard (south/east). Two adjacent large complexes form one continuous Caterpillar campus.
- **Core (z16-17):** Historic East Peoria works — very long buildings with rooftop monitors; component laydown yard with rows of yellow Cat parts to the north.
- **East road Street View (2022-25):** Black metal perimeter fence the length of the east road; building face entrance labeled "E1" visible; fully enclosed.
- **South Street View:** Old brick building walls with chain-link fence; residential homes directly across the street.
- **North:** Illinois River and a riverside road; a separate fenced scrap/laydown yard.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The entire campus is enclosed by black metal + chain-link perimeter fencing (confirmed in several Street View panos). Truck access is through fenced openings off the east access road into the building/laydown areas — controlled, no open uncontrolled driveway.
- **guardShack = false / remoteGs = true.** No standalone guard booth visible from any public road. Gates are at building/fence openings, typical of an old urban works — controlled access without a road-edge booth. Low confidence.
- **Driveway:** `drivewayShort = true` — old urban plant, building faces sit close to the road; little internal stacking depth.
- **backupSensitive = true** — the plant fronts public city streets with residential homes opposite; a gate queue would sit on a public street.
- **Docks:** ~20 dock doors estimated (band 10-25); the continuous old building walls obscure many — low confidence.

## Yard zones and counts
- **Perimeter:** ~230 acres, the fenced East Peoria works between the river and the rail yard.
- **Drop yard:** Large component/casting laydown plus trailer parking north of the historic building; `dropYard = true`, `dropArea = 10-25`.
- **Rail:** Extensive rail yard south/east with spurs running into the property — rail-served.
- **Metrics:** dockDoors ~20, trailersVisible ~12, trailer capacity ~30, truck gates 2, buildings 6, rail-served true.

## Web findings
- Yelp / Panjiva / D&B list Caterpillar at 100 NE Adams St, Peoria 61629 — that is the corporate HQ/Visitors Center address; East Peoria is the historic track-type tractor / components manufacturing plant.

## Final confidence
**Medium.** Location confirmed as the historic Caterpillar East Peoria works; fencing, rail service, laydown yards and docks are clear. The guard-shack / remote-gate call and dock-door count are uncertain because the old continuous building walls and fence-opening gates are hard to read from imagery.
