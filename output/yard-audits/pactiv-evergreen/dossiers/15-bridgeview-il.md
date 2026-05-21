# Pactiv Evergreen — Bridgeview, IL (idx 15)

**Address:** 7701 W. 79th Street, Bridgeview, IL 60455
**Type:** Manufacturing Plant (Foodservice; ISCC PLUS certified)
**Resolved coordinates:** 41.746000, -87.810400
**Confidence:** High

## Location confirmation

The roster coordinates landed on a large single industrial building running
NW-SE alongside a rail line, just south of the W. 79th Street / Harlem Avenue
bridge. Confirmed as the Pactiv Evergreen Bridgeview foodservice manufacturing
plant via web research (Waze, Chamber of Commerce, Manta, D&B, Indeed
reviews — all citing 7701 W. 79th St). The plant runs 24/7. It is ISCC PLUS
certified per the certification announcement referenced in the roster. Now
part of Novolex.

## Site layout

- One large single manufacturing building, long axis NW-SE, with material/
  resin silos clustered at its north end (foodservice manufacturing).
- Employee parking runs along the west side, facing a residential
  neighborhood.
- The truck/dock yard wraps the building on the west and south; an open
  paved/gravel lay-down yard sits to the southeast.
- A rail line runs immediately along the building's east edge.
- The whole property is enclosed in chain-link perimeter fencing.

## Gate / guard-shack determination

- **Truck gate: TRUE.** The property is fully chain-link fenced with
  **privacy-screened sliding gates across the truck-yard drives** — confirmed
  in both 2018 and 2025 Street View (sv-gate, sv-79th-e). At least two gated
  vehicle entrances along the south / southwest perimeter.
- **Guard shack: FALSE.** No guard booth structure sits beside any gate in any
  Street View heading probed.
- **Remote GS: TRUE.** Gates present, no guard booth — check-in is remote /
  manual.

## Docks & yard

- Extensive **canopied dock bays along the building's west face** with
  trailers backed in, plus additional dock doors on the south face. Total
  banded **25-50** — a substantial dock operation; count is an estimate from
  overhead imagery of the dock canopies.
- ~14 trailers visible; estimated capacity ~30 across the west apron and the
  SE open yard. No tightly-marked dedicated drop-stall lot — `dropArea`
  "0-10", `dropYard` false (the SE yard is more of an open lay-down/staging
  area than a striped drop yard).
- The west dock apron and SE yard give ample queue depth → `drivewayLong:
  true`; the inside-fence yard serves as post-gate staging.
- Two gated perimeter entrances modeled as separate in/out gates →
  `entryExitSeparate: true`.
- The large open SE yard leaves significant unused paved width →
  `fastLaneOpportunity: true`.
- No truck scale, no second checkpoint, no clearly separate ship/receive dock
  banks.

## Rail

**Rail-served: FALSE (flagged uncertain).** A rail line runs immediately along
the building's east edge, but no dedicated spur is clearly visible breaking
into the Pactiv property — service appears to be road-based. Flagged in
`uncertainFields`.

## Web findings

Pactiv Evergreen Bridgeview is a 24/7 foodservice packaging manufacturing
plant, ISCC PLUS certified (sustainability / mass-balance chain-of-custody
certification). Part of Novolex post-April-2025 combination.

## Setting

Urban — dense Chicago-area industrial / residential fabric, immediately south
of the 79th Street arterial bridge, bordered by residential on the west and a
rail line on the east. `urbanRural: Urban`, `connectivityIssue: false`.

## Final confidence: HIGH

Facility positively identified by location and corroborating web research.
Gate / no-guard-shack determination is clear across two Street View vintages.
Dock-door count, trailer capacity, and rail-served status are estimates /
uncertain flags.
