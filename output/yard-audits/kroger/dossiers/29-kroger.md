# Deep-Audit Dossier — Swan Island Dairy (idx 29)

**Facility:** Kroger Swan Island Dairy — Dairy Plant
**Address:** 4950 N Basin Avenue, Portland, OR 97217
**Resolved center:** 45.55855, -122.69815
**Confidence:** High

## Step 0 — Location confirmation
Supplied coords (45.558785, -122.699028) landed in the employee parking lot
directly west of the plant, so they were essentially correct. Confirmed the
building three ways:
1. Web search — Kroger Swan Island Dairy, organic milk producer, 4950 N Basin
   Ave, (503) 240-5150.
2. Street View on the west wall shows a mounted **"SWAN ISLAND DAIRY" Kroger
   logo sign** with flagpole and a blue-awning employee entrance.
3. Overhead imagery shows the dairy signature: a row of large **vertical milk
   silos / process tanks** on the north roofline, plus **"Food 4 Less"
   (Kroger banner) trailers** backed into the docks.

The plant sits on the Swan Island industrial peninsula between **N Basin Ave**
(west) and a **Union Pacific mainline** (east). The large red-cornered
warehouse to the north and the rail-served distribution building to the SE are
separate facilities, not part of the dairy.

## Layout
- **Building:** one large single-story plant, long axis running roughly NW-SE
  (parcel is tilted ~25-30° off north, aligned to N Basin Ave / the rail).
- **West face:** office + employee parking, open to N Basin Ave (no control).
- **North roof:** process/refrigeration silos and tanks.
- **East face:** the working dock wall — trailers backed in, plus a staging
  apron between the building and the rail.
- **SE:** a dedicated trailer drop yard near the tracks.

## Gate / Guard determination
- **truckGate = false.** No barrier arm, sliding/swing gate, or checkpoint
  pinch-point anywhere. The truck yard is reached via an **open, shared drive
  aisle** off N Basin Ave that the Street View vehicle drove straight through
  (2019 pano sits inside the yard next to a backed-in Food 4 Less trailer). The
  drive is shared with neighboring multi-tenant industrial units (numbered
  studio/shop bays to the north).
- **guardShack = false.** No booth at any entrance.
- **remoteGs = false** (no gate → no remote check-in implied).
- Entry/exit share the single open access point (entryExitTogether).

## Docks & yard
- **dockDoors: 10-25** (~14 doors estimated on the east wall; some hidden by
  backed-in trailers and roof tanks — flagged low-confidence).
- **dropArea / dropYard: 10-25**, true — a dedicated trailer-storage lot on the
  SE/east side near the rail, trailers parked without tractors.
- **trailersVisible ~22**, **capacity ~28** (estimate).
- **buildingCount: 1**; **siteAreaAcres ~6.8** from the perimeter polygon.
- **railServed = false** — UP mainline hugs the east edge but no spur enters the
  parcel; trailers stage beside the tracks, not on rail.
- **urbanRural = Urban** — dense Swan Island / inner-Portland industrial fabric.
- **backupSensitive = true** — tight parcel, little stacking room; a gate queue
  would spill into the narrow shared drive / N Basin Ave.

## Geofences
Perimeter traced as a 6-vertex oriented ring following the fence/edge of the
dairy operational footprint (building + east dock apron + SE drop yard), at the
parcel's true ~NW-SE orientation. Dock apron = thin quad hugging the east wall;
drop yard = quad over the SE trailer lot; truckGate = the open N Basin Ave entry
apron (zone provided for the driver's-eye render even though there is no
physical gate).

## Street View
- Perimeter pano `AZn6JpGjSU1pSqG36Q-03Q` (2019-09), heading ~1° (looks N at the
  plant from N Basin Ave).
- Truck-gate pano `RZFOtbpoBdVSr5TT7I_oWg` (2019-09), heading ~154° toward the
  open entry apron.

## Web findings
Organic milk / dairy producer operated under Kroger; ~50-99 employees; revenue
$10-20M; office hours M-F 8-5. Branding confirmed on-site (Swan Island Dairy +
Food 4 Less trailers).

## Final confidence
**High.** Building identity unambiguous (on-site signage + silos + Kroger
trailers); gate/guard verdict directly verified from in-yard Street View. Only
the exact dock-door and trailer-capacity counts are estimates.
