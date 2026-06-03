# Yard Audit Dossier — Walmart Perishable DC 3006, Lancaster TX

**Type:** Grocery / Perishable DC (730,000 sf, refrigerated)
**Resolved center:** 32.5835, -96.7115
**Method:** deep-audit (satellite + 2026 Street View + web research)
**Confidence:** medium

---

## 1. Location resolution

The brief supplied address **2500 E Belt Line Rd** with coords 32.58388, -96.713855.
Web research (Dallas Innovates, The Shelby Report, Business Wire, The Packer)
established that 2500 E Belt Line Rd is actually Walmart's **1.5M sf fulfillment
center** (opened Oct 2023), while the **730k sf high-tech Perishable Distribution
Center** (grand opening July 16, 2024; 500+ associates; processes produce, eggs,
dairy, flowers, frozen) is the **adjacent building at 940 E Pleasant Run Rd** in
the **same Lancaster logistics campus**.

Satellite at the supplied point lands squarely on this two-building Walmart campus.
I identified the Perishable DC as the **south building** — a long structure on a
WNW-ESE diagonal axis, sitting immediately south of the larger, more square
fulfillment center. Construction-sequencing confirms it: in the available
(construction-era) Maxar imagery the FC has a finished white roof while the
perishable building is still bare concrete — consistent with it being the later
(2024) of the two. **Refrigeration is confirmed** by the ammonia/refrigerant tank
farm (paired white cylindrical vessels) visible beside the building in 2026 Street
View — a signature of a refrigerated perishable DC.

Locked center on the perishable building: **32.5835, -96.7115**.

## 2. Imagery used

- Satellite z14-z20 (Maxar) — **construction-era**: both buildings under
  construction, yards ungraded, retention pond being excavated. Good for footprint,
  orientation, perimeter and zone geometry; **not** reliable for exact dock-door or
  trailer counts.
- Street View — three real, recent panos resolved and confirmed via `probe sv`:
  - **NW** `EqjXM3JzatGGrSF24J7QuA` (2026-04) @ 32.5874, -96.7185
  - **N**  `SOmNIyqfhkP7ocZQv8hf2A` (2026-02) @ 32.5869, -96.7100
  - **SW** `wfoIBz455AEj5IcMjKbK-g` (2026-02) @ 32.5830, -96.7188
  These show the **completed** facility and were decisive for gate/fence/dock calls.

## 3. What each key view showed

- **NW pano, heading 135-160°:** completed white DC with a long **west dock face**,
  a continuous row of **Walmart trailers backed into docks**, and **chain-link
  perimeter fencing** with the trailers parked behind it. Blue Walmart logo on the
  building.
- **N pano, heading 200-270°:** the long **blank north wall** (no docks this face)
  with a large blue Walmart logo; 2-lane rural road along the north; **open
  farmland and woods** to the north/east — establishes the Rural setting.
- **SW pano, heading 25-60°:** full west elevation across an open grass buffer — the
  **refrigeration tank farm** (ammonia plant), dock doors with trailers, and the
  **continuous perimeter fence** across the midground. The site is fully enclosed.
- **Satellite z16-z20:** two large buildings sharing a wide central **truck court /
  dock apron**; a **south truck yard** with paved parking/staging islands; perimeter
  drive wrapping the south and east with a retention pond.

## 4. Gate / guard-shack / dock determinations

- **truckGate = true.** The whole complex is enclosed by continuous chain-link
  fencing (clearly visible in all three 2026 panos, with trailers parked inside the
  line). Truck traffic enters via a single controlled entrance off the **west
  perimeter drive** (truckGate geofence traced there; SW pano is ~270 m from the
  gate at heading 121°).
- **guardShack = true (flagged uncertain).** Construction-era satellite cannot
  resolve a booth and no pano sits at the gate itself, so this is **inferred** from
  the facility profile: a 730k sf high-tech automated perishable DC with 500+
  associates and a fully fenced perimeter — these are guarded. Listed in
  `uncertainFields`; `remoteGs` set false on the same basis.
- **dockDoors = "50+".** 730k sf cross-dock-style perishable DC with long dock faces
  (north face onto the shared apron with the FC; south face onto the truck yard).
  Door count estimated ~90; exact rhythm not resolvable in construction imagery.
- **shipRcvSeparate = true.** Dock activity on two distinct building faces (north
  apron + south yard).
- **dropArea / dropYard = "50+" / true.** Long rows of Walmart trailers along the
  dock face (2026 Street View) plus a large dedicated south drop yard.

## 5. Yard zones and counts

- **perimeter** — 7-vertex ring around the Perishable DC parcel (building + truck
  court + south drop yard + landscaped buffers). **≈ 143 acres.**
- **truckGate** — quad on the west perimeter-drive entrance.
- **dockAprons** — two thin rotated strips hugging the building at its WNW-ESE
  angle: the **north apron** (shared truck court between PDC and FC) and the
  **south apron** (in front of the south dock face).
- **dropYards** — one ring over the south truck yard / trailer storage area.
- **staging** — null (internal court doubles as post-gate hold; no distinct
  pre-gate stack observed).
- **yardMetrics:** dockDoorCount ~90, trailersVisible ~60, trailerParkingCapacity
  ~120, truckGateCount 1, buildingCount 1 (PDC only), siteAreaAcres 143.2,
  railServed false. Counts are honest estimates (construction imagery) and flagged
  in `uncertainFields`.

## 6. Web findings

- 730,000 sf; grand opening **July 16, 2024**; 15 mi south of Dallas; processes
  fresh produce, eggs, dairy, flowers, frozen goods for nearby Walmart stores.
- 500+ full-time associates; "high-tech" automation processing **2x** the volume
  of a traditional DC. Walmart's **second** perishable DC in Lancaster and **fifth**
  overall.
- Located at **940 E Pleasant Run Rd**, Lancaster TX 75146, sharing the campus with
  the 1.5M sf fulfillment center (2500 E Belt Line Rd) — hence `multipleFacilities`.

## 7. Final confidence

**Medium.** Facility identity, refrigeration, fencing, controlled gate, multi-
building campus, dock faces and Rural setting are well supported by 2026 Street View
plus research. The reduction from "high" is driven entirely by **construction-era
satellite**: exact dock-door and trailer counts, the guard-booth confirmation, and
entry/exit lane counts are estimates rather than direct overhead reads, and are all
listed in `uncertainFields`.
