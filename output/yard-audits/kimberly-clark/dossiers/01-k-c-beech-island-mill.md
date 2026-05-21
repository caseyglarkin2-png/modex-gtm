# Deep-Audit Dossier — K-C Beech Island Mill (idx 01)

## Facility
- **Name:** K-C Beech Island Mill — Beech Island, SC
- **Type:** Integrated tissue & personal care manufacturing complex (Kimberly-Clark's largest plant globally — Scott, Cottonelle, Kleenex, Kotex, Huggies; ~2,000 employees)
- **Roster address:** 246 Old Jackson Hwy, Beech Island, SC 29842
- **Resolved center:** 33.41700, -81.89550

## Step 0 — Location confirmation
The roster lat/lng (33.417058, -81.896178, geocode moved 3.8 km) landed on the
correct property. A z16 satellite probe immediately showed an enormous
integrated industrial complex — multiple mill buildings, hundreds of trailers,
and wastewater treatment ponds — consistent with K-C's flagship mill. Street
View of the main entrance shows an illuminated digital "Beech Island" sign,
positively confirming the facility. Center adjusted to the building-mass
centroid.

## Key views
- **Wide z15/z16:** Sprawling campus — ~7 distinct large building masses, the
  main mill in the south-center, secondary buildings to the NE, and four large
  wastewater treatment ponds to the SW. Forest to the north, farmland/residential
  to the south and east.
- **Main entrance (z20 + Street View, 2026-03):** Divided entry road with
  2 inbound and 2 outbound lanes, landscaped median islands, a guard booth with
  a blue canopy in the median, and a red/white barrier arm across the lanes.
  Angled visitor parking just inside.
- **South dock face (z19):** Very long dock apron with trailers backed in along
  the main building's south wall, plus two parallel rows of angled drop-yard
  trailers — dozens of trailers in this zone alone.
- **North campus (z16/z19):** Extensive trailer-storage rows (hundreds of
  trailer footprints) plus a secondary building cluster with its own dock bank.

## Gate / guard-shack / dock determinations
- **truckGate = true:** Barrier arm across the divided truck/auto lanes at the
  Old Jackson Hwy entrance — confirmed in Street View and z20 satellite.
- **guardShack = true:** Distinct small staffed booth with a blue canopy seated
  in the entry median beside the barrier arm. Not the main building.
- **remoteGs = false:** A staffed booth is present.
- **Docks:** 90+ loading doors estimated across the south main-building face and
  the NE building — banded **50+**. Ship/receive run from physically separate
  dock clusters on different buildings → shipRcvSeparate = true.
- **fastLaneOpportunity = true:** Wide gate apron with 4 total lanes and unused
  paved width — room for an express bypass.

## Yard zones & counts
- **perimeter:** ~470 acres — whole fenced industrial property including the
  treatment ponds.
- **dropYards:** South dock-apron drop rows + the large north trailer-storage
  field. 300+ trailers visible across the campus; capacity ~450.
- **dockAprons:** South main-building apron and the NE building apron.
- **staging:** Paved area inside the gate before the building → postGateStaging.
- **buildingCount ≈ 7; railServed = false** (no rail spur visible into the
  property); **scale** not visible — flagged uncertain.

## Web findings
SC Governor's office and trade press (Naylor) corroborate this as K-C's largest
plant globally, ~2,000 employees, producing the full consumer-tissue and
personal-care lineup. A new automated regional DC (roster idx 2) was announced
adjacent to this plant in 2025.

## Confidence
**High.** Facility unambiguously identified; gate and guard shack confirmed in
both satellite and Street View. Dock-door count and presence of a scale are the
only soft figures, flagged in uncertainFields.
