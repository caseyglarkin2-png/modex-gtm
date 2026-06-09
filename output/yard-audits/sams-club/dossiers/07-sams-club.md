# Deep-Audit Dossier — Sam's Club Distribution Center, Jacksonville FL (idx 07)

**Facility:** Sam's Club Distribution Center Jacksonville FL (Distribution Center)
**Address:** 1511 Zoo Pkwy, Bldg 300, Jacksonville, FL 32226
**Resolved center:** 30.4247, -81.6235
**Method:** deep-audit (satellite + Street View + web research)
**Confidence:** high

---

## Step 0 — Locating the building

The supplied coordinates (30.419193, -81.622538) landed on **undeveloped
woodland** about 800 m south of the actual facility — the satellite imagery at
that point is pre-construction pine plantation. The real building is north of
there.

Web research fixed it: this is **Building E / "Building 300"** in **Imeson
Park South**, a VanTrust logistics park in North Jacksonville. The 1
million-square-foot, $61M Sam's Club DC opened **April 2025** (fully
operational since February 2025), sits on a ~23-acre footprint, and is staffed
by ~250 workers (Jax Daily Record, JAXUSA, Supply Chain Dive, Progressive
Grocer).

Disambiguation mattered here because the park has several large boxes:
**Building 100** = Sub-Zero (~203k sf), **Building 200** = Primark (~547k sf),
**Building 300 / E** = Sam's Club (1M sf), plus an **Amazon-branded** building
immediately to the **west** of Sam's. I confirmed the correct building three
ways:
1. The truck-gate entrance drive comes off a road literally named **"Sam's
   Club Range Blvd."**
2. Sam's is the **largest** footprint in the park — the only 1M-sf box — with
   the big employee parking lot on its south side.
3. It is the easternmost building, bordered on the east by a long retention
   canal and (further SE) the city wastewater-treatment plant; the Amazon
   building (with a visible "amazon" wordmark in 2025 Street View) is the
   separate box one parcel to the west, across a shared drop-yard corridor.

Locked center: **30.4247, -81.6235**.

---

## What the key views showed

**Overview (z15-z16):** Large N-S building (very slight clockwise tilt) on the
east edge of the park. Retention canal hugs the east wall; huge employee
parking lot to the south; shared truck corridor / drop yard on the west between
Sam's and the Amazon building.

**East dock face (z18-z19, along the canal):** A continuous bank of ~30-35 dock
positions, most with trailers backed in (drop trailers at live docks). This is
the primary high-volume dock wall.

**West dock face (z18-z19):** A second dock bank facing the central truck
corridor, with trailers and drop-yard rows in the median between the two
buildings.

**Truck gate (Street View 2023-01 and 2025-02; satellite z19-z20):** The SE
entrance drive off Sam's Club Range Blvd runs into a **guarded checkpoint** —
gate arms across the truck lanes, a "DO NOT BLOCK" painted apron, a STOP sign,
and a **small modular guard booth on a center median island** between the in/out
lanes. In the 2023 frame a black tractor and an XTRA trailer are queued at the
gate. The booth is unambiguous both at ground level and overhead at z20.

**South / front (Street View):** Office/admin entrance with a front canopy
("west entry" signage) facing the employee parking lot; this is the
people-side, not the truck side. Public Street View covers only the perimeter
roads; it does not enter the truck yard.

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled truck entrance with barrier arms, lane
  striping, STOP/"DO NOT BLOCK" markings, trucks queued. SE drive off Sam's
  Club Range Blvd.
- **guardShack = true.** Small modular booth (≈1-2 vehicle footprint, windows,
  median island beside the gate). Visible in Street View and z20 satellite.
- **remoteGs = false.** A staffed booth is present, so this is not a remote /
  kiosk-only gate.
- **dockDoors = "50+".** ~30-35 on the east (canal) wall plus a west-face bank;
  estimated ~85 total for a 1M-sf cross-dock.
- **dropArea = "50+".** Dedicated trailer rows in the central corridor plus
  drop trailers backed at the east wall.
- **shipRcvSeparate = true.** Two physically separate dock banks on different
  building faces, consistent with the reported import-side vs. retail-side
  split of the DC.
- **fastLaneOpportunity = true.** Wide multi-lane gate apron with the booth on a
  center island and spare paved width for an express/bypass lane.
- **entryExitTogether = true** (single gate point handles in + out).
- **postGateStaging = true / drivewayLong = true** — deep approach and an
  inside-the-gate holding area before the docks.
- **urbanRural = "Urban"** — dense North Jacksonville logistics fabric off
  I-95/I-295, by the airport and Blount Island port.

---

## Yard zones & counts measured

- **perimeter** — traced inside the fence: west edge on the centerline of the
  shared drop-yard corridor, east edge just beyond the dock wall along the
  canal, north to the access drive, south past the employee lot. ~**62 acres**
  (building footprint alone ~23 ac per press).
- **truckGate** — quad over the SE checkpoint on the entrance drive.
- **dropYards** — one ring over the central trailer-storage corridor between
  Sam's and the Amazon building.
- **dockAprons** — two: east apron (along the canal) and west apron (facing the
  corridor), each a thin quad hugging the building wall.
- **staging** — post-gate holding area at the SE before the east dock bank.

**yardMetrics:** dockDoorCount ~85, trailersVisible ~80, trailerParkingCapacity
~160 (rough), truckGateCount 1, buildingCount 1, siteAreaAcres ~62, railServed
false.

**Street View metadata:**
- truckGate pano `9zGaaLAI_ema5j_BjXO11A` (2023-01) @ 30.42301,-81.62195,
  heading 318° → toward the gate booth.
- perimeter pano `ZxfUJDM5MMv-7nrIKL6_NA` (2025-02) @ 30.42422,-81.62450,
  heading 58° → toward the building's NW frontage.

---

## Web findings

- 1M sf, $61M, ~23-acre building; opened Apr 17 2025, operational Feb 2025;
  ~250 staff. Architect HFA (Bentonville), builder Evans General Contractors
  (Savannah). (Jax Daily Record, JAXUSA, businesswire, Progressive Grocer.)
- Operations: receives/processes shelf-stable goods for 18 Sam's Clubs in
  FL/GA/SC plus 7 clubs in Puerto Rico, and stores/sorts imported goods for
  four Southeast DCs — i.e. an import side and a direct-to-club retail side
  (supports shipRcvSeparate).
- Imeson Park South: VanTrust-developed, ~214-237 acres, ~3.3M sf across 7
  buildings; tenants include Sub-Zero (Bldg 100), Primark (Bldg 200), Sam's
  Club (Bldg 300/E). Amazon's 1M-sf FC is in the separate Imeson Park to the
  north. Near I-95/I-295, Jacksonville Intl Airport, and Blount Island port.

---

## Uncertain fields

- **entryLanes / exitLanes (2 / 2)** — booth-island lane split read from
  overhead + Street View; exact lane counts not perfectly resolved.
- **scale** — no truck scale positively identified; left false/uncertain.
- **trailerParkingCapacity** — rough capacity estimate from overhead.

**Final confidence: high.** Building positively identified; gate and guard
booth confirmed at ground level in two Street View vintages; dock banks and
drop yard read clearly from z18-z19 satellite.
