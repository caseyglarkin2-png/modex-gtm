# Deep-Audit Dossier — Kenco MCS Georgia I (Austell, GA)

**Roster idx:** 8
**Facility:** Kenco MCS Georgia I — Multi-Client Distribution Center
**Resolved coords:** UNRESOLVED (roster point 33.777949, -84.574624 is not the facility)
**Confidence:** low — facility not positively located

## Location resolution — UNRESOLVED

The roster provides only "Austell, GA 30168" with an APPROXIMATE geocode at
33.777949, -84.574624. **Step 0 probing** showed this point lands on a
residential apartment complex with a water tower — not an industrial building.
Kenco's warehousing map (the roster's source) publishes no street address for
this facility, and the roster note itself states "exact street address not
publicly confirmed."

## Research findings

- Kenco acquired The Shippers Group (TSG), a Dallas 3PL, in January 2024 — adding
  3.8M SF across eight sites in FL, GA and TX.
- TSG operated an Austell, GA facility documented at **300 Interstate West
  Parkway, Lithia Springs GA 30122** (off I-20 Exit 44 / Thornton Road):
  **530,000 SF, 89 dock doors, 20,000 SF cooler space, 39 ft clear height.**
- This 530,000 SF food-grade-with-cooler profile matches the roster's "Kenco MCS
  Georgia I — 540,000 SF, temperature controlled, food grade" very closely. The
  Kenco MCS Georgia I/II roster entries are most likely the TSG-acquired Austell
  facility (and a second adjacent building).

## Imagery probing

Two candidate industrial parks were probed extensively via satellite and Street
View:

1. **Interstate West Parkway corridor**, Lithia Springs, near I-20 Exit 44 /
   Thornton Road — the buildings observed in available imagery were mid-sized,
   multi-tenant flex/industrial; no single 530,000+ SF big-box with legible
   Kenco signage could be positively identified.
2. **Six Flags Road / Riverside industrial park**, Austell 30168 (around
   33.768, -84.580) — contains several genuine large modern distribution
   big-boxes with cross-dock layouts, but none with confirmable Kenco tenancy.

Multiple Street View passes failed to surface a monument sign or building
signage tying any specific building to Kenco / The Shippers Group.

## Determination

The facility could not be positively located to a specific building with the
information available. Per the deep-audit protocol for unlocatable facilities,
the JSON is written with `confidence: "low"`, every classification field listed
in `uncertainFields`, geofences left `null`, and `yardMetrics` zeroed.

## Recommendation

**Flag for human review.** To resolve: obtain the exact street address from
Kenco directly (most-probable target: 300 Interstate West Parkway,
Lithia Springs / Austell GA), then re-run the deep audit against the confirmed
building.

## Final confidence

**Low.** Facility not positively located; classification not performed.
