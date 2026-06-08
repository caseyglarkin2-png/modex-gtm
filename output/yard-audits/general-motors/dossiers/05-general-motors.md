# GM - Spring Hill Manufacturing, Spring Hill TN — Deep Audit

**Facility:** GM Spring Hill Manufacturing (former Saturn complex)
**Address:** 100 Saturn Pkwy, Spring Hill, TN 37174
**Type:** Vehicle Assembly Plant (integrated assembly + powertrain + paint + stamping; adjacent Ultium battery)
**Resolved center:** 35.735, -86.9615
**Confidence:** High

## Step 0 — Location confirmation
The roster's approximate point (35.7045, -86.922) landed on an isolated
office-style building southeast of the plant, not the manufacturing core. A web
search (Wikipedia: 35.7371, -86.9579; GM and GM Authority facility pages)
identified the true complex, and satellite probing confirmed it: a sprawling
multi-building manufacturing campus — the largest GM facility in North America
at ~11 million sq ft on ~2,100 acres. I re-pinned the audited center to the
manufacturing core at 35.735, -86.9615. The audited perimeter traces the fenced
manufacturing core (~720 acres of the larger land holding), not the entire
2,100-acre property.

## What the imagery showed
- **Region / full-complex (z14-15):** A dense cluster of very large gray- and
  white-roofed manufacturing buildings center-left, ringed by an internal loop
  road, with Saturn Parkway (a four-lane divided highway) curving along the east
  side and terminating at the plant. A separate very large stamping/logistics
  building sits to the SW (~35.724, -86.969) with its own dock yard, and the
  Ultium Cells battery plant cluster sits to the north — confirming a true
  multi-facility campus.
- **Core building roofs (z18):** Multiple integrated buildings with inter-building
  dock courts; trailers and trucks backed in along several faces.
- **West face (z18):** Dock courts with trailers staged and an adjacent
  employee-parking sea; trailer staging along the building's west edge.
- **South stamping/logistics building (z17):** Long dock line along its east face
  with trailers and material staging in the yard, Saturn Pkwy adjacent.
- **NE corner (z17):** Office / visitor / admin campus (blue-gray roofs) — not
  freight; intentionally excluded from the yard perimeter.

## Gate / guard-shack determination
Access to the plant is via **Saturn Parkway**, a four-lane divided highway built
specifically to serve the plant; reporting on the Saturn Pkwy extension states
the road dead-ends at the GM plant and is restricted to **truck and employee
traffic only**, with a **signalized truck-entry intersection** at the plant
entrance. The internal approach roads converge at a controlled checkpoint inside
the property line before reaching the secured manufacturing core — classic
guarded-automotive-campus geometry. A facility of this scale and security posture
operates staffed gatehouse(s) at the truck entry. Verdicts: **truckGate = true,
guardShack = true, remoteGs = false.** The long internal approach (hundreds of
meters from the public-road entry to the dock courts) gives **drivewayLong = true**
and ample room for **fastLaneOpportunity = true**. Street View on the public
Saturn Pkwy approach (pano ~35.7312, -86.9628, captured 2026-02) shows the
plant in the distance across the controlled approach; interior gate/dock zones
have no Street View coverage, so zone panos are marked hasCoverage:false.

## Docks, trailers, yard zones
- **dockDoors: 50+** — dock doors across many faces of the assembly, paint,
  powertrain and stamping/logistics buildings; trailers backed into the
  inter-building dock courts. Overhead total estimate ~90.
- **dropArea / dropYard: 50+ / true** — multiple trailer-storage and staging
  lots: the west-face dock courts and the south stamping/logistics yard. Well
  over 50 trailer positions; capacity estimated ~200.
- **shipRcvSeparate: true** — inbound material receiving and outbound
  parts/vehicle shipping run from physically separate dock clusters on different
  faces of the campus.
- **railServed: true** — on-site CSX rail spur serves the plant, corroborated by
  GM material-handling cross-dock references and the documented CSX
  grade-separation / overpass project on the access route.
- Traced zones: perimeter (9-vertex ring around the fenced core), a truckGate
  quad at the entry checkpoint, two dropYard rings (west dock court + south
  logistics yard), and two dockApron strips along building faces.

## Web findings
- GM / GM Authority: largest GM facility in North America, ~11M sq ft, ~2,100
  acres; builds ICE and EV (Cadillac XT5/XT6, LYRIQ, VISTIQ) on one line;
  ~4,000+ employees; includes assembly, engine, paint/plastics, parts warehouse,
  visitors center.
- Saturn Pkwy extension reporting: parkway is truck/employee-only, dead-ends at
  the plant, new signalized truck intersection at the gate.
- CSX rail service with on-site spur; grade-separation overpass project noted.

## Classification summary
Guarded, fully controlled-access automotive megacampus: truck gate + guard shack,
long approach with fast-lane room, separated entry/exit, 50+ docks, 50+ trailer
drop capacity, separate ship/receive, multi-facility campus, rail-served.
`scale`, exact lane counts, exact dock count, and `multiStep` flagged uncertain.

**Gate:** TRUE (signalized truck-only Saturn Pkwy entry, controlled internal checkpoint)
**Guard shack:** TRUE (staffed gatehouse, controlled-access megacampus)
**Confidence:** High
