# Ford - Buffalo Stamping Plant, Hamburg NY — Deep Audit

## Resolved location
- **Roster coords (42.74703, -78.902483) were wrong** — they landed in a residential
  lakeshore neighborhood in Hamburg town, ~5 km SSW of the plant. Roster address
  (5000 Lakeshore Rd) is also off.
- Web research gave the correct address — **3663 Lake Shore Rd, Hamburg/Blasdell,
  NY 14219** — and Wikipedia coordinates 42°47′13″N 78°50′35″W.
- Probed there and found the Buffalo Stamping Plant: a ~2.45M sq ft building on an
  88-acre site at the east end of Lake Erie, beside Route 5 (Lake Shore Rd / NY-5).
- **Locked center: 42.78650, -78.84280.** Ford branding on the building wall and a
  "Buffalo Stamping Plant" sign confirmed in Street View.

## Key views
- **Wide satellite (z16-17):** One enormous single-building footprint with a large
  multi-track rail yard along the entire east/SE side, material-storage yards on the
  south, employee parking and a paved truck staging lot on the north/NW.
- **NW entrance (z18-21):** Main access loop off the Route 5 service road — front
  parking, a fenced lot, a gate and a small structure at the building base.
- **East side (z18-19):** Multi-track rail yard runs into the property; dock canopies
  along the east building face; a rail car visible on the tracks.
- **South yard (z18):** Vast steel-coil / material storage racks (raw-material intake)
  — not trailer parking.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Continuous chain-link perimeter fence rings the property
  (confirmed in 2025 Street View along the Route 5 service road). Controlled NW
  entrance off the service road into the front staging/parking lot.
- **guardShack = uncertain → false (low confidence).** A small structure sits at the
  building base beside the entrance gate. From highway-distance Street View (the only
  Street View available — no pano on the plant's own access road) it cannot be
  confirmed as a staffed guard booth vs. a utility/electrical structure. Flagged.
- **remoteGs = true (low confidence).** Set on the basis that a controlled gate exists
  without a confirmed booth.
- **dockDoors = "25-50".** Dock canopies along the east building face near the rail
  yard; ~25 estimated.
- **dropArea = "0-10".** South/SE yards hold steel-coil and material racks, not parked
  trailers; only a few trailers visible.
- **railServed = true.** Multi-track rail yard runs into the property — typical for a
  stamping plant (inbound steel coil, outbound stamped panels).

## Yard zones / counts
- Perimeter: ~165 acres inside the property line.
- One drop/staging area on the north (paved truck lot), one dock-apron strip on the
  east building face. South material yards excluded from drop-yard (steel storage).
- Building: 1 (one giant connected structure).

## Web findings
- Opened 1950; six major expansions to ~2.45M sq ft; 88-acre site; $80M-$150M
  reinvestments in recent years; EPA/NYSDEC environmental records confirm the site.

## Confidence: MEDIUM
Facility positively identified and overall layout clear. Street View is limited to
the Route 5 highway and service road — no pano on the plant's own access road — so
the guard-booth determination and lane counts are low-confidence (flagged).
