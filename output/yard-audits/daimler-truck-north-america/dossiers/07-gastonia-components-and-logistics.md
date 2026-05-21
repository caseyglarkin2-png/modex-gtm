# Deep-Audit Dossier — idx 07

## Gastonia Components and Logistics — Gastonia, NC

- **Account:** Daimler Truck North America
- **Type:** Component / parts subassembly and logistics plant
- **Roster address:** 1400 Tulip Drive, Gastonia, NC 28052
- **Resolved center:** 35.288, -81.2052
- **Method:** deep-audit | **Confidence:** high

## Step 0 — Location confirmation

The roster coordinate (35.287626, -81.202855; GEOMETRIC_CENTER, moved only
44 m) landed accurately on the campus. Satellite z16-z17 shows a large
white-roofed components/logistics plant plus a separate gray-roofed building to
the east, on a heavily wooded campus off Tulip Drive, south of I-85 on the
edge of Gastonia. DTNA and Waze listings confirm this as "Daimler Truck North
America Components & Logistics, 1400 Tulip Dr" — established 1978, doing
stamping, metal fabrication and cab/chassis sub-assembly plus parts line
sequencing and aftermarket packaging; operates 24/7.

## Key views

- **Wide z16:** Two large buildings on a wooded campus, employee parking, a
  retention pond, with I-85 along the south edge.
- **Main plant z18:** White-roofed plant with a large north-side drop yard
  full of trailers in angled stalls.
- **North docks z19:** Dock doors with trailers backed in along the north
  building face; access road wraps the plant.
- **SE entrance z20 + Street View:** A checkpoint canopy/gatehouse with orange
  bollards lining the entry lane.
- **East building z18:** Separate gray-roofed building linked to the main
  plant by an internal road.

## Gate / guard-shack determination

- **Truck gate: YES.** SE entrance off the internal campus road. Street View
  (captured 2026-02) shows a checkpoint canopy/gatehouse with orange bollards
  channeling the lane and chain-link fencing alongside; satellite confirms a
  small white-canopy structure spanning the entry drive with a trailer passing
  through it.
- **Guard shack: YES (flagged uncertain).** The canopied gatehouse over the SE
  entry lane is the staffed check-in point. The discrete booth form is not
  perfectly resolvable, but a 24/7 logistics plant of this scale runs manned
  security — recorded guardShack=true, remoteGs=false.
- **Staging:** No dedicated pre-gate truck apron observed; ample post-gate
  holding via wide internal aprons and the north drop yard.
- **Fast-lane opportunity: NO.** The SE gate is a single-lane canopy with no
  obvious unused paved width.

## Yard zones and counts

- **Perimeter geofence:** S 35.2858, W -81.2082, N 35.2902, E -81.2010 —
  ~73 acres, capturing both buildings, the north drop yard, dock aprons and
  employee lots within the wooded campus.
- **Drop yard:** Dedicated north-side trailer-storage lot, trailers in marked
  angled stalls.
- **Dock aprons:** North building face and west/SW faces.
- **dockDoorCount ~35** (band 25-50) — doors with trailers backed in across
  the north, west and SW faces; approximate from overhead imagery.
- **trailersVisible ~70**, **trailerParkingCapacity ~95** — dropArea 25-50.
- **truckGateCount 1**, **buildingCount 2**, **railServed false.**

## Web findings

DTNA careers and Waze confirm the facility and address. The Gastonia plant does
stamping, metal fabrication and cab/chassis sub-assembly, plus line sequencing
of parts feeding DTNA assembly plants and aftermarket packaging. Established
1978, operates 24 hours / 7 days. No public detail on the gate layout — gate
determinations rest on imagery.

## Final confidence

**High.** Facility unambiguously identified; the SE controlled gate, two-building
campus, north drop yard and dock banks all read clearly from satellite +
Street View. Guard-shack form, lane counts and ship/receive separation are
imagery-inferred and listed in uncertainFields.
