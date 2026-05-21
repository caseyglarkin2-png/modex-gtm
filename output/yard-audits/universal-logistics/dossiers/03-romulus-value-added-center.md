# Deep-Audit Dossier — idx 3

## Universal Logistics / LINC — Romulus Value-Added Center, Romulus MI

**Address:** 29129 Ecorse Rd, Romulus, MI 48174
**Resolved center:** 42.251528, -83.323800
**Type:** Value-Added Logistics Center / Cross-Dock Terminal
**Confidence:** Medium

---

### Location confirmation

The roster coordinate landed squarely on a large multi-building logistics
campus south of Ecorse Rd. Web research (Yellow Pages, Waze, Universal
Logistics hiring posts) confirms Universal Logistics / Logistics Insight Corp
(LINC) operates a value-added logistics and cross-dock terminal at 29129 Ecorse
Rd, Romulus — a 10-K named owned operating property. 2025 Street View along
Ecorse Rd shows the yard packed with XPO Logistics-, LINC Logistics- and
Universal-branded trailers behind a chain-link fence. Positively identified.

### Key views

- **Wide satellite (z16-17):** A sprawling, trailer-dense campus — several long
  narrow cross-dock buildings plus extensive trailer-storage yards, including a
  separate large gravel trailer yard south of a drainage ditch.
- **Mid (z18-20):** The buildings are classic LTL-style cross-docks — long and
  narrow, with continuous dock-door banks and trailers backed in along BOTH
  long faces, separated by drive lanes.
- **Entrance (z19-21):** A single wide controlled opening in the perimeter
  fence off Ecorse Rd, with jersey-barrier lane control and a canopy/structure
  along the entry drive; car/employee parking beside it.
- **Street View (Ecorse Rd, 2025):** Continuous chain-link perimeter fence the
  full length of the road frontage with trailers parked behind it; the wide
  entrance gap is visible at the west end of the frontage.

### Gate / guard-shack determination

- **truckGate = true.** The whole campus is fenced (2025 Street View confirms
  continuous chain-link fence along the entire Ecorse Rd frontage). Truck
  access is through a single wide, controlled opening with jersey-barrier lane
  control. A Universal "Gate Clerk" job posting at this exact address confirms
  an active gate-check function.
- **guardShack = false / remoteGs = true.** No standalone guard booth cleanly
  resolves at the opening, though a small canopy structure sits along the entry
  drive. The gate-clerk function is most likely run from a kiosk / check-in
  point. Both calls flagged low-confidence in uncertainFields.
- **multiStep = false.** No clear second checkpoint stage after the gate.

### Yard zones and counts

- **Perimeter:** ~95 acres for the fenced campus including the southern gravel
  trailer yard.
- **Dock doors:** several long narrow cross-dock buildings, each with dock
  banks on both long faces → estimated ~200+ doors → 50+ band.
- **Drop yards:** the entire campus is effectively a drop yard — hundreds of
  trailers parked in marked rows across multiple lots, including a large gravel
  storage yard south of the drainage ditch → dropArea 50+, dropYard = true.
- **Staging / driveway:** a large open apron between the gate and the dock
  buildings holds long truck queues → postGateStaging = true, drivewayLong =
  true.
- **multipleFacilities = true:** ~6 distinct cross-dock/warehouse buildings
  plus separate satellite trailer yards.
- **shipRcvSeparate = false:** cross-dock buildings load and unload from both
  faces of the same building — not a separated ship-vs-receive layout.
- **fastLaneOpportunity = true:** the wide entrance and very large yard apron
  leave ample room for an express/bypass lane.
- **Rail:** no spur enters the property → railServed = false.

### Web findings

Yellow Pages / Waze / D&B: shared Universal Logistics & Logistics Insight Corp
facility at 29129 Ecorse Rd. Universal Logistics Facebook/Indeed posts
advertise forklift operators, dock workers and a Gate Clerk for the Romulus
location — consistent with an active LTL/cross-dock terminal with a staffed
gate-check function.

### Final confidence

**Medium** — facility and operator positively confirmed, layout very clear
from strong imagery and 2025 Street View. Confidence held at medium because
the precise gate-control structure (kiosk vs. shack), exact lane counts and the
exact dock-door total cannot be pinned from imagery and are estimated.
