# Deep-Audit Dossier — idx 17

## K-C Graniteville Distribution Center — Graniteville, SC

**Roster coords:** 33.623638, -81.847485 (ROOFTOP, moved 157 m)
**Locked center:** 33.62405, -81.84755
**Type:** Distribution center
**Gate verdict:** Truck gate YES — sliding gate + chain-link perimeter fence
**Guard-shack verdict:** YES — peaked-roof guard booth beside the truck lane
**Archetype:** Gate + Guard Shack DC (cross-dock, split ship/receive)
**Confidence:** HIGH

---

## Step 0 — Location confirmation

The roster ROOFTOP coordinates landed inside the building footprint. Web
research confirms the site: **1043 Global Ave, Graniteville SC 29829**, in the
**Sage Mill Industrial Park**. The DC is the **"Global Avenue Logistics
Center"** — a 450,033 sq ft Class-A concrete tilt-wall cross-dock building on
30.1 acres. CoStar reports Kimberly-Clark renewed its lease of the entire
~450,000 sq ft building. Locked center at ~33.62405, −81.84755.

## Steps 1–3 — Imagery review

- **Wide satellite:** Sage Mill Industrial Park — several large buildings set
  among pine woodland on the rural edge of Graniteville, ~1.5 mi from I-20.
- **Overview / tight satellite:** A long rectangular warehouse oriented NW–SE,
  cross-dock, with dock doors and trailers backed in along BOTH long faces (NE
  and SW). Truck courts wrap both sides; employee parking and the gated
  entrance are at the SE end.
- **Street View (2024-03):** A chain-link perimeter fence runs along the
  property boundary on Global Ave. At the truck-court entrance, Street View
  clearly shows a **chain-link sliding gate** across the truck lane and a
  **small peaked-roof guard booth** set immediately beside the lane. The
  building is visible behind, with dock banks on the long faces.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE** — chain-link sliding gate across the truck lane plus a
  fenced perimeter; leasing materials independently describe a "fully secured
  site." Clear, unambiguous Street View evidence.
- **guardShack = TRUE** — a distinct ≈1-vehicle-footprint booth with a peaked
  roof sits beside the gate lane, visible in the close Street View frame.
- **remoteGs = FALSE** — a staffed booth is present, so this is not a remote /
  kiosk check-in.
- **dockDoors = 50+** — cross-dock building with dock banks down both ~450 m
  long faces; ~120 doors total is an honest overhead estimate (loose).
- **shipRcvSeparate = TRUE** — cross-dock = two dock banks on opposite faces.
- **dropYard = TRUE / dropArea = 25-50** — marked trailer-parking lanes in the
  NE truck court hold tractorless trailers.
- **postGateStaging = TRUE, drivewayLong = TRUE** — deep truck courts (leasing
  materials: "up to 185 ft deep") give 3+ trucks of stacking room inside the
  gate before the docks.
- **entryExitTogether = TRUE** — one combined truck gate at the SE corner off
  Global Ave; ~1 inbound + 1 outbound lane.
- **fastLaneOpportunity = FALSE** — single controlled lane group, no obvious
  unused paved width for a bypass.
- **scale / multiStep = FALSE** — no weigh platform or second checkpoint seen.
- **railServed = FALSE** — the site sits adjacent to a Norfolk Southern line
  and leasing materials note it *could* tie in via a spur, but no spur
  currently enters the property.

## Yard zones & metrics

- **Perimeter:** ~33.62150–33.62650 N, −81.85010 to −81.84480 W — a loose
  axis-aligned bounding box around the NW–SE-elongated fenced property.
- **truckGate:** Small box at the SE entrance off Global Ave (gate + booth).
- **dropYards:** One — the NE truck-court trailer-parking lanes.
- **dockAprons:** Two — one along the NE dock face, one along the SW dock face.
- **staging:** A modest post-gate paved holding area just inside the gate.
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~55, capacity ~70,
  truckGateCount 1, buildingCount 1, siteAreaAcres 30.1 (documented parcel —
  the AABB perimeter overcounts the diagonal corners), railServed false. Door
  and trailer counts are honest overhead estimates, flagged in
  `uncertainFields`.

## Web findings

- Global Avenue Logistics Center: 450,033 sq ft Class-A cross-dock, 32' clear,
  ESFR, two truck courts up to 185' deep, dedicated trailer parking, 30.1
  acres, "fully secured site," Sage Mill Industrial Park, 1.5 mi from I-20,
  adjacent to a Norfolk Southern rail line.
- CoStar: Kimberly-Clark renewed its lease of the entire ~450,000 sq ft
  building.

## Final confidence

**HIGH.** The facility is positively identified at its documented address,
recent (2024) Street View clearly resolves the gate and guard booth, and the
cross-dock layout and yard zones read cleanly from satellite imagery. Only the
exact door and trailer counts are estimates.
