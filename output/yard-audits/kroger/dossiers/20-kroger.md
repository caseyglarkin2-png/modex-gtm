# Deep-Audit Dossier — idx 20 · Heritage Farms Dairy (Kroger)

- **Facility:** Heritage Farms Dairy — Dairy Plant (Kroger-owned)
- **Address:** 1100 New Salem Highway, Murfreesboro, TN 37129
- **Confirmed center:** 35.83340, -86.41310
- **Imagery date (Street View):** 2026-03 · Satellite: Maxar/Airbs 2026
- **Method:** deep-audit (satellite probe 17-20 + Street View walk + web research)
- **Confidence:** HIGH

## Step 0 — Location confirmation
The supplied coords (35.833358, -86.413086) landed directly on a large
white-roofed industrial building ringed by trailers, with cylindrical milk
silos on its east face and wastewater treatment ponds at the SW corner —
unmistakably a dairy plant, not an office. Web search confirmed Heritage Farms
Dairy is Kroger's 24/7 dairy manufacturing plant at 1100 New Salem Rd,
Murfreesboro TN (sole national producer of Kroger Greek yogurt; supplies dairy +
OJ to TN/MS/AL/GA/AR). Street View at the frontage shows the "HERITAGE FARMS
DAIRY" monument sign and Kroger's "Fresh for Everyone" branding on the building,
plus Heritage Farms Dairy logo trailers. Location locked.

## Key views
- **z17/z18 overview:** Building sits slightly rotated (long axis ~NNW–SSE).
  Drop-yard trailer rows fan out on the N and W sides; docks + more trailers
  along the south face; milk silos on the E face; wastewater ponds at SW.
  Employee parking on the E (along New Salem Hwy) and far W.
- **z19/z20 entrance:** Truck driveway off New Salem Hwy with a wide paved apron,
  a chain-link sliding gate, cones marking lanes, and a small white windowed
  guard booth beside the lane. HFD trailers staged just inside.
- **Street View (pano qoLxZOYA2rYLsJYzemb2Tw, 2026-03):** Head-on at the gate
  confirms the sliding gate, the staffed guard booth, the monument sign, and a
  deep apron. The rest of the New Salem Hwy frontage is continuous chain-link
  fence fronting employee parking.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** Chain-link sliding gate across a controlled truck
  driveway off New Salem Hwy; lane cones; trailers staged inside. Clear checkpoint.
- **guardShack = TRUE.** Small white windowed booth (~1-2 vehicle footprint) set
  beside the gate lane — visible in SV headings 300/320 and z20 satellite. Not
  the main building.
- **remoteGs = FALSE** (a physical staffed booth is present).
- **dockDoors = 10-25** (~22 doors counted along the south building face under
  backed-in trailers; overhead count approximate).
- **postGateStaging = TRUE** (wide paved apron inside the gate).
- **drivewayLong = TRUE** (deep apron + internal road hold a 3+ truck queue).
- **backupSensitive = TRUE** (gate fronts a busy 4-lane divided highway near a
  signalized intersection — a queue would back toward the road).
- **fastLaneOpportunity = TRUE** (wide gate apron with unused paved width).
- **entryExitTogether = TRUE** (single shared gate driveway).

## Yard zones & counts
- **Perimeter:** 7-vertex oriented ring tracing the fenced property (building,
  drop yards, ponds, parking) ≈ 16.5 acres.
- **Drop yards (3):** large angled trailer-row blocks on the N, W, and S sides —
  50+ trailer stalls total (`dropYard: true`, `dropArea: 50+`).
- **Dock apron (1):** long thin quad hugging the south dock face.
- **Truck gate:** rotated quad over the entrance drive at the NE/E frontage.
- **Metrics:** dockDoors ~22 · trailersVisible ~95 · capacity ~130 ·
  truckGates 1 · buildings 3 (plant + treatment bldg + utility) · ~16.5 ac ·
  no rail.

## Web findings
Kroger-owned, 24/7/365 dairy + OJ plant; sole national producer of Kroger Greek
yogurt. Heavy outbound finished-goods truck traffic consistent with the large
trailer drop yard observed.

## Confidence
**HIGH** — facility positively identified, recent (2026-03) Street View directly
confirms gate + guard booth, satellite clearly shows drop yards and dock face.
Approximate items (exact dock-door count, in/out lane split, ship/rcv separation)
flagged in `uncertainFields`.
