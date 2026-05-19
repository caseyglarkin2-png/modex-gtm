# Deep-Audit Dossier — FedEx Ground Hub, Goodyear AZ (idx 18)

## Facility
- **Name:** FedEx Ground Hub - Goodyear AZ (Phoenix)
- **Type:** Ground regional distribution hub (~425K sq ft regional sortation
  with large package center)
- **Address:** 890 S 143rd Ave, Goodyear, AZ 85338
- **Resolved coords:** 33.43900, -112.37120 (building center)
- **Maps:** https://www.google.com/maps/@33.43900,-112.37120,400m/data=!3m1!1e3

## Location confirmation (Step 0)
The roster geocode (33.437941, -112.370658, ROOFTOP, movedMeters 1434) lands
in the right industrial park. Web research (City of Goodyear / Develop
Goodyear / In Business Phoenix) confirms FedEx Ground's 425,000 sq ft
regional sortation facility opened 2021 as **Building 2 of Prologis Commerce
Park at Goodyear**, a 4-building, 1.7M sq ft park ~20 mi W of downtown
Phoenix, just N of Phoenix Goodyear Airport. The FedEx building is the large
cross-dock structure at ~33.4390, -112.3712; FedEx logo confirmed on the
office front in 2024 Street View (sv12).

## Key views
- **z16/z17 overview:** Multi-building Prologis park; FedEx is the cross-dock
  building with trailer yards N and S of it.
- **z18 N side (fedex-18-north-z18):** Dock doors and a trailer drop yard
  along the building's N face.
- **z18 yard (fedex-18-yard-z18):** Large S-side trailer drop yard packed
  with parked trailers in rows.
- **Street View 2024/25 W road (sv7-sv10):** Yard enclosed by a tall black
  ornamental steel security fence; FedEx building behind. A Walmart trailer
  also seen parked in the yard.
- **Street View NE entrance (sv13/sv15):** Wide open paved apron/driveway —
  the truck entrance — with NO barrier arm and NO guard booth. Tractors with
  trailers parked at the apron.

## Gate / guard-shack / dock determinations
- **truckGate = false.** The single truck entrance (NE off 143rd Ave) is a
  very wide open apron/driveway. The yard has an ornamental security fence,
  but the truck driveway opening is uncontrolled — no barrier, no gate arm.
- **guardShack = false.** No staffed booth at the entrance — only a small
  sign post. remoteGs = false (no controlled gate exists).
- **dockDoors = 50+.** Cross-dock building, continuous doors on both N and S
  long faces; ~130 doors estimated (flagged uncertain).
- **dropArea = 50+ / dropYard = true.** Two large drop yards (N and S),
  well over 50 parked trailers.
- **shipRcvSeparate = true (medium).** Dock banks on two opposite building
  faces act as separate dock clusters — flagged uncertain.

## Yard zones & counts
- **perimeter:** ~38 acres — the FedEx parcel (Building 2) including N and S
  trailer yards, bounded by 143rd Ave (E), an internal road (W), and the
  public road / screening wall (S).
- **truckGate:** wide open NE apron entrance.
- **dropYards:** two — N of building, S of building.
- **dockAprons:** two — N and S building faces.
- **staging:** the wide NE apron inside the entrance.
- **yardMetrics:** dockDoorCount ~130, trailersVisible ~220,
  trailerParkingCapacity ~280, truckGateCount 1, buildingCount 1,
  siteAreaAcres ~38, railServed false.

## Web findings
City of Goodyear / Develop Goodyear: FedEx Ground 425,000 sq ft regional
sortation facility, up to 7,500 packages/hour, with a large package center
for oversized items; opened 2021, Building 2 of Prologis Commerce Park.

## Confidence
**High.** Facility positively identified and confirmed by web sources. The
open, uncontrolled truck entrance is clearly visible in multiple 2024/25
Street View frames. Door/trailer counts are honest overhead estimates,
flagged uncertain.
