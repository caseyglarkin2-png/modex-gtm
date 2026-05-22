# Kraft Heinz — Mason City, IA (Jell-O Plant) — Deep-Audit Dossier

**Facility:** Kraft Heinz - Mason City
**Type:** Food Manufacturer (specialty / dessert-mix manufacturing)
**Address:** 1022 12th Street NW, Mason City, IA 50401 (Cerro Gordo County)
**Locked center:** 43.16410, -93.21620
**Maps URL:** https://www.google.com/maps/@43.1641,-93.2162,400m/data=!3m1!1e3
**Audit confidence:** HIGH

---

## 1. Resolution — pinning down the right building

The roster's approximate coordinates (43.1627479, -93.2164507) sit just south
of the property line, in the residential block facing the plant across
12th Street NW. Probing satellite at z16-17 around that point immediately
revealed the large industrial complex to the **north** of 12th St NW. A web
search confirmed Kraft Heinz's Mason City address as **1022 12th St NW** —
locking the building.

This is **the** US Jell-O / pudding plant: nearly 200 employees, currently
running a **$62.8M expansion** (Dean Snyder Construction) and slated for
~$9M in DOE clean-energy upgrades including an ammonia-free refrigeration
system. The plant manufactures essentially all US-market ready-to-eat Jell-O
gelatin cups and pudding cups. Confirmed by Food Logistics and Food Dive
coverage and the on-site **"JELL-O" landscaped sign** visible directly south
of the main building in satellite imagery.

### Roster duplicate note (important)

The roster also contains an idx-15 entry labeled "Kraft Heinz - Mason City."
Inspecting its mapsUrl coordinates (39.33247, -84.33163) shows that entry
resolves to **Mason, Ohio** (a Cincinnati suburb), 700+ miles from Mason
City, Iowa. They are **two different facilities** in different states that
share the "Mason"/"Mason City" naming — not duplicates of the same plant.
This audit covers only the Iowa Jell-O plant.

---

## 2. Site layout (what the imagery shows)

The fenced parcel runs roughly **285 m north-south x 320 m east-west**
between 12th St NW (south) and active farmland (north), bounded by the
Union Pacific (or successor) rail mainline on the east and residential
streets on the south/west.

On-property building cluster (single ownership / single campus):

1. **Main processing plant** (west): a large multi-section building with
   solar panels on parts of the roof, multiple ventilation stacks, and a
   complex roofline indicating cooking, mixing, and packaging halls. This
   is the production heart.
2. **Finished-goods warehouse** (center-east): a clean white-roofed
   rectangle, with the long axis running roughly N-S, dock face on the
   north end.
3. **Ingredient silos / tanker yard** (east): two large round storage tanks
   plus a smaller rail-receiving structure — flour, sugar, gelatin, dairy
   ingredients arriving by tanker and rail.
4. **Maintenance / rail shed** (NE corner): smaller white roof beside the
   rail spur, with parked trailers and equipment around it.

A **rail spur** clearly enters the property along the east edge from the
mainline and runs into the warehouse / silo area for inbound ingredient
cars — `railServed: true`.

The **JELL-O landscaped sign** (giant letters mowed into the lawn) sits on
the south-facing front lawn, between 12th St NW and the warehouse — purely
brand display.

---

## 3. Truck entrance & gate determination

**Result:** truckGate **TRUE**, guardShack **FALSE**, remoteGs **TRUE**.

There is **one** truck entrance, on the **south face** of the property,
opening onto 12th Street NW at approximately **43.16285, -93.21655** — a
designated left-turn arrow is painted on 12th St NW indicating the official
plant entry.

What the September-2024 Street View shows from across 12th St NW:

- The **chain-link perimeter fence** runs east-west along the entire south
  property line, with privacy arborvitae/cedar plantings on the south side.
- At the entry, the fence terminates on both sides of a wide asphalt
  driveway opening. **All inbound and outbound traffic is funneled through
  this one ~2-lane gap** — a clear pinch point against the fence.
- Two **monument-sign islands** flank the driveway: a blue Kraft Heinz
  marker (left/west side) and an "Information / Visitor" placard (right/east
  side). They are landscaping monuments, NOT staffed booths.
- **No barrier arm. No swing/sliding gate. No guard shack visible.**
- Inside the entry, the driveway curves north between the main plant (west)
  and the warehouse / silo cluster (east), with lane markings on the
  pavement.
- A second left-turn arrow on the opposite (east) side of the property line
  suggests the entry serves a turn-in lane — there is no separate truck-only
  vs. car-only gate.

Per the rubric, this counts as **truckGate: true** (a clear checkpoint
pinch-point where the property meets the public road, with internal lane
markings), **guardShack: false** (no booth), and therefore
**remoteGs: true** (driver check-in is by kiosk/app/yard portal, or at the
warehouse face inside the property). The previous baseline audit reached the
same conclusion at lower confidence; the 2024 Street View provides the
direct visual evidence.

---

## 4. Yard zones & metrics

### Dock doors — band `10-25`

The **north face of the warehouse** holds the primary dock bank: in the
z18-z19 imagery I count **at least 8-10 dock doors** with trailers backed
in (white roofs visible on a regular rhythm against the building face).
Additional dock doors exist on the **west face of the main plant** for the
ingredient-receiving / tanker bays beside the silos. Total estimate
**15-20 doors** — comfortably in the `10-25` band.

### Trailer parking / drop yard — `dropArea: 10-25`, `dropYard: true`

A dedicated paved drop-trailer strip runs along the **north edge of the
warehouse / north end of the pavement**, with roughly 6-10 trailers
visible parked perpendicular and in marked stalls plus more empty stalls
available. A secondary staging strip sits in the **NE corner adjacent to
the rail yard**, with additional parked trailers and a couple of bobtail
tractors. Estimated capacity ~12-18 trailers → `10-25` band.

### Trailers visible — `~14`

Counted across all probes: ~8 trailers backed at the north dock face, ~3
empty in NW staging, ~3-4 along the NE drop strip. Estimate **14 trailers
visible** in the imagery captured.

### Site area — `~25.1 acres`

Perimeter box: 285 m N-S x 320 m E-W = 91,200 m² ≈ **22.5 acres** of fenced
operating yard. Counting peripheral silo land and the rail apron the total
parcel is ~**25 acres**.

### Buildings — `4`

Counted as four distinct footprints (main plant, warehouse, silo/tanker
yard, maintenance/rail shed). Flagged as `multipleFacilities: true` since
this is clearly a campus rather than a single building.

### Rail — `true`

Confirmed rail spur into the property on the east.

---

## 5. Classification calls (highlights)

| Field | Value | Evidence |
|---|---|---|
| truckGate | **true** | Fence-pinch entry from 12th St NW, internal lane markings |
| guardShack | **false** | No booth visible in 2024-09 Street View |
| remoteGs | **true** | Gate but no shack → kiosk/app check-in implied |
| preGateStaging | false | No paved staging area outside the fence on 12th St NW |
| postGateStaging | **true** | Wide paved courtyard between main plant and warehouse |
| drivewayLong | **true** | ~150 m approach from 12th St NW to dock apron — holds 3+ trucks |
| drivewayShort | false | Long approach |
| backupSensitive | false | 12th St NW is a quiet residential collector — no risk of public-road spillback |
| entryExitTogether | **true** | Single entrance / exit point |
| entryLanes | 1 | Single in-lane at the property line (driveway widens inside) |
| exitLanes | 1 | Same single gap serves outbound |
| fastLaneOpportunity | false | No dedicated bypass; would need to physically widen the gap |
| dockDoors | **10-25** | ~15-20 across north warehouse + west plant face |
| dropArea | **10-25** | ~12-18 marked drop stalls |
| shipRcvSeparate | **true** | Ingredient receiving (rail + tankers, west face) physically separate from finished-goods shipping (warehouse north face) |
| urbanRural | **Rural** | Plant adjoins farmland N and W; small-town residential to the south. Per rubric, small-town industrial = Rural |
| connectivityIssue | false | Inside Mason City limits; coverage adequate |
| multipleFacilities | **true** | Campus with 4 distinct building footprints |
| scale | false (uncertain) | No weigh pad clearly visible in z19-z20 imagery — flagged uncertain |
| dropYard | **true** | Dedicated drop-trailer parking distinct from active dock apron |
| multiStep | false | No second checkpoint visible after entry |

---

## 6. Web research findings

- **Plant role:** the US Jell-O / pudding-cup plant. ~200 employees.
- **Capex:** $62.8M expansion announced (new processing/packaging lines +
  ammonia-free refrigeration); Dean Snyder Construction is the GC.
- **DOE award:** ~$9M of a $170M federal clean-energy award targeted at
  Mason City for efficiency upgrades.
- **Plant-based dessert push (2025):** Mason City is implicated in Kraft
  Heinz's new oat-milk Jell-O pudding line.
- **Rail-served:** confirmed via overhead imagery; aligns with the plant's
  role as a bulk-ingredient consumer (gelatin, sugar, dairy).

Sources used (visible in WebSearch):
- foodlogistics.com — "Kraft Heinz to Expand Iowa Jell-O Pudding Plant"
- deansnyder.com — Kraft Heinz Mason City project page
- fooddive.com — oat-milk Jell-O pudding launch
- northiowatoday.com — $9M DOE upgrades at the Mason City plant
- business.masoncityia.com — Mason City Chamber listing
- buzzfile.com / yelp.com — confirming 1022 12th St NW address

---

## 7. YardFlow sales takeaways

- **Open-but-fenced gate (Archetype #3-ish but with controlled pinch
  point + remote check-in)** is a classic YardFlow opportunity: drivers
  arrive without a guard to direct them, so check-in via kiosk or mobile
  app is the natural fit. No physical gate-arm investment required to
  start.
- **Ship/receive separated** (ingredient rail/tankers on west, finished
  goods on north) means a YardFlow rollout can be **phased** — pilot on the
  outbound dock bank first, then layer in inbound rail/tanker scheduling.
- **Rail-served + 24/7 ingredient flow + 200-employee single-product
  national supply** = high cost of downtime per dock-hour. Strong ROI
  story for dwell-time reduction.
- **Active $62.8M expansion** = capital-project window. The plant is
  already buying packaging-line capex; bundling a yard / dock scheduling
  layer into that program is well-timed.
- **No truck scale visible** — if Kraft is hand-tracking BOLs at receive,
  there is upside from automated check-in + dock assignment.

---

## 8. Confidence summary

- **Gate verdict:** controlled pinch-point entry, no barrier arm — true
- **Guard-shack verdict:** none, remote check-in inferred
- **Confidence:** high
