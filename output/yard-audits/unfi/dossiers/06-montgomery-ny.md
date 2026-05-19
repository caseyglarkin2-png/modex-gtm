# UNFI Montgomery NY DC (Hudson Valley) — Deep-Audit Dossier

**Facility:** UNFI - Montgomery NY DC, Hudson Valley DC (idx 6)
**Address:** 525 Neelytown Rd, Montgomery, NY 12549
**Resolved center:** 41.49355, -74.23700
**Type:** Distribution Center (UNFI Atlantic Region, LEED Gold, opened 2014)
**Confidence:** Medium

---

## Location resolution

The roster ROOFTOP geocode (41.493552, -74.235922) for 525 Neelytown Rd lands
squarely on a large L-shaped distribution building off Neelytown Rd in the Town
of Montgomery, Orange County NY, in the Hudson Valley. Web corroboration (UNFI
press release, Yellow Pages): this is UNFI's **Hudson Valley DC**, opened 2014
and built to LEED Gold standard, serving the NYC-metro Whole Foods customer
base. Identity and location are not in doubt.

## Key views

- **z16/z17 satellite:** A large L-shaped DC building sits on a wooded parcel
  off Neelytown Rd, with a smaller separate ancillary building to the SE and a
  large trailer drop yard at the NW corner.
- **z18/z19 W and NW faces:** Continuous dock-door rhythm along the W and NW
  long faces of the L-shaped building, with ~75 trailers backed in / parked
  across the imagery. The truck drive wraps the W side of the building.
- **z18 NW corner:** A large marked trailer-parking lot (drop yard) holding many
  trailers without tractors.
- **z19 S side:** The office wing and employee parking are on the SW; the
  building water tower / tank sits at the SE corner.
- **Street View (Neelytown Rd, 2025-03):** The building is set well back from
  the public road behind a band of employee parking; the office cluster is
  visible from the road. The truck gate is not directly resolved at road level.

## Gate / guard-shack determination

A single private access road serves the property from Neelytown Rd; the truck
drive wraps the W side of the building into the dock aprons and NW drop yard.
The gate itself is set inside the parcel and is not visible from the Street View
panos along Neelytown Rd (which show mostly the office/employee frontage).
`truckGate: true`, `guardShack: true`, `remoteGs: false` — assigned
medium-confidence: a controlled gated entrance with a staffed booth is the norm
for a modern (2014) LEED Gold UNFI DC serving the NYC-metro Whole Foods account.
All three flagged in `uncertainFields`.

## Yard zones and counts

- **Perimeter:** ~48 acres enclosing the L-shaped building, W/NW dock aprons,
  NW drop yard, employee parking, and the small SE ancillary building.
- **Buildings:** Main L-shaped DC plus a small SE ancillary building (likely
  fleet/maintenance) → `buildingCount: 2`; `multipleFacilities` left false
  because the second building is small and ancillary, not a co-equal large
  cluster.
- **Dock doors:** Continuous dock rhythm on the W and NW faces → band **50+**
  (estimated ~90 positions).
- **Drop yard / dropArea:** Large marked trailer lot at the NW corner →
  `dropYard: true`, `dropArea` band **50+**.
- **Trailers visible:** ~75 backed in / parked at capture.
- **Ship/Rcv separate:** Docks form one continuous W/NW dock system on the
  L-shaped building rather than two distinct opposing banks → false.
- **Rail-served:** False — no spur enters the property.

## Web findings

UNFI's Hudson Valley DC (Montgomery NY) opened in 2014 as a LEED Gold facility,
expanding UNFI's Northeast natural/organic distribution reach and serving the
dense NYC-metro Whole Foods and independent-natural-grocer customer base. As a
2014-generation build it sits in the "third generation" of UNFI yard tooling
described in the Bushway dossier — newer than the legacy-SuperValu Carlisle/York
sites and newer than the legacy-UNFI east-coast footprint.

## Final confidence

**Medium.** Location and building identity are firmly confirmed. Dock and
drop-yard layout are clearly readable from satellite. Gate and guard-shack calls
are inferred (Street View does not reach the truck gate) and are flagged in
`uncertainFields`.
