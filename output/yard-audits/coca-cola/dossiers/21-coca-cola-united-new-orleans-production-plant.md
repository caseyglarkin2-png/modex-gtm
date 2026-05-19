# Deep-Audit Dossier — idx 21

## Coca-Cola UNITED — New Orleans Production Plant, LA

**Facility type:** Bottling / Manufacturing Plant
**Resolved area:** Elmwood industrial park, 5601 Citrus Blvd, Harahan, LA 70123
**Best-estimate center:** ~29.94680, -90.19150
**Confidence:** LOW — exact building not positively confirmed; flagged for human review.

## Location resolution
The roster supplied address "12970 I-10 Service Rd, New Orleans" with
coordinates (30.05239, -89.95199). That point is in New Orleans East and
satellite probing showed a residential subdivision and a stadium beside I-10 —
**no industrial plant**, so the roster location is wrong.

Web research is consistent and clear on the correct facility:
- The Coca-Cola UNITED **"New Orleans Production Center"** (operated by Crescent
  City Coca-Cola Bottling Company UNITED) is at **5601 Citrus Blvd, Harahan, LA
  70123**, in the Elmwood industrial park (Coca-Cola UNITED location page;
  Visit Jefferson Parish; multiple chamber listings).
- It is the **largest Coca-Cola plant in Louisiana**, described in the NOLA.com
  article as a **12-story tower spanning the length of a football field**,
  handling ~750 Coke products; received an $18M upgrade completed 2024.

## What I could and could not confirm
- **Confirmed:** The facility is in the Elmwood industrial park along Citrus
  Blvd. Citrus Blvd is the road running along the Mississippi River levee on
  the south edge of the park (verified by Street View — levee berm visible).
- **Not confirmed:** Despite extensive satellite probing (z15-z20) and
  Street View walking of Citrus Blvd and many internal streets, I could not
  positively isolate the specific 12-story Coca-Cola building. The park is
  packed with hundreds of visually similar large warehouses, and a 12-story
  tower — likely an internal automated high-bay (ASRS) — is not clearly
  distinguishable in the near-nadir satellite imagery available.
- **Strongest positive signal:** A Coca-Cola-branded **"muster station"
  assembly-point sign** at a corner near 29.9461, -90.1928, beside a
  blue-privacy-fenced industrial facility with a small trailer yard. This marks
  a Coca-Cola property boundary but the building behind it reads as a
  mid-size warehouse, not the 12-story landmark.

## Gate / guard-shack / dock determinations
Cannot be reliably determined. No gate, guard shack, or dock face was confirmed
because the exact building was not isolated. All classification flags in the
JSON are low-confidence inferences from generic Elmwood industrial-park layout
and every field is listed in `uncertainFields`.

- **Truck gate:** Unconfirmed (recorded FALSE, uncertain).
- **Guard shack:** Unconfirmed (recorded FALSE, uncertain).
- **Docks / drop area:** Estimated only.

## Yard zones & counts
The geofence and `yardMetrics` are a **best estimate** centered on the building
cluster near the Coca-Cola muster-station sign — not a verified perimeter.

## Web findings
- Coca-Cola UNITED New Orleans Production Center / Crescent City Coca-Cola
  Bottling Company UNITED — 5601 Citrus Blvd, Harahan LA 70123; sales center +
  production facility + equipment refurbishment center + delivery fleet;
  serves 5,000+ customers across Greater New Orleans.
- Largest Coca-Cola plant in Louisiana; 12-story tower; $18M Elmwood upgrade
  completed 2024.

## Final confidence
**LOW.** The facility's general location (Elmwood, 5601 Citrus Blvd) is
established with confidence, but the exact 12-story building footprint could not
be positively confirmed from satellite or Street View. This site should be
flagged for human review to lock the precise building before its yard
classification is relied upon.
