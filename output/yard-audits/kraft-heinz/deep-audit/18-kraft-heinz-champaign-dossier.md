# Deep-Audit Dossier — Kraft Heinz, Champaign IL

**Facility:** Kraft Heinz - Champaign
**Address (confirmed via web):** 1701 W. Bradley Ave, Champaign, IL 61821 — SE corner of Bradley Ave & Mattis Ave
**Seed coordinates:** 40.1259519, -88.2717434 (lands on the plant rooftop)
**Method:** Tier-2 deep audit — multi-zoom satellite + Street View walk + web corroboration. Blind test (no baseline/manifest read).

---

## 1. Site layout established

- **North building (tan, older):** Kraft Heinz manufacturing plant — 1.2M sq ft. Fronts Bradley Ave with the corporate/office face and mature trees. Kraft Heinz's largest North American facility by production volume; 1,000+ employees; makes Kraft Mac & Cheese, Miracle Whip, ketchup, A.1.
- **South building (large grey, newer):** ~430K sq ft distribution center, **operated by CJ Logistics** (3PL). Dock doors wrap nearly the entire building.
- Two separate businesses share the single fenced property — Kraft Heinz (plant) + CJ Logistics (DC). This is why the classification flags `multipleFacilities: true`.
- The property is bounded: Bradley Ave on the north, Mattis Ave on the west, an active **railroad** on the south, and tree-screened secondary streets/industrial sprawl on the east. The whole Mattis Ave frontage is continuous chain-link fence.
- Hundreds of trailers parked across the yard (DC north/south/east aprons + drop-yard rows by the retention pond) — a substantial trailer drop yard.

## 2. Coordinates / headings probed

Satellite: wide context z16 @ seed; z17/z18 sweeps of N, S, E, W edges and all four corners; z19–z21 tight crops of the Mattis Ave driveways, the SW signalized intersection, the curving entrance drive, the DC SW corner, and the south-side internal structure.

Street View panos probed (camera headings in °):
- Mattis Ave @ 40.12379,-88.27693 — H90 → DC west wall, blank, fenced.
- Mattis Ave @ 40.12315,-88.27693 — H90 → DC west wall, fenced, no opening.
- Mattis Ave @ 40.12454,-88.27694 — H75/90/98/105 → **DC driveway gate** (visitor/check-in driveway).
- Mattis Ave @ 40.12435,-88.27694 — H92/100/108/112/115/120 → tight on DC driveway gate.
- Mattis Ave @ 40.12445,-88.27694 — H70/80/85 → straight into the DC driveway.
- Mattis Ave @ 40.12251,-88.27693 — H60/75/90 → **SW signalized intersection / semi entrance**.
- Mattis Ave @ 40.12238,-88.27693 — H45/55/70 → semi entrance road with a Walmart-fleet tractor-trailer on it.
- Mattis Ave @ 40.12279,-88.27693 — H90 → DC south-west wall, fenced.
- Bradley Ave panos @ -88.2747 / -88.2730 / -88.2710 / -88.2700 / -88.2690 — H180 → plant north face: office frontage at the NW, then continuous fenced dock walls eastward. No semi gate on Bradley.
- East-side street panos (2015/older) — tree-screened, no usable gate view.
- South pano @ 40.12136,-88.27255 (2012) — south side confirmed rail-bounded; no public road, no Street View access to the south yard road.

## 3. What the key views showed

**DC driveway gate (~40.1244, -88.27693, Mattis Ave):** A wide paved driveway crosses the chain-link property line. Chain-link **sliding gate panels** on both sides of the opening (shown rolled open in the Aug-2025 imagery). Two white sign panels on posts at the mouth, an upright dark pedestal at the gate edge (call-box / card-reader consistent), an orange cone, a fire hydrant. The DC office portion (bearing the "Kraft Heinz" sign) sits well back. **No guard booth at this roadside opening.**

**Semi entrance — SW signalized intersection (~40.1224, -88.27693, "702-710 N. Mattis Ave at the stop light"):** A full traffic signal where Mattis Ave meets the facility's entrance road. Street View repeatedly caught tractor-trailers (incl. a Walmart-fleet unit) on this entrance road. From here a **long curving entrance drive** (~200 m, wrapping a large grassy median, past the retention pond) leads back to the DC truck yard and dock aprons. No public Street View coverage exists on this private entrance drive.

**South side:** A small internal structure with a driveway running through it sits near the railroad (~40.1218, -88.2727) — an internal yard/rail crossing point, not a public-road gate. The south property line is the railroad; no public truck access there.

**Bradley Ave (north):** Office frontage at the NW; eastward the plant's dock walls front the street behind continuous chain-link, with trucks/trailers visible at docks — but **no semi entrance**, confirmed by review testimony.

## 4. Web research findings

- Facility = 1.2M sq ft plant + 430K sq ft DC; Kraft Heinz's largest NA plant by volume; 1,000+ employees; appointment-only operations; inbound hours ~6:30 AM–1:30 PM.
- **Driver/visitor reviews (decisive corroboration):**
  - "There is **NO semi entrance on Bradley**. The actual **Semi entrance and exit are at 702-710 N. Mattis Ave at the stop light** near AutoZone." → confirms a single combined entry/exit at the Mattis stoplight (matches the SW intersection probed).
  - "Everyone was super nice **from the gate guard** to the shipping and receiving office." → direct eyewitness evidence of a **manned gate** with a gate guard, distinct from the S&R office.
  - "Check in security requires a highlighter for PO# and Seal#, and they'll ask for driver license." → formal security check-in for drivers.
  - "Two separate businesses on the property: Kraft-Heinz and CJ Logistics... the big grey building on the south... is CJ Logistics." → multi-occupant site.
  - Long load times reported ("loaded in like seven hours") → consistent with heavy trailer staging / drop-yard operation.

## 5. Determination — truckGate / guardShack / remoteGs

- **truckGate = TRUE (high confidence).** The property is fully fenced; there is a single dedicated semi entrance/exit at the Mattis Ave signalized intersection, and a chain-link sliding gate is visible across the DC driveway. Reviews independently confirm a controlled semi entrance.
- **guardShack = TRUE (high confidence).** A driver review explicitly names a **"gate guard"** as a person encountered before the shipping/receiving office. The site is appointment-only with a documented security check-in (license, PO#, seal#). A 1.2M sq ft food plant plus a 3PL DC of this scale operating a manned gate is fully consistent. The guard checkpoint is located along the private curving entrance drive (no Street View coverage; the roadside Mattis openings show no booth, so the manned position sits inboard on the drive). The eyewitness "gate guard" evidence is specific and direct.
- **remoteGs = FALSE.** This is not an unmanned/remote check-in kiosk operation — there is a live gate guard plus an in-building security check-in.

## 6. Other classification notes

- `drivewayLong: true` — the entrance drive from the Mattis stoplight curves ~200 m before reaching the truck yard; ample room for `preGateStaging` and `postGateStaging`.
- `entryExitTogether: true` — reviews state the semi entrance AND exit are both at the one Mattis stoplight. `entryLanes`/`exitLanes` estimated at 1 each (the entrance road is a single shared two-way drive); flagged uncertain.
- `dockDoors: 50+` and `dropArea: 50+` — DC docks wrap the building; hundreds of trailers across the yard and drop-yard rows.
- `dropYard: true`, `multiStep: true` (gate check-in + building security check-in + dock assignment), `multipleFacilities: true` (Kraft Heinz plant + CJ Logistics DC).
- `urbanRural: Urban` — embedded in residential Champaign.
- `connectivityIssue: false`, `scale: false` (no truck scale observed), `fastLaneOpportunity: false`, `backupSensitive: false`.

## Final confidence: HIGH

Gate type and the existence of a manned gate are corroborated by both imagery (fenced perimeter, sliding gate, single signalized semi entrance) and multiple specific driver reviews ("gate guard," "semi entrance at the stop light," security check-in). The only residual uncertainty is exact entry/exit lane counts, flagged accordingly.
