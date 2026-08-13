# Tyson Foods Springdale Complex — Springdale, AR

**Resolved location:** 36.19038, -94.12540 — 600 Berry St, Springdale, AR 72764
**Roster seed:** 36.18836, -94.129762 (precision APPROXIMATE, city-level)
**Correction applied:** the seed landed roughly 400 m southwest of the plant, in downtown Springdale. Pinned to the real complex east of the Arkansas & Missouri rail corridor, between Jefferson St and the rail, north of E Huntsville Ave.
**Maps:** https://www.google.com/maps/@36.19038,-94.12540,400m/data=!3m1!1e3

---

## How the location was confirmed

1. Wide z15 sweep around the seed showed one plant-scale industrial cluster in range — a dense process building with trailer yards on both ends, hard against the rail line.
2. Reverse geocode of the cluster center returned **600 Berry St, Springdale, AR 72764**.
3. Google Places (New) `searchNearby` at that point returned **"Tyson Foods Inc.", primaryType `manufacturer`, 600 Berry St** at 36.190375, -94.125687. The other manufacturers inside 350 m (Lassonde Pappas at 320 Rhodes Ave, Pappas Foods, Farmers Cooperative) all sit **west** of the rail corridor and were excluded from the geofence.
4. Roadmap overlay confirmed the street frame: Jefferson St east, Frisco St and the rail west, E Huntsville Ave south. Americold and Darling Ingredients are separate operators to the northeast and are outside the traced perimeter.
5. Ground truth: 2025-03 Street View from Jefferson St shows a **Tyson monument sign on a brick base** reading *MAIN/VISITOR ENTRANCE · SHIPPING · SOUTH TEAM MEMBER PARKING*, with Tyson-liveried reefer trailers behind it.

**Verification confidence.** The WebSearch budget for this run was exhausted, so no Tier-1 documentary check (10-K Item 2, careers requisitions, company plant locator) was performed and no affirmative divestiture check was run. Identity rests on 2025-03 on-property Tyson signage, Tyson-branded equipment in the yard, and the Places business record. Springdale is Tyson's headquarters town and this is its original processing complex, so divestiture risk is low — but treat the verdict as evidence-from-imagery, not evidence-from-filings.

---

## What each key view showed

| View | Finding |
|---|---|
| z17 overview (36.19071, -94.12525) | Linear complex ~415 m N–S x ~155 m E–W. North trailer yard, central process mass, employee parking on the east, large south drop yard. Rail corridor hard against the west edge. |
| z18 north (36.19175, -94.12470) | Angled trailer rows fanned across a large paved yard; office/maintenance building; on-site wastewater plant (clarifier + blue-domed digester). Driveway to Jefferson St at the northeast. |
| z18 south (36.18880, -94.12530) | The main drop yard — trailers parked around the full perimeter of a paved lot with an open maneuvering core. Employee parking north of it, dock face beyond that. E Huntsville Ave along the bottom. |
| z19 east dock face (36.18990, -94.12555) | Eight trailers backed square into an east-facing wall; a second bank of 5–6 north of it. Trailers along the south building face are parked parallel (staged), not docked. |
| z19 rail (36.19053, -94.12657) | Multiple sidings against the plant's west edge holding covered hoppers and tank cars, plus a covered rail unloading shed between tracks. |
| z20 gate (36.18906, -94.12520) | The Jefferson St curb cut, ~13–15 m wide and unstriped, opening straight into the drop yard. Guard booth visible ~45 m inside. |
| z21 booth (36.18910, -94.12544) | Booth footprint confirmed: a single rectangular structure ~10 x 5 m with a vehicle parked beside it, standing in the truck lane. No scale deck adjacent. |
| SV pano `RpjocBAe6Ri47BtrjfGzZg` @ 286°, fov 25 | **The decisive frame.** Tan guard booth, windows on multiple faces, covered entry, steps, golf cart parked at the door. Tyson-branded reefers lined up behind it. |
| SV pano @ 36.19156, -94.12390, headings 280/320 | North entrance: a black cantilever slide gate mounted on the fence line, standing open. No booth at this gate. |
| SV along Jefferson St, four points | Continuous ornamental steel palisade fence for the full frontage — the property is fully enclosed on its street face. |

---

## Determinations

**Truck gate — TRUE (high confidence).** Two controlled entrances, both on Jefferson St:

- **Main / shipping gate, 36.18906, -94.12504.** Signed *MAIN/VISITOR ENTRANCE · SHIPPING*. The control point is the staffed booth 45 m inside, not a barrier at the street.
- **North gate, 36.19158, -94.12400.** A physical cantilever slide gate on the fence line, photographed open.

The perimeter is fenced continuously in ornamental steel, so entry is genuinely channelled through these two points.

**Guard shack — TRUE (high confidence).** Directly photographed, not inferred: a 1-story booth of roughly 1–3 parking-space footprint, multi-sided windows, covered entry, sitting in the truck path at the main gate. `remoteGs` is therefore false.

**Dock doors — "25-50" (medium confidence).** Directly counted: ~14–16 enclosed freight dock positions on the east/southeast shipping face, plus ~12–13 regularly spaced truck bays along the southeast face of the northwest live-haul shed. Combined estimate **28**. If live-haul receiving bays are excluded and only conventional freight docks are counted, the band drops to "10-25". This is a legacy multi-decade poultry complex; some docks are almost certainly enclosed inside refrigerated structure and invisible from overhead. Flagged in `uncertainFields`.

**Trailer capacity — 140 (medium confidence).** Three drop zones traced. The south yard (2.8 acres) held ~41 trailers parked around its perimeter with an open maneuvering core; capacity there is ~70–80. The two north-yard zones (~2 acres combined) held ~38 and can take ~50–60. Site total ~95 trailers visible in the current pass.

**Site area — 16.0 acres** from the traced perimeter (64,700 m²). Compact for the output: the plant is pinched between the rail right-of-way and Jefferson St. West-edge accuracy is roughly ±15 m where the fence follows the irregular rail boundary.

**Scale — false (medium confidence).** No weigh deck or scale house in either entrance path at z20/z21. A scale inside an enclosed dock area would not be visible from above.

**Rail — true.** Sidings with covered hoppers and tank cars run the full west edge, with a covered unloading shed between tracks. The corridor is shared and also stores derelict cars, so the exact count of Tyson-served spurs is not separable from overhead.

**Ship/receive separate — true.** Finished-goods shipping is routed to the Jefferson St gate by the entrance sign; raw and live-haul receiving happens on the northwest shed against the rail, on the opposite side of the complex.

**Urban.** Inside Springdale's built fabric — apartments to the west, an employee lot across Jefferson St, arterials on two sides.

---

## Yard zones traced

| Zone | Area | Notes |
|---|---|---|
| Perimeter | 16.0 acres | 12-vertex ring following the fence line; west edge follows the rail right-of-way |
| Truck gate | 0.16 acres | Rotated quad along the entrance drive axis, street curb cut through the guard booth |
| Drop yard — south | 2.80 acres | The main trailer lot; ~41 trailers parked in the current pass |
| Drop yard — north A | 1.33 acres | Angled trailer rows along the north fence |
| Drop yard — north B | 0.64 acres | Second angled row south of the wastewater plant |
| Dock apron — east shipping | 0.22 acres | Strip in front of the east-facing dock wall |
| Dock apron — live haul | 0.12 acres | Strip along the northwest shed's bay face |
| Staging | 0.95 acres | Internal drive/holding area between the booth and the dock faces |

Street View coverage exists for every zone (all eight metadata queries returned `OK`, all panos captured 2025-03). The truck-gate pano `EVnim-MPaPNMbDnFYgVOtQ` at heading 267° is the driver's-eye arrival frame.

---

## Web findings

None gathered — the session WebSearch budget was exhausted before this facility was audited. Corroboration came from Google Places (New), reverse geocoding, and dated Street View imagery instead. A follow-up pass should add a Tier-1 citation (Tyson plant locator or a careers requisition at 600 Berry St) before this site is used in a filings-grade claim.

---

## Final confidence: **high**

The facility identity, gate, guard shack, drop yards and perimeter are all directly observed at high resolution with 2025-03 ground truth. The soft spots are the dock-door band (live-haul bays vs. freight docks), the unstriped lane counts, the absence-of-scale call, and the trailer-capacity estimate — all listed in `uncertainFields`.
