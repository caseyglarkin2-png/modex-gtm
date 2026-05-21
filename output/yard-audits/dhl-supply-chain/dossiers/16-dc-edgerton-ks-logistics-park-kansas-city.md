# Deep-Audit Dossier — idx 16

## DHL Supply Chain - DC - Edgerton KS (Logistics Park Kansas City)

**Type:** Distribution Center (intermodal logistics park)
**Resolved location:** 32190 W 191st St, Edgerton, KS 66021 — building center ~38.78275, -94.95810
**Confidence:** high

## Step 0 — Location resolution

The roster coordinate (38.782224, -94.966252) landed ~1.1 km west of the
target, on open land beside the BNSF intermodal rail yard within Logistics
Park Kansas City (LPKC) — not a building. LPKC is a ~3,000-acre intermodal
hub with dozens of warehouses, so the specific DHL building had to be found.

Web research surfaced a consistent DHL Supply Chain address in Edgerton:
**32190 W 191st St** (YellowPages "DHL - Edgerton, KS 66021", Nextdoor "DHL
Supply Chain - Edgerton, KS", chamberofcommerce listing, phone 913-856-2414).
A satellite probe at the corrected point showed a large single-tenant
warehouse. Street View along W 191st St (Aug 2024 panos) showed the office
front carrying a prominent **HERSHEY** sign — this is a DHL Supply Chain
dedicated-customer DC operated for The Hershey Company. That matches DHL's
contract-logistics model and the directory listings, so the building is
positively identified as the DHL-operated site.

## Key views

- **z17/z18 satellite:** Single long rectangular warehouse, E-W axis,
  ~700 ft × ~200 ft. Office + employee parking on the south face fronting
  W 191st St; all loading docks on the north face.
- **z19 north face:** Continuous bank of dock doors with trailers backed in
  along the full north wall.
- **Street View (east driveway):** Open paved driveway, HERSHEY signage on
  building, address monument sign only — no barrier, no booth.
- **Street View (west driveway):** Open paved driveway, no barrier, no booth.

## Gate / guard-shack / dock determinations

- **Truck gate: FALSE.** Both driveways off W 191st St (one at each building
  end) are open paved drives with no barrier arm, sliding gate, or checkpoint
  pinch-point. Only small address monuments are present. Typical open-access
  LPKC spec building.
- **Guard shack: FALSE.** No staffed booth at either entrance; Street View
  shows open drives with no guard structure.
- **Remote GS: FALSE.** There is no truck gate, so remote check-in does not
  apply.
- **Dock doors: 25-50 band.** ~38-45 dock positions counted along the north
  face at z19 with many trailers backed in.

## Yard zones and counts

- **Perimeter:** ~338 m × ~217 m parcel = ~18.1 acres. Captures building,
  south office/parking, north truck court, and the east/west drive aisles.
- **Truck gate zone:** boxed at the west driveway entrance (best-effort; open
  access, not a controlled gate).
- **Drop yard:** marked trailer-parking area at the NW corner / north court,
  ~10-25 stalls (low confidence). A larger trailer lot further NW belongs to
  a separate parcel and was excluded.
- **Dock apron:** the paved strip along the north dock face.
- **yardMetrics:** dockDoorCount 42, trailersVisible 38, trailerParking
  capacity ~25, truckGateCount 2 (two driveways), buildingCount 1,
  siteAreaAcres 18.1, railServed false (no rail spur enters this parcel —
  the LPKC intermodal yard is ~1 km away and not connected to this building).

## Web findings

DHL Supply Chain operates a DC at LPKC in Edgerton. Multiple business
directories tie "DHL Supply Chain - Edgerton, KS" to 32190 W 191st St.
Building signage identifies the dedicated customer as The Hershey Company.
LPKC is a NorthPoint Development master-planned intermodal park adjacent to
the BNSF Kansas City intermodal facility.

## Final confidence

**High.** Building positively identified by address + Street View signage.
Gate/guard-shack calls are firm (clear Street View of both open driveways).
Dock and trailer counts are honest overhead estimates; dropArea and trailer
parking capacity flagged as lower-confidence.
