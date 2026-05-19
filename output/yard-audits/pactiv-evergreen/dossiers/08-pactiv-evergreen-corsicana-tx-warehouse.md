# Pactiv Evergreen — Corsicana TX Warehouse (idx 08)

**Type:** Warehouse / Distribution Center
**Resolved center:** 32.0752, -96.4574
**Address:** 2200 S. Business 45, Corsicana, TX 75110
**Confidence:** high

## Location resolution

The roster geocode (32.075124, -96.457637, `ROOFTOP`) was accurate — it lands
directly on a very large modern single-block distribution warehouse on the
southwest side of Corsicana along S. Business 45. Confirmed by satellite at
z16-z19. The building is roughly 1,150 ft x 400 ft (≈460,000+ sq ft footprint),
the largest structure on this side of town.

## Key views

- **Satellite z16-z17 (overview):** one massive rectangular warehouse set
  ~250 m back from S. Business 45 behind a deep landscaped buffer; trailer
  parking rows along the southwest side; a rail line runs along the far
  western property edge.
- **Satellite z18-z19 (SW dock + yard):** the southwest face has a long
  dock-leveler run with trailers backed in, and a large dedicated trailer
  drop yard with dozens of trailers in organized rows.
- **Satellite z19 (SE/E face):** additional dock apron and dock-door run wrap
  onto the southeast face.
- **Satellite z19-z20 (entrance):** a single entrance driveway off Business 45
  at the SE corner, with landscaped islands; a small dark structure sits at
  the driveway split.
- **Street View 2024-02 (Business 45):** the warehouse is visible far back
  across an open field; the entrance driveway leaves the highway here.

## Gate / guard-shack determination

- **truckGate = true.** The property is fully fenced and the building is set
  well back from the public road. A single entrance driveway off S. Business 45
  reaches the yard through a perimeter-fence gate — a clear controlled
  pinch-point.
- **guardShack = false (flagged uncertain) / remoteGs = true.** A small dark
  structure sits at the entrance driveway split. It could be a gatehouse, or
  simply a parked trailer / equipment shed — it does not read as an
  unambiguous multi-window staffed booth. Best read: no staffed shack, remote
  (kiosk / call-box) check-in. `guardShack` and `remoteGs` are flagged
  uncertain accordingly.

## Yard zones and counts

- **Perimeter:** ~58 acres, fenced, with a deep buffer to the public road.
- **Dock doors:** long dock-leveler runs on the southwest and southeast faces
  — a 50+ door cross-dock-scale DC. `dockDoors` banded **50+** (estimate ~70).
- **Drop yard:** extensive dedicated trailer-storage lot along the southwest
  dock face — dozens of trailers in rows. `dropArea` banded **50+**;
  `dropYard` = true.
- **Driveway:** long approach from Business 45 across a deep buffer and wide
  internal road — `drivewayLong`, ample 3+ truck stacking.
- **fastLaneOpportunity = true** — very wide paved aprons and a long approach
  road give abundant room for express/bypass lanes.
- **railServed = false** — a rail line runs along the far western property
  edge but no spur turns into the warehouse property.

## Web findings

Listed on the Pactiv Evergreen Locations page under "Warehouses and
Distribution Centers." Functions as a regional distribution warehouse, almost
certainly tied to the Corsicana foodservice manufacturing plant (idx 07) ~5 km
to the northeast — a plant/DC pair typical of Pactiv's hub model.

## Final confidence: high

Location, building, dock scale, and drop yard are all clearly resolved. The
only soft point is whether the small structure at the entrance is a staffed
guard booth — flagged uncertain — which does not change the high-level read of
a fenced, gated, 50+ door distribution center.
