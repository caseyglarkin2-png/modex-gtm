# Deep-Audit Dossier — Publix Grocery Distribution Center, Jacksonville FL

- **Facility (idx 7):** Publix Grocery Distribution Center Jacksonville FL
- **Type:** Grocery Distribution Center
- **Address:** 9786 W Beaver St, Jacksonville, FL 32220
- **Resolved center:** 30.31480, -81.81880
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied approximate coords (30.315412, -81.81737) landed directly on a large
white-roofed distribution building. A wide z15 pull showed a multi-building
industrial complex set between W Beaver St (a divided arterial) on the south and a
power-transmission / rail corridor on the north, flanked by residential
subdivisions. Web search confirmed the address as the **Publix Jacksonville
Distribution Center** (9786 W Beaver St, 904-781-8600), a grocery distribution
warehouse described as rail-and-highway accessible. Street View from W Beaver St
shows a **"Publix" monument sign** at the property frontage, positively confirming
the site. Center locked at 30.31480, -81.81880 over the campus.

## Key views
- **z15/z16 context:** Campus of two large DC buildings (a west building and an
  east/center building) plus a SW maintenance/trailer-shop structure and a
  distinctive zigzag-roofed admin/security building near the gate. Bounded N by the
  rail/power corridor, S by W Beaver St, with tree buffers E (toward a retention
  pond) and W.
- **z18 main building:** Long south-face dock bank with trailers backed in, paved
  apron, and employee parking below.
- **z19 west-building east face:** A very long continuous dock bank with ~30+
  trailers backed in this segment alone, plus striped trailer drop rows to the east.
- **z19 east-building south face + pond:** Full south dock bank over a large
  employee lot fronting the retention pond.

## Gate / guard-shack determination
- **Truck gate = TRUE.** The internal access road runs from the north road, crosses
  an **at-grade rail crossing** (crossbuck X signals + cantilever signal arm visible
  in Street View, April 2025), then reaches a **controlled checkpoint** just inside
  the property. z20 and z21 satellite show a **canopy structure spanning the lanes**
  with a **semi-truck and passenger vehicles stopped** at the control point, plus
  directional lane arrows and a landscaped median. This is a manned pinch-point, not
  an open driveway.
- **Guard shack = TRUE.** A distinctive **zigzag-roofed security/admin building**
  sits immediately beside the gate lanes on the inbound side, with vehicles queued
  at the checkpoint canopy. Classic staffed guarded entry.
- **remoteGs = FALSE** (a guard shack is present).
- **Entry/exit:** Single gate complex with split inbound (up-arrow) and outbound
  (down-arrow) lanes within the same checkpoint footprint → `entryExitTogether`.
  Estimated 2 in / 2 out lanes (medium confidence). Wide gate apron with unused
  paved width → `fastLaneOpportunity: true`.
- **Driveway:** Long/deep approach from the road through the rail crossing to the
  checkpoint, easily holding a 3+ truck queue → `drivewayLong`. A paved holding area
  exists inside the gate before the docks → `postGateStaging`.

## Yard zones & counts (honest overhead estimates)
- **Perimeter:** ~32.3 acres traced as an 8-vertex oriented ring following the
  fence/tree line around both building lots and the connecting yard. Chain-link
  perimeter fencing confirmed in Street View along the W Beaver St frontage.
- **Dock doors:** **50+** band. West building has a long east-face bank plus a
  south-face bank; east building has a full south-face bank. Total estimated ~140
  doors across the campus.
- **Drop area / drop yard:** **50+**. Extensive striped trailer drop rows with well
  over 100 parked trailers; two distinct drop-yard zones traced (one between the
  buildings, one SW of the west building). `dropYard: true`.
- **Trailers visible ≈ 180; trailer parking capacity ≈ 250** (large active grocery
  DC, drop-and-hook heavy).
- **Buildings:** 3 principal structures (west DC, east DC, SW maintenance building);
  zigzag admin/security building not counted as a DC.
- **Rail served = TRUE:** active rail line along the north edge with an at-grade
  crossing on the entrance road; corroborated by the directory listing.
- **Scale:** no clearly identifiable truck scale pad from overhead imagery — left
  false, flagged uncertain.

## Street View metadata
- **truckGate:** pano `ba70TEhy8FfAY1dNFB0fLw` (2025-04), heading 174° (camera on the
  north access road aimed south toward the rail crossing / gate complex).
- **perimeter:** pano `_w3EL1iYqzN9eOSlWCGSEg` (2025-12), heading 350° (camera on W
  Beaver St aimed north across the grass buffer / perimeter fence toward the docks).

## Web findings
- Publix Jacksonville Distribution Center, 9786 W Beaver St, Jacksonville FL 32220;
  phone 904-781-8600; grocery distribution warehouse, rail-and-highway accessible;
  on-site employee cafeteria; large workforce. Confirms facility identity and the
  rail-served call.

## Final classification summary
Guarded, gated, rail-served multi-building grocery DC campus in west Jacksonville:
manned gate + guard shack past an at-grade rail crossing, long approach with
in-gate staging, 50+ docks, 50+ trailer drop area on dedicated drop yards, separate
ship/receive dock clusters across two DC buildings, and fast-lane room at the gate.

**Confidence: high.** Uncertain: exact entry/exit lane counts and presence of a
truck scale.
