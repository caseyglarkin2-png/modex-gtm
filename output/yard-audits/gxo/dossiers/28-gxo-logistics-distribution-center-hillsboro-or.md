# Deep-Audit Dossier — GXO Logistics Distribution Center, Hillsboro OR (idx 28)

## Facility
- **Name:** GXO Logistics Distribution Center - Hillsboro OR
- **Type:** Distribution Center
- **Roster address:** 2501 NE Century Blvd, Hillsboro, OR 97124 (incorrect)
- **Actual address:** 4800 NE 30th Ave, Hillsboro, OR 97124
- **Resolved coords:** 45.555200, -122.943800

## Step 0 — Location confirmation (required correction)
The roster coordinate (precision GEOMETRIC_CENTER) for "2501 NE Century Blvd"
landed in an Intel-campus parking lot with solar canopies in the Sunset
Corridor - not a distribution center. Research corrected this:
- Washington County tax record (parcel R2227009) lists owner **GXO Logistics
  Supply Chain Inc**, situs address **4800 NE 30th Ave, Hillsboro OR 97124**,
  legal "2021-018 Partition Plat, Lot 1", neighborhood Sunset Corridor.
- An OSHA inspection record (Dec 2023) confirms GXO Logistics at 4800 NE 30th
  Ave.
- A **GXO monument sign** is visible at the development entrance off NE 30th
  Ave in 2024-08 Street View - positive confirmation.
Coordinates relocated to the GXO building at the corrected address.

## Key views
- **z16 context:** Newer industrial development at the edge of the North
  Hillsboro Industrial Renewal Area; farmland on the south and east, mature
  industrial / tech development to the north and west. Brand-new road network
  (NE 30th Ave extension).
- **z17/z18 overview:** Two large modern white-roofed warehouse buildings facing
  each other across a shared central truck court. GXO occupies one (Perlo
  Construction: 270,000-360,000 sq ft concrete tilt-up, 27 dock doors, AutoStore
  robotic picking, completed ~2022).
- **z19 truck court:** Dock bands face the central court from both buildings;
  trailers backed in; marked trailer-parking stalls in the court interior.
- **Street View (2024-08):** New roads with sidewalks and fresh landscaping;
  NE 30th Ave street sign confirmed; GXO monument sign at the entry drive;
  building office face fronts NE 30th Ave with car parking.

## Gate / guard-shack / dock determinations
- **truckGate = false (low confidence).** The development entrance off NE 30th
  Ave is an open drive - no barrier arm, gate, or guard booth observed at the
  property entrance. Individual dock yards have low chain-link separators but
  no controlled truck checkpoint was visible. Flagged uncertain.
- **guardShack = false.** No booth.
- **remoteGs = false.** No gate.
- **dockDoors = "25-50".** Dock band on the truck-court face; 27+ doors per the
  Perlo project record.
- **dropArea = "10-25".** Marked trailer-parking stalls in the shared court.

## Yard zones & counts
- **perimeter:** GXO building parcel + dock court + parking, ~356 m × ~171 m
  ≈ 15 acres.
- **truckGate:** none distinct.
- **dropYard / dockApron:** shared central truck court with trailer stalls and
  the dock apron.
- **staging:** none distinct outside.
- **yardMetrics:** ~30 dock doors, ~12 trailers visible, ~30 parking capacity,
  1 truck gate (open), 1 GXO building, ~15 acres, not rail-served.

## Web findings
GXO Logistics confirmed at 4800 NE 30th Ave via Washington County Assessor and
OSHA. Perlo Construction's "Reilly West - GXO" project page describes a
270,000 sq ft ground-up concrete tilt-up DC with 27 dock doors, AutoStore
robotic package picking, backup generator and bio-swale, developed by Trammell
Crow, completed in under a year (~2022). CompStak lists a ~359,853 sq ft lease.

## Confidence
**Medium.** Building positively identified (GXO sign + county/OSHA records)
after correcting a wrong roster address. The site is a brand-new development;
2024-08 Street View is recent but the truck-court gate status and exact dock
count are honest estimates - flagged uncertain. Urban/Rural is borderline
(metro-edge industrial with adjacent farmland) - classified Urban as part of
the Portland-metro industrial fabric.
