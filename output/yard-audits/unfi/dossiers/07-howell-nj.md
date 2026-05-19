# UNFI Howell NJ DC — Deep-Audit Dossier

**Facility:** UNFI - Howell NJ DC (idx 7)
**Address:** 433 Oak Glen Rd, Howell, NJ 07731
**Resolved center:** 40.13970, -74.18790
**Type:** Distribution Center (UNFI Atlantic Region, natural/organic specialty DC, ~385,000 sq ft)
**Confidence:** Medium

---

## Location resolution

The roster ROOFTOP geocode (40.139697, -74.187949) for 433 Oak Glen Rd lands
squarely on a large distribution building with near-full **rooftop solar
coverage** in a heavily wooded parcel off Oak Glen Rd, Howell Township, Monmouth
County NJ. Web corroboration (BBB, Panjiva, NJ Board of Public Utilities filing,
Yellow Pages) confirms this as UNFI's Howell DC — a ~385,000 sq ft natural/
organic specialty distribution center. The NJ BPU filing documents two rooftop
solar arrays (1.575 MW "Project A" + 1.652 MW "Project B"), matching the
solar-covered roof visible in satellite imagery. Identity is not in doubt.

## Key views

- **z16/z17 satellite:** A solar-roofed main DC building sits on a heavily
  wooded parcel, with a separate older building cluster immediately to the N
  (a red-roofed structure plus a long warehouse) and an office building near
  the S employee parking lot. On-site stormwater ponds ring the property.
- **z18 W face:** Dock-door rhythm along the W face of the main building with
  ~50 trailers backed in / parked across the W apron and the N building's docks.
- **z18 NW area:** A modest trailer-parking area along the W / NW side.
- **z18 E edge:** A rail line runs along the E property edge; the building's E
  face carries solar panels — no rail spur enters.
- **Street View (Oak Glen Rd, 2025-09):** Only dense woods are visible from the
  road; the property is heavily tree-screened and set well back. The truck gate
  is not visible at road level.

## Gate / guard-shack determination

A single private access driveway serves the property from Oak Glen Rd; the
truck circulation wraps to the W dock apron and the N building. The driveway
runs a long way through the woods before reaching the buildings. The gate is
set well inside the tree-screened parcel and is not visible from the Street View
panos on Oak Glen Rd. `truckGate: true`, `guardShack: true`, `remoteGs: false`
— assigned medium-confidence: a controlled gated entrance with a staffed booth
is the norm for a UNFI specialty DC. All three flagged in `uncertainFields`.

## Yard zones and counts

- **Perimeter:** ~42 acres enclosing the three buildings, W dock apron, drop
  yard, employee parking, and on-site stormwater ponds.
- **Buildings:** Solar-roofed main DC + N building cluster (red-roofed + long
  warehouse) + S office building → `buildingCount: 3`, `multipleFacilities: true`.
- **Dock doors:** Dock rhythm on the W face of the main building plus the N
  building's docks; ~50 trailers backed in / parked → band **50+** (estimated
  ~55 positions — a modest footprint for a 385k sq ft specialty DC).
- **Drop yard / dropArea:** Modest trailer-parking area along the W/NW side →
  `dropYard: true`, `dropArea` band **10-25** (smaller drop capacity than
  UNFI's large conventional-grocery DCs).
- **Trailers visible:** ~50 at capture.
- **Ship/Rcv separate:** Docks form one continuous W-face system on the main
  building; the N building's docks are ancillary, not a distinct ship-vs-rcv
  split → false.
- **Rail-served:** False — rail line on the E edge, no spur enters.

## Web findings

The Howell DC is a legacy-UNFI natural/organic specialty distribution center —
distributing natural/organic foods, nutritional supplements, personal-care
items, and organic produce. Its modest 385k sq ft footprint and refrigerated-
heavy specialty profile are characteristic of the pre-2018 legacy-UNFI
east-coast footprint described in the Bushway dossier (smaller average DC size,
clustered near the natural-food customer base) — the opposite profile from the
large legacy-SuperValu conventional DCs. The dual rooftop solar arrays are part
of UNFI's sustainability program.

## Final confidence

**Medium.** Location and identity are firmly confirmed (the solar roof matches
the BPU-documented arrays). Dock layout and building cluster are readable from
satellite. Gate and guard-shack calls are inferred — the property is heavily
tree-screened and Street View does not reach the gate — and are flagged. The
`urbanRural` call is also flagged: Howell Township is within the dense NYC/NJ
metro corridor (→ Urban) but the immediate parcel is unusually isolated in
pine-barren woods.
