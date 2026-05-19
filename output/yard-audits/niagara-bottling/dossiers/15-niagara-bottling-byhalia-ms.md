# Deep-Audit Dossier — idx 15

## Niagara Bottling - Byhalia MS

- **Type:** Bottling / Manufacturing Plant
- **Roster address:** 168 E Wingo Rd, Byhalia, MS 38611
- **Roster coords:** 34.976643, -89.607243 (geocode ROOFTOP, moved 68 m)
- **Locked coords:** 34.97800, -89.60680
- **Confidence:** high

## Step 0 — Location resolution

The geocoded coordinate lands on a large warehouse/manufacturing building in a
Byhalia, MS logistics park southeast of Memphis. Identification is
**confirmed**: a cluster of tall white process **silos** and water-treatment
tanks lines the S/SE building face — the classic bottling-plant signature —
and this matches a web facility note describing the plant's delivery entrance
as "adjacent to the large silos." Niagara's Byhalia plant opened in 2018.

## Steps 1–5 — What the imagery showed

- **Wide / tight satellite:** A large rectangular building oriented N–S, with
  dock faces on **both** the W and E sides. Office and employee parking at the
  S end. Tall process silos and treatment tanks along the S/SE face. Rooftop
  process equipment (large fan units) visible at the SE.
- **Dock faces:** Dock doors run both the W and E building faces, each densely
  lined with trailers — combined estimate ~100–120 doors → band **50+** (exact
  count low-confidence).
- **Drop yards:** Trailer drop rows on both the W side (beyond the W dock
  apron) and the E side → `dropArea = 50+`, `dropYard = true`.
- **Truck gate / guard shack:** The site has a **continuous chain-link
  perimeter fence** along E Wingo Rd. The truck entrance at the SE corner is a
  **controlled gated drive** with a digital driver check-in **sign board**
  (visible in Jan 2026 Street View). **truckGate = true.** No staffed
  multi-window guard booth is visible — check-in is via the digital
  kiosk/board → **remoteGs = true, guardShack = false** (kiosk-vs-booth call
  medium-confidence at Street View distance).
- **Ship/Rcv:** Two physically separate dock banks on opposite building faces
  → `shipRcvSeparate = true`.
- **Entry/exit:** A web facility note mentions a separate "exit gate" with
  shipping restrooms, implying split entry/exit; satellite shows one main SE
  entrance complex, so classed `entryExitTogether` with the possible separate
  exit gate flagged uncertain.
- **Staging:** No pre-gate staging. Deep entrance drive and large dock aprons
  on both faces give 3+ truck post-gate stacking → `drivewayLong`,
  `postGateStaging`.
- **Web findings:** Niagara Byhalia bottled-water plant, opened 2018; facility
  note: "delivery entrance on the east side of the building, adjacent to the
  large silos... shipping restrooms at the exit gate."

## Yard zones & counts

- **Perimeter:** ~48 acres.
- **dockDoorCount:** ~110 (estimate, band 50+, doors on W and E faces).
- **trailersVisible:** ~72.
- **trailerParkingCapacity:** ~150.
- **truckGateCount:** 1 (main controlled SE entrance; a possible separate exit
  gate per web note).
- **buildingCount:** 1 (office integrated at the S end).
- **railServed:** false — no spur into the property.

## Final confidence

**High.** Building identification is confirmed by the silo cluster and a
corroborating web facility description. The truck-gate determination is
confident — a fenced perimeter with a controlled, signed entrance. The
guard-shack-vs-kiosk distinction and the exact dock-door count are honest
estimates flagged in `uncertainFields`.

### 3-line summary
- Gate verdict: YES — fenced perimeter with a controlled, signed SE entrance.
- Guard-shack verdict: NO staffed booth; digital check-in board → remote (remoteGs).
- Confidence: high (silo-confirmed Niagara plant; counts and kiosk call estimated).
