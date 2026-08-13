# Tyson Fresh Meats — Joslin Beef Plant, Joslin IL (idx 05)

**Resolved center:** 41.552400, -90.224400
**Perimeter:** 53.2 acres · **Confidence:** medium
**Maps:** https://www.google.com/maps/@41.5524,-90.2244,400m/data=!3m1!1e3

---

## 1. Locating the site

Roster coordinates were 41.555831, -90.224756 (geocoder precision ROOFTOP). That
point lands on the **north end** of the complex, at the mouth of the trailer
yard, not on the plant. The Google Geocoding API resolves
`Tyson Fresh Meats Joslin Illinois` to an **establishment** record at
*28424 38th Ave N, Hillsdale IL 61257* @ 41.5558309, -90.2247559 — the same
spot. Satellite at z16 centered 400 m south (41.5520, -90.2255) brings the whole
complex into one frame and confirms the true operating center is roughly 350 m
**south** of the roster pin.

The complex reads unambiguously as a large red-meat plant: one very long
process building running NNW–SSE, a separate white cold-storage / distribution
building on its east side, livestock holding pens on the south end (the gridded,
white-flecked block at ~41.5497, -90.2255), a wastewater / utility cluster on the
west, a 100-plus-trailer drop yard on the north, and an employee car lot holding
on the order of 1,400 vehicles. Nothing else in Whiteside/Rock Island County
farmland looks like that.

**Verification caveat:** the session WebSearch budget was exhausted, so the
Step -1 web gate was waived per run instructions. Verdict recorded as
**probable**, not confirmed — there is no on-site signage evidence because there
is no Street View anywhere near this property.

---

## 2. Imagery pulled

| View | Center | Zoom | What it settled |
| --- | --- | --- | --- |
| Wide | 41.5520, -90.2255 | z16 | Whole complex; roster pin is 350 m north of the plant |
| North half | 41.5542, -90.2244 | z17 | Drop yard, access drive, rail crossing, pre-gate lot |
| South half | 41.5507, -90.2244 | z17 | Plant, cattle pens, employee lots, SE access road |
| Entrance | 41.5544, -90.2249 | z18/z19 | Yard mouth — no gate structure |
| Truck spine | 41.5537 / 41.5535 | z19/z20/z21 | The rail-flanked control lane |
| Dock face | 41.5529, -90.2240 | z19 | Cold-storage west wall, door pitch, trailer count |
| West side | 41.5513, -90.2269 | z18 | Rail siding, no visible spur into the yard |
| SE approach | 41.5493, -90.2223 | z18 | Employee entrance road, no gate |

**Street View: none.** Metadata returns `ZERO_RESULTS` at every probe on the
access drive, the yard, the plant perimeter and the SE road (radius 60–200 m).
The nearest pano is 245 m north at 41.55701, -90.22489 on the residential street
through Joslin (2023-05); from there the plant reads only as a distant line of
trailers. Every access-control call below is therefore satellite-only, and
Google's native resolution here tops out around z19 — the z20/z21 crops are
visibly upsampled.

---

## 3. Truck flow

Trucks reach the site on a **private access drive** running south off the county
road at the north edge of Joslin. That drive crosses an **active at-grade rail
line** at approximately 41.5548, -90.2248 and then opens directly into the drop
yard about 60 m further south.

- **Property-line entrance (41.5544, -90.2247):** no barrier arm, no gate leaf,
  no booth. A boundary line of regularly spaced markers runs east along the
  yard's north edge, and the drive simply passes through a gap in it.
- **Control point (41.55347, -90.22476):** ~200 m inside, on the single
  north–south truck spine, the drive necks down into a lane roughly **4.5 m wide
  by 12 m long, flanked by two parallel post-and-rail lines**. Every inbound
  truck funnels through it. That footprint is the classic overhead signature of
  a **truck scale** with guide rails, and it is the only physical choke on the
  truck path.

**Gate verdict: `truckGate: true`** — called on that checkpoint pinch-point, not
on a property-line gate, and flagged uncertain.

**Guard-shack verdict: `guardShack: false`.** Two objects beside the control lane
looked booth-sized at z19; at z21 they resolve to ~2–3 m dark-olive blobs
(vegetation or containers), not a windowed structure with a 1–3-vehicle
footprint. No guard building at the north entrance, at the SE employee entrance,
or anywhere along the access drive. Consequently **`remoteGs: true`** — control
point, no staffed booth, so check-in is presumably kiosk / call-box / phone.

**Backup sensitivity: true.** A queue at the internal control point backs north
along the spine and over the at-grade rail crossing before it ever reaches the
public road. That is the operational failure mode worth naming in a sales
conversation.

**Pre-gate staging: true.** A separate paved lot north of the rail crossing
(~41.5548–41.5552, -90.2247) holds 15–20 tractors and trailers plus a small
building, and tractors were also parked along the access-drive shoulder.

**Post-gate staging: true.** Roughly 1.7 acres of open, unmarked pavement sits
between the drop yard and the dock aprons (traced as `staging`).

---

## 4. Docks

Two banks, on different buildings and different faces — hence
`shipRcvSeparate: true`.

- **Cold-storage / distribution building, west wall** (41.55317 → 41.55234 at
  -90.22380): ~93 m of dock face, door pitch ~3.9 m, **11 trailers backed in**
  at capture across two groups split by a pipe bridge. Estimate **24 doors**.
- **Plant east face** (41.55306 → 41.55244 at -90.22446): three canopied door
  groups, ~19 bays total.

**Total estimate 45 → band `25-50`.** Flagged: adding the north-face and
livestock-side doors could push this over 50.

---

## 5. Yard

- **Drop yard (east block):** 8.44 acres, 41.55315–41.55440 × -90.22206
  to -90.22474. Four to five long trailer rows.
- **Drop yard (west block):** 0.91 acres, immediately west of the truck spine.
- **Trailers visible:** ~140 standing at capture.
- **Trailer parking capacity:** ~220 (honest range 200–260) from measured acreage
  at the observed row pitch.
- `dropArea: "50+"`, `dropYard: true`.

**Rail:** called **false**. A multi-track siding carrying a long string of
covered hopper cars runs immediately along the west property line, but no spur
was seen crossing the drainage ditch and west service road into the yard in z18
imagery. Flagged — a spur north or south of the audited frames cannot be ruled
out.

**Setting:** open row-crop farmland on all four sides; the village of Joslin is
a scatter of houses 400 m north. `urbanRural: "Rural"`, unambiguously.
`connectivityIssue: false` (rural but not isolated — highway and village close
by), inferred and flagged.

**Campus:** `multipleFacilities: true` — process plant, separate cold-storage /
distribution building, livestock holding pens, wastewater/utility cluster, shop
and outbuildings.

---

## 6. Geofence notes

The complex sits close to true north–south: the plant spine, the dock walls and
the trailer rows all run within a few degrees of the cardinal grid, so the rings
here are near-rectangular because the **site** is, not by default. The perimeter
is a 9-vertex ring following the yard's north boundary, the east pavement edge,
the SE access road, the plant's south end and the west service road. It excludes
the mowed field east of the drop yard and the far overflow parking lot, whose
ownership could not be established from imagery.

`streetViewMeta` is `hasCoverage: false` for every zone — there is no pano to
point at this site.

---

## 7. Sales read

A very large, rural, single-spine yard with **no property-line gate and no
guard**, a probable scale as the only control point, 140-plus trailers standing,
and a queue path that dead-ends over a live rail crossing. Gate-side visibility
here is effectively zero today: nobody is capturing arrival, and there is no
staffed point at which a check-in could even happen. Wide unused paved width at
the entrance means a bypass / express lane is physically free
(`fastLaneOpportunity: true`).

**Confidence: medium** — driven entirely by the total absence of Street View.
The dock, yard and layout calls are solid; `truckGate`, `guardShack`, `remoteGs`,
`scale` and `railServed` are honest reads of blurry pixels and are all listed in
`uncertainFields`. A single site visit or one Street View pass would move this to
high.
