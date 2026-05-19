# Deep-Audit Dossier — idx 15

## Kenco LIXIL Americas DC — Groveport, OH

**Facility type:** Dedicated Distribution Center (~906,000 SF, LIXIL Americas)
**Resolved location:** 3099 Rohr Road, Groveport, OH 43125
**Locked center coordinate:** 39.83950, -82.91820 (west building of the two-building DC)
**Gate verdict:** NO truck gate (open access)
**Guard-shack verdict:** NO guard shack
**Confidence:** High

---

### Step 0 — Locating the facility

The roster supplies `ROOFTOP`-precision coordinates (39.841255, -82.919529) for the
Kenco LIXIL Americas DC at 3099 Rohr Road, Groveport, OH 43125. Web research confirmed
this is the **~906,000 SF LIXIL Americas distribution center managed by Kenco**, per the
BusinessWire / Kenco announcement (May 2024) and BBB/Waze Groveport listings.

A zoom-18 probe at the exact roster coordinate showed it pins the **NW corner** of a
large tan-roofed building. The DC is a **two-building tan-roofed complex** in the
Rickenbacker / Groveport logistics hub southeast of Columbus; the roster coordinate sits
on the west building, which was locked as the primary facility (center ~39.8395,
-82.9182). Both buildings form the ~906,000 SF facility.

### Steps 1–3 — Key views

- **Site overview (z16/z17):** Two large tan-roofed Class A logistics buildings running
  NW-SE, set in a dense logistics park. The west building is the roster-coordinate
  target; an identical-looking twin sits immediately to its east.
- **Dock faces (z18):** Continuous dock-door banks with many trailers backed in on
  **both** long faces (SW and NE) of the west building — a cross-dock configuration. The
  SW face alone shows 25+ trailers; a parallel row of parked trailers forms a drop yard.
- **Truck entrance (z19 + Street View, capture 2024-08):** Access driveways leave Rohr
  Road as wide, fully open paved drives — **no barrier arm, no gate, no guard booth, no
  kiosk**. The office front is a blue/white glass curtain wall with car parking on the
  north side. Drive aisles between the two buildings are open.
- **Drop yards:** Large trailer drop yards along both dock faces and in the central
  aisle between the two buildings, 70+ trailers parked.

### Step 4 — Web findings

- LIXIL Americas selected Kenco to manage its 906,000 SF Groveport, OH distribution
  center; the facility ships 5M+ items/year (water fixtures, fittings, bathing and
  repair parts). Address confirmed as 3099 Rohr Rd, Groveport, OH 43125.
- Kenco also manages LIXIL's Hutchins, TX DC; the Groveport site handles the majority of
  LIXIL's distribution volume.

### Step 5 — Classification rationale

- **truckGate / guardShack / remoteGs = false / false / false** — open access drives off
  Rohr Road, no checkpoint structure of any kind. With no gate, remoteGs is false.
- **shipRcvSeparate = true** — cross-dock building, dock banks on both opposite long
  faces.
- **dockDoors = "50+", dropArea = "50+", dropYard = true** — long two-face dock banks
  plus large dedicated trailer drop yards.
- **drivewayLong = true, postGateStaging = true** — deep aprons and yards hold long
  truck queues.
- **multipleFacilities = true** — the LIXIL DC is a two-building tan-roofed complex.
- **entryExitSeparate = true** — multiple separate Rohr Road drive connections.
- **fastLaneOpportunity = true** — wide aprons and drives leave room for an express lane.
- **urbanRural = "Urban"** — Groveport is a Columbus OH metro suburb in the Rickenbacker
  logistics hub, dense industrial fabric.
- **connectivityIssue = false** — a cell tower stands adjacent on Rohr Road; coverage is
  strong.
- **railServed = false; scale = false; multiStep = false; backupSensitive = false.**

### Yard zones & counts

- **Perimeter:** the LIXIL DC's developed parcel (both buildings, aprons, drop yards) —
  ~70 acres.
- **truckGate zone:** the open NE access drive off Rohr Road.
- **dropYards:** SW-face trailer yard + central-aisle trailer yard.
- **dockAprons:** SW dock apron + NE dock apron.
- **yardMetrics:** ~90 dock doors (est., cross-dock), ~75 trailers visible, ~160 trailer
  parking capacity, 2 truck-access points, 2 buildings, ~70 acres, not rail-served.

### Final confidence

**High.** Facility positively confirmed by street address and the May 2024 LIXIL/Kenco
announcement; the `ROOFTOP`-accurate roster coordinate was verified on current satellite
and Street View imagery. Only the overhead count estimates are listed in
`uncertainFields`.
