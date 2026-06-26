# Deep-Audit Dossier — idx 64

**Facility:** Home Chef Production Center, San Bernardino CA (Home Chef Facility — Kroger subsidiary)
**Address:** 1445 S Tippecanoe Ave, San Bernardino, CA 92408
**Resolved center:** 34.0756, -117.2579 (building footprint center)
**Method:** deep-audit · **Confidence:** high

## Step 0 — Building confirmation
The supplied approximate coords (34.075266, -117.257699) land directly on the large
gray-roofed tilt-wall building. Web research confirms this is Home Chef's West Coast
meal-kit production center at 1445 S Tippecanoe Ave: ~200,000 sqft (107,134 sqft
warehouse + 79,642 sqft food-prep + 17,907 sqft office), 32 ft clear height, ESFR,
**30 truck docks + 1 drive-in door**, ~300 jobs retained. Home Chef is a Kroger Co.
subsidiary. Street View shows the "Home Chef" logo and Suite 200 office entrance on the
building's NW frontage, removing any ambiguity. Right building, locked.

## Layout
- The building's **west wall faces S Tippecanoe Ave** (multi-lane divided arterial), set
  behind an employee parking strip.
- The **north wall is the dock face**: a long bank of dock doors with white trailers and a
  tractor backed in, opening onto an E-W truck court shared with the building to the north
  ("1385"). Company release = 30 docks → band 25-50.
- The **east side** is a fire lane / drive running N-S along a rail corridor; no docks back
  to it. A rail spur runs in that corridor but does NOT spur into Home Chef's lot
  (railServed = false).
- The **south wall** is blank tilt-wall fronting a south service road; a SW driveway gives
  secondary access.

## Gate / guard / docks
- **truckGate = true (remote).** Main truck entrance is the NW driveway off S Tippecanoe.
  Street View (Apr 2025) shows the lane **open at the property line — no barrier arm/gate**,
  but a **small check-in kiosk / call-box structure with orange traffic delineators sits
  just inside** the entrance. That reads as a controlled, remote check-in point.
- **guardShack = false / remoteGs = true.** No multi-window staffed booth; the entrance
  structure is kiosk-scale. Controlled entry without a manned shack = remote check-in.
- **dockDoors = "25-50"** (30 doors per company release; verified bank of doors with
  trailers backed on the north face).
- **dropArea = "0-10"** — a handful of drop trailers sit at the north docks; no dedicated
  trailer-storage lot (dropYard = false).
- **postGateStaging = true / drivewayLong = true** — the wide open truck court inside the
  entrance gives deep stacking (3+ trucks) before the docks.
- **fastLaneOpportunity = true** — the Tippecanoe gate apron is wide and open with room to
  add an express/bypass lane.
- **entryExitTogether = true**, single primary NW gate; a secondary SW driveway exists
  (truckGateCount = 2). entryLanes/exitLanes ≈ 1 each (uncertain).
- **urbanRural = "Urban"** — dense industrial fabric of San Bernardino, adjacent to the
  airport-area distribution corridor.

## Yard metrics
dockDoorCount 30 · trailersVisible ~9 · trailerParkingCapacity ~15 · truckGateCount 2 ·
buildingCount 1 · siteAreaAcres ~14.8 (from perimeter ring) · railServed false.

## Street View
Only S Tippecanoe Ave carries SV coverage (interior none). truckGate pano
`8-8YGWFdCuEBbKeXcKf1Pw` (heading 88° E toward the entrance kiosk); perimeter pano
`OKzMeUjpeuXgydL0y8hlXw` (heading 117° ESE). Both captured Apr 2025.

## Web findings
PRNewswire / Connect CRE / Inland Empire Business Journal corroborate the 200k sqft
state-of-the-art production center, 30 docks + 1 drive-in, concrete tilt-wall, 32 ft clear,
ESFR. Home Chef = Kroger subsidiary, operating in San Bernardino since 2015.

## Confidence
**High.** Building positively identified, dock count corroborated by company release,
entrance/kiosk verified in Street View. Uncertainty limited to exact lane counts, kiosk-vs-
shack nuance (called remote check-in), and drop-trailer capacity.
