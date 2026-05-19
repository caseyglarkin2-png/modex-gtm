# Deep-Audit Dossier — Frito-Lay Orlando FL (idx 26)

## Resolved location
- **Roster address is wrong.** The roster lists `8000 S Orange Ave, Orlando, FL 32809`
  (lat 28.4546, -81.3655) — that point is a mixed retail/commercial strip on
  S Orange Ave and corresponds to a Frito-Lay divisional/distribution listing,
  not a manufacturing plant.
- Web research found Frito-Lay's actual Orlando **manufacturing plant at
  2800 Silver Star Rd, Orlando, FL 32808** — in operation since 1965, the site
  named in the Nov-2025 closure WARN notices (454 manufacturing layoffs).
- Locked center: **28.5772, -81.4182**. Satellite confirms a large industrial
  manufacturing complex: multi-section building with rooftop snack-food
  processing equipment, storage silos/tanks, and a visible steam plume —
  consistent with a Frito-Lay plant, not an office.
- **Closure note:** PepsiCo Foods closed the Orlando plant; operations ceased by
  May 9, 2026 and news reports the Silver Star Rd plant was being demolished in
  spring 2026. Maxar satellite imagery and 2025-04 Street View show it fully
  operational; this audit reflects the yard as physically imaged.

## Key views
- **Overview (z16-18):** Plant fronts the south side of Silver Star Rd via an
  internal access road. Main building complex center/east; employee parking
  lots north and far-east; truck staging/parking yard upper-center; a separate
  warehouse-style building on the west along a rail line; a small shop building
  to the south.
- **Truck entrance (z20 + Street View):** Truck driveway leaves an internal
  access road that runs south from Silver Star Rd. Chain-link perimeter fencing
  with a sliding/swing gate across the truck lane. A **blue canopy** structure
  covers an internal check-in lane just inside the gate.
- **Docks (z20):** West face — rows of trailers and canopy-covered docks along
  the rail side, with stacked pallet/material storage. East face — a dock apron
  with 4-5 trailers backed in, plus a tractor-trailer on the east drive.
- **Production side (z20):** South/SE building faces are utility/process areas —
  rooftop equipment, pipe racks, storage tanks/silos — not loading docks.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Fenced truck yard with a gate across the truck lane;
  controlled pinch-point off the internal access road. Strong evidence.
- **guardShack = false / remoteGs = true.** No standalone staffed booth at the
  road. The blue check-in canopy inside the gate indicates kiosk/remote check-in
  rather than a manned shack.
- **dockDoors = "25-50".** ~28 doors estimated across the west and east faces;
  approximate because production faces are obscured by rooftop equipment.
- **shipRcvSeparate = true.** Distinct dock clusters on the west face and the
  east face — different building faces.
- **dropYard = true / dropArea = "25-50".** Dedicated trailer + box-truck
  parking yard north of the docks, plus trailer rows along the west rail side.

## Yard zones and counts
- **perimeter:** ~333 m x ~300 m, ~25 acres inside the fence line.
- **truckGate:** the gate/check-in canopy off the internal access road.
- **dropYards:** (1) west rail-side trailer rows; (2) north staging/parking lot.
- **dockAprons:** (1) west face; (2) east face.
- **staging:** large open paved area inside the gate before the docks
  (postGateStaging = true; deep enough for a 3+ truck queue → drivewayLong).
- **yardMetrics:** ~28 dock doors, ~30 trailers visible, ~55 trailer capacity,
  1 truck gate, 3 buildings, ~25 acres, rail-served.

## Web findings
- Plant operating since 1965; ~454 manufacturing workers laid off in the
  Nov-2025 closure announcement (PepsiCo Foods U.S. consolidation).
- Two Orlando facilities cited for closure: 2800 Silver Star Rd (this plant) and
  2000 Park Oaks Ave (support warehouse). A third Frito-Lay distribution center
  at 998 N John Young Pkwy was sold to Bridge Logistics for redevelopment.

## Confidence
**Medium.** Facility positively identified and the yard layout, gate, and zones
are clear from satellite + Street View. Confidence is held at medium because:
the roster coordinates were wrong (resolved by research); dock-door count is
approximate due to rooftop clutter; rail service is inferred from a siding; and
the site is closed/being demolished, so current ground truth may differ from
the imagery audited.
