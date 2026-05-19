# Deep-Audit Dossier — Frito-Lay West Valley City UT (idx 27)

## Resolved location
- **Roster address is wrong.** The roster lists `3450 W 2100 S` — a generic
  point in a West Valley City industrial park, not the Frito-Lay facility.
- Web research and imagery resolved the real **Frito-Lay West Valley City
  plant/DC at 6301 W 4700 S, West Valley City, UT 84118**.
- Locked center: **40.6662, -112.0402**. Satellite confirms a large industrial
  manufacturing complex consistent with a Frito-Lay snack-food plant: a
  multi-section building with rooftop processing equipment, storage silos, and
  a steam plume; 2024-10 Street View of the truck yard shows trailers in red
  Lay's / Doritos livery and a tall Frito-Lay logo sign on the building — not
  an office or unrelated property.
- **Facility type note:** The roster types this as a Distribution Center; the
  site is in practice a combined production plant + distribution operation
  (Doritos, Lay's, Ruffles). It was audited as the freight/truck yard
  regardless of the label.

## Key views
- **Overview (z17-18):** The plant sits on the south side of W 4700 S, set back
  from the road on the desert bench at the city's west edge. The main building
  complex is center/east; employee parking is along the north frontage; a
  separate paved truck/trailer area sits north of the main building, and
  extensive trailer drop rows wrap the east and west sides. A smaller building
  stands to the south.
- **Truck entrance (z19 + Street View):** A single wide, divided entrance
  driveway leaves W 4700 S — the satellite shows a center island splitting
  inbound/outbound lanes and a checkpoint/gate structure in the driveway.
  Street View (heading E) shows the entrance corner with a STOP sign and tall
  ornamental steel security fencing running along the property line. Street
  View facing the yard shows Frito-Lay-liveried box trailers parked behind that
  fence with the logo-signed building beyond.
- **Docks (z18-20):** Tight z20 imagery shows a building face with palletized
  material storage and tractor-trailers maneuvering on the apron; dock banks
  are present on the south face and on the west face as separate clusters.
  Rooftop snack-food processing equipment is visible across the main roof.
- **Yard (z19):** The east-side drop yard holds dense rows of 40+ trailers;
  additional trailer rows run along the west side and north of the building.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The entire property is enclosed by tall ornamental
  steel security fencing (clear in Street View). A single controlled,
  divided driveway off W 4700 S is the truck entrance, with a gate/checkpoint
  visible in the driveway in zoom-19/20 imagery. Strong evidence.
- **guardShack = false / remoteGs = true.** No clearly staffed standalone guard
  booth is visible at the gate. A small checkpoint structure sits in the
  driveway but cannot be confirmed as a manned shack from overhead/Street View
  imagery; treated as remote/kiosk check-in. Flagged uncertain.
- **dockDoors = "25-50".** ~45 doors estimated across the south-face and
  west-face dock banks (10+ trailers seen backed in on the south face).
  Approximate — the building is large and parts of the dock faces are obscured
  by rooftop equipment.
- **shipRcvSeparate = true.** The south-face and west-face dock banks are
  physically separate clusters on different building faces.
- **dropYard = true / dropArea = "50+".** A very large east-side trailer drop
  yard holds 40+ trailers in rows, with additional rows on the west and north —
  well into the 50+ band.

## Yard zones and counts
- **perimeter:** ~43 acres inside the security fence line
  (40.6645,-112.0425 → 40.6680,-112.0368).
- **truckGate:** the divided entrance driveway / checkpoint off W 4700 S on the
  north side of the property.
- **dropYards:** (1) large east-side trailer drop yard; (2) west-side trailer
  rows.
- **dockAprons:** (1) south-face dock apron; (2) west-face dock apron.
- **staging:** large open paved area inside the gate ahead of the docks
  (postGateStaging = true; deep enough for a multi-truck queue → drivewayLong).
- **yardMetrics:** ~45 dock doors, ~90 trailers visible, ~140 trailer capacity,
  1 truck gate, 2 buildings, ~43 acres, not rail-served (no spur enters the
  property).

## Web findings
- Confirmed as a long-running Frito-Lay / PepsiCo Foods production and
  distribution site for the Salt Lake / Intermountain region; the West Valley
  City address (6301 W 4700 S) is the operating snack-food plant. The roster's
  3450 W 2100 S address does not correspond to a Frito-Lay building and was
  discarded in favor of the imagery-confirmed plant.

## Confidence
**Medium.** The facility is positively identified and the yard layout, gate,
fencing, and drop-yard zones are clear from satellite + 2024-10 Street View.
Confidence is held at medium because: the roster coordinates were wrong
(resolved by research); the dock-door count is an approximate band estimate due
to rooftop clutter; and the guard-shack vs. remote-check-in call could not be
firmly resolved from imagery (`guardShack`, `remoteGs`, `shipRcvSeparate`, and
`dockDoorCount` flagged uncertain in the site JSON).
