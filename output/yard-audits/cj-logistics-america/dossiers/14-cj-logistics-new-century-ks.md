# Deep-Audit Dossier — CJ Logistics, New Century KS Cold Storage (idx 14)

## Facility
- **Name:** CJ Logistics - New Century KS (Cold Storage)
- **Type:** Cold Storage Distribution Center
- **Address:** 27302 W 159th Street, New Century, KS 66031 (roster gave the
  cross-streets 159th Street & Lenexa Parkway; exact street number 27302
  resolved via the Johnson County Post tax-abatement article)
- **Resolved coordinates:** 38.842000, -94.901500 (best-effort parcel estimate)

## Step 0 — Location confirmation (LIMITED)
The geocoded roster point (38.840005, -94.899250, GEOMETRIC_CENTER, moved 1m) is
the 159th Street intersection center, not a building. Web research positively
identified the facility: CJ Logistics America's New Century cold storage
warehouse, 27302 W 159th St, **immediately adjacent to (west of) the Upfield
(Flora) production plant at 27080 159th St**, with an active railway running
between the two buildings.

**Audit limitation:** The facility opened in Q3 2025. The available 2026 Maxar
satellite imagery PREDATES its construction — the parcel west of the Upfield
plant still shows vacant farmland in every probe (z15-z19). The building, dock
doors, truck gate, and yard therefore cannot be observed or measured from
imagery. The coordinates and perimeter box are a best-effort estimate of the
parcel based on the Upfield-plant adjacency and the rail alignment.

## Key views
- **z15-z17 context:** New Century AirCenter industrial park; the Upfield/Flora
  margarine plant is the large tan-roof complex; a rail line runs E-W along
  159th Street.
- **z18-z19 CJ parcel:** The land immediately west of the Upfield plant — where
  the CJ cold storage was built — is shown as vacant farmland / scrubland.
- **2024-08 Street View (159th St):** Rail line running parallel to the road;
  Upfield plant in the distance with construction-colored activity; the new CJ
  building not yet present.

## Gate / guard-shack / dock determinations
- **truckGate / guardShack / remoteGs:** Cannot be determined — building not
  visible in available imagery. Flags set false and listed in uncertainFields.
- **dockDoors / dropArea:** Cannot be counted — building not visible. Set NONE
  and flagged uncertain.
- **railServed: TRUE** — Web-confirmed. Multiple sources describe a rail-served
  cold storage with direct rail access; an active railway runs between the CJ
  building and the Upfield plant.

## Yard zones & counts
- **Perimeter:** Best-effort estimate (~370m x ~310m, ~28 acres) for a
  ~291,000 sq ft cold storage building plus yard on the parcel west of the
  Upfield plant — NOT measured from imagery.
- **All sub-zones:** null / empty — not observable.
- **Metrics:** Dock count, trailers, and capacity unknown; railServed true
  (web-confirmed); 1 building.

## Web findings
- CJ Logistics America's New Century cold storage warehouse opened Q3 2025,
  ~30 miles from Kansas City; ~291,000 sq ft, expandable to ~400,000 sq ft.
- Connected to Upfield's New Century production plant by an above-ground,
  over-rail conveyor bridge; Flora/Upfield finished product moves directly into
  the cold storage via the conveyor.
- Rail-served with direct rail access; ~4 miles from I-35; ~11 miles from the
  BNSF transcontinental intermodal facility.
- ~100,000 sq ft available for third-party customers.
- Johnson County approved a tax abatement for the project (Aug 2025).

## Final confidence
**Low.** The facility was positively identified and well-researched, but it
postdates all available satellite imagery (vacant farmland still shown on the
parcel), so no physical yard audit was possible. Location, type, and rail-served
status are reliable; all physical-yard classification fields are placeholders
flagged as uncertain. **Recommend re-audit when post-Q3-2025 imagery becomes
available.**
