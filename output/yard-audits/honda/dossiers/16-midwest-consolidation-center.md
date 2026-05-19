# Deep-Audit Dossier — idx 16

## American Honda - Midwest Consolidation Center (MCC) - Troy OH

**Type:** Parts Consolidation Center
**Resolved coordinates:** 40.04630, -84.23600
**Maps:** https://www.google.com/maps/@40.04630,-84.23600,400m/data=!3m1!1e3
**Confidence:** high

---

## Step 0 — Location confirmation

The roster coordinates (40.042289, -84.238128, GEOMETRIC_CENTER) landed on
open farmland south of the actual facility. Web research confirmed the MCC is
at **151 Commerce Center Blvd, Troy, OH 45373** — a $89M, 549,000 sq ft
parts-consolidation hub on 58 acres opened in 2007, sitting adjacent to (and
just south of) Honda's older Troy parts distribution center.

Satellite probes (z16-z20) over the Commerce Center Blvd industrial area west
of I-75 positively identified the building: a single very large rectangular
warehouse with a long truck-dock bank along its NE face (toward I-75), a
second dock bank on its SW/south face, a large dedicated trailer drop yard
immediately south, employee parking to the SW, and a guarded access road
entering from Commerce Center Blvd to the NW. The older Troy PDC (roster idx
15) is a separate, larger building cluster just to the north — not the subject
of this audit.

Locked center: **40.04630, -84.23600**.

---

## Key views

- **Wide z16 (`honda-16-perim-z16.png`):** Shows the full MCC property — the
  big warehouse, NE dock apron, southern drop yard, employee lot, and the
  guarded entrance road. The older PDC and its own trailer yard are visible to
  the north as a separate facility.
- **NE dock face (`honda-16-dockcount2-z19.png`, `honda-16-dockfull-z18.png`):**
  A long, continuous dock bank along the NE building face with trailers backed
  in, plus a row of staged/parked trailers in the apron between the building
  and the I-75 treeline.
- **SW/south face (`honda-16-swdrive-z18.png`):** A second dock bank on the
  SW/south face with trailers, fronting the southern drop yard.
- **Drop yard (`honda-16-dropyard-z17.png`, `honda-16-swdrive-z18.png`):** A
  large paved lot south of the building packed with rows of parked trailers
  (no tractors) — a dedicated trailer-storage drop yard.
- **Truck gate (`honda-16-gate-z20.png`, `honda-16-gatesat-z19.png`):** The
  property access road off Commerce Center Blvd passes through a checkpoint
  ~340 m before the building — a guard booth beside the lanes and a
  gate/barrier canopy spanning the driveway.
- **Street View (`honda-16-sv-gate2.png`, `honda-16-sv-booth.png`,
  captured 2024-06):** Confirms a small blue/white staffed guard booth with an
  overhead canopy over the entry/exit lanes, plus a stop sign on the entry
  lane. Perimeter chain-link fencing is visible along the Commerce Center Blvd
  frontage (`honda-16-sv-entr2.png`).

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** A controlled checkpoint sits on the internal access
  road where it leaves Commerce Center Blvd: a gate/barrier canopy spans the
  truck lanes, with a stop sign and a guard booth. Not an open driveway.
- **guardShack = true.** A small staffed booth (≈1-2 vehicle footprint,
  windows on multiple sides, canopy over the lanes) is set beside the gate —
  clearly visible in both satellite (z20) and Street View. Therefore
  **remoteGs = false**.
- **dockDoors = "50+".** Two dock banks — a long bank on the NE face toward
  I-75 and a second on the SW/south face. A 549,000 sq ft consolidation hub
  taking up to 270 freighter-loads per day; total doors estimated ~70,
  comfortably in the 50+ band.
- **shipRcvSeparate = true.** Inbound and outbound flows split across two
  physically distinct dock clusters on different building faces.
- **dropArea = "50+", dropYard = true.** A dedicated trailer-storage lot
  south of the building is full of parked trailers — well over 50 stalls.

---

## Yard zones and counts

- **perimeter:** ~58 acres — the whole MCC property inside the fence line.
- **truckGate:** the guard-booth checkpoint on the NW access road.
- **dropYards:** one box — the large trailer-storage lot south of the building.
- **dockAprons:** two — the NE-face apron and the SW/south-face apron.
- **staging:** the long approach drive + paved apron between the gate and the
  building (postGateStaging).
- **yardMetrics:** dockDoorCount ~70 (estimate), trailersVisible ~95 in the
  captured imagery, trailerParkingCapacity ~180 (drop yard + apron, estimate),
  truckGateCount 1, buildingCount 2 (main warehouse + gatehouse/annex),
  siteAreaAcres 58, railServed false.

---

## Web findings

- Honda Global / hondanews / Dayton Daily News: MCC opened 2007, $89M,
  549,000 sq ft (500,000 warehouse + 49,000 office) on 58 acres at 151
  Commerce Center Blvd. Feeds Honda's other U.S. parts distribution centers.
- Up to **270 freighter-loads of components arrive daily** — confirms a
  high-volume truck operation justifying the heavy dock and drop-yard
  classification.
- Adjacent to the older Troy PDC (operating since 1986) — a separate facility.

---

## Final confidence: high

Facility positively identified; imagery clear; gate and guard shack confirmed
in both satellite and Street View. Lane counts and exact door/trailer counts
are honest overhead estimates and are flagged in `uncertainFields`.
