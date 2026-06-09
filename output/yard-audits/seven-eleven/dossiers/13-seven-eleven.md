# Deep-Audit Dossier — 7-Eleven Grocery DC Fort Worth TX (McLane North Texas)

- **idx:** 13
- **Type:** Grocery DC
- **Address:** 7550 Oak Grove Road, Fort Worth, TX 76140 (Carter Industrial Park)
- **Resolved center:** 32.64015, -97.30985
- **Maps (satellite):** https://www.google.com/maps/@32.64015,-97.30985,400m/data=!3m1!1e3
- **Confidence:** high
- **Method:** deep-audit (satellite z15-z20 + Street View + web)

## Step 0 — Location confirmation

The supplied city-level coords (32.640398, -97.309625) landed squarely on a
very large white-roof distribution building running roughly N-S in the Carter
Industrial Park. Web research confirms the identity: McLane Company opened
**McLane North Texas** at 7550 Oak Grove Rd in March 2019, building out
~625,000 sq ft of a previously **vacant ~1.2M sq ft ex-Associated Wholesale
Grocers** warehouse/refrigeration plant on a **90.7-acre** parcel (FleetOwner /
Convenience Store News / Connect CRE / Fort Worth Business Press; Fort Worth
City Council incentive packet lists the 7550 Oak Grove Rd address). Ambient +
cooler + freezer capability; service territory DFW plus parts of OK, KS, AR, LA.
The building footprint, refrigeration plant on the roof, large dock banks, and
the adjacent paved trailer drop yard all match a grocery DC of this scale, so
the facility is positively identified. No coordinate correction needed — the
operational center sits at 32.64015, -97.30985.

## Key views

- **Overview (z15-z16):** Long N-S main DC building (with an attached
  cooler/freezer plant and a SW office wing) plus a large paved trailer drop
  yard immediately E of the building. A rail line runs N-S just E of the
  building; a separate large white-roof facility sits further E across a
  boundary road. Undeveloped grass (rest of the 90.7-acre parcel) lies E of the
  yard.
- **East face / drop yard (z18 @ 32.638,-97.3075 and z18 @ 32.64,-97.3068):**
  Continuous dock run on the building's E face with trailers backed in; broad
  paved drop yard W of the boundary road, densely filled with marked trailer
  stalls and parked trailers/containers. An in-yard trailer-maintenance shop
  and a fuel-island canopy sit mid-yard.
- **North edge (z19 @ 32.6431,-97.3075):** Enormous paved yard with marked
  trailer stalls and rows of parked trailers/bobtails; grass strip + road at the
  E perimeter.
- **SW/south face (z20 @ 32.64075,-97.31155 and SV):** Dock canopies on the
  S/SW face; precast perimeter wall on the W between McLane and the 7401 office
  building.
- **South frontage (SV @ 32.6367,-97.3071, 2023):** SW office/breakroom building
  behind a **black metal perimeter fence** — confirms a fenced property.
- **Entrance area (SV pano 3_3mZI03-fGvItei_Z28jA @ 32.64067,-97.31183, 2022):**
  Google's car drove in via the west entrance; frame shows the employee parking
  lot (US flags at the office), the open paved yard, trailers parked along the
  building, and the perimeter wall on the far W. No guard booth in view.

## Gate / guard-shack / dock determinations

- **truckGate = true.** The property is fenced/walled (black metal fence on the
  SE/E, precast wall on the W) with a single controlled vehicle/truck entrance
  off the N-S west road (Oak Grove Rd frontage) at ~32.6409,-97.3116, feeding the
  employee lot and the paved yard. No barrier arm is resolvable at the throat in
  2022-2025 imagery, but the site is clearly access-controlled, not an open
  drive-through.
- **guardShack = false / remoteGs = true.** No standalone 1-3-space guard booth
  is visible at the entrance in any satellite (z20) or Street View frame. The
  only small structures near the entrance are the SW office/breakroom modules and
  an in-yard maintenance shop + fuel island — none is a gate guard shack. A
  gated/fenced site with no guard booth implies kiosk/app/call-box check-in, so
  remoteGs = true. (Medium confidence — flagged.)
- **dockDoors = 50+.** Long continuous dock bank on the building's E face (~40+
  doors with trailers backed in) plus dock canopies on the S/SW face; total well
  into the 50+ band. dockDoorCount ~110 is an overhead estimate (exact count
  low-confidence).
- **shipRcvSeparate = true (medium).** Two distinct dock clusters on different
  building faces (E-face bank serving the drop yard; S/SW-face canopies).

## Yard zones & counts

- **Perimeter:** operational paved property (main building + drop yard + office),
  ~64 acres. Traced as a 6-vertex oriented ring; the undeveloped grass field E of
  the yard (part of the 90.7-acre parcel) is excluded.
- **truckGate zone:** entrance throat off the west road.
- **dropYard:** one large rotated quad covering the E-of-building trailer yard.
- **dockAprons:** E-face apron (long thin quad along the dock wall) + S/SW-face
  apron.
- **yardMetrics:** dockDoorCount ~110, trailersVisible ~100, capacity ~260,
  truckGateCount 1, buildingCount 3 (DC+plant+office as one main structure, plus
  yard maintenance shop and fuel canopy), siteAreaAcres ~64, railServed false
  (adjacent rail line, no spur into the building).

## Street View

Only the entrance/employee-lot area has Street View coverage (the 2022-11 drive-in
pano). Interior drop-yard and dock-apron centroids return ZERO_RESULTS, so those
zones have no pano. truckGate streetViewMeta uses pano 3_3mZI03-fGvItei_Z28jA,
heading 85° (camera aimed E into the entrance/yard).

## Web findings

- 625,000 sq ft built out of a vacant ~1.2M sq ft ex-AWG plant; 90.7 acres;
  opened March 2019; $18M build-out; ~400 center workers + 150 drivers.
- Ambient + cooler + freezer; serves 7-Eleven and other c-stores across the DFW
  metroplex plus portions of KS, OK, AR, LA.
- Fort Worth granted a ~50% / ~5-year property-tax abatement.

Sources: FleetOwner, Convenience Store News, Connect CRE, Fort Worth Business
Press, Fort Worth City Council location packet (apps.fortworthtexas.gov),
joinmclane.com/northtexas.

## Final confidence

**high.** Facility unambiguous and well-corroborated; layout, docks, drop yard,
and fenced perimeter read clearly from imagery. guardShack/remoteGs and exact
lane/dock counts are the soft calls (flagged in uncertainFields).
