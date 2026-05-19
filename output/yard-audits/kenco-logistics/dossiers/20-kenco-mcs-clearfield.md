# Deep-Audit Dossier — Kenco MCS Clearfield (idx 20)

**Account:** Kenco Logistics Services
**Facility:** Kenco MCS Clearfield — Clearfield, UT
**Type:** Multi-Client Distribution Center (90,000 SF, food grade per Kenco warehousing map)
**Address:** Building G8, 7th Street, Freeport Center, Clearfield, UT 84016
**Audited coordinates:** 41.10090, -112.03460
**Confidence:** High

## Location resolution

The roster supplied a ROOFTOP geocode (41.100339, -112.035023) for "Building
G8, 7th Street, Freeport Center." Step 0 confirmed it definitively:
- Google geocoding of "Building G8, 7th Street, Freeport Center" returns
  "G-8, 7th St, Clearfield, UT" at 41.1003393, -112.0350228 — matching the
  roster coordinate exactly.
- **Street View (Nov 2022) shows a "G-8 / 7th Street" sign directly on the
  building** at the street corner — a positive, unambiguous identification.

Freeport Center is a 680-acre former WWII military depot, now a warehousing
and distribution park of **78 long warehouse buildings** on an internal street
grid. Kenco Logistic Services occupies **building G8** (~90,000 SF, food-grade
certified per directory listings).

## Key views

- **z16 context:** The full Freeport Center grid — dozens of long parallel
  warehouses on a diagonal street grid, rail spurs running through the
  streets, a rail network on the NW side.
- **z18/z19 G8 footprint:** G8 is one long, narrow warehouse (~230 m x 35 m)
  running NW-SE, with a **comb-shaped dock canopy** along one long side and
  rail along the other.
- **z19 dock detail:** Comb-shaped truck dock canopy; trailers parked along
  the internal street frontage. Rail tracks embedded in the streets.
- **Street View (Nov/Dec 2022):** Internal Freeport streets with embedded
  rail; a bobtail tractor maneuvering; the "G-8 7th Street" building sign.
  No gates or guard booths at the building.

## Gate / guard-shack / dock determinations

- **Truck gate:** FALSE. Individual Freeport buildings have no truck gate —
  trucks pull off the internal Freeport street and back directly into the
  comb dock canopy. No barrier arm, gate, or booth at G8. (The overall
  Freeport Center complex may have perimeter control, but G8 itself does not.)
- **Guard shack:** FALSE. No staffed booth at the building.
- **Remote GS:** FALSE — no building-level gate.
- **Docks:** Comb-canopy truck dock along one long side — estimated ~16 truck
  dock doors → band **10-25**. Low-confidence count (canopy obscures the
  doors from overhead).
- **Ship/receive separate:** TRUE (Freeport standard) — Freeport Center's own
  description states most buildings have a railroad loading dock on one side
  and a truck loading dock on the other, so inbound rail receiving and
  outbound truck shipping use physically separate building faces. Inferred
  from the Freeport layout standard; flagged.
- **Driveway:** Short — trucks back into the comb dock straight from the
  narrow internal street; only 1-2 trucks fit in the approach.
- **Backup-sensitive:** TRUE — a backing truck occupies the shared narrow
  Freeport street; a queue would block adjacent buildings' access.

## Yard zones and counts

- **Perimeter:** ~5.5 acres around the G8 building footprint and its dock
  street frontage (41.10005–41.10180 N, -112.03570–-112.03360 W/E).
- **Truck gate zone:** None (no building-level gate).
- **Dock apron:** The internal street / comb-canopy strip along the truck
  side of G8.
- **Drop yards:** None dedicated — only incidental trailer parking along the
  street frontage.
- **Dock doors:** ~16 (truck side). **Buildings:** 1 (within the 78-building
  Freeport campus → multipleFacilities TRUE). **Rail-served:** TRUE.

## Web findings

- Kenco Logistic Services, #G8 Freeport Center, 7th Street, Clearfield UT
  84016 — food-grade certified 3PL/contract warehousing (directory listings).
- Freeport Center: 680 acres, 78 buildings, >7,000,000 SF; most buildings
  have a railroad dock on one side and a truck dock on the other.

## Final confidence

**High.** Building identity is confirmed by an exact ROOFTOP geocode match and
a visible "G-8 7th Street" building sign in Street View. The Freeport Center
operating model (no per-building gates, rail-served, comb truck docks,
ship/receive on opposite faces) is well documented. Residual uncertainty is
only the exact truck-dock-door count, which the comb canopy obscures.
