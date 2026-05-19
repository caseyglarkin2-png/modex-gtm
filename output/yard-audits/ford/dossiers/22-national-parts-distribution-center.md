# Ford - National Parts Distribution Center, Livonia MI — Deep Audit

## Resolved location
- Roster coords (42.3728, -83.33552) land on the east edge of a very large warehouse
  on Middlebelt Rd — they are essentially correct (the geocode "movedMeters 3497" was
  measured against an earlier wrong point, not a current error).
- Probed the building and confirmed: a ~1M sq ft distribution warehouse running
  north-south along Middlebelt Rd, dock doors on the east face, trailers backed in.
- Web research confirms address **11871 Middlebelt Rd, Livonia, MI 48150** — Ford
  Customer Service Division National Parts Distribution Center, opened 1951 (once the
  world's largest parts warehouse under one roof, ~1M sq ft).
- **Locked center: 42.37280, -83.33600.**

## Key views
- **Wide satellite (z16-17):** One enormous warehouse, long axis N-S; a CSX rail line
  along the north edge; a separate trailer-storage yard north of the rail; a separate
  office/support building at the NE; commercial/industrial development all around.
- **East face (z18-19, Street View 2025):** Continuous chain-link perimeter fence along
  Middlebelt Rd; a long bank of dock doors with many trailers backed in (white, orange).
- **North (z18):** CSX rail line with sidings and rail cars; large drop-yard full of
  dozens of parked trailers below the rail line.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Continuous chain-link perimeter fence rings the property along
  Middlebelt Rd (confirmed in 2025 Street View). Controlled driveway entrances cut
  through the fence into the dock yard.
- **guardShack = false (low confidence).** No clearly identifiable staffed booth at the
  entrances in Street View; small structures are present near a flagpole but cannot be
  confirmed as guard booths. Flagged uncertain.
- **remoteGs = true (low confidence).** Gate present without a confirmed booth.
- **dockDoors = "50+".** A long dock-door bank runs the full east face of the ~1M sq ft
  building with trailers backed in; ~70 estimated.
- **dropArea = "50+".** Dedicated trailer-storage yard north of the property holds
  dozens of trailers, plus more staged in the east yard.
- **dropYard = true.** Dedicated trailer-storage lot across the rail line to the north.
- **railServed = true (medium confidence).** A CSX rail line with sidings and rail cars
  runs the entire north edge; a direct spur into the building is not clearly visible.
- **multipleFacilities = true.** Main DC plus a separate office/support building and
  the trailer yard on one campus.

## Yard zones / counts
- Perimeter: ~100 acres across the campus.
- Two drop-yard boxes (north trailer yard, east staging yard), one long dock apron on
  the east face, one post-gate staging area.
- Buildings: 2 (main DC + NE office/support building).

## Web findings
- Opened 1951; ~1M sq ft; Ford Customer Service Division National Parts Distribution
  Center. Operating M-F.

## Confidence: HIGH
Facility positively identified, layout and dock/drop counts clear. Guard-booth and
exact lane counts are low-confidence (flagged) — Street View covers the fence line but
not the gate interiors.
