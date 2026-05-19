# Deep-Audit Dossier — idx 06

## DHL Supply Chain — East Coast Center of Excellence (Project Empire) — Jacksonville FL

**Type:** Distribution Center
**Resolved coordinates:** 30.43930, -81.57100
**Confidence:** High

## Step 0 — Locating the facility

The roster coordinates (30.418884, -81.598760) were RANGE_INTERPOLATED and **wrong** — they
pointed at the JEA Northside power-plant / chemical tank farm on the Broward River, roughly
1.4 km west of the true site.

Web research resolved the facility:
- DHL Supply Chain "Project Empire" — 603,200 sq ft planned / 625,308 gross sq ft as-built,
  on 47.13–49.8 acres at **10030 / 10300 Eastport Road**, North Jacksonville.
- Located at the SW corner of Kraft Road & Eastport Road, south of I-295, south of the
  San Mateo Little League ballfields (1185 Kraft Rd).
- $64M DHL investment, $72M total build (contractor Arco National); opened 2025; primary
  customer described as "a Fortune 500 world-leading food company." DHL sold the building
  to KKR (Eastport Exchange Owner LLC) for $192M in Dec 2025.

Satellite probing of the Eastport/Kraft industrial park revealed two large new warehouses.
The **central, largest N-S cross-dock building** at 30.4393,-81.5710 was confirmed as
Project Empire via Feb-2025 Street View, which clearly shows the DHL building, the
hip-roof office structure, perimeter fencing and the main entrance with site signage.

## Key views

- **Wide satellite (z16-17):** Large white-roof warehouse running N-S, ~360m long. Dock
  doors with trailers backed in along BOTH long faces. Drop-yard trailer rows along the
  west fence and on the east apron. Bounded north by a residential subdivision /
  retention pond, south by Eastport Road.
- **South / entrance (z18-21):** Hip-roof office at the SW; employee car park fronting
  Eastport Road; a separate divided truck entrance to the east of the office; a large
  paved truck-court turning area inside.
- **Street View (Feb 2025):** DHL building visible with red DHL logo; chain-link
  perimeter fence; main entrance drive split by a landscaped median into separate
  in/out lanes. No staffed guard booth visible.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Single controlled, fenced main entrance off Eastport Road at the
  SW corner. Divided drive with median island.
- **guardShack = false.** No small staffed booth visible beside the lane in Street View
  or high-zoom satellite. Modern fenced DC entrance with signage only.
- **remoteGs = true.** Gate present, no guard booth — kiosk/app/remote check-in inferred.
- **entryExitSeparate = true.** Median-split entrance gives distinct inbound/outbound lanes.
- **dockDoors = 50+.** Cross-dock with continuous dock-door rhythm on both long faces;
  ~110 doors total (low-confidence estimate, banded 50+).
- **shipRcvSeparate = true (medium confidence).** Dock banks on two opposite building
  faces suggest split shipping/receiving.

## Yard zones & counts

- **Perimeter:** ~690m N-S x ~290m E-W fenced parcel ≈ 49 acres (roster cites 47–49.8).
- **Drop yards:** trailer rows along the west fence and on the east apron.
- **Dock aprons:** two — west building face and east building face.
- **Staging:** large paved truck-court turning area inside the gate before the docks.
- **Metrics:** ~110 dock doors; ~115 trailers visible; ~210 trailer parking capacity;
  1 truck gate; 1 building; ~49 acres; not rail-served.

## Web findings

Multiple sources (Jax Daily Record, JAXUSA, Supply Chain 24/7, Florida Politics)
corroborate a 600K+ sq ft DHL Supply Chain DC ("Project Empire") at Eastport Road,
opened 2025, dedicated to a Fortune 500 food company. Refrigerated + dry warehouse.

## Final confidence

**High** — facility positively re-located and confirmed despite a wrong roster
coordinate; recent (Feb 2025) imagery clearly shows the building, entrance and yard.
Guard-shack/remote-GS, exact dock count and ship/receive split flagged as
medium-confidence in uncertainFields.
