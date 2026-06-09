# Deep-Audit Dossier — Target Import Warehouse Savannah (T3684)

- **Facility:** Target Import Warehouse Savannah (T3684) — Import Warehouse
- **Provided address:** 110 Little Hearst Pkwy, Savannah, GA 31407
- **Confirmed address:** 211 Little Hearst Pkwy, Savannah / Port Wentworth, GA 31407
- **Resolved center:** lat 32.17420, lng -81.17620
- **Confidence:** HIGH (with `guardShack` / `remoteGs` / lane counts flagged)
- **Method:** deep-audit (satellite zooms 15–20 + Street View + web/assessor corroboration)

## 1. Locating & confirming the building

The supplied coordinates (32.17856, -81.177928, addressed "110") landed on a
**mid-sized** warehouse (~600 ft, NE–SW axis) inside the Savannah River
International Trade Park — too small to be Target's import warehouse, which web
sources describe as **2+ million sq ft, one of the largest in the nation**
(opened 2007).

Re-probing the trade-park cluster at z15–z16, the single largest footprint by
far is the long rectangular building immediately south of the geocoded point.
Chatham County / city-data assessor records list Little Hearst Pkwy occupants:
**211 = CORPORATION TARGET (building 2,048,125 sq ft on 6,534,000 sq ft land)**,
202 = IKEA (750,480 sq ft), 111 = Cartage Co. The big building matches Target's
2.0 M sq ft; the adjacent elongated complex to its SE matches the smaller IKEA DC.

**Decisive check:** the perimeter polygon I traced around the big building
computes to **154.3 acres**, essentially identical to the assessor's 6,534,000
sq ft (≈150 acres) for parcel 211. Building identity confirmed.

## 2. Key views

- **z17 over the building** (`t3684_target_z17.png`): the roof fills and overflows
  the entire frame; a continuous dense dock-door band with backed-in trailers
  runs the south face — consistent with a 2 M sq ft import DC.
- **z16 full property** (`t3684_prop_z16b.png`): long rectangular building, long
  axis ~W–E (slightly NW–SE). North side = perimeter road + wide cleared buffer +
  office/employee parking at the NE end. South side = dock apron + a very large
  angled-row drop yard. East = drainage canal/treeline. South & SW = tidal
  marsh and a retention pond.
- **Drop yard z19** (`t3684_swexit_z19.png`): 50+ trailers visible in one crop
  alone across many angled striped rows, plus trailers backed into the south
  docks — confirms 50+ dock band and 50+ drop band.

## 3. Gate / guard-shack determination

- **truckGate = TRUE.** The property is fully fenced behind a continuous
  treeline buffer with a **single** truck entrance on the NE side off Little
  Hearst Pkwy. Street View (pano `cnLRlAnQsxxOWFsZNErvBA`, captured 2025-12,
  heading ~135°) shows the entrance apron with **concrete jersey barriers,
  signage panels, and a kiosk / call-box pole** at the driveway mouth. Trucks
  cannot reach the docks without passing this controlled pinch point. The long
  NE approach drive then wraps to the south truck court (deep stacking →
  `drivewayLong`, `postGateStaging`).
- **guardShack = FALSE (low confidence).** No guard-booth-sized structure could
  be positively resolved. Street View on Little Hearst Pkwy never enters the
  private drive, so the actual check-in point sits **beyond the treeline, out of
  camera reach**; satellite shows no clear booth footprint at the apron. A
  staffed booth set back inside the gate cannot be ruled out — flagged uncertain.
- **remoteGs = TRUE (low confidence).** Complement of gate-present /
  no-visible-shack; the kiosk/call-box pole at the apron implies remote or
  automated check-in. Flagged uncertain with `guardShack`.
- **multiStep = FALSE / scale = FALSE.** No second checkpoint, scale pad, or
  scale house seen in the truck path.

## 4. Yard zones & counts (overhead estimates)

- **Perimeter:** 8-vertex oriented ring tracing the fenced property (treeline /
  marsh / pond edges). **154.3 acres** (matches assessor).
- **Building:** single ~2.0 M sq ft footprint, long axis ~W–E. `buildingCount: 1`.
- **Dock apron:** long thin oriented quad hugging the full south dock wall.
- **Drop yard:** one large oriented quad over the angled trailer rows south of the
  apron. Estimated capacity ~250 trailers; ~160 visible in captured imagery.
- **Truck gate:** small oriented quad at the NE entrance apron.
- **dockDoorCount ≈ 120** (continuous band, ~1000+ ft south face) → band **50+**.
- **railServed = FALSE** — no spur enters the property; road-only port-drayage DC.

## 5. Other classification calls

- **urbanRural = Rural** — edge-of-town industrial park (Port Wentworth) ringed by
  woods, marsh, and a tidal creek; per rubric, edge-of-town industrial = Rural.
  `connectivityIssue = false` (large interstate-adjacent park, coverage fine).
- **entryExitTogether = TRUE** — one entrance point; `entryExitSeparate = false`.
- **entryLanes ≈ 2 / exitLanes ≈ 1** (apron width estimate; striping not
  resolvable — flagged uncertain).
- **fastLaneOpportunity = TRUE** — wide gate apron / spare paved width for a
  bypass lane.
- **multipleFacilities = FALSE** — neighbors (IKEA, others) are separate parcels.
- **shipRcvSeparate = FALSE** — single south-face dock cluster.
- **dropYard = TRUE** — dedicated large trailer-storage yard.

## 6. Web findings

- Target Import Warehouse, 211 Little Hearst Pkwy, Savannah/Port Wentworth GA
  31407; ~2,048,125 sq ft, built 2006 / opened 2007; ~150-acre parcel; handles
  overseas cargo for Target's southeast stores; ~4 mi from Garden City Terminal,
  Port of Savannah. Adjacent IKEA DC at 202 Little Hearst Pkwy (~750k sq ft).

## 7. Final confidence

**HIGH** on building identity, location, perimeter, docks (50+), drop yard
(50+), rural setting, single combined gate, and rail-served=false. The
guard-shack vs. remote-kiosk distinction (`guardShack` / `remoteGs`) and exact
`entryLanes` / `exitLanes` are the only soft calls — the manned entrance sits
behind a treeline outside Street View coverage — and are listed in
`uncertainFields`.

### Probe imagery (under `/c/Users/casey/modex-gtm/tmp/`)
`t3684_z15.png`, `t3684_full_z16.png`, `t3684_prop_z16b.png`,
`t3684_target_z17.png`, `t3684_bottom_z17.png`, `t3684_swexit_z19.png`,
`t3684_entrance_z19.png`, `t3684_sv_ne_135.png` (gate apron),
`t3684_sv_ne_270.png`, `t3684_gatecheck_z19.png`.
