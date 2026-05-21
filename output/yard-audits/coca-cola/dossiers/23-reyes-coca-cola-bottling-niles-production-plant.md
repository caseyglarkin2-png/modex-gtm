# Deep-Audit Dossier — idx 23

## Reyes Coca-Cola Bottling — Niles Production Plant, IL

**Facility type:** Bottling / Manufacturing Plant
**Resolved location:** ~42.01620, -87.79500 — 7400 N Oak Park Ave, Niles, IL 60714
**Confidence:** High

## Location resolution
The roster-supplied coordinates (42.015774, -87.794489, ROOFTOP precision)
were accurate. Satellite probing showed a large industrial building cluster,
and Street View along the truck-yard frontage confirmed it conclusively:
**Coca-Cola and Sprite branded trailers** parked openly in the yard. This is the
**Reyes Coca-Cola Bottling Niles production plant** and also serves as Reyes
Coca-Cola Bottling's headquarters. The facility opened in 1964, was acquired by
Reyes in 2016, spans 365,000+ sq ft, and bottles 24M+ cases/year (hot-fill:
Vitamin Water, Powerade, Minute Maid; cold-fill: Coca-Cola, Sprite, AHA) for
the Midwest.

## Key views
- **Wide satellite (z16-17):** Large building cluster in an industrial park,
  bordered by woods/residential to the west and other industrial buildings to
  the east. Main production/warehouse building + a connected south warehouse +
  an office building.
- **Tight satellite (z18-20):** Trailer drop yard along the north/east side
  holds ~35 trailers in marked rows. Dock doors along the building faces with
  trailers backed in.
- **Street View (truck-yard frontage):** Coca-Cola and Sprite branded trailers
  parked along the open road frontage; wide open driveway entrances into the
  truck yard with no barrier, gate, or booth.
- **Street View (office side):** Open employee parking lot, no gate.

## Gate / guard-shack / dock determinations
- **Truck gate — FALSE:** This is an OPEN site. The truck yard fronts the public
  road with no perimeter fence, no barrier arm, no sliding gate, and no
  checkpoint pinch-point. Coca-Cola/Sprite trailers are parked openly within
  view of the road. Multiple wide open driveway entrances.
- **Guard shack — FALSE:** No guard booth anywhere on the perimeter — confirmed
  across multiple Street View headings.
- **Remote GS — FALSE:** No gate, so no remote check-in implied.
- **Docks — 25-50 band:** ~30 dock doors estimated along the building faces
  (flagged uncertain — partly obscured by trailers and rooftop angle).

## Yard zones & counts
- **Perimeter:** Reyes Coca-Cola campus — main building + south warehouse +
  office, roughly 28 acres.
- **Drop yard:** North/east trailer-parking area, ~35 trailers visible,
  estimated ~55-trailer capacity — dropYard true, dropArea 25-50.
- **Dock apron:** Building faces where trailers back in.
- **Staging:** Large open paved truck yard between the entrances and the docks
  gives ample internal staging — postGateStaging true, drivewayLong true.
- **Truck entrances:** Two open driveway entrances into the truck yard counted;
  in/out movement is split across separate openings — entryExitSeparate true.
- **Buildings:** Main production/warehouse + connected south warehouse + office
  — multipleFacilities true.
- **Rail:** No rail spur — railServed false (flagged uncertain).

## Web findings
- Reyes Coca-Cola Bottling Niles facility — 7400 N Oak Park Ave; opened 1964,
  acquired by Reyes 2016; 365,000+ sq ft; on track to bottle 24M+ cases/year;
  serves as Reyes Coca-Cola Bottling headquarters (Reyes Coca-Cola newsroom
  "Niles Facility Spotlight"; Niles Chamber).

## Final confidence
**High.** Identity, layout, and the open-site / no-gate determination are all
confidently established from accurate coordinates, clear satellite imagery, and
multiple Street View confirmations (including Coca-Cola/Sprite branded trailers).
Dock-door count and rail-served are flagged uncertain.
