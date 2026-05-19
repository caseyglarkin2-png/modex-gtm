# Deep-Audit Dossier — FedEx Freight Hub, Hagerstown MD HGR (idx 23)

## Facility
- **Name:** FedEx Freight Hub - Hagerstown MD (HGR)
- **Type:** Freight LTL hub service center
- **Address:** 16114 Transportation Cir, Hagerstown, MD 21740
- **Resolved coords:** 39.62500, -77.80350 (cross-dock building center)
- **Maps:** https://www.google.com/maps/@39.62500,-77.80350,400m/data=!3m1!1e3

## Location confirmation (Step 0)
The roster geocode (39.624991, -77.803108, ROOFTOP, movedMeters 12595) — a
large move — nonetheless landed correctly on the FedEx Freight HGR building.
Satellite probing (z16-z20) showed the unmistakable LTL hub form: one very
long, narrow cross-dock building with dock doors on both long faces,
surrounded by extensive trailer parking. Web research (FedEx Freight service
center page ccid=HGR, Callas Contractors project page) confirms 16114
Transportation Circle, Hagerstown as FedEx Freight HGR — described as **FedEx
Freight's largest terminal in North America**, with a Terminal/Office
building, a Truck Maintenance building, and extensive concrete paving.
2024 Street View shows the FedEx Freight logo on the building.

## Key views
- **z16/z17 overview:** Long SW-NE cross-dock LTL building, two dock aprons,
  huge trailer yard, highway along the N edge.
- **z19 dock view:** Continuous dock doors on both long faces with trailers
  and dollies parked along the aprons.
- **z20 gate (fedex-23-gate-z20):** SW entrance — guard booth in the truck
  lane, lanes splitting around it, directional arrows, lane markings.
- **Street View 2024 (sv3):** The decisive view — a gray windowed guard
  booth standing in the truck lane, chain-link security fencing with sliding
  gates across the lanes, bollards. The whole property is fully fenced.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled SW entrance: fully fenced perimeter,
  sliding gates across the truck lanes, lane markings, bollards.
- **guardShack = true.** A gray multi-window guard booth sits in the truck
  lane at the gate, inbound/outbound lanes split around it. Staffed booth —
  remoteGs = false.
- **dockDoors = 50+.** One very long LTL cross-dock building, continuous
  doors on both faces; FedEx Freight HGR cited at ~278+ doors, ~290
  estimated (flagged uncertain).
- **dropArea = 50+ / dropYard = true.** Hundreds of trailer stalls on both
  sides of the building.
- **fastLaneOpportunity = true.** Very wide gate apron, multiple lanes,
  abundant unused paved width.
- **multipleFacilities = true.** Two FedEx buildings — main LTL cross-dock
  terminal/office plus a separate truck-maintenance shop at the SW.

## Yard zones & counts
- **perimeter:** ~55 acres — the full fenced LTL hub property.
- **truckGate:** SW guard-booth/gate area.
- **dropYards:** two — N-side and S-side trailer parking fields.
- **dockAprons:** two — N and S faces of the cross-dock building.
- **staging:** wide paved apron at/before the SW gate.
- **yardMetrics:** dockDoorCount ~290, trailersVisible ~130,
  trailerParkingCapacity ~400, truckGateCount 1, buildingCount 2,
  siteAreaAcres ~55, railServed false — counts approximate, flagged.

## Web findings
FedEx Freight service center page (ccid=HGR): 16114 Transportation Circle,
Hagerstown MD 21740, M-F 8am-6pm, (877) 743-4440. Callas Contractors:
Terminal/Office building, Truck Maintenance building, extensive concrete
paving. Cited as FedEx Freight's largest terminal in North America.

## Confidence
**High.** Facility positively identified and confirmed by web sources. Gate,
guard booth, and fenced perimeter clearly visible in z20 satellite and 2024
Street View. Door/trailer counts are honest overhead estimates, flagged
uncertain.
