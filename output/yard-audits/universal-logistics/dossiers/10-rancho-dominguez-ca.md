# Deep Audit — Universal Intermodal Services, Rancho Dominguez/Compton Terminal, CA (idx 10)

**Facility:** Universal Intermodal Services - Compton/Rancho Dominguez Terminal
**Address:** 18020 S Santa Fe Ave, Rancho Dominguez, CA 90221
**Type:** Intermodal / Drayage Terminal / Container Yard (owned)
**Locked coordinates:** 33.86810, -118.21210
**Confidence:** Medium

## Location resolution
The loadmatch.com directory and FMCSA list Universal Intermodal Services /
Southern Counties Express Inc (dba Universal Intermodal Services) at the
Rancho Dominguez terminal, 18020 S Santa Fe Ave, Rancho Dominguez CA 90221 —
a drayage / container-yard terminal serving the LA / Long Beach ports. The
roster geocode shifted ~149 m; the fenced building-plus-yard parcel fronting
S Santa Fe Ave (a major industrial arterial) is the audit target. Center
locked at 33.86810, -118.21210.

## Imagery findings
- **Wide satellite (z16):** dense Rancho Dominguez industrial district; the
  audit parcel sits on the W side of S Santa Fe Ave, with another stacked-
  container yard directly across the road on the E side.
- **Property (z18–z19):** a central warehouse building with rows of chassis
  and containers along its W and S sides, trailer/container storage on the N,
  and equipment lanes — a working drayage yard, not a dock-heavy DC.
- **S frontage / Santa Fe Ave (Street View 2025):** continuous chain-link
  perimeter fence; fenced front yards with sliding gates set in the fence
  line at the driveway openings. Trailers parked along the street. The gate
  lane itself was not captured open or in use.

## Gate / guard-shack / dock determinations
- **truckGate = true** (flagged uncertain) — the whole property is ringed by
  chain-link fence; sliding gates are set in the fence at the driveway
  openings, giving controlled truck access. Universal Intermodal markets
  itself as a C-TPAT certified secure carrier, consistent with access
  control. Uncertain because the gate was not captured in operation.
- **guardShack = false / remoteGs = true** (both flagged uncertain) — no
  clearly staffed guard booth was visible beside the gate; a sliding gate
  without a manned booth implies kiosk / driver check-in.
- **backupSensitive = true** — gates open directly onto S Santa Fe Ave, a
  busy industrial arterial with little stacking room outside the fence; a
  gate queue would spill onto the road.
- **drivewayShort = true** — compact yard; short approach from gate to the
  active dock/yard face. **postGateStaging = true** — paved holding space
  inside the fence.
- **dockDoors = "10-25"** — modest dock bank on the central warehouse
  (~18 doors estimated); this is primarily a yard operation. Flagged
  uncertain.
- **dropArea = "50+", dropYard = true** — extensive chassis/container rows
  and trailer storage; heavy drop-yard character.

## Yard zones & counts
- **Perimeter:** ~11 acres enclosing the warehouse and the surrounding
  chassis/container yard.
- **Truck gate:** sliding gate(s) on the S Santa Fe Ave frontage.
- **Drop yards:** W/S chassis-and-container rows + N container storage.
- **Dock apron:** the strip in front of the central warehouse dock bank.
- **yardMetrics:** ~18 dock doors, ~120 trailers/containers visible, ~320
  trailer/container capacity, ~2 truck gates, 2 buildings, ~11 acres, not
  rail-served (no spur into the parcel).

## Web findings
Universal Intermodal Services operates a national network of ~40 drayage
terminals and 8 container yards; the SoCal-ports Rancho Dominguez terminal
provides drayage, container-yard management, and M&R. C-TPAT certified,
interchange agreements with steamship lines and railroads.

## Final confidence
**Medium.** Facility identity and the drayage-yard character are well
established, but the dense irregular parcel, the ~149 m geocode shift, and
limited Street View of the gate lanes leave the truck-gate / guard-shack
calls and the dock/trailer counts as estimates — all flagged for human
review.
