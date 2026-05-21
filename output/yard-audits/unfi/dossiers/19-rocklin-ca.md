# UNFI — Rocklin CA DC (Western Region) — Deep-Audit Dossier

**Roster idx:** 19
**Facility:** UNFI Western Region Division Distribution Center
**Address:** 1101 Sunset Blvd, Rocklin, CA 95765
**Resolved center:** 38.81370, -121.28320
**Confidence:** High

---

## Location resolution

The roster coordinate (38.81344, -121.282819) landed on a large gray-roofed
distribution building with extensive rooftop solar in Rocklin (Sacramento
metro). Web search confirmed the address (Yelp, Waze, ChamberOfCommerce,
Panjiva): UNFI Western Region Division, 1101 Sunset Blvd, Rocklin CA 95765 —
the legacy-UNFI West region DC, accessed from I-65 via Blue Oaks Blvd / Sunset
Blvd. Panjiva trade records confirm Whole Foods inbound through this site.
Building positively identified and locked.

## What the imagery showed

- **Wide satellite (z16-z17):** A single very large DC building (rooftop
  solar) set in a dense mixed-use Rocklin context — apartment complex to the
  north, single-family homes to the east, retail/industrial south and west.
  A separate 2-story glass office building stands at the W end of the parcel.
- **Truck side (z18-z19):** Dock banks with trailers backed in on the W/SW
  face; a drop yard full of parked drop trailers along the N face; a long
  trailer row along the E building wall. The truck court wraps the building.
- **Entrance (z19 + Street View, 2020):** The truck court connects to Sunset
  Blvd and the surrounding streets by open paved driveways at multiple points.
  The W end is offices and employee parking; the SW/SE faces are plain wall
  fronting employee parking.

## Gate / guard-shack determination

- **truckGate: FALSE.** No controlled truck entrance. The wrap-around truck
  court connects to the street network by open paved driveways. z19 satellite
  of every entry point and 2020-era Street-View on Sunset Blvd and the SE
  service road show no barrier arm, no sliding/swing gate, no guard booth and
  no perimeter fence. This is an open-access urban infill DC.
- **guardShack: FALSE.** No staffed booth on any part of the truck
  circulation.
- **remoteGs: FALSE.** Requires a gate to be present; there is none.

## Yard zones and counts

- **Perimeter:** ~38 acres — the main DC, the wrap-around truck court (W
  dock court, N drop yard, E trailer row), the W office building, and
  employee/office parking.
- **Drop yards:** two distinct concentrations — an N-face drop yard and a
  long E-face trailer row, both full of drop trailers without tractors.
  `dropArea` 50+; `dropYard: true`.
- **Dock aprons:** two clusters — the W/SW dock bank and the N-face dock
  bank — on different building faces, suggesting split shipping/receiving
  (`shipRcvSeparate: true`, medium confidence). Combined ~70 doors,
  `dockDoors` 50+.
- **postGateStaging: true** — wide interior truck courts before the docks.
  `drivewayLong: true` — courts run the full building length.
- **entryExitSeparate: true** — truck circulation enters/exits the
  wrap-around court at multiple points on different faces, not one shared gate.
- **yardMetrics:** ~70 dock doors, ~65 trailers visible, ~100-trailer
  capacity, 2 open truck-court access points, 2 buildings, ~38 acres, no rail.

## Web findings

UNFI Western Region Division — the legacy-UNFI West region DC in Rocklin
serving natural/organic/specialty distribution; Panjiva records show Whole
Foods inbound. ~20-100+ employees per directory listings. No public mention
of yard automation or a gated/guarded entrance.

## Final confidence: HIGH

Facility positively identified; imagery clear in all key views. Flagged
uncertain: `dockDoorCount` and `trailerParkingCapacity` (overhead estimates,
trailers occlude doors) and `shipRcvSeparate` (inferred from two dock
clusters, not confirmed operationally).

**3-line summary:**
Gate: no truck gate — open driveways into a wrap-around truck court, no barrier/fence/booth.
Guard shack: none.
Confidence: high.
