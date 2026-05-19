# Deep-Audit Dossier — Niagara Bottling, Phoenix AZ (idx 5)

## Resolved location
- **Address:** 275 S 67th Ave, Phoenix, AZ 85043
- **Locked center:** 33.44700, -112.20170
- **How resolved:** The roster supplied no address and no coordinates for this
  facility. Web research returned a consistent address — "275 S 67th Ave,
  Phoenix, AZ 85043" — across TruckMap, Yahoo Local, Yellowpages, Dun &
  Bradstreet, and chamber-of-commerce listings, all for Niagara Bottling
  Phoenix. Geocoding that address lands on a two-building warehouse/distribution
  complex on the east side of S 67th Ave, just south of Washington St.

## Building-identity caveat (medium confidence)
Source data on the Phoenix plant size conflicts:
- Wikipedia: "Niagara operates a 252,000 sq ft bottling plant in Phoenix."
- A real-estate listing for 275 S 67th Ave: 626,970 sq ft warehouse +
  3,030 sq ft office + 32 dock doors.

The geocoded site is a **two-building complex** larger than either figure, with
far more than 32 dock doors. Both office fronts on 67th Ave are heavily screened
by mature trees, so a "Niagara" sign could not be confirmed in Street View. The
audit proceeds on the strength of the consistently-listed street address, with
the building identity flagged as a medium-confidence call.

## Setting
Dense west-Phoenix industrial corridor along S 67th Ave, immediately abutting
residential subdivisions → **Urban**. Cellular coverage strong; no connectivity
concern.

## Key views
- **Wide satellite:** Two large E-W warehouse buildings (north + south) sharing a
  central dock yard; office fronts with curved-arch entrances on 67th Ave.
- **Central dock yard (z18):** Both buildings present long dock-door runs facing
  the shared central yard, which is full of dropped trailers.
- **North building (z18):** Additional dock run on its far-north face with a
  trailer-staging yard.
- **Perimeter (Street View):** Chain-link / low masonry perimeter fencing; gated
  driveways off S 67th Ave (NW to the north building's yard, SW to the south
  building). Office fronts visible but signage obscured by trees.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence):** Both buildings sit behind perimeter
  fencing; the fenced dock yards are reached via gated driveways off S 67th Ave.
  Gates inferred from the fence line — exact hardware not directly imaged
  because of tree cover.
- **guardShack = false:** No guard booth seen at either gated driveway.
- **remoteGs = true:** Gated, fenced site with no visible guard shack → remote
  check-in inferred. Flagged.
- **Docks:** Two large warehouses with long dock runs on the shared yard plus the
  north building's far-north face; ~90 doors total → band **50+** (high estimate,
  flagged).
- **Drop yard:** Central dock yard and north yard hold dozens of dropped trailers
  in marked rows → `dropYard = true`, `dropArea = 50+`.
- **multipleFacilities = true:** Two distinct large warehouse buildings on one
  property — a campus. Whether both buildings are Niagara-occupied is uncertain.
- **shipRcvSeparate = true (inferred):** Dock banks face the shared yard from two
  separate buildings — plausibly separate ship/receive clusters; flagged.

## Yard zones and counts
- **Perimeter:** ~28 acres — both buildings + shared central dock yard + parking.
- **Dock aprons:** two strips, one per building, facing the central yard.
- **Drop yards:** central shared yard + north building's far-north yard.
- **Dock doors:** ~90. **Trailers visible:** ~70. **Capacity:** ~110.
  **Truck gates:** 2. **Buildings:** 2. **Rail-served:** no. **Scale:** none.

## Web findings
Niagara Bottling Phoenix — consistently listed at 275 S 67th Ave, Phoenix, AZ
85043; phone (909) 230-5000. Wikipedia describes a 252,000 sq ft Phoenix
bottling plant; a property listing for the address describes a 626,970 sq ft
warehouse with 3,030 sq ft office and 32 dock doors. The size discrepancy is
unresolved.

## Final confidence
**Medium.** The street address is firmly established and the site is positively
a large fenced warehouse/distribution complex. The building-identity question
(252k vs 627k sq ft; one vs two buildings; whether the whole complex is
Niagara), the gate hardware, and the dock/trailer counts are all flagged in
`uncertainFields` — the heavy tree screening of the 67th Ave frontage prevented
a direct signage read and a clean look at the gates.
