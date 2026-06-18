# US PL Los Angeles Factory — Deep Audit Dossier

**Site idx:** 25 · **Slug:** `us-pl-los-angeles-factory`
**Type:** Bottling plant (PL)
**Operator:** Primo Brands (formerly BlueTriton / Nestlé Waters — Arrowhead Mountain Spring Water)
**Resolved address:** 1566 E Washington Blvd, Los Angeles, CA 90021
**Resolved coords:** 34.02055, -118.24499
**Maps:** https://www.google.com/maps/@34.02055,-118.24499,400m/data=!3m1!1e3

---

## OPERATIONAL STATUS — ACTIVE (the #1 question)

This was a **blank-flag entry** on the BlueTriton facility list, and the prompt
flagged it as a possible closed/demolished/sold site (BlueTriton/Primo closed
several such plants). **It is not closed — it is operational.**

- **What it is:** the historic **Arrowhead / Nestlé Waters Los Angeles bottling
  plant**, now owned by **Primo Brands** (BlueTriton + Primo Water merged Nov
  2024). A state-of-the-art plant opened in **1917** at Washington Blvd &
  Compton Ave and has bottled Arrowhead for **100+ years** — "one of the oldest
  continuously operating manufacturing facilities in L.A." (PBS SoCal, *Lost LA*).
- **Live evidence (Oct-2025 Street View, pano `EpKRc0zekfxg0iXXea__xw`):** a
  **"PRIMO" building sign**, the **"1566"** office building, white **process
  water tanks / silos**, an American flag flying, a current **health-grade "A"
  placard** mounted at the entrance, a wide **active sliding security gate**, and
  a **ReadyRefresh delivery-fleet yard** full of box trucks plus rows of
  **stacked palletized bottled-water product**.
- **The 2024 shutdown news is a red herring:** the U.S. Forest Service order
  ("must cease operations") applied only to BlueTriton's **Strawberry Creek /
  San Bernardino National Forest spring pipeline** (the water *source*), NOT
  this LA bottling/distribution plant, which runs on LADWP municipal water plus
  trucked-in spring water.

**Operational verdict: OPERATIONAL / ACTIVE.**

---

## How the location was confirmed

No coordinates were supplied. Research chain:
1. WebSearch established a real, long-running Arrowhead/Nestlé/Primo LA bottling
   plant at **Washington Blvd & Compton Ave** (PBS SoCal *Lost LA*; BBB & D&B
   business profiles).
2. The Primo/BlueTriton corporate address of record is **1566 E Washington
   Blvd, LA 90021**.
3. Google geocoding of that address → **34.0205477, -118.2449874**, landing
   dead-center on a large industrial complex.
4. Street View at that point shows the literal **"1566"** building number and
   **"PRIMO"** signage — positive ID, no ambiguity.

---

## What each key view showed

- **z16/z18 overview:** dense downtown-LA industrial block (ZIP 90021), rail/I-10
  corridor to the N along Washington Blvd, residential blocks to the S/W. The
  Primo complex fills most of one block.
- **z18/z19 yard:** a campus of connected buildings — bottling plant with process
  tanks/silos (W), the 1566 office (NE), a central warehouse/load building, and a
  west building over the fleet lot. A large internal paved yard holds rows of
  **stacked shrink-wrapped product pallets** and a **fleet of white delivery
  box trucks/vans** plus over-the-road trailers.
- **z20 yard:** clear delivery-fleet rows (diagonal + straight parking) and
  trailer storage — the ReadyRefresh distribution operation co-located with the
  plant.
- **Street View (Washington Blvd frontage, Oct 2025):** the controlled entrance —
  wide black sliding gate, perimeter wall + fence with barbed wire, blue
  directional/check-in sign panel at the gate, PRIMO sign, tanks, flag, "A" grade.

---

## Gate / guard-shack / dock determinations (with evidence)

- **truckGate = TRUE** — wide black **sliding security gate** across the
  truck/yard driveway on E Washington Blvd, in a fenced/walled perimeter
  (Street View, Oct 2025).
- **guardShack = FALSE** — no staffed booth (1–3 vehicle footprint, multi-side
  windows) at the gate. Control is the sliding gate + a mounted signage panel.
- **remoteGs = TRUE** — gate present, no guard shack → implies kiosk / call-box /
  buzzer / app self-check-in (the mounted sign panel at the gate fits).
- **dockDoors = "10-25"** — a bank of loading bays on the warehouse face fronting
  the internal courtyard; honest estimate ~14. **Soft number** — the
  interior-courtyard orientation and dense urban roofs hide some faces.
- **dropArea = "10-25" / dropYard = TRUE** — dedicated trailer + delivery-fleet
  storage along the S/W perimeter and interior rows (~18 trailers/vans visible).

---

## Yard zones & counts measured

- **perimeter** — the fenced ~8-acre block (~212 m N–S × ~157 m E–W), traced as a
  parallelogram aligned to Washington Blvd.
- **truckGate** — small quad over the Washington Blvd sliding-gate driveway.
- **dropYards** — one ring over the southern internal fleet/trailer lot.
- **dockAprons** — one ring over the dock-face strip fronting the central yard.
- **streetViewMeta** — gate pano `EpKRc0zekfxg0iXXea__xw` (2025-10), heading ~200°
  (camera from Washington Blvd toward the gate) used for both perimeter and
  truckGate (interior centroid has no Street View coverage).

**yardMetrics:** dockDoorCount ~14, trailersVisible ~18, capacity ~40,
truckGateCount 1, buildingCount 4, siteAreaAcres ~8.0, railServed false.

**Other classification notes:** Urban; **backupSensitive TRUE** (gate opens onto
busy Washington Blvd with minimal apron stacking → a queue spills to the street);
**drivewayShort TRUE** (gate right at the street, interior yard immediately
behind); **postGateStaging TRUE** (internal yard); **multipleFacilities TRUE**
(multi-building campus); **railServed FALSE** (rail runs along the road, no spur
into the property); **scale FALSE**; **multiStep FALSE**.

---

## Web findings

- PBS SoCal, *Lost LA* — "How Mountain Spring Water Became Big Business in Old
  Los Angeles": 1917 plant at Washington Blvd & Compton Ave; one of the oldest
  continuously operating manufacturing facilities in L.A.; Arrowhead still
  top-selling LA bottled-water brand.
- BBB / D&B business profiles — BlueTriton Brands, **1566 E Washington Blvd, Los
  Angeles, CA 90021**.
- KTLA / Seattle Times / Newsweek (2024) — USFS ordered BlueTriton to cease the
  **Strawberry Creek pipeline** in San Bernardino National Forest (the *source*,
  not this plant).
- Primo Brands / BlueTriton merger (Nov 2024) — company now Primo Brands; matches
  the "PRIMO" signage on-site.

---

## Confidence

**HIGH.** Operational status, exact location, truck gate, no guard shack, urban
setting, drop yard, and multi-building campus are all directly confirmed by sharp
2026 satellite + Oct-2025 Street View + corroborating web sources. The only soft
fields are the exact **dock-door count / band** and **ship-vs-receive
separation**, which the dense interior-courtyard layout obscures from overhead —
flagged in `uncertainFields`.
