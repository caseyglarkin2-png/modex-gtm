# Deep-Audit Dossier — idx 13

## Niagara Bottling - Jeffersonville IN

- **Type:** Bottling / Manufacturing Plant
- **Roster address:** 350 Logistics Ave, Jeffersonville, IN 47130
- **Roster coords:** 38.379939, -85.674977 (geocode ROOFTOP, moved 161 m)
- **Locked coords:** 38.37990, -85.67500
- **Confidence:** high

## Step 0 — Location resolution

The geocoded coordinate lands on a single large warehouse/manufacturing
building in the River Ridge Commerce Center. Identification is **confirmed**:
- A red **"Niagara"** wall sign is visible on the building's office front in a
  March 2026 Street View pano on Logistics Avenue.
- Web research confirms Niagara's Jeffersonville plant — 469,000 sq ft at 350
  Logistics Avenue, opened 2019, expanded with additional investment ~2020 and
  ~2023; bottles purified/vitamin-enhanced water and sports drinks.

## Steps 1–5 — What the imagery showed

- **Wide / tight satellite:** One large rectangular building oriented E–W.
  Process/utility equipment (cooling units, silos) clusters on the roof and at
  the NE corner — a clear bottling-plant signature. Employee parking on the E
  end near the office.
- **Dock face:** A single continuous, very long dock face runs the entire **S
  side**, densely lined with trailers backed in. Estimated ~80–120 doors →
  band **50+** (exact count low-confidence from overhead imagery).
- **Drop yard:** The S/W dock yard is packed with rows of parked trailers — a
  large dedicated trailer-storage yard → `dropArea = 50+`, `dropYard = true`.
- **Truck gate / guard shack:** No barrier arm, sliding/swing gate, or guard
  booth is visible anywhere along the property line. The S frontage on
  Logistics Avenue is open behind a grass berm; the truck driveway into the
  dock yard is uncontrolled. **truckGate = false, guardShack = false,
  remoteGs = false.** Confirmed in current (2026) Street View and satellite.
- **Staging:** No pre-gate staging. The deep dock apron and trailer yard give
  3+ truck post-gate stacking room → `drivewayLong`, `postGateStaging`.
- **Web findings:** $56M initial investment, ~49 jobs at open; later ~$37M
  expansion of two lines, ~27 added jobs by end-2023.

## Yard zones & counts

- **Perimeter:** ~34 acres; the dock yard fills most of the S/W parcel.
- **dockDoorCount:** ~100 (estimate, band 50+).
- **trailersVisible:** ~110.
- **trailerParkingCapacity:** ~150.
- **truckGateCount:** 1 (single uncontrolled driveway off Logistics Avenue).
- **buildingCount:** 1 (office integrated into the SE end).
- **railServed:** false — no spur into the property.

## Final confidence

**High.** Building identification is confirmed by on-building Niagara signage
and web corroboration. Gate/guard-shack call is confident from current Street
View and satellite (open, uncontrolled). Only the dock-door and trailer counts
are honest overhead estimates of a very large dock face.

### 3-line summary
- Gate verdict: NO truck gate — open, uncontrolled driveway off Logistics Ave.
- Guard-shack verdict: NO guard shack; no remote check-in kiosk visible.
- Confidence: high (signage-confirmed site; counts estimated).
