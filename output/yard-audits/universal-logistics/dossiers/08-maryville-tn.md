# Deep Audit — Universal Logistics Services, Maryville Terminal, Maryville TN (idx 8)

**Facility:** Universal Logistics Services - Maryville Terminal
**Address:** 1615 Robert C Jackson Dr, Maryville, TN 37801
**Type:** Trucking / Logistics Terminal
**Locked coordinates:** 35.75479, -84.01224
**Confidence:** Medium

## Location resolution
The roster's source is the FMCSA SAFER snapshot for Universal Logistics
Services Inc (USDOT 839281, MC371555), physical address 1615 Robert C
Jackson Dr, Maryville TN 37801 — corroborated by TruckMap, Waze, Buzzfile
and D&B. The ROOFTOP geocode (35.754792, -84.012239) lands on a tan/white
metal warehouse at the corner of W Lamar Alexander Pkwy (US-321) and the
Robert C Jackson Dr industrial park, immediately SE of a long cross-dock
LTL freight-terminal building. The two buildings share a single paved truck
yard. Center locked at the warehouse, 35.75479, -84.01224.

**Operator caveat:** Universal Logistics Services Inc of Maryville (founded
2005, GM Jim Brinkley, ~77-unit fleet) is a small independent freight
carrier/brokerage. It is most likely **not** a subsidiary of Universal
Logistics Holdings (ULH / NASDAQ:ULH) — the roster appears to have matched on
the "Universal Logistics" name via FMCSA. The physical site is audited as
instructed, but the account linkage to ULH should be treated as uncertain.

## Imagery findings
- **Wide satellite (z17–z18):** a planned industrial park off US-321,
  alongside DENSO (1720) and ICC International (1620). The audit complex is
  two buildings — a long cross-dock LTL terminal and a SE warehouse — sharing
  one paved yard.
- **Cross-dock terminal (z19):** a long narrow building with dock doors along
  both long faces and many trailers backed in — classic LTL freight-terminal
  layout.
- **Roster-coords warehouse (z19–z20):** a tan/white metal warehouse with
  docks and trailers along its N face; it backs directly onto US-321 with no
  south-side access.
- **Shared yard (z19):** open paved area between the two buildings holding
  numerous parked trailers; connects to Robert C Jackson Dr via open
  driveways. Partial chain-link fence rings the yard.
- **Street View (2021–2025):** road frontage shows the buildings behind
  chain-link fence with open gravel/paved driveway entrances. No barrier arm,
  gate, or guard booth visible at the yard entrances; Street View coverage of
  the inner yard driveways is limited.

## Gate / guard-shack / dock determinations
- **truckGate = false** (flagged uncertain) — open industrial-park driveways
  into the yard; no barrier, sliding/swing gate, or checkpoint pinch-point
  observed. Partial perimeter fence but uncontrolled entrances.
- **guardShack = false** — no booth at any entrance. remoteGs = false
  (no controlled gate).
- **drivewayShort = true** — compact terminal; the approach from the road to
  the dock faces is only 1–2 trucks deep.
- **dockDoors = "25-50"** — the cross-dock terminal has doors on both faces;
  the SE warehouse has a N-face dock bank. Combined ~40 doors estimated;
  flagged uncertain.
- **dropArea = "25-50", dropYard = true** — the shared paved yard holds
  numerous parked trailers, consistent with LTL freight cycling.
- **multipleFacilities = true** — two distinct buildings on the complex
  sharing one yard.

## Yard zones & counts
- **Perimeter:** ~8.5 acres enclosing both buildings and the shared yard.
- **Truck gate:** none controlled — left null.
- **Drop yard:** the shared paved yard between the buildings.
- **Dock aprons:** N face of the SE warehouse; the cross-dock terminal faces.
- **yardMetrics:** ~40 dock doors, ~55 trailers visible, ~90 trailer parking
  capacity, 1 (uncontrolled) truck entrance, 2 buildings, ~8.5 acres, not
  rail-served.

## Web findings
Robert C Jackson Dr is a planned commercial/industrial park off W Lamar
Alexander Pkwy (US-321), home to DENSO Manufacturing Tennessee and ICC
International. Universal Logistics Services Inc has operated freight
transportation arrangement from Maryville since 2005; fleet of ~77 units,
~79 drivers, ~9.4M annual miles (2023).

## Final confidence
**Medium.** Location is confirmed and the open-access / no-guard-shack reads
are well supported, but the truck-gate call carries some uncertainty due to
limited Street View of the inner yard, dock/trailer counts are estimates, and
— importantly — the operator may be an independent company unrelated to
Universal Logistics Holdings. Flagged for human review of the account
linkage.
