# Tyson Fresh Meats Dakota City Beef Plant — Dakota City, NE

**Resolved location:** 42.42785, -96.41696 (perimeter centroid) — 5200 Dakota Ave / Ibp Ave, Dakota City, NE 68731
**Roster seed:** 42.428627, -96.415967 (precision ROOFTOP)
**Correction applied:** none needed. The seed landed inside the complex. Work went into resolving the **extent** of the site, not its position — this is a 1.4 km ribbon of plant, not a single building.
**Maps:** https://www.google.com/maps/@42.42785,-96.41696,400m/data=!3m1!1e3

---

## How the location was confirmed

Google Places (New) `searchNearby` at the seed returned **five separate Tyson-named records inside the traced perimeter**:

| Record | Address | Coordinates |
|---|---|---|
| Tyson Fresh Meats | 5200 Dakota Ave | 42.428627, -96.415967 |
| Tyson Foods | 5200 Ibp Ave | 42.427556, -96.415113 |
| Dakota City, Tyson Fresh Meats | 1671 Ibp Ave | 42.431425, -96.414687 |
| **TYSON TRUCK ENTRANCE** | 360 164th St | 42.431284, -96.415733 |
| Tyson Chemical Receiving | 1655 Ibp Ave | 42.425580, -96.416499 |

That last-but-one record is the useful one: it sits exactly on the interior truck check-in building found on satellite.

**Neighbours excluded from the geofence:** empirical foods (6001 Dakota Ave) and Dakota Cold Storage (370 164th St) sit on 164th St **west** of the rail corridor at roughly -96.4203; Ingredion is further west again. Their building cluster is visible on the left edge of the z16 sweep and is outside the traced perimeter.

**Verification confidence.** The WebSearch budget for this run was exhausted, so no Tier-1 documentary check and no affirmative divestiture check were run. Identity rests on the Places records plus 2023-08 Street View and 2026 satellite showing a fully active plant — trucks moving on the entrance drive, occupied dock faces, packed trailer yards. Dakota City is Tyson Fresh Meats' flagship beef plant, so divestiture risk is low, but treat the verdict as evidence-from-imagery.

---

## What each key view showed

| View | Finding |
|---|---|
| z15 sweep | One continuous industrial ribbon running ~1.4 km north–south along the rail line, farmland on both sides. Position confirmed immediately. |
| z17 north (42.4337) | North boundary fence at lat 42.43474. Big north trailer yard (five long rows, ~76 trailers), employee parking, blue-roofed office. Green land-application field to the east. |
| z17 mid (42.4287) | The process spine — a dense 800 m building mass. Rail cars lining the west edge for the full frame. Enormous striped employee lots on the east. |
| z17 south (42.4237) | South trailer yard (~8.6 acres of rows), multi-track rail yard on the west, Pine St at the south boundary (lat ~42.42231). |
| z18 entrance (42.43128, -96.41560) | The main truck entrance drive off Ibp Ave, and the interior check-in building with a tractor-trailer stopped beside it. Trailer rows on every side. |
| z19 dock A (42.43040, -96.41660) | **17–20 trailers backed square into a single east-facing wall** across a ~75 m dock face. |
| z19 dock B (42.43150, -96.41680) | ~13 trailers on a west-facing wall, plus ~10–12 along the south face of a large shed. |
| z20 check-in (42.43125, -96.41585) | Blue-roofed building measured at ~12.7 x 18.7 m — a driver check-in office, too large to call a booth. |
| z21 gatehouse (42.43140, -96.41472) | Small brick building with a hipped roof, measured **7.0 x 6.1 m** on a gravel pad — classic gatehouse footprint. |
| SV `FUABoi9GvqwMlzTvdkKzeg` (2023-08) @ 247–272° | The driver's arrival frame: open T-intersection off Ibp Ave onto a wide concrete drive, **no barrier at the road**, plant dock faces visible straight ahead. |
| SV from the entrance drive @ 228°, fov 26 | **The decisive frame for the gate.** Chain-link swing gates with locking post, diagonal bracing, yellow bollards and concrete barriers closing the drive into the trailer yards, restriction signage on the fence. |
| SV Ibp Ave @ 42.42903 and 42.43403 | Wide grass buffer between the county road and the plant — no perimeter fence at the road frontage on these stretches. |

---

## Determinations

**Truck gate — TRUE (high confidence), but the control point is not at the road.** The Ibp Ave entrance at 42.43172, -96.41415 is an open T-intersection. Control sits inside, on two lines: the chain-link gate line photographed in 2019-07, and the truck check-in building 600 m west that Google Places labels "TYSON TRUCK ENTRANCE". For a yard-management conversation this is the interesting shape — the property's stacking capacity is enormous and its checkpoints are deep inside, not at the fence.

**Guard shack — TRUE (medium confidence).** A brick hipped-roof building measured at 7.0 x 6.1 m sits at 42.43140, -96.41472, on a gravel pad on the south side of the entrance drive about 55 m in from Ibp Ave, behind the perimeter fence and beside the trailer-yard fence line. Size, roof form and position all read gatehouse, and it is plainly not the main building. **What was not observed: a barrier arm beside it, or a person in it.** If that building turns out to be unstaffed, this site flips to `remoteGs: true` — it is the single highest-value thing to confirm on a call. The interior check-in building (12.7 x 18.7 m) is a different animal: a driver check-in office, not a booth.

**Dock doors — "50+" (band high confidence, count 85 is an estimate).** Three banks were counted directly and total ~41–45 doors: an east-facing wall with 17–20 trailers backed in across 75 m, a west-facing wall with ~13, and a shed's south face with ~10–12. Further banks are visible on the north warehouse and in the ground-level view west from the entrance. 85 is the campus aggregate.

**Trailer capacity — 380 (medium confidence).** 32.5 acres of traced drop yard across four zones: north 10.25 ac, north-mid 10.02 ac, west-of-check-in 3.64 ac, south 8.56 ac. Observed occupancy is ~280 trailers at roughly one per 520 m² — a wide-aisle layout, so the packed ceiling is higher than 380.

**Site area — 106.5 acres** from a 15-vertex perimeter (431,000 m²). A long ribbon roughly 1,380 m x 300–360 m between the rail corridor and Ibp Ave. Boundary accuracy ±30 m; the softest edges are the southeast (paved lots fading into grass buffer) and the west (yard meeting rail right-of-way).

**Scale — false, but read it as "not found".** No unambiguous weigh deck or scale house at the entrance or beside the check-in building at z20/z21. A beef plant this size almost certainly weighs inbound cattle and outbound product. Flagged.

**Rail — true, and integral.** A continuous line of cars runs the full west edge, with a multi-track yard at the south end around 42.4250, -96.4192.

**Rural.** Dakota City is a town of ~2,000; the plant is bounded by row-crop farmland east and north, the rail corridor and river bottom west, and the residential grid only at the far south. `connectivityIssue` is still false — this is the edge of the Sioux City metro, not back country.

**Multi-step — true (flagged).** Entrance gatehouse and gate line, then a separate truck check-in 600 m further in with its own fenced lane. Recorded true, but it rests on inferring both structures' function from footprint and position.

---

## Yard zones traced

| Zone | Area | Notes |
|---|---|---|
| Perimeter | 106.5 acres | 15-vertex ring, rail corridor west, Ibp Ave east, Pine St south |
| Truck gate | 1.56 acres | Entrance drive off Ibp Ave plus the gatehouse pad |
| Drop yard — north | 10.25 acres | Five long rows, ~76 trailers in the current pass |
| Drop yard — north-mid | 10.02 acres | The largest single trailer block, east of the check-in building |
| Drop yard — west of check-in | 3.64 acres | Rows against the plant's west shed line |
| Drop yard — south | 8.56 acres | South-end rows beside the rail yard |
| Dock apron — east face | 0.40 acres | The 17–20 door bank |
| Dock apron — west face | 0.48 acres | ~13 doors |
| Dock apron — shed south face | 0.34 acres | ~10–12 doors |
| Staging | 1.38 acres | Internal concrete artery past the check-in toward the docks |

Street View coverage exists for every zone. The truck-gate frame uses pano `FUABoi9GvqwMlzTvdkKzeg` (2023-08) at heading 247° — the arrival view from Ibp Ave. Interior zone panos resolve to `P2CNwZ8JoYvweC9rP6Cdng`, which is a 2012-07 capture on the entrance drive; it is the only pano with line of sight into the yards, so those frames are dated even though the satellite and the gate frames are current.

---

## Web findings

None gathered — the session WebSearch budget was exhausted before this facility was audited. Corroboration came from Google Places (New), reverse geocoding, roadmap overlays and dated Street View. A follow-up pass should add a Tier-1 citation (Tyson plant locator or a careers requisition at Dakota City) before this site is used in a filings-grade claim.

---

## Final confidence: **medium**

Location, extent, drop yards, dock banks and rail service are all directly observed and solid. Confidence is held at medium rather than high because of three things: the guard-shack call rests on footprint and position rather than an observed barrier or person; the interior zone panos are 2012 vintage; and several counts (dock doors, trailers, capacity, gate count, building count) are campus-scale estimates on a 106-acre site. All are listed in `uncertainFields`.
