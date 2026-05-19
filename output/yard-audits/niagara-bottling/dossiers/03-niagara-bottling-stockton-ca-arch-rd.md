# Deep-Audit Dossier — Niagara Bottling, Stockton CA / Arch Rd (idx 3)

## Resolved location
- **Address:** 5959 Arch Rd, Stockton, CA 95215
- **Locked center:** 37.90620, -121.19720
- **Confirmation:** Roster coordinates landed directly on a large white-roofed
  building. Street View (captured 2026-03) of the east face shows the "niagara"
  wordmark on the building and a Niagara monument sign at the entrance —
  positively confirmed. This is Niagara's newest Stockton plant (~600,000 sq ft,
  concrete tilt-up, operational 2023).

## Setting
SE Stockton industrial logistics district off Arch Rd — a dense cluster of
big-box distribution warehouses within the Stockton metro. Classified **Urban**
(borderline edge-of-town, flagged). Cellular coverage adequate; no connectivity
concern.

## Key views
- **Wide satellite:** Large rectangular building running E-W. North face = dock
  yard; east end = office + employee parking; south face = blank tilt-up wall on
  Arch Rd.
- **North face (z18-19):** Long run of canopied dock doors with trailers backed
  in; wide, deep paved trailer yard north of the docks.
- **Rail check:** A single rail line runs in a landscaped corridor NW of the
  building — it does NOT spur into the property. North docks are truck-only.
- **SE entrance (Street View 2026-03):** Wide driveway with a **rolling
  chain-link gate**; no guard booth.
- **NE corner:** A second gated driveway into the dock yard.
- **Arch Rd frontage (Street View):** Blank tilt-up south wall behind a black
  metal perimeter fence.

## Gate / guard-shack / dock determinations
- **truckGate = true (high confidence):** The whole property is fenced with black
  metal fencing. The SE truck/yard entrance carries a wide rolling chain-link
  gate, directly imaged in 2026-03 Street View. A second gated driveway is at the
  NE corner. `truckGateCount = 2`.
- **guardShack = false:** No staffed booth beside either gate — just the rolling
  gates.
- **remoteGs = true:** Gate present with no guard shack → remote check-in
  (kiosk / call-box / app). Consistent with this newer 2023 plant.
- **Docks:** Long canopied dock run on the north face plus doors on the SW face;
  ~45 → band **25-50**.
- **Drop yard:** Deep, wide paved trailer yard north of the dock face holds many
  dropped trailers → `dropYard = true`, `dropArea = 50+`.
- **fastLaneOpportunity = true:** Wide gate apron and a deep/wide dock yard leave
  ample paved width to add an express/bypass lane.

## Yard zones and counts
- **Perimeter:** ~41 acres — building + north dock yard + east employee parking.
- **Dock apron:** strip along the north building face.
- **Drop yard:** large paved trailer yard north of the apron.
- **Staging:** paved holding area between the SE gate and the dock yard.
- **Dock doors:** ~45. **Trailers visible:** ~25. **Capacity:** ~70.
  **Truck gates:** 2. **Buildings:** 1. **Rail-served:** no. **Scale:** none.

## Web findings
Niagara Bottling Arch Rd — ~600,000 sq ft single-story water/plastics
manufacturing plant, concrete tilt-up + steel frame + panelized wood roof,
operational 2023. One of four Niagara plants in Stockton (others on Runway Dr,
Zephyr St, Logistics Dr); ~415 FTEs across the Stockton plants.

## Final confidence
**High.** Building identity is certain (wordmark + monument sign). The gate call
is directly confirmed by recent (2026-03) Street View showing the rolling gate
and the absence of a guard booth. Dock/trailer counts are overhead estimates and
the Urban/Rural call is borderline — both flagged.
