# Tyson Fresh Meats — Storm Lake Pork Plant, Storm Lake IA (idx 06)

**Resolved center:** 42.639749, -95.187849 (1009 Richland Dr, Storm Lake IA 50588)
**Perimeter:** 38.2 acres · **Confidence:** high
**Maps:** https://www.google.com/maps/@42.639749,-95.187849,400m/data=!3m1!1e3

---

## 1. Locating the site

Roster coordinates 42.639941, -95.187210 (precision ROOFTOP) landed directly on
the plant. Two independent confirmations:

1. **Geocoder.** `Tyson Fresh Meats Storm Lake Iowa` resolves to an
   *establishment* at **1009 Richland Dr, Storm Lake IA 50588** @
   42.6399405, -95.1872102; the same address as a *premise* resolves to
   42.6397490, -95.1878492. Both sit on the complex **west** of the north–south
   road.
2. **Street View, 2024-06.** From the public road on the east frontage
   (pano `M7pfOH1Kii67p3X8Y_-PHg` @ 42.63993, -95.18619, heading 270) the
   **Tyson wordmark and logo are legible on the process building**, behind the
   site's white perimeter fence. A second pano 70 m north shows a row of flags
   of employee home countries — Tyson's standard Storm Lake frontage.

**Adjacent site excluded.** A second large industrial complex with its own
trailer fleet and employee lot sits immediately **east across the road**
(centered near 42.6396, -95.1840). The Tyson establishment record does not
resolve to it, so it is out of scope for this audit and out of the perimeter.

**Verification verdict: confirmed.** WebSearch was unavailable this run, so no
news check for a 2025–2026 closure or divestiture was performed; the operating
signature in current imagery (packed trailer yards, thousands of employee cars,
a tank car spotted at the plant wall) is that of a running plant.

---

## 2. Imagery pulled

| View | Center | Zoom | What it settled |
| --- | --- | --- | --- |
| Wide | 42.6395, -95.1885 | z15/z16 | Whole complex, town context, the east neighbor |
| NW quadrant | 42.6409, -95.1893 | z17 | Employee lots, north trailer park, west rail arm |
| SE quadrant | 42.6393, -95.1862 | z17 | Plant block, east frontage, adjacent complex |
| East entrance | 42.6408, -95.1870 | z19/z20 | The truck entrance — open, no gate, no scale |
| Fence line | 42.64108, -95.1893 | z19 | Security building on the car-lot fence line |
| West arm | 42.6401, -95.1918 | z18 | Rail turnouts into the yard, maintenance shop |
| West tip | 42.6405, -95.1945 | z17 | Western boundary of the trailer arm |
| Plant | 42.6398 / 42.6393 | z19 | Roof detail, east frontage strip |

**Street View: good coverage.** 2024-06 along the whole east frontage, plus a
2021-11 capture **inside the east truck entrance** (`XJV7VbwUhL8wZB7pSDKfQg` @
42.64080, -95.18656), a 2021-11 pano south of the rail (42.63898, -95.18900),
a 2019-07 pano on the north street, and a 2023-05 pano west of the yard.

---

## 3. Truck flow — gate and guard shack

**Gate verdict: `truckGate: false`.** Ground-truthed, not inferred. The 2021-11
pano sitting *inside* the east truck entrance, looking west (heading 270), shows
an open paved yard running away to rows of parked trailers — **no barrier arm,
no gate leaf, no booth, no lane control, no lane striping**. Looking east
(heading 90) from the same point shows the drive running straight out to a
**signalized intersection** on the public city street. The 2024-06 frontage
panos show only a **white ornamental picket fence** with jersey barriers at the
corner: it screens the yard from the street, it does not gate it. Satellite at
z19/z20 over the entrance confirms nothing but open pavement and a curbed
landscape island.

**Guard-shack verdict: `guardShack: false`.** No booth at the truck entrance in
either the 2021 or 2024 capture. The one gatehouse-like structure on site is a
**~10 × 16 m building at 42.64106, -95.18928**, sitting on the fence line between
the employee car lot and the plant yard — a personnel entry / security office on
the walking route, not a truck-lane booth. A brick office building with visitor
parking sits at the NE corner (42.64183, -95.18625); also not on the truck path.

**`remoteGs: false`** by rule — no gate, so the field does not apply.

**`backupSensitive: true`** and this is the headline. The truck entrance is
**~35 m west of a signalized intersection** on a public city street, with
residential blocks immediately south and the plant's north dock apron immediately
inside. Any inbound queue spills straight into that signal. There is no
pre-gate apron and no outside truck stalls — `preGateStaging: false`.

Inside, `postGateStaging: true`: ~1.5 acres of open pavement between the
entrance drive and the docks, and `drivewayLong: true` — the internal run from
the street to the far dock faces is several hundred metres.

---

## 4. Docks

- **North face** (42.64054, -95.18740 → 42.64048, -95.18703): **8 trailers backed
  in** over ~31 m of wall, pitch 3.8 m. Further east along the same face, ~6 more.
- **West face:** ~5–7 backed in.
- **South / east faces:** ~5.

Occupied dock positions counted ≈ 30. Total installed doors estimated **48**
across the four faces → band **`25-50`**, with 50+ plausible. Flagged.

`shipRcvSeparate: true` — the north-face bank (feeding the north trailer park) is
a physically distinct cluster from the west/south dock faces on other buildings
of the campus.

---

## 5. Yard

- **North drop yard:** ~1.95 acres against the east road, dense trailer rows.
- **West rail-side arm:** ~10.1 acres running WNW from the plant along the CN
  corridor out to 42.6410, -95.1939 — the bulk of the trailer storage, and a
  maintenance shop mid-arm.
- **Trailers visible:** ~165 standing at capture; the yards are near-full, so
  realized capacity is close to what is visible.
- **Trailer parking capacity:** ~280 (honest range 250–320).
- `dropArea: "50+"`, `dropYard: true`.

**Rail: `railServed: true`, confirmed.** The 2021-11 pano south of the rail
corridor (42.63898, -95.18900, heading 20) shows a **rail tank car spotted
directly against the plant's south wall** alongside a tanker truck, and z18
imagery west of the plant shows **turnouts off the CN main into the yard** at
approximately 42.6401, -95.1912.

**Setting:** Storm Lake is a town of ~11,000; the plant sits inside the street
grid with houses across the road and the lake ~700 m south. Per the rubric,
small-town industrial resolves to **`urbanRural: "Rural"`** rather than Urban.
`connectivityIssue: false` — in town, on an arterial.

**Campus:** `multipleFacilities: true` — a dozen-plus connected and separate
structures (kill/cut/process, cold storage, west-arm maintenance shop, utility
and ammonia plant, NE office building, the car-lot security building).

**Scale:** none found in the truck path in z19/z20 imagery or in the entrance
Street View. Called `false` and flagged — a plant receiving live hogs would
normally weigh somewhere, and a scale set deep inside the process yard would not
be visible from the frames audited.

---

## 6. Geofence notes

The site is **two-orientation**, and the rings reflect it. The employee lots on
the north and the east frontage run on the city's north–south grid. The entire
southern edge and the west trailer arm follow the **CN rail corridor on a
WNW–ESE bearing** — so the west drop-yard geofence is traced as a five-vertex
polygon along that rail line rather than a north-aligned box, and the north dock
apron is a rotated quad matching the ~12° south-of-east dock wall.

The 10-vertex perimeter covers the employee lots, the plant block and the rail
arm; it excludes the separate complex east of the road.

`streetViewMeta` uses the 2021-11 entrance pano `XJV7VbwUhL8wZB7pSDKfQg` for
every zone — it is the frame a driver actually sees on arrival. Headings:
perimeter 272°, truckGate 266°, dropYards 314°, dockAprons 249°, staging 260°.

---

## 7. Sales read

An ungated, unguarded, in-town plant yard whose only entrance opens 35 m from a
signalized intersection, carrying ~165 trailers across 12 acres of drop yard with
rail service into the property. Everything about arrival is uncontrolled and
unmeasured: no gate, no booth, no scale in the truck path, no pre-gate apron to
absorb a surge, and a queue that lands in a public traffic signal in a town where
the plant is the largest employer. Physical room for an express or bypass lane is
abundant (`fastLaneOpportunity: true`).

**Confidence: high** — Tyson branding confirmed on the building from the street,
the geocoder resolves the premise, and the gate and guard-shack calls are backed
by a Street View pano taken *inside* the entrance rather than inferred from
overhead. The remaining flags are `scale`, lane counts, the dock-door band, the
gate count and the capacity estimate.
