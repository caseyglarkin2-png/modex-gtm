# Deep-Audit Dossier — idx 14

## Performance Foodservice — Northern California (Stockton, CA)

**Facility type:** Broadline Foodservice Distribution Center
**Address:** 1624 Army Ct, Stockton, CA 95206
**Resolved coordinates:** 37.93255, -121.32450
**Confidence:** High

---

### Location resolution

The roster supplied ROOFTOP-grade coordinates (37.932725, -121.323148) that
moved only 24 m at geocode — these land squarely on the east-side truck court
of the facility. Web research confirms 1624 Army Court is the **Stockton
Commerce Center**, a Dermody Properties spec building; LoopNet listings for the
address describe **64 dock doors with levelers, 5 rail-served receiving doors,
up to 205 ft truck-court depth, 30 ft clear height**. Performance Foodservice's
own location page and Waze list this as the "Northern California" broadline DC
serving the Sacramento / Bay Area market. Street View from January 2022 shows
the green-striped warehouse facade with a wall-mounted "Performance" logo,
positively identifying the PFG-occupied building.

The facility is the large rectangular warehouse with its long axis running
north-south, immediately east of the Stockton wastewater treatment ponds and
just north of a residential subdivision across the rail corridor.

### Key views

- **Satellite z16-z20:** Large single warehouse, long N-S footprint. The east
  face fronts a paved truck court with a tree-lined cul-de-sac. A separate
  cluster of larger spec warehouses lies to the east (not part of this site).
- **Street View, entrance (heading N):** A chain-link **sliding gate** spans
  the truck driveway entering the east truck court. A small **guard booth** —
  a single-room structure with windows, roughly one-vehicle footprint — stands
  on the right side of the gate lane.
- **Street View, dock face (heading SW / S):** A long bank of dock doors with
  levelers runs along the building's east/south face, with the green roofline
  stripe and the "Performance" sign visible. Several trailers backed in.
- **Satellite, truck court:** Striped trailer-parking lanes east of the
  building hold drop trailers; ample paved depth (the spec'd 205 ft court).

### Gate / guard-shack / dock determinations

- **truckGate = true** — Chain-link sliding gate across the truck lane,
  controlled checkpoint where the truck driveway meets the cul-de-sac.
- **guardShack = true** — A small staffed booth sits beside the gate; multiple
  windows, ~1-vehicle footprint.
- **remoteGs = false** — A physical guard booth is present.
- **dockDoors = "50+"** — Spec sheet lists 64 doors; long dock bank visible.
- **dropArea = "25-50"** — Marked trailer-parking lanes in the truck court.
- **drivewayLong = true** — Deep truck court (205 ft) gives long internal
  stacking depth past the gate.
- **postGateStaging = true** — Paved truck court inside the gate before docks.

### Yard zones and counts

- **Perimeter:** ~13.8 acres covering the warehouse and its east truck court.
- **Drop yard:** Striped trailer lanes in the east truck court.
- **Dock apron:** Long apron strip along the east/south dock face.
- **Staging:** Apron just inside the gate.
- **Dock doors:** 64 (spec-confirmed).
- **Trailers visible:** ~12 in the captured imagery.
- **Rail-served:** Yes — spec sheet lists 5 rail receiving doors.

### Web findings

- 1624 Army Ct = Stockton Commerce Center, Dermody Properties spec building;
  PFG NorCal occupies it. 64 docks / 5 rail doors / 205 ft court / 30 ft clear.
- Performance Foodservice "Northern California" location serves Sacramento and
  the Bay Area; phone (800) 233-6211.

### Final confidence: HIGH

Building positively identified by the wall-mounted PFG logo in Street View;
gate and guard booth directly observed. Dock-door count taken from the
published spec sheet rather than counted overhead — flagged as a confident
estimate. Rail service confirmed via spec sheet.
