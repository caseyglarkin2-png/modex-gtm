# SalSon Logistics — North Charleston SC — Deep-Audit Dossier

**Facility:** SalSon Logistics - North Charleston SC
**Type:** Drayage Terminal / Food-Grade Warehouse (Charleston port market)
**Address:** 7225 Cross County Road, North Charleston, SC 29418 (Pepperdam Industrial Park)
**Resolved coordinates:** 32.919050, -80.066800
**Confidence:** High

## Location confirmation
The roster coordinates (32.918011, -80.068256) landed on a small building
**branded "C&K"** — a different company, not SalSon. The correct SalSon
facility at 7225 Cross County Road is a separate building ~150 m NE of that
point. This was confirmed by web research: a LoopNet listing for **7225 Cross
County Rd** describes it precisely as a **"17-door truck terminal located
within the Pepperdam Industrial Park, featuring 16 dock-high doors, 1 drive-in
door, and a 3.3-acre fenced yard compacted with rock for truck and trailer
storage"** (a 4,800 sq ft office/terminal building). The SalSon LogiCore
listing also gives 7225 Cross County Road as its Charleston address. The
satellite imagery at the corrected point shows exactly that: a single
L/T-shaped terminal building with dock doors and a large rock yard full of
containers and trailers to the south.

## What the imagery showed
- **Satellite (z18-z20):** One L-shaped terminal building. Dock doors line the
  building faces. South of the building is a large rock/dirt yard packed with
  intermodal containers and trailers (distinct red/green/orange units). A
  treeline/fence rings the property. An internal driveway connects from Cross
  County Road on the NW.
- **Street View (Cross County Rd, 2024-11):** The terminal is set well back
  from the road behind a dense treeline; the gate itself is not visible from
  the public road. White fence panels are visible at the property edge,
  confirming a fenced perimeter.

## Gate / guard-shack determination
- **truckGate: true** — The terminal sits inside a fully fenced/treelined
  perimeter with a single internal access driveway off Cross County Road; the
  LoopNet listing explicitly describes a fenced yard. This is a controlled
  truck entrance.
- **guardShack: false / remoteGs: true** — No staffed guard booth is resolvable.
  The gate is screened from public Street View by the treeline, and satellite
  shows the internal driveway with no booth-sized structure. Marked remoteGs
  true (kiosk/driver-managed); flagged as an uncertain field given the
  screened view.
- **entryExitTogether: true** — A single driveway serves the property.
- **drivewayLong: true** — The internal approach from Cross County Rd into the
  rock yard is long and deep, easily holding 3+ queued trucks.

## Yard zones & counts
- **Perimeter:** ~4.3 acres (the ~3.3-acre rock yard per LoopNet plus building
  footprint and driveway).
- **Drop yard:** The rock/dirt yard south of the building is a drayage
  container/trailer drop yard (dropArea 25-50, dropYard true).
- **Dock apron:** Along the building's faces; **16 dock-high doors + 1 drive-in
  door** per the LoopNet building spec (dockDoors 10-25, dockDoorCount 16).
- **yardMetrics:** ~28 trailers/containers visible, capacity ~90; 1 building;
  1 truck gate; not rail-served.

## Web findings
SalSon's Charleston operation provides drayage, OTR transportation and cross-
docking, "located close to the North Charleston Terminal (NCT)." SalSon
publicly noted it **acquired the dray operations of The Scoular Company in
Charleston**, adding capacity to the Charleston market. The LogiCore listing
flags food-grade (FDA) handling, transloading and inventory control. 7225 Cross
County Rd is a compact crossdock truck terminal — not a large DC.

## Final confidence
**High.** The LoopNet building listing gives an exact dock-door count and yard
size, and the corrected satellite location matches it precisely. The only soft
spot is the guard-shack call, since the gate is screened from Street View.
