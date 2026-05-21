# Deep-Audit Dossier — Frito-Lay Kern Plant, Bakersfield CA (idx 6)

## Location resolution
The roster coordinates (35.367588, -119.07772, "GEOMETRIC_CENTER") were **wrong** —
roughly 25 km off-target, landing on a petroleum tank farm and the Kern River
bed east of Bakersfield. The roster address "28490 Highway 58" is also imprecise.

Web research (CLUI Land Use Database, PotatoPro, TruckMap, ClustrMaps) resolved
the real **Frito-Lay Kern Plant** to **28801 Hwy 58, Bakersfield, CA 93314** —
an isolated industrial complex northwest of Bakersfield, in an area of pivot-
irrigated farmland, dairies and oil leases. CLUI describes it as "the world's
largest Frito factory," a 375,000 sq ft processing/warehouse facility on ~640
acres (one square mile) with its own LEED-Gold co-generation power plant.

Satellite probing confirmed the building: at ~35.396, -119.318 a large white-
roofed manufacturing building with process silos, a wastewater/treatment area,
trailer drop yards and an isolated rural setting — consistent with a major food
plant. **Locked center: 35.39575, -119.32045.**

## Key views
- **z16 / z17 wide:** Single large industrial complex sitting alone amid farm
  fields and circular pivot-irrigation crops. Developed footprint ~110 acres of
  the ~640-acre holding.
- **z18 / z19 facility:** Main manufacturing building (center-west), a co-gen /
  process equipment cluster on the north side, a wastewater treatment area to
  the southwest, employee parking on the northwest, and large trailer drop yards
  on the south and southeast.
- **z19 dock yard:** Dozens of trailers parked in tight rows south of the
  building — a substantial drop / trailer-storage yard (90+ trailers counted).
- **Street View (captured 2026-04, Hwy 58 frontage):** Clear views of the
  property's chain-link perimeter fence, a BNSF rail spur paralleling the road
  with covered-hopper rail cars parked on it, and a single truck entrance
  driveway crossing the rail spur into the site.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** A single wide paved truck driveway leaves the north
  public road, crosses the BNSF rail spur (railroad-crossing signals and X
  signs visible in Street View), and curves into the property through a gap in
  the continuous perimeter fence. Orange lane delineators are set in the drive.
  This is a controlled pinch-point entrance for a fenced, isolated flagship food
  plant — gated by definition.
- **Guard shack — TRUE (medium confidence).** A small structure with vehicles
  parked around it sits beside the entrance driveway near the rail crossing,
  consistent with a guard booth. Satellite resolution at the entrance is
  degraded by tree shadow and the booth is near the edge of Street View range,
  so this call is medium-confidence rather than high.
- **Remote check-in — FALSE.** A staffed booth is present, so this is not a
  kiosk-only remote gate.
- **Docks — 25-50 band.** Dock doors run along the south/southeast face of the
  main building; trailers are visible backed in. Exact count not crisply
  resolvable overhead.
- **Drop yard — 50+ band, dropYard TRUE.** A large dedicated trailer-storage
  yard south of the building holds many rows of parked trailers.
- **Fast lane — TRUE.** Wide entrance driveway and a large open paved apron
  inside the rail crossing leave ample room to add an express/bypass lane.

## Yard zones and counts
- **Perimeter:** active fenced developed footprint, ~110 acres (the full land
  holding is ~640 acres of mostly undeveloped farmland).
- **Truck gate zone:** the entrance driveway / rail-crossing / booth area on the
  north edge.
- **Drop yards:** two boxes — the main trailer yard south of the building and a
  secondary yard at the south edge.
- **Dock apron:** strip along the south/southeast building face.
- **yardMetrics:** dockDoorCount ~35, trailersVisible ~90, trailerParking
  capacity ~160, 1 truck gate, ~4 distinct buildings, ~110 acres, rail-served
  TRUE (BNSF spur with hopper cars present).

## Web findings
- CLUI: "the world's largest Frito factory," supplies the Los Angeles region,
  640-acre site in Kern County, generates 100% of its own power via on-site
  co-generation, LEED Existing Building Gold (2012).
- PotatoPro: Frito-Lay North America production site — potato chips, extruded
  snacks, pretzels, tortilla chips; address 28801 Hwy 58.
- Rail spur and on-site cogen corroborate bulk inbound (corn/potatoes) by rail
  and a heavy outbound finished-goods truck operation.

## Final confidence: MEDIUM
Facility identity and gross layout are firmly established. Confidence is held to
medium because the guard-shack call and exact dock-door count rest on
shadow-degraded entrance imagery and edge-of-range Street View. Flagged fields:
guardShack, dockDoors, scale, multiStep, postGateStaging.
