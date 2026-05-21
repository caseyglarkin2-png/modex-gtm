# Deep-Audit Dossier — Kenco MCS Dallas I (DeSoto, TX)

**Roster idx:** 4
**Type:** Multi-Client Distribution Center / E-Commerce Fulfillment
**Address:** 2119 N Interstate 35 East Service Rd, Suite 200, DeSoto, TX 75115
**Resolved coords:** 32.63200, -96.82960
**Confidence:** High

## Location confirmation
The roster pin (32.631712, -96.82947) lands on the northernmost of three
large warehouses along the I-35E service road in DeSoto, TX. Web research
(LogiCore, DeSoto Chamber of Commerce, Kenco/BusinessWire releases) confirms
Kenco operates the Walker Edison e-commerce DC at 2119 N Interstate 35 East
Service Rd, DeSoto; Gordon Highlander built it (~490,000 SF). The pinned
building's scale and dual-face dock layout are consistent. Locked center at
the building centroid, ~32.63200 / -96.82960.

## Key views
- **z16 context** — three large DCs along I-35E; dense residential to the
  west; the pinned building is the northern structure.
- **z17/z18 building** — large E-W warehouse; docks on the N face (dark band
  with trailers) and the S face; striped trailer drop yards on the W end.
- **N face (z19)** — dock apron with a long row of trailers backed in and
  staged equipment.
- **S face (z19 + Street View 2025-02)** — long continuous dock bank with
  many doors and trailers; full chain-link perimeter fence along the service
  road.
- **W end (z19)** — large striped trailer-parking drop yard against a fence
  line separating it from residential.
- **S/SW gate (z20 + Street View 2025-02)** — fenced truck gate with twin
  landscaped islands, gate arms, and a guard booth.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE.** The whole property is fenced (chain-link). The truck
  driveway off the I-35E service road passes through a controlled gate with
  gate arms — clearly visible in z20 satellite and 2025-02 Street View.
- **Guard shack: TRUE.** A small 1-vehicle-footprint guard booth sits beside
  the gate driveway, visible in both z20 satellite and Street View.
- **Remote GS: FALSE.** Guard shack present, so not remote.
- **Docks:** Long dock banks on BOTH the N and S long faces of a ~458,000-
  490,000 SF e-commerce DC — banded **50+**. Two physically separate dock
  clusters → `shipRcvSeparate: true`.

## Yard zones and counts
- **Perimeter** — fenced parcel: building plus W and S drop yards and the
  gate apron, ~35.3 acres.
- **truckGate** — the fenced gate / guard-booth area on the S/SW driveway.
- **dropYards** — large striped W-end drop yard plus a striped S-side yard.
- **dockAprons** — N-face and S-face dock aprons.
- **staging** — paved apron outside the gate along the service road.
- **yardMetrics** — ~80 dock doors (estimate), ~25 trailers visible (yards
  largely empty in this imagery), ~160 trailer capacity, 1 truck gate,
  1 building, 35.3 acres, no rail spur.

## Web findings
LogiCore and the DeSoto Chamber list "Kenco Logistics – Walker Edison" at
2119 N Interstate 35 East Service Rd. Kenco/BusinessWire releases describe
the Walker Edison turnkey e-commerce DC; Gordon Highlander cites a ~490,000 SF
build (roster source cites 458,000 SF / 36 ft clear — same facility).

## Final confidence
High. Building positively identified by address + web corroboration; gate and
guard-shack confirmed by clear 2025-02 Street View and z20 satellite; dual
dock faces confirmed. Door and trailer counts are honest overhead estimates
(flagged in uncertainFields).
