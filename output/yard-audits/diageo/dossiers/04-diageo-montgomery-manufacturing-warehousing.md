# Deep-Audit Dossier — Diageo Montgomery Manufacturing & Warehousing, Hope Hull AL

**Roster idx:** 4
**Type:** Manufacturing & Warehousing Facility
**Address:** 7000 Celebration Way, Hope Hull, AL 36043
**Resolved coordinates:** 32.2785, -86.3645
**Gate verdict:** Indeterminate (construction-era imagery) · **Guard shack:** Indeterminate · **Confidence:** Medium

## Location confirmation
The roster geocode (32.279069, -86.36396) carried an 8,043 m correction flag.
Web research confirms 7000 Celebration Way, Hope Hull AL is Diageo's new
Montgomery manufacturing & warehousing facility — a $415M, 360,000 sq ft plant
that officially opened April 21, 2026 (Diageo press releases 2025/2026; WSFA;
The Bama Buzz). Satellite probing around the geocode point revealed two large
buildings under construction in a logistics park south of Montgomery, off I-65,
consistent with the press descriptions. Location is confirmed with high
confidence; locked center at 32.2785, -86.3645.

## Imagery limitation (important)
The most recent available satellite imagery (Maxar) of this site is from the
**construction phase**: building roofs only partially installed, yards graded
but unpaved, construction trailers and material laydown scattered across the
site, and no finished perimeter fence, gates, dock doors, or trailer-parking
lots in place. Street View has no pano covering the facility itself (the only
nearby 2026-02 pano is at an electrical substation on undeveloped land). As a
result, the **yard-classification fields cannot be reliably determined** and are
flagged in `uncertainFields`. The facility itself is positively located.

## Key views
- **z15/z16 overview** — two large building masses under construction in a
  logistics park; surrounding land is bare earth and graded pads.
- **Manufacturing building (north)** — partial roof, construction laydown yard
  on the west side with construction trailers and materials.
- **Warehouse building (south)** — large rectangular footprint, roof partially
  complete, graded but unpaved surrounding yard.
- **Between buildings** — an internal access corridor and a process equipment
  area (tanks) under construction.

## Gate / guard-shack / dock determinations
- **Truck gate: indeterminate.** No finished gate, barrier arm, or perimeter
  fence is visible — the yard was still being built. Defaulted `false` but
  flagged uncertain.
- **Guard shack: indeterminate.** No booth visible; flagged uncertain.
- **Docks:** the warehouse building will host the main dock bank; doors are not
  yet built/visible. Estimated band 25-50 based on a 360K sq ft warehousing
  operation — low confidence.

## Yard zones and counts
- **Perimeter:** ~93 acres covering the developed two-building footprint and
  graded yards (the construction laydown extends further).
- **Drop yards / dock aprons / staging:** not yet built — left empty or
  approximate.
- **Buildings:** 2 (manufacturing + warehouse) — `multipleFacilities` true.
- **Rail served:** false — road-served logistics park, no spur visible.

## Web findings
Diageo Montgomery: $415M investment, 360,000 sq ft, opened April 21, 2026; part
of Diageo's distribution network for Smirnoff and Captain Morgan; multi-million
case annual capacity. Highly automated — robotics, automated blending, and five
on-site automated guided vehicles (AGVs). ~100 full-time employees; ~750
construction jobs.

## Final confidence
**Medium.** The facility is positively identified and located, but the only
available satellite imagery predates the April 2026 opening, so gate, guard,
dock, and trailer-yard fields could not be visually verified and are flagged
uncertain. A re-audit once post-opening imagery is available is recommended.
