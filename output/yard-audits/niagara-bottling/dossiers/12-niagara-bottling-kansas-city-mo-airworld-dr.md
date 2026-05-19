# Deep-Audit Dossier — idx 12

## Niagara Bottling - Kansas City MO (Airworld Dr)

- **Type:** Bottling / Manufacturing Plant
- **Roster address:** 11400 N Airworld Dr, Kansas City, MO 64153
- **Roster coords:** 39.299633, -94.675074 (geocode ROOFTOP, moved 103 m)
- **Locked coords:** 39.30040, -94.67520
- **Confidence:** medium

## Step 0 — Location resolution

The geocoded coordinate lands directly on a single large warehouse/
manufacturing building in the Congress Corporate Centre, immediately west of
Kansas City International Airport (KCI). Web research confirms this is
Niagara's **second KC plant** — ~634,000 sq ft, also described as Congress
Commerce Building B at the NW corner of NW 112th St and N Airworld Dr, opened
2021. The building footprint and isolated single-tenant siting are consistent
with that listing. Building identification is solid; the medium confidence is
driven by gate-detail uncertainty (see below).

## Steps 1–5 — What the imagery showed

- **Wide / tight satellite:** One long rectangular building oriented NW–SE,
  with all truck operations along the SW/W face. A detached office building
  sits to the S near the entrance road. The site is bordered by farmland and
  woodland on the W.
- **Dock face:** A single, continuous, very long dock face runs the entire
  W/SW side of the building, densely packed with trailers backed in.
  Estimated ~80–110 doors → band **50+** (exact count low-confidence).
- **Drop yard:** Trailers also fill the W dock apron and marked stalls along
  the perimeter road — a continuous on-site trailer yard, capacity well over
  50 → `dropArea = 50+`, `dropYard = true`.
- **Truck gate / guard shack:** The truck driveway off N Airworld Dr curves up
  to the SW dock apron. No barrier arm, sliding/swing gate, or guard booth is
  visible at the property line or along the approach in current satellite
  imagery. **truckGate = false, guardShack = false, remoteGs = false.** Street
  View on Airworld Dr is pre-construction (2014/2019 panos), so this rests on
  satellite — listed in `uncertainFields`.
- **Staging:** No pre-gate staging. The long curved entrance drive and deep SW
  apron give 3+ truck post-gate stacking room → `drivewayLong`,
  `postGateStaging`.
- **Web findings:** Niagara's second Kansas City facility, ~634,000 sq ft,
  opened 2021; the two KC plants together employ ~250; combined private-label
  bottled-water production for major retailers.

## Yard zones & counts

- **Perimeter:** ~31 acres (irregular parcel with woodland fringe).
- **dockDoorCount:** ~95 (estimate, band 50+).
- **trailersVisible:** ~62.
- **trailerParkingCapacity:** ~120.
- **truckGateCount:** 1 (single unguarded entrance off N Airworld Dr).
- **buildingCount:** 2 (plant + detached office).
- **railServed:** false — no spur into the property.

## Final confidence

**Medium.** Building identification is confident (geocode + web corroboration).
The gate/guard-shack determination relies on current satellite only because
Street View predates construction; no controlled entry is visible. Dock-door
and trailer counts are honest overhead estimates for a very large dock face.

### 3-line summary
- Gate verdict: NO truck gate — open curved driveway off N Airworld Dr.
- Guard-shack verdict: NO guard shack; no remote check-in kiosk visible.
- Confidence: medium (gate call from satellite only; large dock count estimated).
