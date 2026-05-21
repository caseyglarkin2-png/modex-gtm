# Deep-Audit Dossier — PFG idx 19

## Performance Foodservice - East Tennessee (Morristown TN)
**a.k.a. PFG Hale / Performance Foodservice Roma-Hale**
**Address:** 5262 S Air Park Blvd, Morristown, TN 37813
**Type:** Broadline Foodservice Distribution Center
**Resolved coords:** 36.17760, -83.37150
**Confidence:** High

---

## Location resolution
The roster pin (36.1689, -83.378725) landed on a small building near an
apartment complex south of the city — clearly not a broadline DC despite the
"ROOFTOP" geocode tag (metadata flagged a 2,625 m offset). Web research
established the facility is in the **East Tennessee Progress Center / Air Park
business area** adjacent to Moore-Murrell Airport (Morristown Regional, KMOR)
in southeast Morristown. Probing west of the airport runway revealed a large
multi-section white-roof distribution complex with a guarded truck entrance.
Street View at the entrance (April 2025) confirmed an industrial DC with a
barrier-arm gate. Locked center: 36.17760, -83.37150.

This is PFG Hale, the PFG East Tennessee broadline DC — roots in the 1925
Hale Brothers food-distribution company (merged into PFG 1989); also branded
Roma-Hale. ~230 associates serving 1,200+ customers. Subject of a Dec 2024
$33.2M / 37-job Hamblen County expansion announced by the State of Tennessee.

## What the imagery showed
- **z17 / z18 satellite (hazy Maxar imagery):** Large multi-section white-roof
  distribution building with several roof planes, a paved truck yard on the
  east/south, and rows of trailer parking on the east side. Sits between the
  airport runway/rail to the northwest and open fields to the east.
- **Street View (April 2025) at the entrance:** A clear truck gate — a small
  guard booth with a peaked roof and windows on multiple sides sits on a paved
  island in the driveway, with barrier arm(s) across the lane and painted lane
  markings splitting entry and exit around the booth. Chain-link perimeter
  fencing runs along both sides of the gate. The large white-roof DC building
  is visible beyond the gate.

## Gate / guard-shack determination
- **truckGate: true** — barrier-arm gate with lane markings and a gate island
  at the property entrance; perimeter fencing present. Unambiguous in Street
  View.
- **guardShack: true** — a dedicated small staffed guard booth (≈1-vehicle
  footprint, multi-side windows, peaked roof) on the paved island between the
  in/out lanes — a textbook guard shack.
- **remoteGs: false** — a physical manned booth is present, so not a
  remote/kiosk check-in.

## Yard zones & counts
- **Perimeter:** ~51.4 acres enclosing the DC, truck yard, and east trailer
  lot.
- **Truck gate:** single guarded entrance on the east side off the Air Park
  business-park road.
- **Dock doors:** 25-50 band — dock banks on the south/west building faces;
  imagery haze limits a precise count (~45 estimated, flagged).
- **Drop area / drop yard:** 25-50 band — trailer-parking rows on the east
  side hold parked trailers.
- **Post-gate staging:** large paved interior yard between the gate and docks.
- **Buildings:** 2 (main multi-section DC; counted conservatively — adjoining
  roof sections form one connected complex with one ancillary structure).
- **Rail:** a rail line runs near the airport to the NW but no spur enters the
  PFG property.

## Web findings
- PFG Hale / Roma-Hale; PFG East Tennessee broadline DC; 5262 S Air Park Blvd.
- Dec 2024: $33.2M expansion, 37 new jobs, announced by Gov. Bill Lee / TNECD;
  adding warehouse space.
- ~230 associates serving 1,200+ customer partners; one of five PFG broadline
  locations in TN (Morristown, Johnson City, Knoxville, Lebanon, Nashville).

## Setting
Rural — airport-adjacent East Tennessee Progress Center on the edge of
Morristown, surrounded by airport land, open fields, and woods.

## Final confidence: HIGH
Building positively identified and gate/guard-booth clearly confirmed in
April-2025 Street View. Satellite haze makes the dock-door and trailer counts
estimates only — flagged in uncertainFields.
