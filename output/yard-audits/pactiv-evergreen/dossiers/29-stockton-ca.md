# Pactiv Evergreen - Stockton CA (idx 29)

## Resolved location
- **Address:** 1110 Performance Drive, Stockton, CA 95206
- **Locked center:** 37.89400, -121.26035
- **Confirmation:** The roster ROOFTOP coordinate (37.894422, -121.260196) lands on a
  large rectangular distribution/warehouse building inside the Performance Drive
  logistics park on the south side of Stockton (near I-5/Hwy 99). Web research
  (Waze, Chamber of Commerce, IndustryNet) confirms Pactiv Corporation / Pactiv
  Evergreen at 1110 Performance Dr, Stockton CA 95206, a 24-hour foodservice
  packaging operation (paper cups & plates) with a co-located warehouse. The
  building has an office front and visitor parking on its NE face along
  Performance Drive and a long dock court along its SW face.
- **Confidence note:** This is a multi-building logistics park; the exact tenant
  footprint of 1110 was inferred from the ROOFTOP geocode and the office frontage
  rather than confirmed by readable on-site signage (Street View captures of the
  monument signs were washed out by sun glare). Overall confidence: medium.

## Site layout
- One large rectangular building running NW-SE, ~340 m x ~140 m.
- **NE face:** office entrance, employee/visitor parking, low monument sign, two
  open driveway cuts onto Performance Drive. Parking lot ringed by an ornamental
  fence.
- **SW face:** the truck dock court — a long bank of dock doors (~40) with
  trailers backed in, fronting a deep paved corridor.
- **Rail:** a multi-track rail spur runs the full length of the SW corridor right
  past the dock face and crosses the public street at the SE end (grade crossing
  with crossing signals visible in Street View).

## Gate / guard-shack determination
- **truckGate: true.** The SW dock corridor is enclosed by chain-link perimeter
  fencing; Mar-2026 Street View at the SE corridor mouth (where it meets the
  public street and the rail grade crossing) shows a sliding gate across the truck
  corridor entrance. The NE office frontage is open, but the truck/dock side is
  fence-and-gate controlled. Flagged in uncertainFields because the corridor is
  partly shared with the adjacent building and tenant boundaries in a multi-unit
  park are not perfectly crisp from imagery.
- **guardShack: false.** No staffed booth at the SE corridor gate or the NE office
  entrance — the corridor gate is an unmanned chain-link slider.
- **remoteGs: true.** There is a controlled truck entrance but no guard booth,
  implying badge / kiosk / call-box check-in.

## Yard zones and counts
- **Perimeter:** ~16.5 acres covering the building, NE office parking, SW dock
  corridor.
- **dockDoorCount:** ~40 (band 25-50) — estimate from bay rhythm; flagged uncertain.
- **trailersVisible:** ~22 across satellite passes (docks + corridor).
- **trailerParkingCapacity:** ~35 — the long fenced corridor holds well more.
- **truckGateCount:** 1 (SE corridor gate).
- **buildingCount:** 1 (one tenant unit within a larger multi-building park).
- **railServed:** true — active multi-track spur down the SW corridor.

## Web findings
Waze and business directories list Pactiv Corporation / Pactiv Evergreen at
1110 Performance Dr, Stockton CA 95206, phone 209-983-3111, open 24 hours,
foodservice packaging (paper cups & plates) with co-located warehouse. A Pactiv
Evergreen Facebook post references a Stockton CA foodservice facility achieving a
certification milestone.

## Final confidence: MEDIUM
Location resolved by ROOFTOP geocode and office frontage; facility type and
operations corroborated by web research. The truck gate is visible in Street View
but the corridor is shared in a multi-tenant park, so truckGate, dock-door count,
and lane counts are flagged uncertain. Rail service is clearly confirmed.
