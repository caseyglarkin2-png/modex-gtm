# UNFI — Hopkins MN DC (idx 12)

**Address:** 300 2nd Ave S, Hopkins, MN 55343
**Resolved center:** 44.91900, -93.40550
**Confidence:** High

## Location confirmation
The roster coordinate (44.91914, -93.40308, ROOFTOP) landed on the east edge of
the main DC building. Web search confirmed the address — "UNFI / SUPERVALU
Distribution Center, 300 2nd Ave S, Hopkins MN 55343" (Waze, dcontrol, TruckMap,
businessyab). An NLRB case (18-RC-284875) names the operator as **"UNFI
Wholesale, Inc., formerly known as Supervalu Wholesale Operations, Inc."** —
confirming this is a **legacy-SuperValu** conventional-grocery DC, the
Minneapolis-metro hub UNFI inherited in the 2018 acquisition. The roster note's
mention of a related grocery DC at 201 3rd St S resolves to the second
(west) building on this same campus.

## Site layout
- **Multi-building campus** — at least 3 buildings: the **main DC** (very large,
  center-east), a **separate large west warehouse** with its own dock bank, and
  a smaller building plus office buildings.
- **Main DC docks** run along the **north face** — a long continuous dock bank
  with trailers backed in.
- **West building docks** run along its **SW face** — a distinct second dock
  cluster.
- **Trailer drop yards** — a large yard north of the main building and another
  at the west building; together well over 50 trailers.
- **Employee parking** lots on the SE (with a retention pond) and around the
  offices; a solar-roofed office building at the SE corner.
- A **light-rail line** (Metro Green Line LRT extension) runs alongside the
  adjacent highway — this is transit rail, **not** a freight spur into the DC.

## Gate / guard-shack determination
- **truckGate: true.** z19–z20 imagery shows a distinct truck checkpoint on the
  NE side of the main building: the inbound truck lane pinches around a guard
  structure, and 2025 Street View shows the property is perimeter-fenced
  (chain-link). This is a controlled truck entrance.
- **guardShack: true.** A clear **red-roofed guard booth** straddles the truck
  lane (≈1–3-vehicle footprint, set in/beside the lane) with a long covered
  canopy/awning extending over the inbound lane — a classic staffed guard shack.
  This is the SuperValu conventional-grocery guarded-entry profile (Kraft Heinz
  #1 equivalent), and the only one of the four UNFI sites in this batch with a
  guarded entry.
- **remoteGs: false** — a staffed booth is present, so this is not a remote /
  kiosk check-in.

## Docks & yard
- **dockDoors: 50+** — roughly 130 dock doors estimated across the campus (main
  DC north face + the separate west building's dock bank). Large legacy-SuperValu
  DC; exact count uncertain from overhead imagery.
- **dropArea: 50+** — multiple large trailer drop yards hold well over 50
  trailers (`dropYard: true`).
- **postGateStaging: true** — a large paved truck court and drop yard sit inside
  the gate, before the dock doors; `staging` boxed at the gate apron.
- **drivewayLong: true** — long internal truck approach from the guard booth to
  the north-face docks.
- **fastLaneOpportunity: true** — very wide truck court and gate apron with
  unused paved width; clear room to stripe an express bypass lane.
- **shipRcvSeparate: true** — two physically separate dock clusters on different
  buildings (main DC north face + west building SW face).
- **multipleFacilities: true** — a 3-building campus.
- **scale: false** — no truck scale clearly identified (flagged uncertain).
- **railServed: false** — no freight rail spur enters the property; the nearby
  tracks are the LRT line.

## Setting
**Urban.** Hopkins is an inner-ring suburb in the dense Minneapolis–St. Paul
metro; the campus is hemmed in by residential streets, commercial development,
a highway and a light-rail line. Cellular coverage is strong, so
`connectivityIssue: false`.

## Web findings
A legacy-SuperValu conventional-grocery wholesale DC — exactly the facility
profile the Bushway dossier describes as the SuperValu inheritance: large
conventional-grocery DC, PINC/Kaleris-generation yard tooling, guarded entry,
high dock count. The NLRB case confirms an active, Teamsters-context unionized
workforce. As a legacy-SuperValu Midwest DC, it sits inside UNFI's ongoing
"Great Consolidation" footprint review.

## Final confidence: High
Location address-confirmed against a ROOFTOP roster coordinate. The
gate/guard-shack call is unambiguous — a red-roofed staffed booth straddling the
truck lane is clearly visible in z19–z20 imagery and the property is fenced.
Residual uncertainty is limited to exact dock-door count, lane counts and the
presence of a truck scale — all flagged in `uncertainFields`.
