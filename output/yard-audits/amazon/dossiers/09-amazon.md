# Deep-Audit Dossier — Amazon MDW2 Fulfillment Center, Joliet IL (idx 09)

**Facility:** Amazon MDW2 Fulfillment Center
**Type:** Fulfillment Center
**Address:** 250 Emerald Dr, Joliet, IL 60433
**Resolved center:** 41.48334, -88.07153
**Maps (sat):** https://www.google.com/maps/@41.48334,-88.07153,400m/data=!3m1!1e3
**Confidence:** high
**Method:** deep-audit (satellite z16–z21 + Street View 2025-05/06)

---

## Step 0 — Location confirmation

The supplied coordinates (41.483289, -88.071143) landed squarely on the correct
building. Confirmed three ways:

1. **Address / web.** 250 Emerald Dr, Joliet IL 60433 is MDW2, inside the
   CenterPoint Intermodal Center (North America's largest inland port), minutes
   from I-55/I-80. Multiple directories (youramazonguy, fbanearme, Apple Maps,
   Waze "MDW2 entrance for trucks") agree on the address.
2. **Satellite.** A single very large rectangular distribution building, long
   axis roughly N–S with a slight east-leaning tilt, dock doors and backed-in
   trailers along both long faces — consistent with a ~1M sq ft fulfillment
   center, not an office.
3. **Street View branding (decisive).** Ground panos on the north access road
   show the building wall with the **Amazon "fulfillment" / Prime smile logo**
   (sv_road_w_ne, sv_gate_booth). This is unambiguously the Amazon building.

Neighboring large buildings to the west and north are separate tenants and were
excluded.

---

## Key views

- **mdw2_full16 / mdw2_ctr17** — whole site: MDW2 center, employee parking +
  truck court to the north, west drop yard, east apron, Emerald Dr to the south,
  perimeter road and grass buffer to the east.
- **mdw2_z18 / mdw2_eastedge** — dock doors with backed-in trailers along the
  **west** long wall and the **east** long wall (two distinct dock banks).
- **mdw2_northentry / mdw2_gate_z20 / mdw2_gate_z21 / mdw2_gate_final** — the
  gated truck entrance off the north access road.
- **mdw2_booth_z21b / mdw2_booth_z21c** — numbered trailer staging stalls
  (402–410+ painted) in the post-gate truck court.
- **mdw2_nw (NW herringbone drop yard)** — dense angled trailer storage between
  MDW2 and the west building.
- Street View: sv_road_w_ne, sv_gate_dead, sv_gate_booth, sv_perimcentroid,
  sv_swdrive_* — fence line, gate, branded wall.

---

## Gate / guard-shack / dock determinations

**Truck gate — TRUE.** The main truck entrance is on the **north** access road
(not Emerald Dr directly). z21 satellite at 41.4858,-88.0716 shows a
black/white **striped barrier line across multiple gate lanes**, gate-arm
posts, hatched approach pavement, and a **chain-link perimeter fence** running
the property frontage. Street View (pano hf5GHdqeCiB5yrOdWqgVCQ, 2025-05)
confirms the fence and gated opening with trailers behind it. This is a
controlled, manned checkpoint — not an open driveway.

**Guard shack — TRUE.** A small **white-roofed booth (~1–2 car footprint) with
a dark canopy sits on the gate island between the entry/exit lanes** at
~41.4860,-88.0714 (mdw2_gate_final z21). Footprint, position beside the barrier,
and canopy are the signature of a staffed guard shack. Because a physical shack
is present, `remoteGs = false`.

**Docks — 50+.** Dock doors line **both** long walls (west and east) with
trailers backed in along each; total comfortably exceeds 100 doors. The two
opposing dock banks support `shipRcvSeparate = true` (medium confidence from
overhead).

**Drop yard — TRUE / 50+.** Two large drop/staging areas:
1. A **herringbone trailer drop yard** NW, between MDW2 and the neighboring
   building (mdw2_nw) — packed with angled trailers.
2. The **post-gate truck court** north of the building with numbered staging
   stalls (mdw2_booth_z21b).
Combined trailer presence is in the hundreds (band 50+).

**Staging.** `postGateStaging = true` — the numbered staging court sits inside
the gate, before the dock faces. No dedicated pre-gate apron on the public road,
so `preGateStaging = false`.

**Driveway depth.** `drivewayLong = true` — the gate-to-dock run across the
north truck court easily holds a 3+ truck queue.

**Lanes / fast lane.** Multi-lane gate apron; estimated ~2 in / ~2 out sharing
one gate complex (`entryExitTogether = true`). Generous unused paved width at
the gate supports an express bypass, so `fastLaneOpportunity = true`.
(entry/exit lane split is the main low-confidence call — flagged.)

**No scale, no rail, single building, not a campus.** No truck-scale pad in the
truck path (`scale = false`); no rail spur enters the parcel (`railServed`,
intermodal rail is elsewhere in CenterPoint); one building (`buildingCount = 1`,
`multipleFacilities = false`); no second post-gate checkpoint (`multiStep =
false`).

**Urban/Rural — Rural.** Edge-of-town CenterPoint industrial park: farmland and
residential homes immediately south across Emerald Dr (sv_road_n showed homes +
a water tower), open grass parcels east. Per the rubric's tie-break, this is
Rural. Not isolated — carrier coverage is fine, so `connectivityIssue = false`.

---

## Yard zones & geofences

Oriented polygons traced to the real lot (building/lot is near-N–S with a slight
east tilt; rings follow that orientation, not north-aligned boxes):

- **perimeter** — fenced truck-side operation (building + drop yards + truck
  court + dock aprons), 4-corner oriented quad. ~31.6 acres. The full deeded
  parcel including the eastern grass buffer is larger.
- **truckGate** — quad over the north gate island / lane group.
- **dropYards[0]** — NW herringbone trailer drop yard.
- **dropYards[1]** — north numbered staging court.
- **dockAprons[0]** — long thin strip hugging the **west** dock wall.
- **dockAprons[1]** — long thin strip hugging the **east** dock wall.
- **staging** — post-gate holding strip just inside the gate.

### yardMetrics (overhead estimates)
- dockDoorCount ≈ 120 (both long walls; 50+ band)
- trailersVisible ≈ 140 (across drop yard + court + aprons in captured imagery)
- trailerParkingCapacity ≈ 260
- truckGateCount = 1
- buildingCount = 1
- siteAreaAcres ≈ 31.6
- railServed = false

### streetViewMeta
- **truckGate** — pano `hf5GHdqeCiB5yrOdWqgVCQ` (2025-05) @ 41.48551,-88.07161,
  heading 5° (camera looks north toward the gate). This is the driver's arrival
  frame.
- **perimeter** — pano `Cxh1mjZ1NjW5Nb4KuxYKpw` (2025-05) @ 41.48373,-88.06940
  on the east perimeter road, heading 269° (looks west across the yard toward
  the building).

---

## Web findings

- MDW2 = 250 Emerald Dr, Joliet IL 60433; CenterPoint Intermodal Center;
  operates 24/7; serves Joliet/Will County and greater Chicagoland.
- Sometimes labeled an Amazon "cross-dock"/sortable FC in directories; the
  on-the-ground signage reads Amazon fulfillment/Prime. Building layout (docks
  on two faces, large drop yards) is consistent with high-throughput FC + yard
  operations — a strong YardFlow fit.

Sources: youramazonguy.com (MDW2 address), fbanearme.com, Apple Maps, Waze
(MDW2 truck entrance), flexfulfillment.eu, warehouse.ninja.

---

## Confidence

**High.** Building positively identified by Amazon signage in Street View; gate,
guard shack, fence, dock banks, and drop yards all confirmed in z20–z21
satellite plus 2025 Street View. Low-confidence items (flagged in
`uncertainFields`): exact entry/exit lane counts and the ship/receive-separate
inference, both reasoned from overhead geometry.
