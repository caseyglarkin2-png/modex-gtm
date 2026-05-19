# Deep-Audit Dossier — Kenco MCS Perris I (Perris, CA)

**Roster idx:** 5
**Type:** Multi-Client Distribution Center / E-Commerce Fulfillment
**Address:** 3900 Indian Avenue, Perris, CA 92571
**Resolved coords:** 33.84200, -117.22890
**Confidence:** Medium

## Location confirmation
The roster pin (33.841558, -117.228703) lands on a very large white-roofed
warehouse in the Perris (Inland Empire) logistics corridor. Web research
(LogiCore, Connect CRE, Commercial Observer, Commercial Property Executive)
confirms Kenco Logistics leased 579,708 SF at "Perris Logistics Center,"
3900 Indian Avenue, built 2014 on ~28 acres at the SW corner of N Perris Blvd
and Ramona Expressway. The pinned building's scale, build era, and dual-face
cross-dock layout are consistent. A second large building immediately to the
south is Kenco's Perris II (roster idx 6). Locked center at the Perris I
building centroid, ~33.84200 / -117.22890.

## Key views
- **z16 context** — dense Inland Empire warehouse district; the pinned
  building is the northern of two adjacent large DCs.
- **z17/z18 building** — large E-W cross-dock; dock banks with trailers on
  BOTH the N face and the S face; office and employee parking on the W end.
- **N face (z19/z21)** — dock apron with trailers backed in and a striped
  trailer drop yard against a dirt lot to the north.
- **S face (z19/z20)** — dock bank plus a large striped drop yard packed with
  colorful trailers, shared with Perris II to the south.
- **E side (z19)** — faces N Perris Blvd behind a landscaped buffer; no truck
  access from the east.
- **W side / entrance (z18-z21 + Street View)** — office, employee parking,
  and the private truck driveway off Indian Avenue.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE (medium confidence).** The N and S truck courts are
  bounded by chain-link fencing — a fence line is visible in z20 satellite and
  in 2018 Street View alongside the entrance driveway. Truck access is a
  single private driveway off Indian Avenue into the fenced court. Barrier-arm
  hardware could not be positively resolved at the road in available imagery
  (Street View covers only the public road), but a fenced truck court with one
  controlled driveway reads as a truck gate. Flagged in uncertainFields.
- **Guard shack: FALSE.** No guard booth visible at the driveway entrance or
  anywhere on the property across z20/z21 satellite and Street View.
- **Remote GS: TRUE.** Fenced truck court with no guard shack implies kiosk /
  app / remote check-in.
- **Docks:** Long dock banks on BOTH the N and S long faces of a 579,708 SF
  cross-dock — banded **50+**. Two physically separate dock clusters →
  `shipRcvSeparate: true`.

## Yard zones and counts
- **Perimeter** — Perris I building plus its N truck yard and its share of the
  S drop yard, ~30.5 acres (consistent with the cited ~28-acre parcel).
- **truckGate** — the fenced driveway entrance off Indian Avenue.
- **dropYards** — striped N-side drop yard and the shared S drop yard.
- **dockAprons** — N-face and S-face dock aprons.
- **yardMetrics** — ~90 dock doors (estimate), ~75 trailers visible,
  ~170 trailer capacity, 1 truck gate, 1 building, 30.5 acres, no rail spur.

## Web findings
LogiCore lists "Kenco-Perris" at 3900 Indian Ave. Connect CRE / Commercial
Observer / Commercial Property Executive report Kenco's 579,708 SF lease at
Perris Logistics Center (built 2014, ~28 acres). Kenco's own release describes
a new Multi-Client DC with e-commerce/order fulfillment, kitting, appliance,
furniture, pharma/medical and cross-docking services. Import records reference
a "Kenco Perris DC" tied to P&G distribution.

## Final confidence
Medium. Location is positively confirmed by address + multiple commercial
real-estate sources. Dual dock faces and large drop yards are clear. The gate
call rests on visible perimeter fencing plus a single controlled driveway; the
exact gate hardware and any kiosk could not be resolved (Street View does not
enter the private drive), so truckGate / guardShack / remoteGs are flagged in
uncertainFields and the overall confidence is Medium.
