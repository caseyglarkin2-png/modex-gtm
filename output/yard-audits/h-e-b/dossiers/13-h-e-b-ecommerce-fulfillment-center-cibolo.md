# Deep-Audit Dossier — H-E-B eCommerce Fulfillment Center, Cibolo TX (idx 13)

## Facility
- **Name:** H-E-B eCommerce Fulfillment Center - Cibolo
- **Type:** E-commerce Fulfillment Center (~55,000 sq ft, opened May 2024)
- **Address:** 850 FM 1103, Cibolo, TX 78108
- **Resolved coordinates:** 29.568700, -98.230100 (store/eFC building centroid)

## Step 0 — Location confirmation
Roster geocode (29.569315, -98.230771, ROOFTOP, moved 79 m) and web research
(H-E-B Newsroom, Grocery Dive, Community Impact) confirm the Cibolo eFC is
~55,000 sq ft and is **connected to the H-E-B Cibolo retail store at 850 FM
1103** (SEC of FM 1103 & Main St; H-E-B owns the 45-acre parcel). The store
opened Jan 25 2023; the eFC opened May 2024 (H-E-B's 8th eFC). The 2026-02
Street View pano at "850 ste 100" positively shows the built H-E-B store and
the eFC wing with a "curbside" sign and H-E-B delivery vans. Center locked at
the building centroid.

## Imagery limitation
Google satellite tiles for this site are STALE: at every zoom (z16-z20) they
show the site mid-construction (early foundation excavation / grading),
pre-2023. They cannot be used to count docks or trailers. The audit therefore
relies on:
- 2026-02 Street View (confirms the completed store + eFC, curbside area,
  H-E-B delivery vans, one box trailer near the building);
- the well-established H-E-B retail-store-attached-eFC layout pattern, which
  matches the Plano eFC (idx 12).

## Key views
- **Street View front (FM 1103, 2026-02):** H-E-B Cibolo storefront, "FRESH
  FOODS" entry canopy, customer parking.
- **Street View SW face:** "curbside" pickup signage, an H-E-B red delivery
  van — this is the eFC-adjacent face.
- **Satellite (stale):** building foundation footprint only — rectangular/
  L-shaped pad, store fronting west toward FM 1103, service area to the rear
  (east).

## Gate / guard-shack / dock determinations
- **truckGate = false.** No controlled freight gate visible and none is part
  of the H-E-B retail-store format. Truck access is a back-of-house service
  drive off the shopping-center parking-lot circulation. No barrier arm, gate,
  or checkpoint.
- **guardShack = false.** No staffed booth — not visible and not used at
  H-E-B store-attached eFCs.
- **remoteGs = false.** No truck gate exists.
- **Docks:** A rear-of-store dock, estimated ~4 positions (a little larger
  than a plain store dock because of the attached eFC). Banded **0-10**.
  Estimate — the rear is not directly observable.
- **Staging:** No paved staging; back-of-house service drive holds only 1-2
  trucks (drivewayShort = true).

## Yard zones & counts
- **perimeter:** the developed part of H-E-B's 45-acre FM 1103 & Main St
  parcel — store + eFC + customer parking. ~334 m × 290 m ≈ **24 acres**.
- **truckGate:** null — no controlled gate.
- **dockApron:** estimated rear-of-building dock strip.
- **dropYards / staging:** none.
- dockDoorCount ~4 (estimate); trailersVisible ~1; trailerParkingCapacity ~4;
  truckGateCount 1 (uncontrolled service drive); buildingCount 1;
  railServed false.

## Web findings
H-E-B Newsroom / Grocery Dive / Supply Chain Dive (May 2024): Cibolo eFC,
~55,000 sq ft at 850 FM 1103, H-E-B's 8th eFC, ~200 partners, serving Cibolo,
New Braunfels and surrounding San Antonio-area communities for Curbside and
Home Delivery. Community Impact: H-E-B Cibolo store opened Jan 25 2023 on a
45-acre parcel at FM 1103 & Main St.

## Confidence
**Medium.** The facility is positively identified and confirmed built and
operational via recent Street View, and the classification follows the
firmly-established H-E-B store-attached-eFC pattern (no freight gate, small
back-of-house dock). However, satellite imagery is stale and Street View does
not reach the rear dock, so dock-door and trailer counts are estimates —
flagged in uncertainFields.
