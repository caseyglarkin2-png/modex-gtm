# Deep-Audit Dossier — US PL Madison Factory (Primo / BlueTriton)

**Facility:** US PL Madison Factory · Bottling plant (PL)
**Resolved location:** ~690 NE Hawthorne Ave, Lee, FL 32059 (Madison County, FL)
**Locked center:** 30.47115, -83.25060
**Maps (satellite):** https://www.google.com/maps/@30.47115,-83.25060,400m/data=!3m1!1e3
**Confidence:** high

---

## Location resolution (the supplied coords were wrong)

The roster/reference label said "Madison, **WI**" with coords 43.0558, -89.3268 — that
is **downtown Madison, Wisconsin**, an office/civic area, not a bottling plant.

Web research corrected this: BlueTriton / Primo Brands (formerly Nestle Waters North
America) operates **three Florida spring-water bottling plants — Zephyrhills, Madison,
and High Springs.** The roster already lists Zephyrhills (FL) separately, so "US PL
Madison Factory" is the **Madison plant in Madison COUNTY, FLORIDA**, located near the
small town of **Lee, FL (32059)** at **690 NE Hawthorne Ave**. It is a 202-acre,
LEED-certified plant operating since January 2004, bottling Zephyrhills / Deer Park /
Nestle Pure Life from area springs (Madison Blue Spring).

Satellite at the geocoded address (30.4721, -83.2516) and across the compound shows a
large bottling/production building, an attached long warehouse, a stormwater retention
pond, and a 100+ trailer drop yard — exactly the freight footprint of a bottling plant,
confirming the identification. Sources: wwdmag.com (LEED), bluetriton.com/zephyrhills,
clustrmaps/Waze/TruckMap address records for 690 NE Hawthorne Ave, Lee FL.

---

## What the key views showed

- **z16 perimeter overview:** Isolated cleared compound in farmland/pine forest. NW
  production building + attached long E-running warehouse; green retention pond NE; a
  perimeter loop drive wrapping a huge southern trailer drop yard.
- **z18 entrance / NW:** Access drive enters from the W (Hawthorne Ave T-intersection)
  to a traffic circle, with two employee parking lots NE of the circle. A separate truck
  branch runs SE to the gate and yard.
- **z19–z21 gate:** A clear pinch-point on the internal truck drive (~30.4711,-83.2517)
  where the road narrows before the dock apron — paired gate posts/bollards and lane
  markings straddle the lane.
- **z18 south dock:** Continuous bank of ~40+ dock positions along the warehouse south
  face with trailers backed in; long striped drop-yard rows in front.
- **z18 east end / drop yard:** Multiple long parallel trailer rows extend ~400m east;
  loop drive curves back; replanted pine beyond. No rail spur anywhere.
- **Street View (pano qBUaKzwatxwDIfKCmixdXA, Jan 2008):** Down the entry drive looking
  SE/E — yellow safety bollards + a cantilever/barrier gate across the truck lane, dock
  face on the left, the long drop yard of trailers behind. No staffed booth in frame.

---

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE (high).** Street View shows a barrier/cantilever gate with flanking
  yellow bollards across the truck lane and painted lane markings; satellite z20-21
  corroborates the pinch-point and gate posts. This is a controlled truck entrance.
- **Guard shack — FALSE.** No 1-3-vehicle windowed booth beside the lane in any SV
  heading or in z21 satellite. The only small structure is an equipment pad in the SE
  yard apron, not a roadside booth.
- **Remote guard station — TRUE.** Gate present, no booth -> automated barrier with
  kiosk / call-box / badge / app check-in implied. Medium-high confidence.
- **Dock doors — 50+.** ~40+ along the warehouse south face plus ~10-15 on the production
  building south face -> ~55 total.
- **Drop area / drop yard — 50+ / TRUE.** Dedicated multi-row trailer-storage lot, ~100-130
  trailers visible, separate from the active dock apron.

---

## Yard zones & counts measured

| Metric | Value | Basis |
|---|---|---|
| Dock doors | ~55 (50+) | warehouse south face + production-building docks |
| Trailers visible | ~120 | drop-yard rows (multiple z18 crops) |
| Trailer parking capacity | ~150 | striped rows + apron space |
| Truck gates | 1 | single controlled entry |
| Buildings | 2 | production building + attached warehouse |
| Site area | ~60 acres (cleared compound) | perimeter polygon; ~202 ac total property is mostly forest |
| Rail served | No | no spur on property |

Geofences traced as oriented polygons: **perimeter** (cleared compound inside the loop
drive), **truckGate** (the gate pinch-point on the truck drive), one **dropYard** (the
long southern trailer lot), and two **dockAprons** (warehouse south face + production-
building south face). Street View metadata recorded for both perimeter and truckGate
using the on-site gate pano (qBUaKzwatxwDIfKCmixdXA): truckGate heading 112°, perimeter
heading 93°, both pointing from the pano toward the respective zone.

---

## Web findings

- BlueTriton/Primo (ex-Nestle Waters) runs 3 FL bottling plants: Zephyrhills, **Madison**,
  High Springs (bluetriton.com/zephyrhills; primobrands.com).
- Madison plant: ~202 acres in Madison County FL near Lee, operating since Jan 2004;
  Florida's first LEED-certified manufacturing facility; sources water from Madison Blue
  Spring (wwdmag.com; floridaspringscouncil.org; WWALS).
- Address 690 NE Hawthorne Ave, Lee, FL 32059 confirmed across clustrmaps, Waze,
  TruckMap, YellowPages, Manta business records.

---

## Final confidence: HIGH

Facility positively re-identified (corrected from a wrong WI label to the real Madison
County, FL bottling plant) and imagery is clear. Flagged as uncertain: guardShack /
remoteGs (older 2008 SV could hide a small booth), exact dock-door count, ship/receive
split, connectivity inference, and the exact cleared-acreage figure.
