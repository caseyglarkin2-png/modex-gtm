# Deep-Audit Dossier — GXO Logistics Distribution Center, Aloha OR (idx 29)

## Facility
- **Name:** GXO Logistics Distribution Center - Aloha OR
- **Type:** Distribution Center (per roster)
- **Roster address:** 3585 SW 198th Ave, Aloha, OR 97007
- **Resolved coords:** 45.49332, -122.8834 (Intel Aloha Campus)

## Step 0 — Location confirmation — FACILITY MISMATCH
The roster coordinate (precision GEOMETRIC_CENTER) and address resolve correctly,
but **NOT to a GXO distribution center**. 3585 SW 198th Ave, Aloha OR is the
**Intel Aloha Campus** - a semiconductor fabrication campus. Multiple sources
(Waze map entries explicitly label "Intel - Aloha" and "Intel Aloha Campus" at
3585 SW 198th Ave) confirm this.

GXO Logistics provides **on-site contract logistics services for Intel** at this
campus (and at the Hillsboro Intel CUB1 facility - idx 28's roster address was
also an Intel address). There is no separable, freestanding GXO distribution
center with an auditable truck yard at this location.

## Key views
- **z16 context:** Large semiconductor fab campus in the center, surrounded on
  all sides by Aloha (Portland-metro) residential neighborhoods.
- **z18 campus:** Multiple large fab buildings with extensive rooftop cleanroom
  HVAC / mechanical equipment - unmistakably a chip fab, not a warehouse.
- **z18 campus edges:** Employee parking lots, construction-laydown yards
  (containers, equipment), a stormwater pond, and security-controlled campus
  entrances with guard structures.
- **No conventional distribution dock bank, no trailer drop yard, no
  distribution-center truck gate** is visible anywhere on the property.

## Gate / guard-shack / dock determinations
- **truckGate / guardShack** — Recorded `true` at LOW confidence: Intel
  campuses are security-controlled and the campus entrances have guard/security
  structures. This reflects Intel's campus access control, not a
  distribution-center truck gate. Genuinely not the kind of gate the rubric
  targets.
- **dockDoors = "NONE", dropArea = "NONE", dropYard = false** — No
  distribution-style dock bank or trailer yard exists; fab material handling is
  internal and controlled.
- **multipleFacilities = true** — Several large fab buildings form a campus.

## Yard zones & counts
- **perimeter:** the Intel Aloha campus footprint, ~88 acres (approximate).
- All sub-zones `null` / empty - no auditable distribution yard.
- **yardMetrics:** 0 dock doors, 0 trailers, 0 trailer capacity, ~5 buildings,
  ~88 acres, not rail-served. (Building/area counts approximate.)

## Web findings
- 3585 SW 198th Ave, Aloha OR is the Intel Aloha Campus (Waze, multiple
  directory entries).
- GXO Logistics is listed with an Aloha, OR location at this address, but as a
  contract-logistics service provider operating within Intel's campus - not as
  an independent distribution-center operator.

## Confidence
**LOW — flagged for human review.** The address resolves correctly, but the
roster entry is an Intel semiconductor fab campus, not a GXO distribution
center. There is no GXO truck yard to audit here. Recommend the roster entry be
re-scoped or removed: GXO's role at this site is embedded contract logistics
inside an Intel fab, with no distribution-center yard infrastructure.
