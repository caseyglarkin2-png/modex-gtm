# GM CCA - Memphis Processing Center, Memphis TN — Deep Audit

**Idx 30 · Type: CCA Parts Processing Center · Confidence: High**

## Location resolved
- **Address:** 5115 Pleasant Hill Rd, Memphis, TN 38118
- **Center:** 35.00885, -89.90035
- **Maps:** https://www.google.com/maps/@35.00885,-89.90035,400m/data=!3m1!1e3

The roster gave only "Memphis, TN." Web research resolved the GM Customer Care &
Aftersales (CCA / SPO) Memphis Parts Processing Center to **5115 Pleasant Hill
Rd, Memphis, TN 38118** (confirmed by GM/UAW Local 2406 location listings, GM
Authority's $14M-investment article, and a Panjiva import record literally
titled "Gm Cca Memphis, 5115 Pleasant Hill Rd"). Shelby County parcel
APN 09-4200-0-0465C records a **676,150 sq ft, 1-story building built 1999 on a
35.69-acre lot** — matching the large white-roofed distribution building on the
**east side of Pleasant Hill Rd**, which the supplied/geocoded pin lands on.
Positively the correct GM industrial building, not an office.

## What the imagery showed
- **Wide/overview (z16-17):** A long rectangular DC oriented roughly N-S
  (slightly rotated), occupying the parcel between Pleasant Hill Rd (west) and a
  creek + wooded buffer (east). Dock-backed trailers line BOTH the west and east
  faces.
- **West face (Street View, 2025-04, multiple headings):** Full bank of loading
  docks with dock levelers and trailers backed in, behind a **continuous
  chain-link perimeter fence** running the length of Pleasant Hill Rd. Office
  portion at the north end.
- **East/back face (z18 satellite):** A second full dock bank with dozens of
  mixed-carrier trailers (blue/teal/red/white) backed in, plus an **outer drop
  row** of staged trailers in the yard. Creek/woods beyond.
- **North loop (z20 satellite + Street View):** The single vehicle access is the
  loop driveway at the NE corner, connecting to Pleasant Hill Rd and opening onto
  marked visitor/office parking. No staffed guard booth identifiable.
- **SW corner (z19):** Marked trailer-parking stalls and the perimeter drive
  wrapping the back of the building.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Continuous fence along the public road; the property's
  yard and docks are sealed off, with one controlled loop-drive entrance at the
  north corner. (Evidence: fence visible in every west-facing Street View frame.)
- **guardShack = false.** No booth visible at the entrance in Street View or z20
  satellite; the throat opens onto visitor parking. Flagged uncertain.
- **remoteGs = true** (medium confidence) — gated/fenced with no staffed booth,
  implying badge/kiosk/app check-in.
- **dockDoors = "50+"** (~90 estimated). Dock banks on BOTH building faces, each
  with levelers and backed-in trailers. **shipRcvSeparate = true** — two distinct
  dock clusters on opposite faces.

## Yard zones and counts (estimates from overhead)
- **dockDoorCount ≈ 90**, **trailersVisible ≈ 120**, **trailerParkingCapacity ≈ 150**
- **truckGateCount 1**, **buildingCount 1**, **siteAreaAcres 35.7** (parcel record)
- **railServed = false** — no spur; creek/woods on the east edge, no tracks.
- Geofence: perimeter traced as an oriented quad on the parcel lines; truckGate
  quad over the north loop drive; two dockApron strips hugging the west and east
  dock walls; two dropYards (east outer trailer row + SW marked stalls).

## Web findings
- GM CCA / SPO Memphis PDC, opened 1999, ~259 employees (UAW Local 2406), ships
  ~331,700 orders/month; hub for ACDelco OE parts, EV chargers, and GM's
  eCommerce business. Received a **$14M investment (Jan 2023)** including an
  automated parts storage-and-retrieval system for EV readiness.

## Street View
- **perimeter** pano `SV0NGTBNDcwozb9G6nmW5A` (2025-04), heading 67° toward the
  west dock face / yard.
- **truckGate** pano `eeDFiro5tEfWwC_Qli9r1w` (2025-04), heading 110° toward the
  north loop entrance.

## Final confidence: High
Building and parcel positively identified and corroborated. Gate verdict and
dock bands are well-supported; guardShack/remoteGs and exact lane/door counts
are the only soft calls (flagged uncertain).

---
**Gate:** Fenced property, single controlled loop-drive entrance → truckGate true.
**Guard shack:** No staffed booth visible → false; remoteGs true (medium conf).
**Confidence:** High.
