# Pactiv Evergreen — Raleigh, NC (idx 12)

**Address:** 2215 South Wilmington Street, Raleigh, NC 27603
**Type:** Manufacturing Plant (Beverage Merchandising; carton converting)
**Resolved coordinates:** 35.750876, -78.640973
**Confidence:** High

## Location confirmation

The roster coordinates landed on the rooftop of a mid-sized industrial building
immediately south of a large unrelated warehouse. Confirmed positively as the
Pactiv facility by **"pactiv evergreen" branding visible on the building wall**
in 2026-02 Street View (driveN / drive2 panos from Wilmington Street). Web
search corroborates 2215 S Wilmington St as the Pactiv Evergreen Raleigh plant
(loc8nearme, ImportYeti, active job postings). The rows of structures to the
southwest are a self-storage facility — NOT part of the Pactiv property.

## Site layout

- Single large manufacturing building with an attached brick office on the
  northwest (Wilmington St) frontage. Material-processing silos sit at the
  building's SE corner.
- Open, unbarriered driveway from Wilmington Street serves the office /
  employee parking on the northwest.
- The truck/dock yard wraps the south and southeast faces of the building,
  enclosed by chain-link perimeter fencing.

## Gate / guard-shack determination

- **Truck gate: TRUE.** 2022-09 Street View of the south side shows a
  **chain-link sliding/swing gate across the truck-yard drive lane**, with
  perimeter fence running off it. A truck entering the yard passes through this
  controlled gate.
- **Guard shack: FALSE.** No booth structure of any size sits beside the gate
  in any heading probed. The gate is an unstaffed chain-link gate.
- **Remote GS: TRUE.** Gate present, no guard booth — check-in is remote /
  manual (call box or office walk-in).

## Docks & yard

- Dock doors on the south and west faces — 5-8 visible with trailers backed in
  in Street View; banded **10-25** allowing for SE-face doors not fully
  resolved. Flagged as an estimate.
- Trailer parking is modest: ~6 trailers visible, the constrained apron/lot
  could hold roughly 10. No dedicated drop yard — `dropArea` "0-10",
  `dropYard` false.
- The dock apron opens onto a tight shared maneuvering lot with little
  stacking depth back to Wilmington Street → **backupSensitive: true**,
  `drivewayShort: true`.
- Single combined entry/exit gate; 1 inbound + 1 outbound lane.
- No truck scale, no second checkpoint, no separate ship/receive banks.

## Rail

**Rail-served: TRUE.** An active rail spur runs along the south property edge
and into the site beside the silos (confirmed in z19 satellite).

## Web findings

Pactiv Evergreen Raleigh is an active carton-converting plant (Beverage
Merchandising). Job postings (engineering intern, 2025) confirm ongoing
operations. Now part of Novolex post-April-2025 combination.

## Setting

Urban — inside Raleigh's developed industrial fabric just off I-40, surrounded
by warehouses, retail, and residential. `urbanRural: Urban`,
`connectivityIssue: false`.

## Final confidence: HIGH

Facility positively identified by on-building branding. Gate and rail confirmed
in imagery. Dock-door count is the only meaningfully uncertain figure
(estimated from partial Street View / satellite coverage).
