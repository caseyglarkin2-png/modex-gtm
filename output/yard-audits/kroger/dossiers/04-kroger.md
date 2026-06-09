# Deep-Audit Dossier — Kroger Grocery Distribution Center, Nashville TN (idx 04)

**Facility:** Kroger Fulfillment Network LLC — 1116 Polk Ave, Nashville, TN 37210
**Type:** Grocery Distribution Center (Ocado-linked grocery e-commerce / last-mile fulfillment spoke)
**Resolved center:** 36.13690, -86.74270
**Confidence:** high
**Method:** deep-audit (satellite + Street View + web)

---

## Step 0 — Location confirmation

The supplied coordinates (36.136908, -86.742513) landed directly on the target
building. Web search confirmed 1116 Polk Ave, Nashville TN 37210 is the Kroger
Fulfillment Network facility — a grocery e-commerce / last-mile delivery spoke
that works with the Atlanta Ocado fulfillment center (publicly described as a
~40,000 SF leased footprint, designed for ~180 jobs). Note: Kroger filed a WARN
notice for a permanent closure of this site effective 2026-02-01 (132 employees);
this audit reflects 2025-09 imagery while the site was still operating.

Identity was confirmed in Street View (pano dated 2025-09): the west office
front carries Kroger blue signage, and rows of Kroger-blue delivery vans are
parked along the east side and backed into the south dock face. The building is
a long multi-tenant warehouse; Kroger occupies the west/central portion.

Imagery used (saved under `tmp/`): `k04-wide-z17.png`, `k04-z18.png`,
`k04-z19.png`, `k04-z20.png`, `k04-context-z18.png`, `k04-bldg-z18.png`, and
Street View frames `k04-sv-entr-60.png`, `k04-sv-90.png`, `k04-sv-30.png`,
`k04-sv-ne.png`, `k04-sv-sw.png`.

---

## Layout

- Long warehouse running roughly E-W, with a slight clockwise rotation (long
  axis bears ~100°/280°); footprint measured ~250 m x ~34 m.
- **West end** = office front facing the road-side parking/apron.
- **South face** = the dock bank, doors with delivery vans / box trucks backed in.
- **South yard** = large open paved/gravel area between the dock face and the
  rail line — used for van/truck staging.
- **SE edge** = a mainline rail corridor borders the property; parked trailers
  and railcars there belong to the adjacent property, NOT a Kroger spur.
- **SW edge** = the public road (Polk/Foster Ave corridor) — the only frontage.

---

## Gate / guard-shack / dock determinations

- **Truck gate: FALSE.** The property opens directly onto the public road via a
  wide, fully open paved apron. Street View (heading 30°/90°, 2025-09) shows the
  approach controlled only by orange traffic cones laid across the apron — there
  is no barrier arm, no swing/sliding gate across any truck lane, and no
  checkpoint pinch-point. Walking the road NE and SW (`k04-sv-ne`, `k04-sv-sw`)
  showed no controlled entrance anywhere along the frontage.
- **Guard shack: FALSE.** No booth structure of any kind at the road edge or on
  the apron, confirmed across multiple Street View headings.
- **Remote GS: FALSE.** There is no gate, so no remote-check-in inference.
- **Driveway short: TRUE.** The building sits roughly one apron-depth (1-2 truck
  lengths) back from the road; vehicles reach the dock face / van staging almost
  immediately. Driveway-long is false.
- **Backup-sensitive: FALSE.** The apron is large and open with abundant
  stacking room; a queue would not spill onto the road.
- **Entry/exit together: TRUE** (single open frontage access point). Separate:
  false. Entry/exit lanes: null — access is an uncontrolled open apron with no
  marked lanes.
- **Dock doors: 10-25.** The south face shows ~14-18 dock bays in tight z19/z20
  imagery, several occupied by Kroger vans / box trucks. Estimated from overhead
  (flagged).
- **Drop area: 0-10 / drop yard: FALSE.** This is a van-based last-mile spoke,
  not a 53'-trailer DC. Only a few trailers/box trucks sit in the south yard;
  there is no dedicated trailer-storage lot for this tenant.
- **Ship/rcv separate: FALSE** — single dock bank on the south face.
- **Scale: FALSE**, **multiStep: FALSE**, **multipleFacilities: FALSE**.
- **Urban/rural: URBAN** — dense Nashville industrial fabric near the Foster Ave
  corridor. Connectivity issue: false.

---

## Yard zones and counts

- **Perimeter** — 8-vertex oriented ring tracing the operational property
  (building + south yard) inside the road on the SW and the rail on the SE.
  Computed area ≈ **15.3 acres**.
- **truckGate** — oriented quad over the open road apron at the SW frontage
  (the de-facto, uncontrolled entrance). Street View pano `x1m2EKPQ-HezeIOfVwybXw`
  (2025-09), heading 285° toward the apron.
- **dockApron** (1) — long thin quad hugging the south dock wall at the
  building's angle.
- **dropYard** (1) — the open paved south yard used for van/truck staging.
- **streetViewMeta.perimeter** — pano `Yja1It9jk5M1KjnB3OVoXw` (2025-09),
  heading 99° toward the building front.

### yardMetrics
- dockDoorCount: 16 (est.) · trailersVisible: 6 · trailerParkingCapacity: 10
- truckGateCount: 1 · buildingCount: 1 · siteAreaAcres: 15.3 · railServed: false

---

## Web findings

- Kroger Fulfillment Network spoke at 1116 Polk Ave, ~40,000 SF leased, Ocado /
  Atlanta-fulfillment linked, designed for ~180 jobs (2022 launch).
- WARN notice: permanent closure effective 2026-02-01, 132 employees affected.
- Operation is grocery e-commerce last-mile (delivery vans), which matches the
  van fleet and short open-apron layout seen in imagery.

Sources: kroger.com store page, REBusinessOnline (40,000 SF), Kroger IR / PRNewswire
(2022 expansion), TN TDLWD WARN letter, NewsChannel5 / WSMV / Progressive Grocer
(2026 closure).

---

## Final confidence: HIGH

Building identity and gate/guard-shack determinations are unambiguous from clear
2025-09 Street View plus high-zoom satellite. Dock-door and drop-area counts are
honest overhead estimates and are flagged in `uncertainFields`.
