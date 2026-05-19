# Deep-Audit Dossier — Kenco MCS Georgia II (Austell, GA)

**Roster idx:** 9
**Facility:** Kenco MCS Georgia II — Multi-Client Distribution Center
**Resolved coords:** UNRESOLVED (roster point 33.777949, -84.574624 is not the facility)
**Confidence:** low — facility not positively located

## Location resolution — UNRESOLVED

The roster provides only "Austell, GA 30168" with an APPROXIMATE geocode at
33.777949, -84.574624 — identical to the idx 8 (Georgia I) coordinates.
**Step 0 probing** confirmed this point lands on a residential apartment complex
with a water tower, not an industrial building. Kenco's warehousing map
publishes no street address, and the roster note states "exact street address
not publicly confirmed."

## Research findings

Kenco MCS Georgia II (499,960 SF, temperature controlled, food grade) is the
second building of the same Kenco Austell campus as idx 8 (Georgia I). Both are
most likely part of the former The Shippers Group (TSG) Austell footprint —
Kenco acquired TSG in January 2024.

The documented TSG Austell facility at **300 Interstate West Parkway,
Lithia Springs GA 30122** is 530,000 SF (89 docks, 20,000 SF cooler, 39 ft
clear); a second ~500,000 SF building on or adjacent to the same campus would
correspond to this Georgia II entry. No distinct street address for the second
building was found.

## Imagery probing

The same two candidate industrial parks probed for idx 8 were considered:
the Interstate West Parkway corridor (Lithia Springs, I-20 Exit 44) and the
Six Flags Road / Riverside big-box DC park in Austell 30168. Neither yielded a
positively confirmable Kenco-tenanted ~500,000 SF building in available
satellite imagery or Street View.

## Determination

The facility could not be positively located to a specific building. Per the
deep-audit protocol for unlocatable facilities, the JSON is written with
`confidence: "low"`, every classification field in `uncertainFields`, geofences
`null`, and `yardMetrics` zeroed.

## Recommendation

**Flag for human review.** Resolve together with idx 8 by obtaining the exact
street addresses for both Kenco MCS Georgia buildings from Kenco directly
(most-probable area: 300 Interstate West Parkway, Lithia Springs / Austell GA),
then re-run the deep audit. See dossier 08 for the shared-campus research detail.

## Final confidence

**Low.** Facility not positively located; classification not performed.
