# Ball - Millersburg OR (idx 20)

**Type:** Beverage Can Plant (bodies) / Warehouse — NEW PLANT, startup 2026
**Address:** 3130 NE Transition Pkwy, Millersburg, OR 97321
**Coordinates (Phase-1 building center):** 44.678400, -123.062450 (provided rooftop coord 44.679328, -123.065006 sits on the graded field just NW; recentered onto the built structure)
**Confidence:** low

## Step -1 — Verification: PROBABLE (operator self, owned)
Ball is building a new mid-Willamette-Valley beverage can plant at 3130 NE Transition Pkwy; company plans / earnings coverage put startup in 2026 (sources say H2 2026). Because it is a current-ops-only pipeline, a brand-new plant would normally be excluded — but per the run instructions this NEW site is audited-as-visible with confidence set accordingly, not rejected for being new.
- Tier 1: Ball earnings coverage / company plans, Aluminum Market Update (CRU), 2025 — "Ball ... Oregon facility to start up in 2026."
- Tier 3: Street View pano `kwNPK9BwF8pcaM96PVI3xQ` (2025-04) + satellite — site graded/under construction at the address.

## Step 0 — Building lock
The supplied rooftop coordinate landed on bare graded farmland just NW of the actual built structure. Recentered onto the Phase-1 building (blue/gray roof) that the loop access road (NE Transition Pkwy) wraps. The large multi-trailer yard **east across Conifer Blvd is a SEPARATE trucking terminal**, not Ball — do not attribute it.

## What the imagery showed
- **Whole site (z18):** a single modest Phase-1 building (~140m x 100m) at the developed NE corner of a very large parcel. Employee/visitor parking to its NE; a concrete truck apron on the west face (one trailer seen at a dock). A loop road rings the pad. The **bulk of the parcel to the south and west is bare graded farmland** — the future/ongoing plant buildout.
- **Street View (2025-04):** chain-link perimeter fencing along Conifer Blvd, construction staging, buildings rising in the background — consistent with a plant mid-construction / early ramp.

## Gate / guard-shack / dock determinations (all low-confidence, construction state)
- **Truck gate:** chain-link perimeter fence + a single gated loop entrance → scored **truckGate = true**, but this is likely still temporary construction fencing. Flagged uncertain.
- **Guard shack:** none visible → **false**. **remoteGs = true** (gate implied, no manned booth).
- **Docks:** ~6 on the west face of the Phase-1 building (band **0-10**); will grow substantially at full buildout.
- **Drop yard:** not yet established on Ball's side → **false**.

## Yard zones & counts
- Perimeter (developed pad only): ~16 acres — **this is just the currently built pad; the full Ball parcel with graded expansion land is materially larger.**
- dockDoorCount ~6 · trailersVisible ~1 · trailerParkingCapacity ~15 · truckGateCount 1 · buildingCount 1 · railServed false.

## Setting
Rural — Millersburg / mid-Willamette Valley farmland, just off I-5 near Albany. urbanRural = Rural. connectivityIssue false.

## Final confidence: low
The site is a new plant still building out; only Phase-1 structures are visible. Most yard metrics and gate/guard calls are provisional and should be re-audited once the plant is operational (post-2026 startup).
