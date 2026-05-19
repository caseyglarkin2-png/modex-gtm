# Deep-Audit Dossier — HMGMA Metaplant, Ellabell GA (idx 02)

**Facility:** Hyundai Motor Group Metaplant America (HMGMA)
**Type:** Auto Assembly Plant (EV)
**Address:** 1500 Genesis Dr, Ellabell, GA 31308
**Resolved center:** 32.162000, -81.448000
**Confidence:** Medium (construction-phase imagery)

## Step 0 — Location confirmation
Roster coords (32.165371, -81.444937, ROOFTOP) landed on the HMGMA Metaplant
manufacturing complex — confirmed by satellite: an enormous multi-building
manufacturing campus along I-16 in rural Bryan County. Web research
(hmgma.com, Wikipedia) confirms the $7.6B EV plant, 16M+ sq ft of factory
floor, ~25 mi west of Savannah, opened Oct 2024. Center adjusted slightly to
the central manufacturing halls.

## Key views
- **z13/z14 wide:** Massive defined campus block surrounded by pine woods and
  farmland; cluster of supplier warehouses on the NW corner; I-16 runs along
  the NE edge.
- **z15-17 mid:** Multiple large connected and standalone manufacturing
  buildings; very large paved/graded areas (future finished-vehicle and
  trailer staging); employee parking lots; a separate admin/office building on
  the NW.
- **z17 south:** A rail spur / yard feature runs into the south part of the
  campus — consistent with HMGMA's rail-served logistics design.
- **Street View (2025-11) along I-16:** Continuous perimeter fencing visible
  around the campus; manufacturing buildings set back behind it.

## Imagery caveat
The available satellite imagery is from the **construction phase** — extensive
bare earth and partly-finished buildings. HMGMA opened Oct 2024, so the fully
operational dock-door, trailer-yard and gate-booth layout is not yet resolvable
from overhead. All counts are best-effort estimates flagged at low confidence.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A $7.6B OEM EV plant with a fully fenced perimeter
  (confirmed by Street View) uses controlled, guarded gates. Main truck entry
  is the access corridor on the NW edge off Genesis Dr.
- **guardShack = true (inferred).** Facilities of this scale and security
  profile universally staff their gates; exact booth footprint not resolvable
  in construction-phase imagery — flagged uncertain on the structure, not its
  existence.
- **remoteGs = false** (guard shack present).
- **dockDoors = 50+ (uncertain).** A 16M sq ft assembly campus has very large
  dock-door capacity; exact count not visible — estimated ~70, low confidence.
- **dropArea = 25-50 / dropYard = true (uncertain).** Large paved staging
  areas present; occupancy not yet built out in available imagery.
- **railServed = true.** Rail spur/yard runs into the south campus.

## Yard zones and counts
- **Perimeter:** developed campus footprint (~2,900-acre parcel).
- **Drop yard / dock apron / truck gate:** boxed best-effort; staging left
  null pending operational imagery.
- **Metrics:** ~70 dock doors, ~40 trailers visible, ~300 trailer capacity,
  3 truck gates, 15+ buildings, rail-served — all low-confidence estimates.

## Web findings
- hmgma.com / Wikipedia: $7.6B EV plant, Bryan County GA, 16M+ sq ft factory
  floor, 500K vehicles/yr capacity (IONIQ 5 / IONIQ 9 / Kia), opened Oct 2024.

## Final confidence
**Medium.** Facility unambiguously identified and the campus is clearly a
large, fenced, guarded multi-facility OEM plant. Construction-phase imagery
prevents precise dock/trailer/gate counts — those fields are flagged in
`uncertainFields`.
