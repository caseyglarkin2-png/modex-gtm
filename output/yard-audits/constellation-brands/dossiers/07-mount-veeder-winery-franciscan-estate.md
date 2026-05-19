# Deep-Audit Dossier — Mount Veeder Winery / Franciscan Estate (idx 7)

**Account:** Constellation Brands
**Facility:** Mount Veeder Winery / Franciscan Estate — Napa, CA
**Type:** Winery / Production Facility (in practice: hillside vineyard estate)
**Address (roster):** Mount Veeder area, Napa, CA — vineyard at 1999 Mount Veeder
Rd; tasting at 930 3rd St, Napa 94559
**Resolved coords:** 38.360450, -122.401900 (Mount Veeder estate building)
**Confidence:** Medium

## Step 0 — Location confirmation
The roster coordinates (38.298851, -122.282898, ROOFTOP) landed in downtown
Napa on the Napa River — the urban tasting room location (930 3rd St), not a
production site. Web research established the relevant estate is the hillside
vineyard at 1999 Mount Veeder Road. Geocoded that address via the Google
Geocoding API to 38.3606213, -122.4017761 (ROOFTOP) and audited there.

Satellite probes (z17-z19) confirmed a terraced mountain vineyard estate in the
Mayacamas Range: blocks of contoured vineyard on forested slopes, a small
irrigation pond, and a single modest estate building reached by dirt access
tracks. Street View on Mount Veeder Road showed only a narrow rural mountain
road with deer fencing — no commercial entrance.

## Facility nature — important
Mount Veeder Winery is a Constellation brand, not a standalone freight facility.
Web research (Napa Wine Project, Napa Valley Register): Mount Veeder's wine has
historically been made at the Franciscan facility on Galleron Road — the same
building now operating as The Prisoner Wine Co. (idx 6 in this batch).
Franciscan Estate as a brand was sold to E&J Gallo in 2021 and is no longer
Constellation-owned; Mount Veeder remains in Constellation's premium portfolio.
The 1999 Mount Veeder Road site is a vineyard estate with one small building —
there is no truck-yard, dock bank, or trailer operation here.

## Key views
- **z17 wide:** Terraced hillside vineyard blocks, dense forest, a small dark
  irrigation pond, a few small structures near the center.
- **z19 tight:** One modest building (estate winery/barn) with a dirt yard
  clearing beside it; dirt/gravel access roads; no paved truck infrastructure.
- **Street View (Mount Veeder Rd, 2024):** Narrow two-lane rural mountain road,
  deer fencing along the vineyard, no gate or commercial driveway treatment.

## Gate / guard-shack / dock determinations
- **truckGate: false** — Access is an unimproved one-lane dirt track off Mount
  Veeder Road; no barrier arm, gate, or checkpoint.
- **guardShack: false** — No booth anywhere on the property.
- **remoteGs: false** — No gate exists.
- **dockDoors: NONE** — No loading docks; single small estate building only.
- **dropYard / dropArea: false / NONE** — No trailer storage or parking.

## Yard zones and counts
- **Perimeter:** ~60-acre estimate of the vineyard estate parcel; the built
  footprint is a tiny fraction of that.
- **truckGate / dropYards / dockAprons / staging:** none — left null/empty.
- **yardMetrics:** 0 dock doors, 0 trailers, 0 trailer capacity, 0 truck gates,
  1 building, ~60 acres, not rail-served.

## Web findings
Constellation acquired Franciscan Winery in 1999, which included Mount Veeder
Winery. Constellation closed the Galleron Road Franciscan property in 2017 and
reopened it in 2018 as The Prisoner Wine Co. tasting room. Mount Veeder wine
production occurs at shared Constellation premium-wine production capacity, not
at the Mount Veeder Road estate. The estate functions as an estate vineyard.

## Final confidence
Medium. The estate vineyard was positively located and clearly is not a
truck-yard facility — the no-gate/no-dock classification is firm. Confidence is
held at medium because this is a brand/vineyard rather than a discrete
production-and-shipping facility; the relevant trucking activity (if any)
belongs to a shared Constellation production site, and the connectivity and
area estimates are inferred.
