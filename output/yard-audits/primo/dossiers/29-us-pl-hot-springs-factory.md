# 02 — US PL Hot Springs Factory (Mountain Valley / Primo Brands)

- **Type:** Bottling plant (PL)
- **Resolved location:** ~34.63215, -93.0693 — Mountain Valley Spring Water / BlueTriton (Primo Brands) bottling plant, **283 Mountain Valley Water Pl, Hot Springs Village, AR 71909**
- **Maps:** https://www.google.com/maps/@34.63215,-93.0693,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite; no Street View coverage)
- **Confidence:** medium

## Site resolution

The supplied coordinates (34.6332, -93.0672) landed in forest just **east** of the actual plant. A z16 sweep showed a building cluster to the lower-left; zooming in confirmed a large industrial bottling/warehouse complex with loading docks, a trailer yard, and a dedicated drop lot.

Web search clarified there are **two** Mountain Valley sites:
1. The **existing/legacy bottling plant** (this audit) at 283 Mountain Valley Water Pl — the active facility with imagery.
2. A **new ~200,000 sqft Primo Brands "Mountain Valley Factory"** that broke ground Oct 29, 2025 on Glazypeau Rd near Hot Springs Village, slated operational spring 2026. No usable satellite/Street View of the new build exists yet.

This audit covers the active legacy plant. Flagged in fieldNotes so the right facility can be re-audited once new-factory imagery exists.

## What the imagery showed

- **Layout:** Two primary connected industrial buildings on a cleared shelf inside dense forest. A larger **NE bottling/warehouse** building (process-tank yard on its south face — colored mix/process vessels, not docks) and a long **SW warehouse/load building**. A single private access drive winds ~0.4 km through trees from the N/NE to the yard.
- **NE building south face:** smaller dock/load cluster (~6-8 doors) beside the process-tank area, a few trailers backed in.
- **SW building SE/south face:** the main dock bank — a continuous row of ~14-16 numbered dock bays with box trailers and flatbeds backed in (clearest at z20, `s02-z20-swsouth*.png`).
- **Drop yard:** distinct trailer-storage lot at the SW tip of the property — diagonal rows of ~16-20 trailers parked without tractors, separate from active dock staging.
- **Internal apron:** a large open paved area between the two buildings serves as internal queue/staging before the docks.

## Gate / guard-shack determination

- **truckGate: false (low confidence).** No barrier arm, sliding/swing gate, or pinch-point checkpoint is visible at any captured entrance. The private drive enters the yard with no structure on it in-frame. A gate could plausibly sit further up the private drive outside the captured tiles — hence low confidence and listed in uncertainFields.
- **guardShack: false.** No booth-sized structure (1-3 vehicle footprint, multi-side windows) at the entrance.
- **remoteGs: false.** No confirmed gate, so no remote-checkin inference.
- **Street View:** ZERO_RESULTS at the yard, the entrance, and out to 400 m. It is a private, road-isolated rural site; no ground-level confirmation possible. `streetViewMeta` set hasCoverage:false for all zones.

## Yard zones & counts (honest estimates)

| Metric | Value | Basis |
|---|---|---|
| dockDoorCount | ~22 | ~14-16 SW bank + ~6-8 NE; sits on 10-25/25-50 boundary, banded **10-25** conservatively |
| trailersVisible | ~38 | ~14 SW docks + ~4 NE + ~18 drop yard + scattered |
| trailerParkingCapacity | ~50 | drop-yard rows ~30-40 + apron capacity |
| truckGateCount | 1 | single private access drive / entrance |
| buildingCount | 2 | NE + SW primary buildings (process/utility minor) |
| siteAreaAcres | ~17.5 | cleared/paved footprint inside treeline, from perimeter polygon |
| railServed | false | no spur enters the property |

## Classification highlights

- **dropYard: true**, **dropArea: 10-25** — clear dedicated trailer-storage lot at the SW tip.
- **postGateStaging: true**, **drivewayLong: true** — long private approach + deep internal apron hold a 3+ truck queue.
- **shipRcvSeparate: true (medium)** — two dock banks on two different buildings/faces; function not confirmable from above.
- **urbanRural: Rural**, **connectivityIssue: true (inferred)** — forested hills west of Hot Springs Village, no adjacent development, likely weak cellular.
- **scale / multiStep / multipleFacilities: false** — none visible.

## Web findings

- Primo Brands = 2024 merger of Primo Water + BlueTriton; Mountain Valley is a Primo brand.
- Mountain Valley spring water originates ~12 mi from downtown Hot Springs, west of Hwy 7 N.
- New 200k sqft factory groundbreaking Oct 2025 (Glazypeau Rd), three production lines, operational spring 2026 — distinct from this legacy plant.

## Final confidence: medium

Site identity is certain. Dock/yard layout is well-imaged. Downgraded from high because (1) gate presence cannot be confirmed (no Street View, possible gate up the private drive), (2) dock count sits on a band boundary, and (3) mixed imagery vintages across the dock tiles. Note the separate forthcoming Primo factory for a future re-audit.
