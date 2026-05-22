# Kraft Heinz - Davenport, IA (Deep Audit)

**Facility:** Kraft Heinz Foods Company — Davenport, Iowa
**Address:** 9401 Granite Way, Davenport, IA 52806 (Eastern Iowa Industrial Center)
**Type:** Food Processing — meat / further-processed protein (Oscar Mayer Deli Fresh, Lunchables)
**Site center (locked):** 41.6160, -90.6105
**Maps:** https://www.google.com/maps/@41.6160,-90.6105,400m/data=!3m1!1e3
**Imagery:** Maxar 2026 satellite + Google Street View June 2025

---

## 1. Site identification

The brief gave approximate coordinates 41.6154, -90.6125, an "industrial park" hint
and a Velveeta archetype guess. A web search resolved the actual facility to the
**Kraft Heinz meat-processing plant at 9401 Granite Way, Davenport IA**, in the
Eastern Iowa Industrial Center, ~12 km north of downtown Davenport. The plant is
a **382,000 sq ft greenfield facility built by Gray Construction**, commissioned
2017, on a **70-acre site**. It produces **Oscar Mayer Deli Fresh and Lunchables**
(not Velveeta cheese — that's a separate KHC line).

Satellite probes at z16-z21 around the given lat/lng resolved the building center
to ~41.6160, -90.6105 (the approximate coords were ~300 m WSW of the true center).
Once locked, the building footprint is the large white industrial block centered
in the wide z16 frame, with Slopertown Road on the north, a rail mainline + east-
side neighbor (massive separate distribution complex) to the east, Hillandale Drive
and a separate (in-construction) parcel to the west, and the plant's wastewater
treatment lagoons + green buffer to the south.

Computed site area from perimeter bbox: ~72 acres — matches the published "70 acres."

## 2. Imagery captures

Key views used:
- **Satellite z17-z18 wide** (`tmp/probe-davenport-wide-z16.png`,
  `tmp/probe-davenport-east-z17.png`): full plant footprint, all dock faces,
  drop yards, perimeter.
- **Satellite z19-z20 close** of each yard zone (south dock face, east dock face,
  east drop yard, south drop yard, NW corner entrance).
- **Street View June 2025** from Slopertown Road (north), Hillandale Drive
  (west, `sv-davenport-w-e.png` etc), and the rail-crossing T-intersection at
  the NE corner (`sv-davenport-int-s.png`).

## 3. Gate / guard-shack determination

**Truck gate: TRUE.** The plant is entirely enclosed by chain-link perimeter fence
— confirmed on west, north, and east in 2025-06 Street View. The only opening is
the single paved driveway off Slopertown Road at the NW corner of the employee
parking lot (~41.6182, -90.6094). This driveway is the pinch-point through which
all trucks and cars enter. The published address (9401 Granite Way) and the visible
paved entry confirm a single controlled point of access.

**Guard shack: FALSE.** Z19-Z21 satellite at every plausible booth location (the
parking-lot entry, the SE corner of parking, the SW corner where the truck route
meets the dock-yard fence) shows **no standalone 1–3-vehicle-footprint structure**
typical of a staffed guard booth. The small dark shapes near the dock area are
HVAC / cooling-tower equipment and small maintenance buildings.

**Remote GS: TRUE.** Modern Kraft Heinz greenfield plants (2017+) typically use
electronic / kiosk / app-based check-in instead of a permanent staffed booth.
With a fenced perimeter, a single controlled entry, and no visible booth, the
classification "gate + remote check-in" is the best read. Marked uncertain because
a kiosk pedestal can be below satellite resolution.

## 4. Yard zones and counts

- **Dock doors (`50+` band).** Counted ~40 along the south face (split into a
  longer west sub-bank and a shorter east sub-bank) plus ~15-20 along the east
  face that fronts the east drop yard. Total dock door estimate **~55-60**.
- **Drop / trailer parking (`50+` band).** Two distinct drop yards:
  - **East drop yard** (east of the building, between docks and rail buffer):
    ~50 trailers in marked nose-out stalls plus a loose-parked middle zone.
  - **South drop yard** (south of the south dock apron, before the wastewater
    lagoons): ~25 trailers parked nose-out in marked rows.
  - Total trailers visible ~75-80; capacity ~110.
- **Ship/receive separate: TRUE.** South face (long dock bank, multi-temperature
  loading) and east face (separate dock cluster, different drop yard) are on
  different sides of the building and feed different yard zones — strong visual
  read of separate inbound vs. outbound flows.
- **Driveway long: TRUE.** From the Slopertown entry to the dock face is roughly
  350 m (~1100 ft) of paved internal route running south past parking then SW
  around the building to the dock apron — easily holds 3+ trucks queued.
- **Fast-lane opportunity: TRUE.** The internal driveway from road to property
  is paved wide with grass medians on either side; physical room for a bypass
  / express lane.
- **Backup-sensitive: FALSE.** Slopertown is a rural two-lane road with very
  light traffic and the property has a long driveway from the gate to the
  building, so any inbound queue stays well inside the property.
- **Pre-gate staging: FALSE.** No paved truck-sized stalls outside the gate on
  Slopertown — just grass shoulders.
- **Post-gate staging: TRUE.** Wide paved apron south of the parking lot before
  trucks reach the dock face, plus the dock aprons themselves provide queue room.
- **Entry/exit together: TRUE.** Single gate, in-and-out via the same NW driveway.
- **Entry lanes / exit lanes: 1/1.** Single bidirectional driveway.
- **Scale: FALSE (uncertain).** No truck-scale platform identified along the
  inbound truck path. Meat plants sometimes have a scale; not visible here.
- **Multi-step: FALSE.** No second checkpoint or separate scale house after
  the gate.
- **Multiple facilities: FALSE.** One main manufacturing building + a small
  wastewater treatment plant (two buildings; same campus). Not a campus of
  multiple full operations.
- **Rail-served: FALSE.** A rail mainline (3 tracks) runs N-S between the Kraft
  Heinz property and the east-DC neighbor, and crosses Slopertown at the NE
  intersection. There is **no rail spur curving into the Kraft Heinz property**.
  The east-DC neighbor has a rail spur and the rail line; Kraft Heinz does not.
- **Urban/rural: RURAL.** Cornfields north, west, and south. The Eastern Iowa
  Industrial Center is a discrete industrial pod ~12 km north of Davenport's
  urban core, not embedded in the metro fabric.
- **Connectivity: FINE.** Rural setting but in an active industrial park with
  multiple modern industrial tenants and major Davenport/I-80 corridor nearby
  — cellular coverage is almost certainly adequate.

## 5. Geofences

- **Perimeter (PRIMARY):** S=41.6125, W=-90.6135, N=41.6182, E=-90.6080
  (~72 acres, matches the published 70-acre figure).
- **Truck gate:** narrow box around the NW driveway entry on Slopertown.
- **Drop yards (2):** east drop yard (east of building) and south drop yard
  (south of south dock apron).
- **Dock aprons (2):** south dock apron (long, in front of south face) and
  east dock apron (in front of east face).
- **Staging:** the parking-lot apron + initial truck route between the gate and
  the dock yard.

## 6. Web findings

- Kraft Heinz Davenport is the company's **first post-merger greenfield plant**
  (2017), 382,000 sq ft, 70 acres, **Eastern Iowa Industrial Center**.
- Produces millions of pounds annually of Oscar Mayer Deli Fresh + Lunchables.
- Won **Food Engineering Magazine's 2018 Plant of the Year**.
- **$30M expansion** announced subsequent to opening (qctimes.com).
- General contractor: Gray Construction; design partner Tri-City Electric on
  the Davenport build.

Sources used to resolve location and operational detail:
- [Gray Construction — Plant of the Year 2018](https://www.gray.com/insights/new-kraft-heinz-iowa-factory-awarded-food-engineering-magazines-2018-plant-of-the-year/)
- [QC Times — $30M expansion](https://qctimes.com/business/kraft-heinz-investing-million-to-expand-industrial-park-facility-in/article_20018c96-878a-5a36-a67d-ed1ded0aeb07.html)
- [BD+C — 70-acre facility](https://www.bdcnetwork.com/home/news/55161463/kraft-heinz-meat-processing-and-packaging-facility-occupies-70-acre-plot-in-davenport-iowa)
- [Tri-City Electric — Kraft Heinz Davenport](https://www.tricityelectric.com/projects/kraft-heinz/)
- [FSIS — Kraft Heinz Foods Company](https://www.fsis.usda.gov/inspection/fsis-inspected-establishments/kraft-heinz-foods-company-4)

## 7. Verdict

- **Truck gate:** YES — fenced perimeter, single controlled entry off Slopertown.
- **Guard shack:** NO standalone staffed booth visible.
- **Remote GS (kiosk / app check-in):** Implied YES (modern 2017 plant, no booth).
- **Confidence:** HIGH on most fields (the building, perimeter, dock count,
  drop-yard count, single-gate, no rail spur, modern plant) — uncertain on the
  exact check-in mechanism (kiosk vs. nothing), the presence of a truck scale,
  and a possible multi-step check-in inside.
- **Archetype hint:** Was given #5 (Gate + GS + multi-step). My read is closer
  to a **Gate + Remote-GS** modern-greenfield archetype with significant
  fast-lane opportunity (long driveway, wide apron, 50+ docks across two faces,
  separate ship/receive).

---

**3-line summary:**
- Gate: yes — fenced perimeter, single controlled NW driveway off Slopertown.
- Guard shack: no — no booth visible; modern (2017) plant with remote / kiosk
  check-in implied.
- Confidence: high.
