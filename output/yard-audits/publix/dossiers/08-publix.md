# Yard Audit Dossier — Publix Distribution Center, Sarasota FL (idx 08)

- **Facility:** Publix Distribution Center Sarasota FL
- **Type:** Grocery Distribution Center
- **Listed address:** 6123 Sawyer Rd, Sarasota, FL 34238
- **Resolved center:** 27.26430, -82.48635
- **Method:** deep-audit (satellite z16-z21 + Street View 2019/2023 + web)
- **Confidence:** high

---

## Step 0 — Locating the exact building

The supplied coordinates (27.264795, -82.486424) land directly on a large
two-tone-roof distribution building (tan/concrete north half, grey south half,
blue-painted parapet) on the **west** side of the Palmer Ranch / Sawyer Rd
industrial parcel. Web listings (Yelp "Publix Sarasota Warehouse", YellowPages,
TruckMap, Manta) all place the Publix DC at 6123 Sawyer Rd, FL 34238 — a 24-hour
warehouse with truck/overnight parking and diesel fuel.

Critically, there are **two large buildings** here. Immediately east, across a
tree-lined drainage corridor, sits a **much larger bright-white building** with
its own enormous dock face and trailer drop area. That white building is a
**separate facility on its own parcel** (different access, different docks) and
is **excluded** from this audit. This audit covers only the Publix building west
of the drainage line, which is the one closest to Sawyer Rd (the addressed road).
Building centroid pinned to ~27.2643, -82.48635.

## Key views

- **Wide (z16-z17):** Publix building west of the drainage corridor; neighbor
  white mega-DC to the east; residential subdivisions south and west; Clark Rd
  commercial strip to the north behind a wide wooded/wetland buffer.
- **West face (z18-z20):** building wall with reefer trailers backed in, a long
  staged trailer row along the north drive, employee parking lot (angled stalls,
  red-curbed islands) at the SW, and a small fleet/maintenance annex with
  canopies and green bobtail tractors at the SW corner.
- **North (z19):** dedicated trailer **drop yard** — two long parallel rows of
  parked trailers with a wide central drive aisle, fully fence/tree-buffered.
- **South face (z20-z21):** continuous striped **dock-door band** along the south
  wall with a deep paved truck apron; dock office + maintenance annex at the SW.
- **East face (z20):** plain building wall + a perimeter drive bordered by the
  tree-lined drainage corridor that separates Publix from the neighbor DC. No
  docks on the east face.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE (gate present), set-back private entrance.** The property
  is **fully perimeter-fenced** (chain-link + hedge) on every public frontage.
  Street View driven along Sawyer Rd (west) and the north access road shows an
  unbroken fence line with No-Parking signage and **no open driveway**. Trucks
  were captured **staged bumper-to-bumper on the public access road** outside the
  property (pano 7ugekUmvXEaSpyBkJVJKBw, 2023-04: a queued red tractor and
  trailers along the fence). The single combined vehicle entrance is a **private
  drive entering from the SW** (off the Palmer Ranch collector). Google Street
  View has **no on-property coverage** — every roadside pano snapped back to the
  public street — which is itself consistent with a controlled, set-back gate.
- **Guard shack — FALSE / remote (uncertain).** No ~1-3-vehicle booth structure
  could be positively resolved beside the entrance drive in z20/z21 satellite,
  and there is no Street View of the gate throat itself. With a gate clearly
  present but no confirmed manned booth, classified `guardShack: false`,
  `remoteGs: true` (kiosk / call-box / app check-in implied). Both flags flagged
  as **uncertain** for human review.
- **Docks — 50+.** Continuous dock-door bands read on the **south face** (long
  striped dock line, trailers backed in, ~27.2631) and the **west face** (reefer
  trailers backed in). Combined estimate ~55 doors -> band **50+**. Two distinct
  dock faces => `shipRcvSeparate: true` (flagged uncertain — single connected
  building).
- **Drop yard — 50+.** Dedicated north drop yard (two parallel trailer rows) plus
  a long staged trailer row along the north/west drive. ~70 trailers visible,
  estimated capacity ~110 -> band **50+**; `dropYard: true`.

## Yard zones & counts measured

| Metric | Value | Basis |
|---|---|---|
| Dock doors | ~55 (50+) | south + west dock bands, z20-z21 |
| Trailers visible | ~70 | drop yard + dock + staged rows |
| Trailer parking capacity | ~110 | drop-yard rows + apron |
| Truck gates | 1 | single set-back SW entrance |
| Buildings | 2 | main DC + SW fleet/maintenance annex |
| Site area | ~55 acres | shoelace on traced perimeter polygon |
| Rail served | no | no spur enters the property |

Geofences traced as oriented polygons following the real (slightly skewed)
parcel: `perimeter` (full fenced parcel), `truckGate` (SW entrance throat),
two `dropYards` (north trailer yard + west staged row), two `dockAprons` (south
+ west dock strips), and a `staging` quad (deep internal yard between gate and
docks).

**Street View frames recorded:**
- `perimeter` — pano `P9gizTYymsT6uz8hXIXvWg` (Sawyer Rd, 2019-09), heading 81°
  (E, toward the building across the west fence).
- `truckGate` — pano `PMNdhB0Ec12Nelv3jf_r7w` (SW drive, 2019-09), heading 60°
  (NE, toward the entrance / building). This is the closest mapped driver's-eye
  frame to the entrance; the gate itself sits past the public-road fence with no
  SV coverage.

## Web findings

- Yelp / YellowPages / TruckMap / Manta: "Publix Sarasota Warehouse", 6123 Sawyer
  Rd, Sarasota FL 34238; phone (941) 923-4929; open 24 hours; truck / overnight /
  reservable parking; diesel fuel on site. Categorized as a grocery warehouse;
  ~100-249 staff. Located off Sawyer Rd, south of Bee Ridge Rd, west of I-75,
  near the Clark Rd @ Sawyer Rd corridor.

## Urban / rural

Dense south-Sarasota / Palmer Ranch metro fabric — large residential
subdivisions to the south and west, a Clark Rd commercial strip to the north,
and a neighboring large DC + industrial park to the east. **Urban.**

## Final confidence

**High** on identity, perimeter, docks, drop yard, urban setting, and the
existence of a controlled (gated, fully fenced) entrance. The only soft calls are
the **guard-shack vs. remote check-in** distinction and the **entry/exit lane
count** — the entrance is a private set-back drive with no Street View coverage
of the gate throat, so those are flagged in `uncertainFields` for human review.
