# Yard Audit Dossier — Amazon SCK6 Sortation Center, Tracy CA (idx 16)

**Method:** deep-audit (satellite + Street View) · **Confidence:** high

## Resolved location
- **Address:** 1500 E Grant Line Rd, Tracy, CA 95304 (95376 also used)
- **Confirmed center:** 37.751800, -121.403500
- **How confirmed:** Supplied coords (37.752275, -121.402884) landed on the
  north car-parking apron of the correct parcel. Satellite probes at z16-z18
  positively identified the building as the large white 5-story Amazon
  sortation/fulfillment building. Web research corroborated: SCK6 ("Big Byrd")
  is a 3.5M sqft, 100-ft-tall, 5-story robotics building at 1500 E Grant Line
  Rd with published specs of ~230 trailer parking, 40 dock bays, 1,800 car
  spaces (abc10 / Tracy Press / TruckMap / datacenter.fyi). I shifted the audit
  center ~160 m south to the true building centroid.

## What the key views showed
- **z16/z17 overview:** Central white building bounded by E Grant Line Rd (N),
  employee car lots (N/NW), trailer drop yards (E and S), and a south road with
  vegetated buffer. The lot sits a few degrees clockwise off north — geofences
  traced to the real orientation, not a north box.
- **South dock face (SW z19):** Continuous bank of dock doors with trailers
  backed in, plus a second row of trailers parked across the south drive (drop
  yard).
- **East drop yard (z19/z20):** Dense double rows of numbered trailer stalls
  (read 580s through 760s), enclosed behind a landscaped buffer.
- **Perimeter (Street View 2023-02, east access road):** Black steel palisade
  fence and precast concrete screen walls fully enclose the truck yard. The
  trailer rows sit directly behind the steel fence (pano dvkowtervoQ0-ev7HnD5Tg).
- **Gate throat (z21 @ 37.75215,-121.40015):** Painted STOP marking, yellow
  checkpoint striping, and a small booth-footprint structure beside the
  controlled lane between the parking apron and the secured dock/yard area.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The entire truck yard is hard-secured (palisade + screen
  wall). Trucks funnel through a single controlled driveway throat off the NE
  access road (~37.7531, -121.4006) into the dock/drop area. This is a
  controlled checkpoint, not an open driveway.
- **guardShack = true.** Small staffed-booth-footprint structure at the gate
  throat with STOP + checkpoint striping (~37.75215, -121.40015). remoteGs is
  therefore false.
- **dockDoors = 50+.** Published spec lists 40 bays, but overhead imagery shows
  dock positions on the south face plus east/north faces; honest band is 50+.
- **dropArea = 50+ / dropYard = true.** Large fenced trailer drop yards on the
  east and south, ~230 trailers visible — matches the published 230-trailer
  figure.
- **shipRcvSeparate = true.** Activity runs from physically separate dock banks
  (south apron and east apron).

## Yard zones & counts measured
- **perimeter:** 6-vertex oriented ring around the secured truck parcel — 68.2
  acres (shoelace from the traced polygon).
- **truckGate:** quad over the NE entrance throat.
- **dropYards:** two rings — east trailer yard and south trailer row.
- **dockAprons:** two rings — south dock apron and the east dock/drive apron.
- **staging:** interior post-gate apron between the building east face and the
  east drop yard.
- **yardMetrics:** dockDoorCount ~60, trailersVisible ~230, capacity ~260,
  truckGateCount 1, buildingCount 1, 68.2 acres, railServed false.

## Street View metadata
- perimeter: pano `Ibf-84PqjROvdsHVSOdG_g`, heading 244, hasCoverage true.
- truckGate: pano `dvkowtervoQ0-ev7HnD5Tg`, heading 275, hasCoverage true.
  (Coverage runs along the east access road; the driver's arrival frame.)

## Web findings
- SCK6 ("Big Byrd"), opened/soft-launched Oct 2022, ribbon cutting Mar 2023.
- 3.5M sqft, 100 ft tall, 5 stories (4 robotics sorting floors of 133k sqft
  each over a ground floor); ~1,500 employees, ~3,000 robots; ~1M units/day
  outbound capacity. Parking for 1,800 cars, 230 trailers, 40 dock bays.

## Setting & low-confidence flags
- **urbanRural = Rural.** SE-edge Tracy industrial park ringed by large DCs and
  open farmland; rubric tie-break favors Rural. connectivityIssue false (large
  metro-adjacent industrial corridor, good coverage).
- **Uncertain:** entryLanes/exitLanes (estimated 2/2 from overhead width) and
  multiStep (no clear second checkpoint observed; left false).

**Final confidence: high** — building identity, perimeter, gate, guard booth,
drop yards, and dock banks are all corroborated by imagery and published specs.
