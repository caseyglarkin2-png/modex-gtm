# Deep-Audit Dossier — idx 40 · Kroger Indianapolis Bakery

**Facility:** Indianapolis Bakery (Bakery Plant) — Kroger Manufacturing
**Address:** 6801 English Ave, Indianapolis, IN 46219
**Resolved center:** 39.759711, -86.048578
**Method:** deep-audit · **Confidence:** high

## Step 0 — Location confirmation
The supplied coords (39.759778, -86.048928) landed squarely on a large dark-roofed
industrial building. Web search confirmed 6801 English Ave = Kroger Bakery Indianapolis,
a food manufacturer (bread, cake, tortilla). The dark-roofed building on English Ave is
the **bakery plant** (audit target). A separate large **white-roofed building to the SE**
shares yard pavement but is a distinct Kroger DC — explicitly excluded from this audit, as
flagged in the prompt. The bakery is the western building cluster, with its dock face on
the NE wall and a large trailer drop yard immediately NE/E.

## Site setting
Indianapolis metro, inside I-465, dense industrial fabric (adjacent DC, a scrap/salvage
yard to the west, retention ponds and English Ave to the north). **Urban.**

## Entrance / gate / guard shack
- The truck entrance is a single drive off English Ave running ~300m south into the
  property between perimeter chain-link fencing on both sides ("Private Property / No
  Trespassing" signage).
- Street View (2024-05) at the entrance shows a **sliding chain-link gate** across the drive
  and a **small peaked-roof booth** (single-occupant footprint, windowed) standing beside
  the gate. → `truckGate: true`, `guardShack: true`, `remoteGs: false`. Booth is borderline
  kiosk-sized but read as a manned check-in/guard booth for a 24/7 food plant (flagged
  uncertain).
- The drive forks internally just inside the gate (entry + exit at one gate cluster →
  `entryExitTogether: true`), with a wide apron leaving paved room for an express bypass
  → `fastLaneOpportunity: true`.
- Gate sits far back from English Ave behind a long private drive → no public-road
  spillover (`backupSensitive: false`); long gate→dock approach (`drivewayLong: true`).
- No truck scale and no second checkpoint visible → `scale: false`, `multiStep: false`.

## Docks
NE wall of the bakery carries a long bank of loading-dock doors (clear rhythm of bays,
trailers backed in). Single dock cluster on one face → `shipRcvSeparate: false`.
Estimated ~35 doors → band **25-50** (honest overhead/SV estimate, flagged uncertain).

## Yard / drop area
A large drop yard fills the pavement NE/E of the plant — long angled rows packed with
60-80+ parked trailers, yard tractors actively spotting. → `dropArea: "50+"`,
`dropYard: true`, `postGateStaging: true`. trailersVisible ~70, capacity ~90.

## Geofence & metrics
- **perimeter** — 6-vertex oriented ring tracing the bakery parcel (building + its own drop
  yard) inside the fence, west of the shared DC pavement. ≈ **15 acres**.
- **truckGate** — quad over the gated entrance / booth area.
- **dropYards** — one ring over the NE/E trailer field.
- **dockAprons** — one thin quad hugging the NE dock wall at the building angle.
- **streetViewMeta** — both perimeter (pano `VAyw0Ewu6u8_VSYejnJ6vg`, heading 187) and
  truckGate (pano `cOQki6uOrb7TrWEw-mYalA`, heading 108) have 2024-05 coverage.
- No rail spur into the property → `railServed: false`. buildingCount 1, truckGateCount 1.

## Web findings
Kroger Bakery Indianapolis, 6801 English Ave — Kroger Manufacturing Division food plant
producing bread/cake/tortilla; phone 317-322-5000. Confirms a high-throughput in-house
production bakery feeding Kroger's distribution network, consistent with the heavy drop
yard observed.

## Final confidence: high
Facility unambiguously identified and street-view-confirmed. Gate and drop yard are clear.
Uncertain: precise guard-shack staffing (small booth) and exact dock-door count (banded).
