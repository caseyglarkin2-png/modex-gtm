# Deep-Audit Dossier — idx 15

## K-C Warren Advanced Manufacturing Facility — Warren, OH

**Roster coords:** 41.226713, -80.811838 (GEOMETRIC_CENTER, moved 3 m)
**Locked center:** ~41.2235, -80.8115 (approximate property center)
**Type:** New advanced manufacturing facility (Huggies, Pull-Ups, Kleenex, Scott, Viva, Kotex, Poise, Depend) — ~1.0–1.2M sq ft, $800M, **under construction**
**Gate verdict:** Indeterminate — no yard infrastructure exists in available imagery
**Archetype:** Indeterminate (under construction)
**Confidence:** LOW

---

## Step 0 — Location confirmation

The roster coordinates land squarely on the correct property: the 560-acre
former Republic Steel / BDM Steel brownfield off **Pine Avenue (Niles River
Road)** in Trumbull County, spanning Howland Township, Warren Township and a
small piece of the City of Warren — less than a mile from Warren's Courthouse
Square. The Mahoning River bounds the parcel on the west; an active NE–SW rail
line crosses the site.

Web research corroborates: JobsOhio / WFMJ / WKBN / Vindicator / Business
Journal Daily all describe an $800M K-C advanced manufacturing plant on this
former steel-mill lot. Kimberly-Clark bought the 560-acre parcel from the
Western Reserve Port Authority in late 2023; construction began ~May 2025;
production is slated for H1 2027.

Location is therefore positively confirmed. The coordinates are correct.

## Steps 1–3 — Imagery review

- **Wide / mid satellite (z14–z16):** A large elongated brownfield runs roughly
  N–S along the Mahoning River — cleared, graded earth with old foundation
  scars from the demolished steel mill. No plant building, no fence line, no
  paved truck courts.
- **Tight satellite (z18):** The SE corner shows an existing white-roofed
  industrial building and an aggregate / sand-and-gravel operation (material
  stockpiles, processing equipment). These are pre-existing or separate
  operations on/adjacent to the parcel — NOT the new K-C plant.
- **Street View (Pine Ave, captured Nov 2024):** Undeveloped brushland behind a
  chain-link fence along the road. The pano predates construction; no building,
  gate or guard booth visible.

The current Maxar/Airbus satellite layer and the Street View pano both predate
the K-C structure. Per the Vindicator (Jan 2026), the manufacturing building is
"sealed up and weathertight" with ~300 workers on site — but that progress is
not yet captured in any imagery available to this audit.

## Steps 4–5 — Web findings & classification

- $800M, ~1M+ sq ft advanced manufacturing facility — K-C's second-largest US
  plant. Production H1 2027. ~491 permanent jobs.
- A separate proposed **$160M, ~500,000 sq ft regional distribution center** is
  planned on greenfield land *across Pine Avenue* — not yet started.
- The City/townships are vacating ~1 mile of Niles River Road / Pine Avenue
  Extension (Burton St to Deforest St) for the project; $17M in All Ohio
  Futures Fund money is building a replacement road.

Because no truck-yard infrastructure exists in any obtainable imagery, every
operational classification field (gate, guard shack, docks, drop yard, lanes,
staging, etc.) is **unresolvable** and listed in `uncertainFields`. The flags
are set to their `false` / `NONE` / `null` defaults to keep the record valid,
not as positive findings.

Calls that CAN be made with reasonable confidence:
- **urbanRural = Urban** — the site sits inside Warren's urban fabric, <1 mile
  from Courthouse Square, with residential grids flanking it east and west.
- **railServed = true** (medium confidence) — an active rail line crosses the
  property; a former integrated steel mill of this scale, repurposed for a
  major manufacturing plant, will almost certainly retain rail service.

## Yard zones & metrics

- **Perimeter:** Drawn around the visibly cleared brownfield footprint
  (≈41.2120–41.2330 N, −80.8175 to −80.8055 W). Approximate — the eventual
  fenced plant pad will occupy only part of the 560-acre parcel.
- **Sub-zones:** All `null` / empty — truck gate, drop yards, dock aprons and
  staging do not yet exist.
- **yardMetrics:** All counts 0 (no infrastructure visible). `siteAreaAcres` is
  set to the documented 560 acres of purchased land rather than derived from
  the perimeter box. `buildingCount` 0 reflects current imagery, not the
  planned single plant building (plus future cross-street DC).

## Final confidence

**LOW.** The facility is positively located and well-documented, but it is an
active construction site whose truck yard does not yet exist in any imagery a
satellite/Street-View audit can reach. A re-audit is warranted once 2027-era
imagery shows the completed plant, gate and dock layout.
