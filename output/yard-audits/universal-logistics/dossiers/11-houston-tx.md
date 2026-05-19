# Deep Audit — Universal Intermodal Services, Houston Terminal, Houston TX (idx 11)

**Facility:** Universal Intermodal Services - Houston Terminal
**Address:** 7800 E Little York Rd Ste A, Houston, TX 77016
**Type:** Intermodal / Drayage Terminal (owned)
**Locked coordinates:** 29.87010, -95.28610
**Confidence:** Medium

## Location resolution
The loadmatch.com directory lists the Universal Intermodal Services Houston
terminal at 7800 E Little York Rd, Houston TX 77016. The same address is also
associated with Universal Truckload Service — both Universal Logistics
Holdings companies. The site is a drayage / intermodal terminal in NE
Houston, on the south side of E Little York Rd, with a residential
subdivision to the W and open field to the E. The roster ROOFTOP coordinates
land in the terminal yard; center locked at 29.87010, -95.28610.

## Imagery findings
- **Wide satellite (z17):** an intermodal terminal south of E Little York Rd —
  a building cluster with a very large yard, set among other transportation
  properties.
- **Terminal (z19):** a long N-S terminal building with an M&R / maintenance
  operation; trailers, tractors and equipment parked around it.
- **South yard (z18):** a very large compacted-gravel drayage yard packed
  with rows of chassis, containers and trailers; a smaller secondary building
  to the S.
- **North frontage (z18 + Street View 2025):** the property fronts E Little
  York Rd with an open yard apron. No perimeter fence along the road, no
  barrier arm, no sliding gate, no guard booth — trucks drive straight off
  the public road into the yard.

## Gate / guard-shack / dock determinations
- **truckGate = false** (flagged uncertain) — the road-frontage entrance is
  an open, ungated yard apron with no fence, barrier, or checkpoint
  pinch-point. Uncertain only because the deep interior of the yard could not
  be walked, but the entrance itself is unambiguously uncontrolled.
- **guardShack = false** — no booth anywhere along the frontage.
  remoteGs = false (no controlled gate).
- **drivewayLong = true** — long internal drive/apron from E Little York Rd
  to the dock face and deep yard; 3+ truck queue capacity.
  **postGateStaging = true** — large internal graveled holding area.
- **fastLaneOpportunity = true** — very wide open yard apron with ample
  unused width for an express/bypass lane.
- **dockDoors = "10-25"** — modest dock bank on the terminal building
  (~20 doors estimated) plus M&R bays; primarily a yard operation. Flagged
  uncertain.
- **dropArea = "50+", dropYard = true** — extensive chassis/container/trailer
  storage across the large south yard.

## Yard zones & counts
- **Perimeter:** ~22 acres enclosing the terminal building, the secondary
  building, and the large south drayage yard.
- **Truck gate:** none controlled — left null.
- **Drop yards:** the large south yard + a north yard strip.
- **Dock apron:** the strip in front of the terminal building.
- **yardMetrics:** ~20 dock doors, ~130 trailers/containers/chassis visible,
  ~350 capacity, 1 (uncontrolled) truck entrance, 2 buildings, ~22 acres, not
  rail-served.

## Web findings
Universal Intermodal Services operates a national network of drayage
terminals; the Houston terminal serves the Houston port/rail drayage market.
The 7800 E Little York Rd address is shared with Universal Truckload Service
in third-party directories — consistent with a Universal Logistics Holdings
intermodal/trucking operating property.

## Final confidence
**Medium.** Facility identity, location, and the open / uncontrolled-entrance
and no-guard-shack reads are well supported by 2025 Street View. Dock-door
count and trailer/chassis capacity are honest estimates from overhead
imagery and are flagged as uncertain.
