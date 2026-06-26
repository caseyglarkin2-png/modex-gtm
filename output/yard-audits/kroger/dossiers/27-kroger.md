# Deep-Audit Dossier — #27 Springdale Ice Cream & Beverage Plant

**Facility:** Springdale Ice Cream & Beverage Plant (Kroger-owned manufacturer)
**Type:** Beverage Plant (ice cream + carbonated beverage / fluid milk manufacturing)
**Address:** 11801 Chesterdale Rd, Cincinnati (Springdale), OH 45246
**Resolved center:** 39.29125, -84.45040 · `method: deep-audit` · **Confidence: high**

## Step 0 — Location confirmation
Supplied coordinates (39.291439, -84.450499) landed directly on a large industrial
manufacturing building. Web research (LinkedIn "Springdale Ice Cream and Beverage,"
IndustryNet "The Kroger Co., Springdale Ice Cream & Beverage," company/chamber pages)
confirms a Kroger-owned plant opened 1965 producing Kroger Deluxe / Private Selection
ice cream and Big-K sodas, described as "minutes from I-275 East." Imagery matches:
I-275 runs along the north edge and Chesterdale Rd (NE-SW) along the east. Coordinates
were accurate; no relocation needed.

## Key views
- **z17/z18 overview:** Single large dark-roof manufacturing building with an attached
  white-roof cold-storage/freezer addition on the south/SE. I-275 to the north, employee
  parking lot to the east, grass buffers on all sides, fully fenced.
- **z20 W / SW dock face:** Rows of individual white canopies, each covering a single
  reefer trailer backed to a dock door — the classic cold-chain dock signature. Two banks
  (W face vertical row + SW face row).
- **z20 NE yard:** Large paved maneuvering/staging yard between the building's north face
  and I-275, with parked trailers, a tank/silo farm (milk/beverage) on the NW, and a long
  low gatehouse-style structure at the parking-to-yard boundary.
- **Street View (Chesterdale Rd, 2023-09, panos at 39.2905/-84.4479 & 39.2906/-84.4479):**
  continuous chain-link perimeter fence + guardrail along the road; plant building and
  parking visible behind the grass buffer; no open curb cut on that frontage.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The entire property is wrapped in continuous chain-link fence
  (verified in two Chesterdale Rd panos). Road frontage shows no open driveway, so trucks
  enter through a single controlled gated drive at the SE (parking/yard boundary). One
  truck gate.
- **guardShack = false / remoteGs = true.** No staffed booth could be positively resolved
  in available imagery. A long low gatehouse/canopy sits at the NE parking-to-yard
  boundary but cannot be confirmed as manned, so guardShack left false with remoteGs true
  (gate present, no confirmed booth). Both flagged uncertain.
- **Docks = 25-50.** ~25-35 canopied/uncovered dock positions across the W and SW building
  faces (each canopy = one reefer trailer/door). Shipping and receiving appear to share
  the same dock complex (shipRcvSeparate = false).

## Yard zones & counts
- **perimeter:** ~22-acre fenced operational footprint, oriented to I-275 (pentagon ring).
- **dropYard/staging:** NE paved yard for trailer drop/staging (postGateStaging = true,
  dropYard = true). dropArea banded 10-25.
- **dockAprons:** two rotated quads hugging the W and SW canopy dock walls.
- **truckGate zone:** quad at the SE parking/yard gate.
- **yardMetrics:** dockDoorCount ~30, trailersVisible ~35, capacity ~45, 1 gate,
  1 building, ~22 acres, no rail.

## Web findings
Kroger fluid-milk / ice-cream / soda plant since 1965; serves Cincinnati, Columbus,
Mid-Atlantic and Louisville Kroger regions; 78+ ice-cream flavors and 30 Big-K sodas.
A cold-chain manufacturing plant (reefer-heavy), not a pure DC.

## Setting & misc
- **urbanRural = Urban** — dense Cincinnati/Springdale industrial corridor on I-275.
- **railServed = false** — no rail spur; highway-served.
- **multipleFacilities = false** — one contiguous building (main + attached addition).

## Final confidence
**High** on location, gate-present, dock band, layout, urban setting. Uncertain (flagged):
guardShack/remoteGs (booth not positively resolved), entry/exit lane counts, scale.
