# UNFI Manchester PA DC — Deep-Audit Dossier

**Facility:** UNFI - Manchester PA DC (idx 2)
**Address:** 1025 Locust Point Rd, Manchester, PA 17345
**Resolved center:** 40.07043, -76.74648
**Type:** Distribution Center (UNFI Class-A tri-temp build-to-suit, opened Q1 FY25)
**Confidence:** Medium

---

## Location resolution

The roster ROOFTOP geocode (40.070433, -76.746475) for 1025 Locust Point Rd
lands squarely on a single very large (~1.3M sq ft) distribution building on a
129-acre parcel in York County, PA, along the I-83 corridor. Web corroboration
(BusinessWire, Modern Distribution Management) confirms this as UNFI's Manchester
PA DC — a Class-A tri-temp (ambient + refrigerated + frozen) build-to-suit
consolidation receiving DC that opened in Q1 FY25. This is one of the new-build
"third generation" UNFI facilities named in the Bushway dossier's "fewer,
larger, more automated" thesis. Identity and location are not in doubt.

## Key views — imagery state

The best available Maxar satellite imagery captures the site **mid-construction**:
the main building shell is roofed (the NE half shows a finished dark roof, the
SW half a lighter, still-being-finished roof), but perimeter paving, parking
striping, and yard buildout are incomplete. A second large structure is under
construction on the SE side of the parcel. The facility is operational per
public reporting (opened Q1 FY25), so the yard counts below rely on the
published developer spec rather than on a count of finished imagery.

- **z16/z17 overview:** A single very large rectangular DC oriented NE-SW
  dominates the 129-acre parcel, bordered by farmland, woods, and scattered
  rural residences off the I-83 corridor.
- **z18 SE dock face:** A long dock face with dock doors lining the SE long
  side, with trailers backed in and a deep dock apron — the drop yard runs
  along the SE side.
- **z18 SW gate area:** A single dedicated access road runs from the SW off
  Locust Point Rd; a guard-booth-scale structure and a gated checkpoint sit at
  the campus entry (~40.0668, -76.7448). The wide access road and large open
  apron at the gate are visible, though construction-era imagery leaves the
  booth itself not fully resolved.

## Gate / guard-shack determination

A single truck entrance from the SW, via a dedicated access road off Locust
Point Rd, leads to a gated checkpoint at the campus entry. A guard-booth-scale
structure is present at the entry. `truckGate: true`, `guardShack: true`,
`remoteGs: false` — a staffed guard booth is assumed for a modern Class-A
build-to-suit grocery DC of this scale. The booth and gate are not fully
resolved in construction-era imagery, so all three calls are flagged in
`uncertainFields`.

## Yard zones and counts (from published spec)

- **Perimeter:** ~129-acre parcel (published figure) enclosing the building,
  dock aprons, and drop yard.
- **Dock doors:** Published spec — 214 dock positions. Dock doors are visible
  lining BOTH long faces (NW and SE) of the building → band **50+**.
- **Trailer parking / dropArea:** Published spec — 492 trailer parking spaces
  → `dropYard: true`, `dropArea` band **50+**.
- **Trailers visible:** ~40 in the construction-era imagery (not a finished-
  yard count).
- **Ship/Rcv separate:** Two distinct dock banks on the two opposite long faces
  of the building → `shipRcvSeparate: true`.
- **drivewayLong / fastLane:** Long dedicated access road from the public road
  to the gate, deep approach, wide gate apron → `drivewayLong: true`,
  `fastLaneOpportunity: true`.
- **buildingCount:** 1 (the main DC; the SE structure under construction is
  treated as part of the same single-DC build).
- **Rail-served:** False — no rail spur observed entering the property; a
  truck-served grocery DC.
- **urbanRural:** The parcel is surrounded by farmland, woods, and scattered
  rural residences in York County off the I-83 corridor → **Rural**.

## Web findings

Manchester PA is one of UNFI's new-build consolidation receiving DCs, opened
Q1 FY25 — a Class-A tri-temp (ambient/refrigerated/frozen) build-to-suit. In the
Bushway dossier it is repeatedly named as a prime YardFlow pilot candidate: a
fresh, modern facility commissioned with current-generation tooling, sitting
inside UNFI's active consolidation cadence as a receiving point for redistributed
volume.

## Final confidence

**Medium.** Location and identity are firmly confirmed and the building/dock
layout is readable. Yard counts (214 docks, 492 trailer spaces) come from the
published developer spec because the satellite imagery predates yard buildout;
the gate and guard-shack calls are inferred from construction-era imagery. All
inferred fields are flagged in `uncertainFields`.

*Dossier backfilled to match the pre-existing `02-manchester-pa.json`; the JSON
classification and metrics were not modified.*
