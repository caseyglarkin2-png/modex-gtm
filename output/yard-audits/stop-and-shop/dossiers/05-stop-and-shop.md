# Deep-Audit Dossier — Stop & Shop / ADUSA Grocery DC, Bethlehem PA (idx 05)

**Facility:** Stop & Shop Grocery Distribution Center Bethlehem PA
**Type:** Grocery Distribution Center
**Address:** 4820 Hanoverville Road, Bethlehem (Lower Nazareth Township), PA 18020
**Resolved center:** 40.686742, -75.369157
**Confidence:** High
**Method:** deep-audit (satellite probe z15–z20 + Street View + web research)

---

## Step 0 — Location confirmation

The supplied coordinates (40.687688, -75.364725) geocode exactly to the **4820
Hanoverville Rd** address point (Google rooftop geocode returned
40.6876879, -75.3647246 — an exact match), which sits at the southeast/east end
of the target building.

Web research confirms 4820 Hanoverville Rd is the **former C&S Wholesale Grocers
dry-grocery distribution center, ~1.2–1.3 million sq ft**, converted in Feb 2022
into ADUSA Supply Chain's self-managed network. It now receives, selects and
ships ~200M cases/yr of nonperishable grocery for 210+ Stop & Shop and The GIANT
Company stores; ~700 on-site associates. This is the correct facility and the
single largest building in the Hanoverville Rd / Lehigh Valley warehouse cluster.

The supplied point is at the building corner; I locked the building centroid at
40.686742, -75.369157. The neighboring big buildings (4770 Hanoverville to the
east — confirmed by its "4770" monument sign in Street View; the DCs to the SE)
are separate properties and were excluded.

## Steps 1–3 — What the imagery showed

**Building (footprint ~31 acres / ~1.3M sq ft).** A single very large rectangular
high-bay DC, long axis running SW–NE, rotated roughly 25–30° clockwise from
E–W. Roof footprint measured ~700 m × ~120–170 m via pixel-segmented oriented
bounding box. Footprint area (~31 acres) is consistent with the published
1.2–1.3M sq ft floor area (high-bay / multi-level pick).

**Docks (band: 50+).** Continuous banks of loading-dock doors with trailers
backed in run along **both** long walls — the NW face (z19 `ss-nw-face` shows a
near-unbroken row of dock doors + a second staged trailer row) and the SE face
(z18 `ss-south-entrance` / z20 `ss-yard-neck` show another long door bank with
yellow-striped aprons). Total well over 100 doors. Docks on two opposing faces
indicate physically separate shipping vs receiving clusters → `shipRcvSeparate`.

**Trailer drop yard (band: 50+ / `dropYard` true).** A dedicated trailer-storage
lot on the NW side (z18 `ss-trailer-yard`, z19 `ss-yard-gate`) holds dense rows
of 100+ parked trailers — a true drop yard separate from active dock staging.

**Layout / circulation.** Auto/employee parking is concentrated at the NE end and
along the east side near a water tower. A wide internal truck court wraps the
building; trucks have a long, deep approach to the docks (`drivewayLong`).

## Step 2 — Gate / guard-shack determination (rigorous)

**truckGate: FALSE.** No barrier arm, sliding/swing gate, or pinch-point
checkpoint exists where the property meets the public road. Access is via the
shared business-park road network off **Hanoverville Rd through open, signalized
intersections** (Street View `ss-sv-int-ne`/`ss-sv-drive-in` show traffic signals
and open campus entries, no arm). The building's own truck courts open directly
off the internal road with no gate at the pinch points (checked the E court
entry, the trailer-yard neck, and the SW court — all open).

**guardShack: FALSE.** No staffed booth (1–3-space footprint, multi-side windows)
at any access point across satellite z18–z20 and ~10 Street View frames. The only
small structure near the south frontage is a **private residence** (house with a
swimming pool) on the far side of Hanoverville Rd (z19 `ss-gate-sw`) — not a
guard booth.

**remoteGs: FALSE** (no gate → no remote-gate kiosk concept applies).

The two driver's-eye Street View frames at the perimeter and truck-court entrance
(both 2024-07 panos) look across a deep grassed/treed buffer to the building and a
monument sign — confirming the open, ungated character.

## Step 4 — Web findings

- ADUSA Supply Chain press release / Progressive Grocer / Food Trade News:
  1.2M sq ft, ~200M cases/yr, 210+ Stop & Shop + The GIANT Company stores,
  former C&S facility, converted Feb 2022, ~700 associates, C&S retained as
  third-party labor-management provider.
- LoopNet / CoStar-type listings list 4820 Hanoverville Rd at ~1.3M sq ft and
  place it in Lower Nazareth Township within the Lehigh Valley industrial market.
- A separate rail-served tank/silo complex sits north of the property; the rail
  spur serves that operation, **not** the 4820 DC (no rail enters this property).

## Step 6 — Geofences & yard metrics

All geofences are oriented polygons traced to the building's true ~25–30° angle
(north-aligned boxes would miss the fence line). Building OBB derived by
segmenting the dark roof and fitting a rotated bounding box; perimeter, drop
yard, and the two dock aprons traced by hand against a pixel-accurate z16 frame
and verified by overlay.

- **perimeter** — whole fenced property (building + truck courts + NW trailer
  yard + NE parking), excludes the adjacent farm field. ~104.5 acres.
- **truckGate** — the east truck-court approach off the internal road (best proxy
  for the main truck entrance; note there is no physical gate structure there).
- **dropYards[0]** — NW trailer-storage lot.
- **dockAprons[0]** — NW dock-wall apron strip; **dockAprons[1]** — SE dock-wall
  apron strip; both run parallel to their respective walls at the building angle.
- **streetViewMeta** — perimeter pano `itriHdfD9lzm2y62ZFpYTA` (heading 337°),
  truckGate pano `qJlF9ElT_txQpyLddDEF6Q` (heading 342°); both 2024-07, OK.

**yardMetrics (honest overhead estimates):**
- dockDoorCount ≈ 140 (both long faces; 50+ band)
- trailersVisible ≈ 180; trailerParkingCapacity ≈ 220
- truckGateCount 1 (single main truck approach, ungated)
- buildingCount 1
- siteAreaAcres 104.5 (from perimeter polygon)
- railServed false

## Classification summary

Open/ungated, high-throughput grocery DC. No truck gate, no guard shack, no truck
scale, no second checkpoint. Long deep internal driveway, ample post-gate-style
internal staging, dual-face docks (50+, ship/rcv separate), and a large dedicated
drop yard (50+). Single building; rural/edge-of-town setting (Lower Nazareth
Twp). Confidence **high**; `postGateStaging` and `shipRcvSeparate` flagged as the
only inferred (uncertain) calls.

### YardFlow read
A big, busy, **completely ungated** grocery DC: 140± doors, ~180 trailers on the
ground, a dedicated 100+ trailer drop yard, and no booth or arm controlling
arrivals. That is the classic profile where there is zero gate-side visibility
into who is on the yard or where trailers sit — high-value for a yard-management
check-in / trailer-tracking deployment.
