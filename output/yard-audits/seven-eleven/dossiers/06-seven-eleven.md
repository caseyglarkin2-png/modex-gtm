# Deep-Audit Dossier — 7-Eleven CDC Commerce City CO (E.A. Sween Denver)

- **idx:** 6
- **Facility:** 7-Eleven Combined Distribution Center Commerce City CO (E.A. Sween Denver)
- **Type:** Combined Distribution Center (fresh-food / value-added-services supply node)
- **Listed address:** 5700 E. 56th Avenue, Unit D, Commerce City, CO 80022
- **Resolved center:** 39.79592, -104.92080
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View + web)

## Step 0 — Location confirmation

The supplied city-level coordinates (39.795841, -104.920816) landed directly on
a cluster of three white-roofed flex-industrial buildings just north of I-270 in
Commerce City. Web research resolved the address: **Park Industrial Center**, a
multi-tenant flex park comprising the buildings at **5690 / 5700 / 5710 E 56th
Avenue** (LoopNet / CommercialCafe), ~155,000 SF total, north of I-270 at 56th &
Holly. E.A. Sween runs its **"Denver VAS"** (value-added-services) fresh-food
distribution operation out of **5700, Unit D** — this is the 7-Eleven
fresh/commissary supply node, not a tractor-trailer regional DC.

The audited building is the **center N-S flex building** of the three. It was
positively identified by:
- Satellite: center building at 39.7959, -104.9208 with truck aprons/docks on
  both its west and east faces, flanked by 5690 (west) and 5710 (east).
- Street View on 56th Ave: building face numerals in the 5700 block; a **Ryder**
  rental truck plus delivery box-trucks/vans parked at the building behind a
  chain-link screen — consistent with E.A. Sween's Ryder-leased route fleet.
- Street View of the west court: a **reefer (refrigerated) trailer** backed into
  the dock, consistent with the cold-chain fresh-sandwich operation.

This is unambiguously the correct facility.

## Key views

- **Wide satellite (z16/z18):** Park Industrial Center sits in dense Denver-metro
  industrial fabric, bounded north by E 56th Ave (shared parking), south by I-270
  with a landscaped/fenced buffer. Three parallel N-S flex buildings with shared,
  open truck courts between them.
- **Tight satellite (z19/z20) on 5700:** long rectangular building, long axis
  roughly N-S (slightly rotated). Dock-height + grade-level overhead doors on
  both the west and east faces; trailers/box-trucks backed in along both. Open
  paved courts on each side; shallow depth (1-2 truck stacking).
- **Street View — 56th Ave arrival (pano 3uPQg8iaeDd39YKn8rWGuA, 2020-11):**
  looking south, the truck driveway runs straight off the public road into the
  shared court with **no barrier arm, no gate, no booth, no checkpoint**. A
  chain-link fence runs along the east landscape buffer only.
- **Street View — building signage (2021-08):** Ryder truck + delivery vehicles
  at the 5700 building behind a chain-link screen.
- **Street View — west court (2019-08):** dock face with recessed dock bays and
  grade-level doors; a reefer trailer + day-cab tractor backed in.
- **Street View — east entry (2021-08):** another building in the park with
  labeled "DOCK 1 / DOCK 2" doors and, again, a fully open uncontrolled drive.

## Gate / guard-shack / dock determinations

- **truckGate: false.** Every complex access seen in Street View (2019-2024) is
  an open driveway off 56th Ave or an internal through-drive. No barrier arm,
  sliding/swing gate, or checkpoint pinch-point at the property line. This is an
  open-access multi-tenant flex park.
- **guardShack: false.** No staffed booth at any entry.
- **remoteGs: false.** No gate exists, so no remote/kiosk check-in.
- **dockDoors: 10-25.** The 5700 building carries docks on both faces; counted
  ~12-18 doors total across west + east (mix of dock-height and grade-level). The
  E.A. Sween unit uses only a subset. Banded 10-25 (count flagged uncertain).
- **dropArea: 0-10.** A handful of trailers (incl. a reefer) park without a
  tractor in the shared courts; no marked drop-stall block of any size.
- **dropYard: false.** No dedicated standalone trailer-storage lot — only shallow
  shared aprons hugging the building.

## Yard zones and counts

- **perimeter** (~4.98 acres) — the 5700 leasehold: building + flanking west and
  east truck aprons + south I-270 buffer, bounded by the central park drive lanes.
- **truckGate** — the open north-center driveway off 56th Ave (open, uncontrolled).
- **dockAprons** — two rotated quads: the west apron (shared with 5690) and the
  east apron (shared with 5710), each hugging the building wall at its N-S angle.
- **dropYards** — none traced (no dedicated drop lot).
- **staging** — none (no defined pre/post-gate staging; open courts).
- **streetViewMeta** — perimeter and truckGate both use the 56th Ave arrival pano
  `3uPQg8iaeDd39YKn8rWGuA` (2020-11), the true driver's-eye on arrival, headings
  172 / 178 (looking south into the open entrance). Both `hasCoverage: true`.

### yardMetrics
- dockDoorCount: 16 (estimate, both faces; uncertain)
- trailersVisible: 9
- trailerParkingCapacity: 14 (uncertain — shallow shared courts)
- truckGateCount: 2 (north drive + east through-drive; both open)
- buildingCount: 1 (the audited 5700 building)
- siteAreaAcres: 4.98 (from perimeter polygon)
- railServed: false (no spur enters the property)

## Web findings

- E.A. Sween Company (HQ Eden Prairie, MN; founded 1955) is the #1 branded
  ready-to-eat sandwich supplier; operates VAS/distribution sites nationally and
  is a primary fresh-food supplier to 7-Eleven (Yelp/Craft list a Denver-area
  E.A. Sween presence).
- LoopNet / CommercialCafe: 5700 E 56th is part of Park Industrial Center
  (5690/5700/5710 E 56th Ave), ~155,000 SF flex-industrial, I-270 frontage,
  flex-industrial lease use, ~$10/SF/yr — a multi-tenant flex product, confirming
  the open-access shared-court reality rather than a single-tenant guarded DC.

## Final confidence

**High.** Facility unambiguously located and tenant-confirmed; gate/guard-shack
calls are clear and corroborated across multiple Street View years; only the
exact dock-door count and trailer capacity are estimates (flagged uncertain).
