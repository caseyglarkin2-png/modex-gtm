# GM - Romulus Propulsion Systems, Romulus MI — Deep Audit Dossier

**Roster idx:** 13
**Type:** Propulsion Systems (Engine / Transmission) Plant
**Resolved center:** 42.25520, -83.40080
**Confidence:** Medium

## Location resolution

The address 36880 Ecorse Rd, Romulus (Wayne County) MI 48174 geocodes to a
point on the Ecorse Rd frontage (~42.2521, -83.4018). My first probe at a
nearby web-supplied coordinate landed on Detroit Metro Airport (DTW) runways
(the plant sits just northwest of DTW), so I re-centered on the Ecorse Rd
address and confirmed the building from satellite. The correct facility is the
large continuous industrial plant whose south and west faces front Ecorse Rd
and Vining Rd; I refined the center to the main building cluster at
~42.2552,-83.4008.

Web research (GM facility pages, GM Authority, americanautoworker.com,
Wikipedia "Romulus Engine") confirms identity: GM Romulus Propulsion Systems,
opened 1976, ~1.4M sq ft, producing the HFV6 (3.6L) V6 engine and the GM
10-speed (10L) automatic transmission used across Chevrolet/Buick/GMC/Cadillac
(Blazer, XT5/XT6, CT5; Escalade, Tahoe, Yukon, Silverado/Sierra). Represented
by UAW Local 163. GM announced an $830M Romulus/Saginaw/Toledo investment in
April 2026.

## Key views

- **z15/z16 context** — one massive continuous plant building on a large
  parcel; employee parking on the south (Ecorse Rd) and west (Vining Rd);
  freight operations on the north/northeast; two water-retention ponds and a
  powerhouse/utility complex on the north; wooded buffer and undeveloped land
  on the SE; a rail line along the east edge.
- **North dock bank (z18)** — a dock bank along the north building wall with
  several trailers backed in.
- **NE freight yard (z17/z18)** — a long row of ~20+ angled/backed drop
  trailers plus a material laydown area (stacked returnable containers / steel
  racks); a second trailer row sits mid-east; a retention pond separates it
  from the building.
- **East edge (z18/z19)** — a rail line (double track) with parked
  boxcars/autoracks runs along the east property line; an internal perimeter
  road runs N-S inside the fence with a small blue-roofed structure (candidate
  guard/rail-crossing booth) near 42.2548,-83.3968. The rail crosses Ecorse Rd
  at a grade crossing at the SE corner.
- **West (z17)** — Vining Rd separates the GM plant from two large modern
  logistics warehouses (dock-heavy, many trailers) that are SEPARATE,
  off-property buildings — excluded from this audit.
- **Street View (2025-09)** — south Ecorse Rd frontage shows the employee
  parking lot across the road; the SE freight access drive and the east
  perimeter are set well back behind a thick tree buffer, so the gate itself is
  not resolvable from the public road.

## Gate / guard-shack / dock determinations

- **Truck gate: true.** Freight enters via an east/NE perimeter access road
  that loops from an Ecorse Rd driveway (~42.2522,-83.3982) up to the NE
  freight yard. The gate sits deep inside the parcel behind a wooded setback
  and is not visible from Street View. A secured GM powertrain plant of this
  scale operates a controlled truck gate. truckGateCount estimated 1 primary
  freight gate — flagged uncertain (employee entrances are separate).
- **Guard shack: true (medium confidence).** A fenced ~1.4M sq ft GM plant
  conventionally runs a staffed gatehouse at its freight entry; a small
  blue-roofed structure on the east perimeter road is a candidate but could not
  be positively confirmed as a booth. Flagged uncertain. remoteGs false.
- **Dock doors: 10-25 (count ~24).** A dock bank with trailers backed in is
  clear along the north building face, plus NE dock/trailer activity. Exact
  count partly obscured by roof overhang.
- **Ship/Rcv separate: true (medium confidence).** Activity on physically
  separate areas (north dock bank vs NE trailer yard / east laydown) — flagged
  uncertain.

## Yard zones and counts

- **Perimeter:** ~180 acres — the parcel from Vining Rd (west) to the rail line
  (east), Ecorse Rd (south) to the north ponds/utility area, trimming the SE
  undeveloped wooded triangle and excluding the off-property west warehouses.
- **Drop yards:** (1) the NE trailer/laydown yard, ~20+ trailers plus material
  laydown; (2) a second mid-east trailer row. dropArea banded 25-50, dropYard
  true; trailersVisible ~40, capacity ~70.
- **Dock aprons:** the north dock bank where trailers back into the north wall.
- **Buildings:** 2 (main continuous plant + detached north powerhouse/utility
  building); the campus is a single integrated plant so multipleFacilities is
  false.
- **Rail:** a rail line with parked railcars runs the east property edge and
  appears to spur into the parcel; the site was originally a GM Detroit Diesel
  Allison facility and is rail-capable — railServed true.

## Web findings

- Opened 1976; ~1.4M sq ft; HFV6 V6 engine + GM 10-speed transmission.
- Customers/vehicles: Blazer, XT5/XT6, CT5; Escalade, Tahoe, Yukon,
  Silverado/Sierra. UAW Local 163.
- April 2026: GM announced an $830M investment across Romulus/Saginaw/Toledo
  propulsion sites.

## Final confidence

**Medium.** The facility is positively identified and the perimeter, freight
zones, drop yards, dock bank, and east-edge rail are well established from
imagery. The truck gate is confirmed by the dedicated freight access road but
is obscured from Street View by a tree buffer; guard-shack presence, exact gate
/ lane / dock-door counts, ship-receive separation, and pre/post-gate staging
are inferred or estimated and flagged uncertain.
