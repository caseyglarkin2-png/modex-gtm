# Deep-Audit Dossier — Frito-Lay Arlington TX (idx 10)

## Status: UNRESOLVED — could not positively locate the facility

## What the roster gave
- **Roster address:** 5500 Watson Rd, Arlington, TX 76018
- **Roster coords:** 32.657998, -97.062805 (RANGE_INTERPOLATED, movedMeters 5)
- Probing those coordinates lands in a single-family residential subdivision
  east of a highway in SE Arlington — not an industrial parcel. The roster
  address is wrong; the roster source itself flagged it as "approximate from
  public business listings".

## Web research
- Multiple business directories (Yelp, Cylex, PotatoPro, D&B, IndustryNet)
  consistently identify the Frito-Lay Arlington plant as:
  **948 Avenue H E, Arlington, TX 76011** — listed as "Frito-Lay Inc - Dip
  Plant". Production began 1971; ~80 employees. This is a small, legacy
  facility (a dip/salsa plant, not a large potato-chip manufacturing plant).
- No coordinate was published for the Avenue H E address.

## Search performed
- Probed the Arlington lettered-avenue industrial corridor along the Union
  Pacific railroad NE of downtown (the district that carries the A-M avenues)
  at z15-z17 satellite over a ~2 km span, plus ~12 Street View headings.
- The corridor is full of small and medium industrial buildings of similar
  size. No building presents an unmistakable Frito-Lay manufacturing
  signature — no rooftop process tower/silos, no large multi-bay dock bank,
  no trailer drop yard. Because the Arlington facility is small and old
  (consistent with a dip/salsa operation), it does not stand out from
  neighboring industrial tenants in overhead imagery, and Street View did not
  surface an "Avenue H" street sign or Frito-Lay signage at the parcels probed.

## Outcome
Per the deep-audit-prompt's unresolved-facility clause, the `.json` is written
with `confidence: "low"`, all 22 classification fields listed in
`uncertainFields`, and `geofences`/`yardMetrics` left null/zero. Placeholder
coordinates (32.7370, -97.0915) mark only the general Avenue H E corridor.

## Recommendation
Human review required. Obtain a verified parcel / address for the Frito-Lay
Arlington (Avenue H E) plant — e.g. from PepsiCo facilities records or Tarrant
County appraisal district — before this site can be audited. Given it is a
small ~80-employee legacy facility, expect limited yard infrastructure.

## Final confidence: low
