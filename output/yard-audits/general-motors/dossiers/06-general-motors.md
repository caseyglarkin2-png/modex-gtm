# Deep-Audit Dossier — GM Bowling Green Assembly, Bowling Green KY

**Facility:** GM - Bowling Green Assembly Plant (Chevrolet Corvette)
**Address:** 600 Corvette Dr, Bowling Green, KY 42101
**Resolved centroid:** 37.0103, -86.3658
**Type:** Vehicle Assembly Plant (~1.7M sq ft, opened 1981)
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** medium

---

## Location confirmation

The supplied city-level coordinates (~36.99, -86.43) landed in downtown Bowling
Green, well off the plant. Web research placed the plant at 600 Corvette Dr off
I-65 Exit 28, directly across from the National Corvette Museum (≈37.0089,
-86.3738). Satellite probing at that point revealed the massive white-roofed
assembly complex on the east side of the frame, the round National Corvette
Museum to the SW, and the NCM Motorsports Park road course to the SE.

Positive ID confirmed by Street View off the south frontage: the building face
carries a large **"PROUDLY ASSEMBLED IN BOWLING GREEN"** Corvette mural (C8 car
+ wheel + taillights + Corvette flags logo). Combined with the I-65 Exit 28
position, the museum across the street, and the motorsports track, this is
unambiguously the GM Bowling Green Assembly Plant. True building centroid locked
at 37.0103, -86.3658.

## What the key views showed

- **Wide (z15-16):** One large integrated assembly building oriented NW-SE, with
  a long production wing reaching NW toward the CSX rail corridor. Employee
  parking on the west and south; finished-Corvette storage lots on the east.
  I-65 hugs the south edge.
- **South frontage (z18-19 + Street View):** Main employee/visitor entrance and
  security lobby at south-center, large salaried parking, the Corvette mural on
  the building face. This public-facing entrance is open employee parking, not
  the truck gate.
- **NW / North (z17-18):** CSX mainline runs along the north edge with a siding
  curving toward the plant's NW corner — rail-served. A utility substation sits
  NE outside the building.
- **SW (z18-19):** Wastewater treatment tanks; the materials/truck approach and
  enclosed truck wells feed the NW/W building face. A modest trailer
  drop/marshalling area (~14 trailers visible) hugs the NW face for
  just-in-time / just-in-sequence parts.
- **East (z18):** Rows of finished Corvettes in dispatch storage lots — the
  shipping side, physically separate from the NW receiving side.

## Gate / guard-shack / dock determinations

- **truckGate: true (uncertain).** Secured GM campus with fenced/buffered
  perimeter and a controlled materials approach running in from the SW frontage
  to enclosed truck wells. Public Street View panos sit on the south frontage
  and employee-lot loops and do not reach the interior truck gate, so the gate
  is inferred from layout + standard GM plant security rather than directly
  imaged.
- **guardShack: true (uncertain) / remoteGs: false.** Held on plant-class
  precedent (GM assembly plants staff security gatehouses at truck entrances);
  the booth could not be crisply isolated overhead and is unreachable by Street
  View. Flagged uncertain.
- **dockDoors: "10-25" (uncertain).** Materials docks are largely enclosed truck
  wells integrated into the NW/W face, not an open banked dock wall; ~20-25 door
  positions estimated from canopies, roof penetrations and staged trailers.
- **shipRcvSeparate: true.** Inbound parts on the NW/W truck-well side; finished
  Corvettes dispatch from the opposite E/SE side by the vehicle storage lots.

## Yard zones and counts

- **perimeter:** 8-vertex ring tracing the fenced property (building + employee
  parking + finished-vehicle lots + north rail buffer). ~235 acres.
- **truckGate:** small quad at the SW frontage materials approach.
- **dropYards:** one ring — the NW-face JIT/JIS trailer marshalling strip.
- **dockAprons:** one ring along the NW/W truck-well face.
- **streetViewMeta:** truckGate pano `QvxE3Y0xBGNNMmMgMlOdaA` (2023-05, south
  frontage, heading ~6° toward building); perimeter pano
  `DrC_CnhoEgpDBk8vKD7WCQ` (2023-05, SW frontage, heading ~39° toward building).
- **yardMetrics:** 22 dock doors (est.), 14 trailers visible, ~40 trailer
  capacity, 1 truck gate, 2 buildings, ~235 acres, rail-served.

## Web findings

GM media + Wikipedia + GM Authority: Bowling Green Assembly is GM's sole Corvette
plant, ~1.7M sq ft, ~1,000 employees, building the C8 generation (incl. ZR1).
Described by GM as "a marvel of logistics" with just-in-time/just-in-sequence
parts delivery to the line — consistent with the modest on-site trailer
marshalling rather than a large standalone drop yard. CSX rail serves the
Bowling Green industrial area along the north corridor.

## Final confidence

**Medium.** Facility identity is high-confidence (mural + position + museum +
track). Gate/guard-shack and exact dock/trailer counts are inferred from
overhead layout and plant-class precedent because Street View cannot enter the
secured campus and the docks are enclosed — these are flagged in
`uncertainFields`.

---

**3-line summary**
- Gate: truckGate TRUE — secured fenced GM campus, controlled SW materials approach (interior gate not directly imaged; inferred).
- Guard shack: TRUE but UNCERTAIN — plant-class precedent; booth not isolatable overhead, Street View cannot reach it.
- Confidence: MEDIUM (identity high; gate/dock/trailer specifics inferred).
