# Deep-Audit Dossier — Dallas Parts Distribution Center, Grand Prairie TX

**Account:** Daimler Truck North America · **Roster idx:** 15
**Type:** Parts distribution center
**Method:** deep-audit · **Confidence:** high

## Resolved location

- **Address:** 3010 Roy Orr Blvd, Suite 140, Grand Prairie, TX 75050
- **Locked center:** 32.797300, -97.031700
- **Maps:** https://www.google.com/maps/@32.797300,-97.031700,400m/data=!3m1!1e3

The roster rooftop geocode (32.797248, -97.031664) moved only 111 m and landed
directly on the correct building. Web research (Daimler careers location page,
DTNA Dallas PDC business listings) confirms the facility is the 275,000 sq ft
Dallas Parts Distribution Center, serving regional Freightliner / Western Star
/ Thomas Built Buses dealers. DTNA occupies Suite 140.

## Key views

- **Wide (z16):** An industrial district of Grand Prairie — a row of large
  distribution warehouses, an equipment-rental yard to the north, residential
  areas to the east, a creek/greenbelt to the west; Roy Orr Boulevard runs
  along the east side.
- **Pin building (z17-z18):** A long E-W warehouse, white roof. All dock doors
  on the south long face fronting a deep truck court; the north wall abuts a
  neighboring equipment-rental yard with no dock face.
- **South dock face (z19-z20):** Continuous dock-door rhythm; trailers backed
  into docks plus rows of angled trailer drop stalls in the truck court.
- **Truck-court entrance (z20 + Street View 2024-12):** A chain-link perimeter
  fence encloses the south truck court / dock yard; the driveway entrance has a
  controlled slide gate — a truck was captured mid-entry through the gate. No
  guard booth. A two-story office sits at the SE corner with car parking.

## Gate / guard-shack / dock determinations

- **Truck gate: TRUE.** A chain-link perimeter fence encloses the south truck
  court / dock yard, with a controlled slide gate at the driveway entrance.
  Street View shows a truck driving through the gate.
- **Guard shack: FALSE.** No booth structure at the gate or anywhere on the
  truck side.
- **Remote GS: TRUE.** A controlled truck gate with no guard shack — implies
  kiosk / badge / app check-in.
- **Dock doors: 25-50 band.** Single dock bank running the full length of the
  south face; estimate ~40 doors (flagged uncertain).
- **Drop area: 50+ band, dropYard TRUE.** The south truck court holds rows of
  angled trailer drop stalls in addition to trailers backed into docks.
- **Ship/Rcv separate: FALSE.** Docks are a single bank on the south face only.

## Yard zones and counts

- **Perimeter:** the building and its fenced south truck court, ~19 acres.
- **Truck gate zone:** best-effort box on the gated SE driveway entrance.
- **Drop yard:** the trailer drop stalls in the south truck court.
- **Dock apron:** the south truck court fronting the dock doors.
- **Staging:** none distinctly identified (null).
- **Metrics:** ~40 dock doors; ~55 trailers visible; ~80 trailer capacity;
  1 truck gate; 1 building; ~19 acres; not rail-served.

## Web findings

- Daimler careers / DTNA: Dallas PDC at 3010 Roy Orr Blvd Suite 140, Grand
  Prairie TX; 275,000 sq ft; described as a critical strategic node for
  delivering stock and mission-critical parts quickly.

## Final confidence

**High.** Facility positively identified by an accurate rooftop geocode and
corroborated by web research. The truck-gate determination is clear and strong
— recent (2024-12) Street View directly shows the fenced truck court with a
slide gate and a truck entering. Dock-door and trailer counts are honest
overhead estimates, flagged in uncertainFields.
