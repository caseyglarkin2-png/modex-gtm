# GM - Ultium Cells, Lansing / Delta Township MI

**Type:** Battery Cell Plant (GM JV)
**Address:** Delta Township, MI (former GM land NW of 8175 Millett Hwy, Lansing MI 48917)
**Resolved center:** 42.7160, -84.6470
**Maps (satellite):** https://www.google.com/maps/@42.71600,-84.64700,400m/data=!3m1!1e3
**Confidence:** medium

## Location confirmation
The roster address ("Delta Township, MI") is city-level only. Web research (LG Energy Solution press release, GM Authority, DOE supplemental EA, PureLansing) confirmed the facility: the **Ultium Cells Lansing** battery-cell gigafactory, a $2.6B / 2.8M sq ft / 41 GWh plant built by the GM + LG Energy Solution joint venture on ~590 acres of former GM land **immediately NW of GM's Lansing Delta Township (LDT) Assembly plant**, between the I-69/I-496 interchange (north) and Millett Highway (south). The roster's GM-Delta-Township geocode (42.7361, -84.5838) landed in residential Lansing well NE of the plant; satellite probing (z13-z18) walked SW and positively re-pinned the single large light-roofed gigafactory mass at ~42.7160, -84.6470, with the solar-roofed LDT Assembly complex clearly visible to its SE. Identity is unambiguous; confidence is held at **medium** only because all available imagery is construction-era (see below).

**Ownership note:** GM agreed in Q1 2025 to sell its JV stake to LG Energy Solution (now planning NCMA modules for Toyota). It was a GM JV when this roster was assembled; audited here as GM idx 28.

## Imagery caveat (drives the medium confidence)
Every Google/Maxar satellite tile AND the only Street View pano (2023-05) for this parcel are **construction-era**:
- The white roof membrane is only partway installed (clear two-tone roof in z16/z17).
- The land around the building is **raw graded earth** — no paved/striped truck yard, no installed perimeter fence or gate, no parked trailers.
- The SE end shows an active **contractor laydown yard** (job trailers, pipe/material stockpiles, worker parking).

So operational yard features (gate, guard booth, finished docks, drop yard, trailer parking) could **not be directly observed** and are inferred from the building design and the security/operating norms of a battery-cell gigafactory. Production was pushed to late 2025 / 2026.

## What each view showed
- **Wide (z13-14):** Re-pin walk from the bad geocode; identified the freeway interchange, the LDT Assembly solar complex, and the new gigafactory pad to its NW.
- **Site (z15-16):** Single very large rectangular building, long axis running NW-SE and **rotated ~30° clockwise from north**, sitting in a large graded parcel bounded by the I-69/I-496 ramps (N/NE), Millett Hwy (S), woods/road (W), and the assembly complex (E/SE).
- **Building (z17):** NE long face with rooftop mechanical penthouses; a **multi-bay dock structure under construction at the SE end** (dark roof, regular bay rhythm) — the receiving/shipping face.
- **SE corner (z18):** Active construction laydown yard, not an operational drop yard.
- **Street View (Millett Hwy, 2023-05):** Graded earth, retention pond, new utility poles and fence posts being set, plant in the far distance. No built gate.

## Gate / guard-shack / dock determinations
- **truckGate = true (uncertain).** No gate is built yet in the imagery (only fence posts being set). Inferred true on the gigafactory-security standard: a fully fenced, controlled-access campus is universal for a battery-cell plant of this value adjacent to a GM assembly plant.
- **guardShack = true (uncertain).** Same inference; no booth observable in construction-era imagery. `remoteGs` left false accordingly.
- **dockDoors = "10-25" (uncertain).** A multi-bay dock structure is being built at the SE end; banded conservatively for a single-building cell plant. Exact count not determinable from unfinished docks.
- **dropArea = "NONE" / dropYard = false (uncertain).** No paved trailer lot existed when imaged. Likely to materialize once operational.
- **shipRcvSeparate = false.** A single dock face is under construction at the SE end; no second separate dock bank visible.
- **fastLaneOpportunity = true.** Large open graded apron around the building leaves ample room to add bypass/express lanes at a future gate.

## Yard zones & counts measured
- **Perimeter:** 8-vertex oriented ring tracing the active developed plant site (building + immediate graded lot) between the freeway and Millett Hwy. **~171.6 acres.** (The full GM/Ultium land holding is ~590 ac including shared/expansion acreage.)
- **truckGate zone:** null — no built/observable gate location to trace.
- **dropYards:** [] — none built yet.
- **dockAprons (1):** a thin oriented quad along the SE dock face being constructed, at the building's ~30° angle.
- **yardMetrics:** dockDoorCount ~20 (uncertain), trailersVisible 0 (construction era), trailerParkingCapacity ~60 (inferred future), truckGateCount 1, buildingCount 1, siteAreaAcres 171.6, railServed false.

## Web findings
- LG Energy Solution / GM: $2.6B, 2.8M sq ft, 41 GWh, up to 1,700 jobs; announced 2022, on ~590 ac next to LDT Assembly.
- GM Authority (2025): GM stake sale to LGES; production timeline pushed to 2026; site now slated to build NCMA modules for Toyota.
- DOE supplemental environmental assessment and PureLansing confirm the Delta Township location adjacent to the existing GM assembly plant.

## Final confidence
**medium.** Facility identity is certain (unmistakable gigafactory mass, web-corroborated location, adjacency to LDT Assembly). Confidence is capped at medium because all imagery predates plant completion, so gate, guard shack, finished docks, drop yard, and trailer counts are inferred rather than observed — every operational field is listed in `uncertainFields`.

---
**3-line summary:**
- Gate: truckGate = true (inferred, uncertain) — secured gigafactory campus standard; no gate built in 2023-era imagery.
- Guard shack: guardShack = true (inferred, uncertain) — implied by gigafactory security; no booth observable.
- Confidence: medium — identity certain, but all imagery is construction-era so operational yard features are inferred.
