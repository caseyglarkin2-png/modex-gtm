# Deep-Audit Dossier — idx 21

## DHL Supply Chain — DC — Etna OH
**Type:** Distribution Center
**Resolved location:** 127–143 Heritage Drive, Pataskala OH 43062 (Etna Township, Licking County)
**Locked center:** 39.96055, -82.71735
**Confidence:** high

## Step 0 — Location resolution
The roster entry had no address and no coordinates ("COULD NOT PIN DOWN exact
address"). Web research surfaced a business listing for **COTY/EXEL (DHL), 131
Heritage Dr, Pataskala OH 43062**, in Etna Township, Licking County — EXEL is
DHL Supply Chain's legacy brand and Coty is a known dedicated DHL customer.
Panjiva import records list the same building as "Dc Etna, 127-143 Heritage
Dr." The Google Geocoding API returned **ROOFTOP** precision for 131 Heritage
Drive (39.95984, -82.71752). Satellite probing showed a large white-roofed
distribution building; Street View of the south face read office unit **"138"**
— within the 127-143 range — positively confirming the building. Locked the
building center at 39.96055, -82.71735.

## Key views
- **Wide satellite (z15-17):** A row of big-box DCs in the Etna Corporate Park.
  The target is the white-roofed building; docks face WEST onto a shared truck
  court, employee parking on the south and east, retention pond to the north.
- **z18-20 dock face:** Continuous dock wall along the ~350 m west elevation
  with numerous trailers backed in. The truck court between this building and
  the neighbouring DC holds dropped trailers.
- **Street View (2024-08):** The south face (Heritage Drive) shows the office
  entrance "138" with car parking. Walking west along Heritage Drive, the truck
  driveway enters a fully chain-link-fenced truck court.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** A black cantilever **sliding gate** spans the truck
  driveway off Heritage Drive on the west side of the building. Confirmed from
  three Street View headings; the entire truck court is enclosed by chain-link
  fence.
- **Guard shack — FALSE.** No staffed booth (1–3-space footprint, multi-side
  windows) is visible beside the gate in any angle.
- **Remote gate system — TRUE.** Gated entry with no guard shack implies
  kiosk / call-box / app check-in.
- **Dock doors — 50+.** The west face is a continuous dock wall the full
  ~350 m length of the building; ~70 doors estimated (banded).
- **Drop yard — TRUE.** Dropped trailers stand in the fenced truck court;
  ~25–50 stall capacity, shared/adjacent with the neighbouring building.

## Yard zones and counts
- **Perimeter:** ~37.4 acres — building + west truck court + east/south
  parking.
- **Truck gate:** sliding gate on the SW, off Heritage Drive.
- **Drop yard:** fenced truck court on the west side.
- **Dock apron:** the dark paved strip along the west dock wall.
- **Staging:** short paved apron between Heritage Drive and the gate
  (pre-gate); the deep truck court serves as post-gate staging.
- **Metrics:** ~70 dock doors, ~28 trailers visible, ~45 trailer capacity,
  1 truck gate, 1 building, no rail.

## Web findings
- COTY/EXEL (DHL) business listing categorised "Storage"; driver reviews
  describe appointment-based loading/unloading ("runs by appointments… chock
  wheels, slide tandems, drop trailer") — consistent with a contract-logistics
  DC.
- Panjiva import records ("Etna Coty US", "Dc Etna 127-143 Heritage Dr")
  confirm active DHL/Coty distribution operations at the building.

## Final confidence
**High.** Building positively identified by address, geocode, and Street View
unit number. Gate and guard-shack calls are firm from clear 2024 imagery. Dock
count and drop-yard capacity are honest banded estimates and are flagged in
`uncertainFields`.
