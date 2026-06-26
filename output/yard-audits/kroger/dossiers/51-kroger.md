# Deep-Audit Dossier — idx 51 — Kroger State Avenue Plant

- **Facility:** State Avenue Plant (Grocery Plant), Kroger
- **Address:** 1034 Depot St, Cincinnati, OH 45204
- **Resolved center:** 39.10900, -84.55050
- **Method:** deep-audit (probe.ts sat/sv) · **Confidence:** high

## Location confirmation (Step 0)
The supplied coords (39.109302, -84.550867) landed directly on a dense, contiguous
industrial complex of large connected manufacturing/warehouse buildings running NW-SE,
with trailers backed into docks and a central row of parked drop trailers — consistent
with a grocery manufacturing plant. Web search confirms **1034 Depot St = "Kroger
Manufacturing"** (the State Avenue Plant), open 24/7, a receiving/distribution +
manufacturing facility (Waze/Loc8NearMe/Chamber listings, Kroger Manufacturing Division
plant address list). Street View of the main entrance shows the historic white-brick
Kroger plant office flying multiple national flags — positively the right building.
The large tank/clarifier facility immediately east is the Mill Creek water-treatment
plant, NOT Kroger, and is excluded from the geofence.

## Key views
- **z16/z18 satellite:** Kroger block bounded by Depot St (W) and the rail/road corridor
  (E); residential hillside to W, water-treatment plant to E.
- **z18/z19 (full):** ~6 connected large buildings; central internal drive runs the
  length of the campus NW-SE with a row of angled drop trailers; an enclosed pedestrian
  bridge spans the drive; employee parking lot center-right.
- **z19/z20 (docks/yard):** trailers backed into dock doors on multiple building faces;
  ~10-12 angled drop trailers parked along the central drive.
- **Street View (entrance drive, pano rDyZ6MJsoWbAtfyRjfSPCA, 2022-07; Depot St,
  2024-09):** open driveways into the complex, on-street public parking against the
  building, no barrier/gate/booth.

## Gate / guard / dock determinations
- **truckGate: false** — Open urban plant on the city street grid. No barrier arm,
  sliding/swing gate, or checkpoint pinch-point at any entrance in Street View; no
  perimeter fence controlling the truck approach. Trucks enter via open drives off
  Depot St straight into the internal yard.
- **guardShack: false** — No staffed booth at any entrance.
- **remoteGs: false** — No gate, so no remote check-in implied.
- **dockDoors: 25-50** — ~30-40 doors across several building faces (estimate, flagged).
- **dropArea / dropYard: 10-25, true** — dedicated row of ~10-12 parked drop trailers
  along the central drive.
- **backupSensitive: true** — entrances open onto narrow public streets with tight
  urban geometry; a gate queue would spill into the street.
- **multipleFacilities: true** — campus of ~6 buildings + a separate southern warehouse.
- **railServed: false** — no active spur into the docks (legacy rail in the corridor only).

## Yard zones & counts
- **perimeter:** 7-vertex oriented ring tracing the contiguous Kroger block at its true
  NW-SE orientation → ~17.5 acres.
- **truckGate:** quad over the main entrance drive opening off Depot St.
- **dropYard:** quad over the central drop-trailer row.
- **dockApron:** quad hugging the central dock face.
- dockDoorCount ~35 · trailersVisible ~22 · trailerParkingCapacity ~30 · 1 main gate ·
  6 buildings · 17.5 ac · no rail.

## Final confidence
**High** on location, open-no-gate/no-guard verdict, urban setting, drop-yard and
multi-building campus. Dock-door exact count and ship/receive split are estimates from
overhead imagery (flagged in uncertainFields).
