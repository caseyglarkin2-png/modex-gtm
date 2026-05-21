# Deep-Audit Dossier — HMMA Cylinder Head Machining Plant, Montgomery AL (idx 03)

**Facility:** HMMA Cylinder Head Machining Plant
**Type:** Engine / Component Plant
**Address:** 700 Hyundai Blvd, Montgomery, AL 36105 (HMMA campus)
**Resolved center:** 32.282800, -86.332000 (HMMA western engine-shop cluster)
**Confidence:** Medium

## Step 0 — Location confirmation
The roster gives the HMMA campus address (700 Hyundai Blvd) — same campus as
idx 1. Web research (Montgomery Chamber, hmmausa.com, Made in Alabama)
confirms the cylinder-head machining plant is a **260,000 sq ft building**, a
**$388M investment opened May 2019**, and the **third engine shop** on the
HMMA campus supporting 650,000+ engines/yr.

It is a **component building inside the larger HMMA campus**, not a standalone
site. The exact building could not be uniquely distinguished from the other
HMMA engine shops in satellite imagery without floor-plan documentation; it is
positively within the campus's western engine-shop / component-plant cluster,
on which the center is placed.

## Key views
- **z17 west cluster:** Large light-roofed engine/component buildings on the
  west side of the HMMA campus, with a row of trailers along the west building
  dock face.
- **z18-19 west building:** A dock bank with trailers backed in and a small
  trailer staging lot (~20 trailers) along the west engine-shop face
  (~32.2825,-86.3330).
- **z18 NW:** Utility infrastructure (electrical substation, cooling towers)
  serving the engine-shop cluster.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Inherits the HMMA campus access — controlled, numbered,
  guarded gates (web research confirms numbered gates such as "Gate 2"). The
  cylinder-head plant has no independent truck gate; inbound castings and
  outbound machined heads route through the shared campus gates.
- **guardShack = true (inferred).** Shares the guarded HMMA campus perimeter
  (see idx 1 dossier).
- **remoteGs = false** (guard shack present).
- **dockDoors = 10-25 (uncertain).** West engine-shop building face shows a
  dock bank with trailers backed in; estimated ~14 doors for this building. A
  machining operation has modest dock needs.
- **dropArea = 0-10 (uncertain).** Small trailer staging lot on the west
  building face; campus-wide drop yard is much larger (idx 1).

## Yard zones and counts
- **Perimeter:** the full HMMA developed campus footprint (shared with idx 1) —
  this plant is a building within that campus.
- **Drop yard / dock apron:** boxed to the western engine-shop cluster face.
- **Metrics:** ~14 dock doors and ~22 trailers for this building's apron;
  campus-level metrics match idx 1 (2 truck gates, 12+ buildings, ~620 acres).

## Web findings
- Montgomery Chamber / hmmausa.com / Made in Alabama: 260,000 sq ft cylinder-
  head machining plant, $388M, opened May 2019, third engine shop, supports
  650,000+ engines/yr; created ~50 jobs.

## Final confidence
**Medium.** The facility is unambiguously on the HMMA campus and its truck-yard
profile is the HMMA campus profile (idx 1) scoped to the western engine-shop
cluster. The specific building cannot be uniquely pinned without floor plans —
dock/trailer counts for it are flagged in `uncertainFields`.
