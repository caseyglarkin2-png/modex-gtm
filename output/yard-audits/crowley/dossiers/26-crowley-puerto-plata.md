# Crowley Puerto Plata Container Terminal - Dossier

**Site:** Crowley container service terminal, Puerto Plata multipurpose port (Muelle Nuevo / Taino Bay), Dominican Republic (north coast)
**Resolved center:** 19.7993, -70.7021
**Type:** Marine container terminal (small multipurpose wharf, shared cargo + cruise)
**Confidence:** LOW

## Location confirmation
Crowley runs a direct weekly container service from Puerto Plata to Port Everglades
(Crowley press release; sails Mondays). The Crowley terminal address is "Antigua
Via Ferrea, Muelle Nuevo entre Av. Penetracion Portuaria y Prolongacion Duarte" -
the commercial port of San Felipe de Puerto Plata at ~19.802 N, -70.700 W
(Wikipedia: Port of Puerto Plata 19.80278, -70.70000).

The port is a SHARED cargo + cruise facility. Satellite (z16-19) showed:
- The long central N-S pier is the **Taino Bay cruise berth** (three cruise ships
  docked in the imagery) - inaugurated Dec 2021 as a tourist + cargo terminal.
- A private **cruise village** (circular pavilions, swimming-lagoon, landscaped
  excursion area) on the east/landside - clearly tourism, not freight.
- The **cargo / container operation** is the modest paved working yard on the WEST
  side of the pier base, adjacent to round bulk-storage tanks (fuel/cement).

I probed the bay repeatedly to separate cargo from cruise. There is **no large
dedicated container stacking yard** here like a major box terminal; Crowley's
container service works off a small multipurpose wharf. This drove the LOW
confidence rating.

## What the key views showed
- **z16 / z17 wide:** the whole bay - cruise pier center, city wrapping the south
  and east shores, port infrastructure (tanks, paved yards) on the southwest shore.
- **z18 pier base (19.7985,-70.7008):** cruise ship at the pier, cruise village
  (circular structures + lagoon) bottom-right, and the cargo working area with
  bulk tanks on the west.
- **z19 west cargo yard (19.7992,-70.7022):** a paved yard with scattered
  equipment, some cargo/containers, and small buildings - a working but compact
  cargo area, much of the frame being open sea surface.

## Gate / guard / dock determinations
- **truckGate / guardShack:** A working ISPS port implies a controlled, guarded
  perimeter entry, but the exact gate structure + lane count were NOT cleanly
  resolved in satellite (port frontage merges with the cruise-village access road).
  Both set true but **flagged uncertain**. Street View exists at the port frontage
  (pano @ 19.79832, -70.70121, captured 2022-03), so streetViewMeta hasCoverage:true.
- **dockDoors:** NONE. Marine terminal - no warehouse dock-door bank.
- **dropArea / dropYard:** the compact west cargo yard holds container/chassis;
  banded 10-25 (conservative).

## Yard zones & counts (honest estimates)
- **"Yard spots" = container/chassis GROUND SLOTS, ~250 capacity** (low confidence) -
  this is the metric Jake wants, NOT dock doors. Drawn from the small west-side
  paved cargo yard (~10-12 working acres).
- trailersVisible ~40; dockDoorCount 0; truckGateCount 1; buildingCount 3;
  siteAreaAcres ~11; railServed false (the "Antigua Via Ferrea" is a former,
  abandoned rail line - no live spur).

## Web findings
- Crowley launched the Puerto Plata -> Port Everglades weekly service to complement
  its Rio Haina and Caucedo (Dominican Republic) calls.
- The port handles container, general cargo, fuel and cruise - a multipurpose
  facility, consistent with the compact cargo footprint seen.

## Final confidence: LOW
Imagery cleanly identified the port complex but the cargo-vs-cruise split and the
small, mixed-use cargo footprint make the container-slot count and gate details
genuinely uncertain. trailerParkingCapacity, gate/guard, and acreage are conservative
ranges, not precise figures.

**3-line summary**
- Gate: likely guarded ISPS port entry, but exact gate not resolved - flagged uncertain.
- Guard shack: implied (working port), not visually confirmed - flagged uncertain.
- Confidence: LOW.
