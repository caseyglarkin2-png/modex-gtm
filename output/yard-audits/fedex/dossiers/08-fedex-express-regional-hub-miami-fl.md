# FedEx Express Regional Hub - Miami FL (idx 8)

## Resolved location
- **Audited center:** 25.79255, -80.29525 — southwest cargo apron, Miami International Airport (MIA)
- **Roster address (7150 NW 25th St, Miami FL 33122):** geocodes to a generic warehouse/lease
  park ~1.5 km west of MIA. Street View at the NW 72nd Ave / NW 25th St intersection (2026-01)
  shows lease "AVAILABLE" signage and unbranded warehouses — **no FedEx presence**. The roster
  coordinate is a landside address, not the operational hub.
- **Operational hub:** FedEx Express's Americas-gateway air-cargo hub at MIA — a single
  ~282,000 sq ft cargo distribution facility (a $72.2M expansion added 138,000 sq ft and a
  70,000 sq ft cold-chain area; PGAL/GRAEF project pages describe ~17 acres of development on a
  ~30-acre site). The building is the long cargo structure on the southwest cargo apron.

## How it was confirmed
- z15 orientation showed the MIA cargo complex on the south/southwest airfield.
- z17-z19 satellite of the southwest cargo row revealed a long cargo building with a widebody
  freighter parked on the airside apron (north face) and a full row of truck dock doors with
  trailers backed in along the landside (south/southwest face), plus an employee parking lot
  and a curved landside access road.
- **Building attribution is medium-confidence:** MIA's cargo complex is multi-carrier. 2022
  Street View along the cargo road shows a **DHL**-branded building at the east end of the row.
  No FedEx branding was directly visible from accessible Street View panos. Identification of
  the FedEx building rests on facility type, scale (~282K sq ft / ~30-acre footprint), and the
  airside-apron + landside-dock-row configuration consistent with the documented FedEx hub.

## Key views
- **Airside apron (north):** widebody cargo freighter parked at the building; yellow cargo
  dollies / ULD containers staged on the apron.
- **Landside (south/southwest):** continuous bank of dock doors, ~50-60 estimated, with white
  trailers backed in; additional trailers staged in the apron strip and a side lot.
- **Access road:** curved landside cargo-service road feeding the dock area; employee parking
  to the southwest.

## Gate / guard-shack / dock determinations
- **truckGate: true (medium conf).** Airport cargo facilities are reached via controlled
  airport cargo-service roads; access to the Airport Operations Area / cargo zone is
  security-credentialed. There is no conventional per-building gate arm visible, but the cargo
  zone itself is a controlled-access environment — counted as a controlled truck gate.
- **guardShack: false.** No dedicated 1-3-vehicle guard booth at the building's own driveway.
- **remoteGs: true.** Gate exists (airport cargo-zone credentialing) but no on-site booth.
- **multiStep: true (low conf).** Airport cargo access is inherently staged — security
  checkpoint at the cargo-zone perimeter, then the building's dock dispatch.
- **dockDoors: 50+.** Long continuous dock face with regular bay rhythm.
- **dropArea: 10-25 / dropYard: true.** Trailers staged in front of the dock row and a side lot.
- **shipRcvSeparate: false.** Single dock bank along one building face.

## Yard zones and counts
- **perimeter:** ~30-acre box around the building, airside apron, landside docks and parking.
- **truckGate / dockApron / dropYard:** boxed best-effort along the landside cargo road and
  the dock face. `staging` left null.
- **yardMetrics:** ~55 dock doors, ~22 trailers visible, ~40 trailer capacity, 1 truck gate,
  1 building, ~30 acres, no rail.

## Web findings
- FedEx Express completed a $72.2M MIA expansion (2021): main sort facility now >282,000 sq ft,
  with a new customs clearance area and a 70,000 sq ft cold-chain facility (largest in the
  FedEx network). MIA is FedEx's Americas gateway connecting the US/Canada to Latin America and
  the Caribbean. (newsroom.fedex.com, businesswire, PGAL, GRAEF project pages.)

## Final confidence: medium
Facility type, scale, and configuration are clear, but the exact FedEx building within the
multi-carrier MIA cargo complex could not be confirmed by visible branding; the roster street
address was a wrong landside location. Gate/guard determinations reflect the airport-cargo
access model rather than a conventional fenced truck gate.
