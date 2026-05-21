# Deep-Audit Dossier — H-E-B Hempstead Distribution Campus (in development), Hempstead TX (idx 16)

## Facility
- **Name:** H-E-B Hempstead Distribution Campus (in development)
- **Type:** Distribution Campus (multi-phase; Phase 1 under construction)
- **Address:** Waller County, near Hempstead, TX 77445
- **Status:** **UNDER CONSTRUCTION — Phase 1 site work only.**

## Step 0 — Location confirmation
The roster's APPROXIMATE coordinate (30.097441, -96.078292, moved 4 m on
geocode) is the Hempstead town centroid. Web research (KHOU, Wolff Companies,
Supply Chain Dive, Progressive Grocer, RCR Rail Co.) places the campus
precisely: a ~500-acre tract in Waller County **south of US Highway 290 and
east of SH 6**, on the SW edge of Hempstead, **immediately adjacent to the
RCR Hempstead Logistics Rail Park** (23639 Hwy 6, at the US 290 / SH 6
junction, on a Union Pacific Class I line). Probing satellite around that
junction located a large active construction site; the audit center is
corrected to **30.105200, -96.064000** (the graded campus footprint).

## Imagery findings
Satellite imagery (z15-z18) clearly shows an **active construction site**:
- ~400+ acres of graded reddish earth;
- a sand/fill building pad under preparation in the western portion;
- perimeter grading, internal haul roads, a detention pond, and construction
  staging — equipment, fill stockpiles, and trucks.
There is **no completed distribution building, roof, dock bank, or defined
truck yard** yet. The facility is at the site-grading / pad stage.

## Gate / guard-shack / dock — cannot be audited
Because no distribution building or operational yard exists yet, the truck
gate, guard shack, remote check-in, docks, staging, and drop yard cannot be
observed or measured. All such fields are recorded as `false` / `NONE` /
`null` placeholders and listed in `uncertainFields`.

**Expected program (from announcements, not observations):**
- Phase 1 — a 750,000-900,000 sq ft distribution facility, **120-140 dock
  doors**, a **20-30 acre truck yard**, ~$200M investment; first-phase opening
  was targeted for late 2025 (running behind, still in site work as imaged).
- Phase 2 (2027) — adds 250,000-350,000 sq ft plus a dedicated cold-storage
  area.
- Phase 3 — completes parking, landscaping and stormwater controls.
Once operational this will be a very large gated freight DC: expect a
controlled truck gate with guard shack and/or remote check-in, a 50+ dock-door
band, a large drop yard, and rail service via a spur from the adjacent UP
line. Re-audit after Phase 1 opens.

## Yard zones & counts
- **perimeter:** the currently-graded campus footprint — ~1113 m × 1540 m ≈
  **423 acres** (full land purchase ~500 acres). Bounded by US 290 to the
  north, the Hempstead residential edge to the west, open Waller County land
  to the east/south.
- **truckGate / dropYards / dockAprons / staging:** null / empty — not built.
- **railServed = true** (planned/expected): rail access was H-E-B's stated key
  site-selection factor; the campus abuts the RCR Hempstead Logistics Rail
  Park on a Union Pacific line, though a spur into the campus is not yet
  visible.
- **multipleFacilities = true:** explicitly a multi-phase, multi-building
  distribution campus.
- buildingCount 0 (nothing structurally complete); dockDoorCount 0;
  trailersVisible 0.

## Web findings
KHOU / Wolff Companies / Supply Chain Dive (2024): H-E-B finalized a ~500-acre
purchase in Waller County south of US 290 / east of SH 6 for a multi-phase
distribution campus, ~$200M Phase 1, with Phase 1 first-opening targeted late
2025 and Phase 2 in 2027. TDLR (Feb 2025) registered a ~2,600 sq ft Vendor
Processing Center at the campus, confirming construction was underway by early
2025. RCR Rail Co.: the H-E-B land is adjacent to the RCR Hempstead Logistics
Rail Park; rail access was a key factor.

## Confidence
**Low.** The campus is positively located and confirmed under construction,
but Phase 1's distribution building and truck yard do not yet physically
exist. All gate/dock/yard classifications are placeholders pending
construction. Recommend re-audit once Phase 1 opens.
