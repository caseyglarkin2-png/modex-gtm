# Deep-Audit Dossier — KDP Beverage Plant, Victorville CA

**Roster idx:** 5
**Facility type:** Manufacturing - Beverage
**Roster address (incorrect):** 16200 Nisqualli Rd, Victorville, CA 92395
**Resolved address:** 18180 Gateway Dr, Victorville, CA 92394 (Southern California Logistics Airport)
**Resolved coordinates:** 34.584000, -117.395500
**Confidence:** Medium

## Location confirmation
The roster pin (34.485332, -117.310196, RANGE_INTERPOLATED) landed in a
Victorville residential neighborhood with a school — clearly not a beverage
plant. Web research corrected this: the KDP (former Dr Pepper Snapple) West
Coast production and distribution plant is at **18180 Gateway Drive**, inside
the Southern California Logistics Airport (SCLA, the former George Air Force
Base) NE of Victorville. Confirmed via Beverage Industry, ReliablePlant, ARCO
National Construction, and Yelp/CalStateDir/Waze listings. The plant is ~850,000
sq ft (≈300k sq ft production + ≈550k sq ft warehouse) on 57 acres, opened
~2010-2011 on a ~$150M investment; it produces Snapple, Mott's, Hawaiian Punch,
Clamato, ReaLemon and other KDP brands. Location locked at the SCLA building.

## Key views
- **z14-z16 satellite:** SCLA — runways plus a row of large logistics/warehouse
  buildings on the W side. The KDP building is the large cream-roof building
  with a round-tank process farm at its SW corner.
- **z18-z19 W side:** Long W dock bank with many trailers backed in, wide truck
  court.
- **z18-z19 N side:** A very large trailer drop yard — dozens of trailers parked
  in rows on a graded lot — plus a long N dock bank.
- **z19-z20 SW corner:** Office area, employee parking, process tank farm.
- **May 2025 Street View (W/SW road frontage):** Continuous chain-link perimeter
  fence with privacy screening along the full building length; process
  equipment / cooling structures; trailers staged inside the fence; entrance
  infrastructure near the SW.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE (uncertain).** The plant is fully enclosed by a chain-link
  perimeter fence (confirmed in multiple 2025 Street View frames). A fenced
  production plant of this scale has controlled truck access. Classified TRUE on
  the continuous perimeter fence and entrance infrastructure, but flagged
  uncertain — no crisp close-up of the gate barrier was obtainable.
- **Guard shack: TRUE (uncertain).** A large fenced beverage manufacturing plant
  (~200 employees) of this type typically staffs the truck entrance; structures
  consistent with entrance check-in are visible near the SW in Street View.
  Flagged uncertain — the booth could not be definitively resolved overhead.
- **Remote GS: FALSE.** Guard shack assumed present.
- **Dock doors: 50+ band.** Long dock banks on both the W and N faces; ~60-80
  doors estimated. `shipRcvSeparate` true — two distinct dock clusters.
- **Drop yard: TRUE, dropArea 50+.** Very large N-side trailer drop yard,
  ~100+ trailers parked in rows.

## Yard zones and counts
- **Perimeter:** The full ~57-acre fenced site — building, W truck court, N drop
  yard, SE employee parking, SW process tank farm.
- **Truck gate zone:** SW entrance area off Gateway Dr.
- **Drop yard:** Large N-side trailer storage lot — boxed.
- **Dock aprons:** W building-face apron and N building-face apron — both boxed.
- **Building count:** 1 large building (process tank farm at SW counted as part
  of the plant, not separate). **Rail:** none — no spur into the property.
- `drivewayLong` true; `postGateStaging` true (deep truck court);
  `fastLaneOpportunity` true (wide court).

## Web findings
- Beverage Industry / ReliablePlant: Dr Pepper Snapple opened the SCLA West
  Coast production + distribution facility (~$120-150M; 850k sq ft; 57 acres;
  ~200 jobs; ~40M cases/yr).
- ARCO National Construction: designed/built the 860,200 sq ft FDA-certified
  beverage production and distribution facility.
- The plant does not produce Dr Pepper itself but a range of other KDP brands.

## Final confidence
**Medium.** Location is firmly corrected from a bad roster pin and verified
against multiple sources, and the overall layout (single ~850k sq ft fenced
plant, large W/N dock banks, very large N drop yard, no rail spur) is clear. The
truck-gate and guard-shack calls are positive — driven by the confirmed
continuous perimeter fence and the scale of the operation — but flagged
uncertain because the gate barrier and booth could not be crisply resolved in
the available imagery. Dock-door and trailer-capacity counts are
order-of-magnitude estimates.
