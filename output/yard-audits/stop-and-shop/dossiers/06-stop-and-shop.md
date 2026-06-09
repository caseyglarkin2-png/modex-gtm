# Deep-Audit Dossier — Stop & Shop Frozen DC, Plainville CT (idx 6)

**Operator:** Americold (automated frozen warehouse) for Ahold Delhaize / ADUSA Supply Chain
**Serves:** Stop & Shop and Hannaford, US Northeast
**Address:** 24 Northwest Drive, Plainville, CT 06062
**Resolved center:** 41.69255, -72.85825
**Maps (sat):** https://www.google.com/maps/@41.69255,-72.85825,400m/data=!3m1!1e3
**Confidence:** high
**Method:** deep-audit (satellite probe + Street View + web)

---

## Step 0 — Facility confirmation

The supplied coordinates (41.693397, -72.858617) landed directly on the correct
building. Positive identification:

- Satellite (z17/z18) shows a single very large white-roofed industrial building
  with a tall high-bay block casting a long shadow — consistent with a 130 ft
  automated ASRS frozen warehouse, not an office.
- Street View (2024-10) shows the **AMERICOLD** logo on the tall building and a
  **"24"** address marker on the east wing — confirming 24 Northwest Drive.
- Web research confirms this is the Ahold Delhaize / Americold fully-automated
  frozen warehouse (~130 ft tall, 230K+ sq ft, 30K+ pallet slots, Bloom Energy
  fuel cells) serving Stop & Shop and Hannaford. Operations have begun.

No relocation needed; the roster coordinates were rooftop-accurate.

---

## Key views

- **z17/z18 overview** — single building oriented ~20-25° clockwise of north
  (long axis NW-SE). Drop yard of trailers to the NW; dock bank on the SW/west
  wall; office and employee parking on the NE/east end; Northwest Drive along the
  north edge; woods/wetland to the east and south.
- **z19 west wall** — clear row of dock doors with trailers backed in under dock
  canopies; employee parking inboard.
- **z18/z19 NW** — large drop yard packed with trailers in long diagonal rows.
- **z19/z20 east end** — divided in/out access road around a landscaped median
  where the property drive meets Northwest Drive (the main entrance throat).
- **Street View (2024-10)** — continuous chain-link perimeter fence along the
  entire Northwest Drive frontage (employee side, drop-yard side, east elevation).

---

## Gate / guard-shack / dock determinations

- **Truck gate: TRUE.** The whole property is enclosed by a continuous chain-link
  perimeter fence (confirmed in multiple Street View frames). The single main
  truck/visitor entrance is a divided in/out drive around a center median at the
  SE/east end (~41.6929, -72.8567), a controlled fenced pinch-point.
- **Guard shack: TRUE (flagged uncertain).** Americold staffs a dedicated
  **Gate Guard** role at its facilities (job posting: opens gates for truckers,
  checks credentials / approved roster before admitting through the gate). The
  Street View car never enters the private divided drive, so the booth structure
  is not pixel-confirmed — the booth sits inside the entry throat past the
  fence. Guarded entry is called on the operational + entrance-geometry evidence;
  `guardShack` is listed in `uncertainFields` because the structure itself is not
  directly resolved.
- **Remote GS: FALSE** — staffed guard present, not a kiosk/app-only check-in.
- **Dock doors: 25-50.** ~30-35 doors counted along the SW/west wall, several
  with trailers backed in.
- **Ship/Rcv separate: FALSE** — a single dock bank on the west face.

---

## Yard zones & counts

- **Perimeter** — oriented 5-vertex ring tracing the fenced property (building +
  drop yard + parking + perimeter drive). ~23 acres. Compact single-building
  cold-storage footprint.
- **Truck gate** — oriented quad over the divided entrance throat at the SE end.
- **Drop yard** — one oriented quad over the trailer-storage lot NW of the
  building; ~70 trailers visible, ~110 capacity (`dropArea: 50+`, `dropYard: true`).
- **Dock apron** — one long thin oriented quad hugging the SW dock wall at the
  building's angle.
- **Staging** — null (post-gate holding is the open yard, captured by the drop
  yard / apron rather than a distinct staged box).

**yardMetrics:** dockDoorCount 32, trailersVisible 70, trailerParkingCapacity 110,
truckGateCount 1, buildingCount 1, siteAreaAcres 23.0, railServed false.

**streetViewMeta:** perimeter pano `A63EADtHJMJrj0mxfRx3mQ` (heading 160, the
arrival frontage frame); truckGate pano `10-P9heB94U13HZVtUXi6g` (heading 210,
easternmost public pano nearest the entrance). Both 2024-10, status OK.

---

## Web findings

- Grocery Dive / Supermarket News / FreightWaves: Ahold Delhaize tapped Americold
  for two automated frozen warehouses; Plainville is one of them, serving Stop &
  Shop and Hannaford in the Northeast. ~130 ft tall, 230K+ sq ft, 30K+ pallet
  slots, robotic case-pick onto trailers; powered by Bloom Energy fuel cells;
  20-year ADUSA term; operations begun (full throughput targeted late 2025).
- Americold careers — a dedicated **Gate Guard** position controls truck/visitor
  access and checks credentials, corroborating the guarded-gate call.

---

## Final confidence: HIGH

Building identity and layout are unambiguous (logo + address marker + corroborating
press). Gate and dock determinations are well supported. The guard-booth structure
and any truck scale could not be directly imaged because Street View does not enter
the private divided drive; `guardShack`, `entryLanes`, `exitLanes`, and `scale` are
flagged in `uncertainFields`.
