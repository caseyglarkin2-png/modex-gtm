# Deep-Audit Dossier — idx 26

## Performance Foodservice - Tidewater (Suffolk VA)

**Type:** Broadline Foodservice Distribution Center
**Address:** 1201 Progress Road, Suffolk, VA 23434
**Resolved coordinates:** 36.76720, -76.54480
**Confidence:** Medium

---

### Location resolution

The roster coordinate (36.769855, -76.542823) carried `movedMeters: 5887` — a
stale/imprecise geocode. It lands in a wooded strip NE of the real facility.

The facility was resolved to a single very large rectangular distribution
building at ~36.7672, -76.5448, in the Progress Road industrial area of
Suffolk. It is bounded by a divided highway (Holland Road / Rt 58 corridor) on
the south, Progress Road and a rail spur on the north, and a creek/pond to the
west, with a residential subdivision across the highway.

**Confirmation it is PFG:** multiple Street View passes — on the divided
highway directly in front of the building and along Progress Road — show
Performance Foodservice-branded delivery trucks (red/white "Performance" logo,
"800-849-7110") parked at the dock face and driving the access road. SAM /
Neustar list 1201 Progress Rd as Reinhart Foodservice LLC, PFG's legacy brand.

**Caveat:** the building footprint is unusually large for a single broadline
DC (~600k+ sq ft). It may be a large warehouse with PFG as the dominant
tenant. Operations and branding clearly confirm an active PFG foodservice DC;
the size is flagged as an uncertainty. Confidence held at medium.

### Key views

- **Satellite z16/z17:** one dominant rectangular building; long dock bank with
  ~50+ trailers backed in along the north face; trailer parking rows along the
  west/SW edge and a second lot on the north; large employee parking lot on the
  east; water tank (round white structure) at the SW.
- **Street View (south frontage / Progress Road):** PFG-branded trucks at the
  building; dock face with red trailers behind a screening fence; access
  driveways off Progress Road are open with no barrier arm or booth.
- **Satellite z20 (north edge):** a rail spur runs along the north property
  line into the site.

### Gate / guard-shack determination

- **Truck gate — false (uncertain):** no barrier arm or sliding gate observed
  in any Street View pass. North-side driveways off Progress Road are open.
  A perimeter screening fence runs the south edge but the truck entrances
  themselves appear uncontrolled — the open-access pattern typical of a
  broadline DC. Listed in `uncertainFields` because trees obscure the exact
  NE entrance.
- **Guard shack — false:** no booth structure at any entrance. The round white
  structure at the SW is a water tank.
- **Remote GS — false:** no gate, so not applicable.

### Yard zones and counts

- **Perimeter:** ~38 acres, the full fenced parcel between the highway and the
  rail line.
- **Dock aprons:** one long apron along the north face.
- **Drop yards:** two — a row along the west/SW edge and a north-side lot.
- **dockDoorCount ≈ 55**, **trailersVisible ≈ 60**, **capacity ≈ 90** (honest
  estimates from overhead imagery; flagged uncertain).
- **Rail-served:** yes — spur along the north line.

### Web findings

Performance Foodservice Tidewater, 1201 Progress Rd, Suffolk VA 23434; phone
(757) 538-8000; operating entity Reinhart Foodservice LLC. Serves the Virginia
and North Carolina markets. Former Reinhart broadline DC, now PFG.

### Final confidence: Medium

Location and PFG operation confirmed by branded trucks; building footprint size
and the exact (apparently uncontrolled) truck entrance leave residual
uncertainty.
