# UNFI Allentown PA DC — Deep-Audit Dossier

**Facility:** UNFI - Allentown PA DC (idx 4)
**Roster address (incorrect):** 8550 Willard Dr, Breinigsville, PA 18031
**Resolved location:** North Valley Trade Center, ~4255 North Valley Dr, Schnecksville, PA 18078
**Resolved center:** 40.66380, -75.59470
**Type:** Distribution Center (UNFI Atlantic Region, full-service grocery DC)
**Confidence:** Medium

---

## Location resolution — roster address was wrong

The roster supplied 8550 Willard Dr, Breinigsville PA (40.554158, -75.632566)
with an explicit note to "verify exact site." Probing those coordinates landed
on the Lehigh Valley industrial complex near Breinigsville — an unrelated
multi-warehouse park, not a UNFI facility.

Web research (WFMZ Lehigh Valley News, Modern Distribution Management, TruckMap,
Showcase/LoopNet commercial listings, LehighValleyNews.com) firmly places UNFI's
"Allentown" DC at the **North Valley Trade Center on Independence Drive /
North Valley Drive in Schnecksville, PA 18078** — ~10 mi NW of the roster point.
It is two warehouses totaling ~1.3M sq ft on a 107-acre parcel, held by UNFI on
a 15-year lease (one building ~812k sq ft). Satellite imagery of the resolved
site shows **"UNFI" painted on the SW yard pavement**, confirming identity. This
is the facility UNFI announced for FY26 closure after losing the Key Food
customer agreement (~716 jobs, layoffs Aug–Oct 2025) — the "Allentown" closure
named in the Bushway dossier's consolidation cadence.

## Key views

- **z14–z16 wide:** The North Valley Trade Center sits at the SE edge of
  Schnecksville, bordered by farmland. Two very large DC buildings dominate the
  parcel.
- **z17 main building:** A very large rectangular DC oriented NNE-SSW, with a
  continuous dock-door face along the **E long side** (toward the road) and a
  matching dock face along the **W long side**, trailers backed in on both.
- **z18 W side:** Deep W-side dock apron with an extensive trailer row; "UNFI"
  painted on the pavement at the SW yard.
- **z19 E dock face:** Deep dock apron with trailers backed into the E face.
- **z19 SW corner:** The truck entrance — a dedicated truck driveway with
  painted lane arrows runs from the trade-center road into the property through
  a checkpoint/roundabout, with a small structure beside the entry near the
  site water tower.
- **Street View (trade-center road, 2025-07):** The building sits elevated on a
  landscaped berm above the public road; Street View cannot see over the berm
  to the gate. The truck gate could not be observed directly from the road.

## Gate / guard-shack determination

A single controlled truck entrance at the SW corner: a dedicated truck driveway
with painted directional lane markings leads from the trade-center road through
a checkpoint area into the property. A small booth-scale structure is visible
beside the entry near the water tower. `truckGate: true`. `guardShack: true`
and `remoteGs: false` — assigned medium-confidence because the entrance berm
blocks the Street View angle; the visible structure is consistent with a
staffed gatehouse, the norm for a UNFI Atlantic-Region full-service DC of this
scale.

## Yard zones and counts

- **Perimeter:** ~107 acres (published trade-center parcel figure) enclosing
  both buildings, both dock aprons, and employee parking.
- **Buildings:** 2 distinct large warehouses → `buildingCount: 2`,
  `multipleFacilities: true` (campus).
- **Dock doors:** Continuous dock rhythm on both long faces of the main
  building → band **50+** (estimated ~180 positions).
- **Drop yard / dropArea:** Deep trailer aprons flank both dock faces with
  extensive trailer parking → `dropYard: true`, `dropArea` band **50+**.
- **Ship/Rcv separate:** Docks on two opposite long faces (E and W) operate as
  physically separate dock banks → `shipRcvSeparate: true` (medium confidence).
- **Trailers visible:** ~90 across both dock faces at capture.
- **Rail-served:** False — no spur enters the property.

## Web findings

UNFI's Schnecksville DC is a full-service grocery distribution center that
expanded UNFI's Northeast presence, including a refrigerated/frozen build-out
(a Metl-Span cold-storage solution; an ice-cream freezer maintained at -20 °F).
The NORR amenity-spaces project added modern employee amenities (Lifestyle
Center, ESL training). The FY26 closure follows the termination of the Key Food
account — a textbook entry in UNFI's "Great Consolidation" closure cadence
(Logan Township → Allentown → next regional consolidation point).

## Final confidence

**Medium.** Location is firmly re-resolved (roster address was wrong) and
building identity is confirmed by the "UNFI" pavement marking and multiple
corroborating sources. Dock layout is clearly readable. Gate and guard-shack
calls are inferred — the entrance berm blocks the Street View angle — and are
flagged in `uncertainFields`. The facility is mid-closure; counts reflect the
physical yard as imaged.
