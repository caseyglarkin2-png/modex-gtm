# Deep-Audit Dossier — idx 11

## Niagara Bottling - Kansas City MO (149th St)

- **Type:** Bottling / Manufacturing Plant
- **Roster address:** 4000 E 149th St, Kansas City, MO 64147
- **Roster coords:** 38.853841, -94.549338 (geocode ROOFTOP, moved 14 m)
- **Locked coords:** 38.85290, -94.55370
- **Confidence:** medium

## Step 0 — Location resolution

The geocoded ROOFTOP coordinate lands on a road intersection inside the Three
Trails / EastLink speculative logistics park in far-south Kansas City, MO — not
on a building. The cluster holds several large warehouses.

- Street View NE of the pin (45°) shows the large NE building displaying
  **Walmart** branding with Walmart trailers at its docks — that building is
  Walmart, NOT Niagara.
- Web research confirms Niagara's first KC plant is the ~421,000–426,000 sq ft
  facility at 4000 E 149th St, opened 2019, expanded 2022; "at the corner of US
  Hwy 71 and MO Hwy 150."
- Satellite scan of the cluster identified one building (SW of the pin,
  ~38.8529,-94.5537) with a clearly different roof: a complex roofline, **two
  large rooftop solar arrays**, and visible process/utility roof equipment —
  the heavy-process signature of a bottling plant, distinct from the plain
  distribution roofs of its neighbours.
- No readable Niagara signage was captured in available Street View panos
  (internal-road coverage is sparse). Building identification is therefore
  medium-confidence; the roof signature and address geocode together point to
  this SW building.

## Steps 1–5 — What the imagery showed

- **Wide / tight satellite:** An L-shaped warehouse/manufacturing building with
  a small annex on the NW corner. Perimeter access road encircles the building.
  Employee parking on the E side near the office.
- **Dock faces:** Long row of dock doors with trailers backed in on the **N
  face**; a second dock bank with trailers on the **W face**. Estimated
  ~50–60 doors total — band **50+** (low-confidence exact count).
- **Drop yard:** A dedicated marked trailer-parking lot runs along the **W
  side** beyond the dock apron, ~70-stall capacity, ~28 trailers parked in the
  captured imagery.
- **Truck gate / guard shack:** No barrier arm, sliding/swing gate, or guard
  booth was visible at any driveway where the property meets the public road.
  Driveways are open. **truckGate = false, guardShack = false, remoteGs =
  false.** Wide open driveway aprons leave room to add an express lane
  (`fastLaneOpportunity = true`).
- **Staging:** No pre-gate staging (no gate). Deep internal aprons and the
  perimeter road give post-gate queue room for 3+ trucks → `drivewayLong`,
  `postGateStaging`.
- **Web findings:** Niagara KC 149th St — first local plant, opened 2019,
  ~421,803 sq ft, third production line added in a late-2022 expansion;
  supplies private-label bottled water to retailers including Walmart and
  Costco. Co-located near a Walmart DC in the same logistics park.

## Yard zones & counts

- **Perimeter:** ~22 acres inside the property line.
- **dockDoorCount:** ~55 (estimate, band 50+).
- **trailersVisible:** ~28.
- **trailerParkingCapacity:** ~70.
- **truckGateCount:** 1 (primary unguarded driveway).
- **buildingCount:** 2 (main plant + NW annex).
- **railServed:** false — no spur into the property.

## Final confidence

**Medium.** Imagery is clear and the audited building has an unambiguous
bottling-plant roof signature, but no Niagara signage could be read, so the
building-vs-neighbour identification carries residual uncertainty. Gate and
guard-shack calls are confident (open, unguarded). Dock-door count is an
overhead estimate.

### 3-line summary
- Gate verdict: NO truck gate — open, unguarded driveways from the public road.
- Guard-shack verdict: NO guard shack; no remote check-in kiosk either.
- Confidence: medium (building ID uncertain; gate/dock calls solid).
