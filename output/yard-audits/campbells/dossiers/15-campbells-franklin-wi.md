# Deep-Audit Dossier — idx 15 — Campbell's - Franklin WI

## Facility
- **Name:** Campbell's - Franklin WI (Late July tortilla chips; capacity expanded 2024)
- **Type:** Manufacturing - tortilla chips / baked snacks
- **Operating entity:** Baptista's Bakery, Inc. (a Campbell Snacks / Campbell's Company division)
- **Roster address:** 9999 South 60th Street, Franklin, WI 53132 — **incorrect**
- **Resolved address:** 4625 W Oakwood Park Drive, Franklin, WI 53132 (Franklin Business Park)
- **Locked coordinates:** 42.8594, -87.9863

## Step 0 — Location resolution
The roster pin (42.863254, -87.991311, RANGE_INTERPOLATED) landed in the
residential/industrial fringe west of the Franklin Business Park. Web research
confirmed the Late July / Baptista's tortilla-chip plant is at **4625 W Oakwood
Park Drive** — a ~250,000-300,000 sq ft plant where Campbell Soup Co. invested
$8M in 2024 to add tortilla-chip capacity (5 SKUs, +40 jobs). The previously
goldfish/pretzel plant now also runs tortilla chips.

Satellite probing located the largest single building in the Franklin Business
Park: a white industrial building with a curved-glass office wing at its NW
corner, at ~42.8594,-87.9863. Footprint measured ~205m x 114m = ~23,400 m²
(~252,000 sq ft) — a direct match to the reported plant size. The SW building
face has ~10 dock doors with trailers backed in — a food-plant dock layout.

Caveat: 2019 Street View showed a "Central" monument sign at the office wing
(likely a former office tenant; the 2019 imagery predates the 2024 Campbell's
tortilla expansion). Building footprint, dock layout, and Franklin Business
Park location all align with the Campbell snacks plant. **Identity confidence:
medium.**

## Key views
- **z18 site overview** — single large white building, curved office wing NW,
  parking W and NE, SW dock bank, road along the N edge.
- **z19 SW dock face** — ~9-10 trailers backed into docks; 3-4 free-standing
  trailers parked nearby; moderate-width apron with trees beyond.
- **z19/z20 W boundary** — open N-S paved drive from the road past parking to
  the dock apron; no gate.
- **Street View (2019)** — NW truck/parking driveway and NE office driveway are
  both open paved entrances; office front has a curved blue-glass facade.
- **z20 SE corner** — small material-handling/dock apron with stacked pallets.

## Gate / guard-shack / dock determinations
- **truckGate: FALSE** — Both road connections (NW truck drive, NE office drive)
  are open paved driveways. No barrier arm, sliding/swing gate, or checkpoint
  pinch-point. An open industrial-park facility.
- **guardShack: FALSE** — No booth structure at either entrance.
- **remoteGs: FALSE** — No gate, so no remote check-in implied.
- **Dock doors:** ~10 on the SW face plus a small dock/staging apron at the SE
  corner; total estimated 12-14 -> **"10-25"** band (low confidence on exact).
- **Drop area:** 3-4 free-standing trailers near the SW docks -> **"0-10"**;
  a small on-site drop yard exists (`dropYard: true`).

## Yard zones and counts
- **perimeter:** whole property incl. building, parking, dock apron, wooded
  buffer — ~16 acres.
- **truckGate zone:** the NW open driveway connection (best-effort box).
- **dropYards:** one small trailer cluster at the SW dock apron.
- **dockAprons:** SW main dock apron + SE corner staging apron.
- **dockDoorCount ~14, trailersVisible ~13, trailerParkingCapacity ~18,
  truckGateCount 2, buildingCount 1, railServed false.**

## Web findings
- BizTimes: Campbell Soup Co. $8M Franklin plant investment for tortilla-chip
  capacity (+40 jobs).
- Baptista's Bakery (Campbell Snacks division) HQ at 4625 W Oakwood Park Dr;
  300,000 sq ft plant; produces tortilla chips, multigrain chips, crisps.
- Baptista's also operates a separate 246,000 sq ft warehouse at 10000 S
  Franklin Drive (former Harley-Davidson) — a multi-building Franklin presence,
  but the audited plant is the single 4625 building.

## Final confidence
**Medium.** Building identity inferred from footprint/dock layout/location
match rather than a current signage read (2019 SV showed a former tenant).
Gate/guard-shack calls (both FALSE) are high-confidence from clear imagery.
Dock-door and ship/receive-separation counts are honest overhead estimates.
