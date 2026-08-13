# Tyson Foods - Sherman, TX (idx 09)

**Resolved location:** 33.5815, -96.6056 (plant + yard center)
**Address:** 4700 US-75, Sherman TX 75090, west side of US-75 at the south edge of Sherman
**Type as rostered:** Poultry Processing Plant (see "Facility type" caveat below)
**Confidence: HIGH**

---

## How the location was resolved

The roster coordinate (33.635662, -96.60888) was flagged APPROXIMATE and was
city-level: it landed in downtown Sherman, about 6.1 km north of the plant. A
z14 satellite sweep of Sherman showed no plant at or near that point.

Google Places API (New) `places:searchText` for "Tyson Foods Sherman Texas
plant" returned **Tyson Foods Inc, 4700 US-75, Sherman TX 75090 at
33.5807678, -96.6055118**, typed manufacturer / wholesaler / food. A z16 crop
on that point put a single large industrial complex in frame: one connected
~400 m processing building, an employee lot holding several hundred cars, and
three separate trailer-storage lots. Refined the center to 33.5815, -96.6056
off the z17 crop.

**Identity is ground-truth, not inference.** April 2026 Street View at the
west gate (33.58200, -96.60815) shows a **"Tyson" sign zip-tied to the
barbed-wire perimeter fence** and a **Tyson Foods 53 ft reefer** (livery: "We
feed the world like family", unit 77398) sitting at the checkpoint. Session
WebSearch budget was exhausted, so no press or locator corroboration was
pulled; the on-site signage plus Tyson-liveried equipment is stronger evidence
than either would have been.

### Facility type caveat
Imagery shows **no live-haul infrastructure** at Sherman: no coop trailers, no
fan-and-canopy live-bird holding shed, no offal dock. Every trailer on the
property is a dry van or reefer. This yard reads as a **further-processing /
prepared-foods plant with a very large finished-goods trailer operation**, not
a slaughter complex. The `type` field was left as rostered and the discrepancy
flagged in `fieldNotes.facilityType`.

---

## What each key view showed

| View | What it showed |
|---|---|
| z17 wide (33.5815,-96.6056) | Whole complex: one connected plant building running NNE-SSW, three trailer lots on the west and south, employee parking against US-75 |
| z18 north-west (33.58213,-96.60814) | The west boundary road, the rail line beside it, and the single truck drive crossing into the yard |
| z19 gate (33.58200,-96.60755) | The gate throat: a ~14 m wide drive with a small structure sitting on an island in the middle of it |
| Street View 2026-04, pano `7t8RfGmE1dit2WIqv2MFdw` @ heading 87 | The decisive frame - see below |
| z19 north dock (33.58235,-96.60573) | ~13 trailers backed into the building's north-west wall; a second, south-facing bank of ~9-10 below it |
| z18 trailer yard (33.58230,-96.60700) | Four packed nose-in rows in the north lot alone |
| z17 south (33.5790,-96.6045) | Employee lots, the south trailer rows, and the drive out to the US-75 frontage road |

---

## Gate, guard shack, docks

**Truck gate: YES.** One truck entrance, on the west boundary road at
**33.58201, -96.60758**. Barbed-wire-topped chain-link perimeter with a Tyson
sign on it, a clear checkpoint pinch-point, and orange traffic cones
channeling trucks past the booth. The 2026-04 pano catches a tractor-trailer
stopped at the checkpoint with **two hi-vis staff working the lane**. No
barrier arm was resolvable, but the checkpoint is unambiguous and manned.

**Guard shack: YES.** A masonry / brick booth with a flat canopy roof, roughly
a two-vehicle footprint, sitting on an island **in the middle of the entrance
drive** with windows facing both the inbound and the outbound side. It appears
in the Street View frame at heading 87 and as a small structure straddling the
drive at z19 and z20.

**Remote GS: no** (a booth is present and staffed).

**The backup story - the sales hook.** An active **rail line runs parallel to
the west boundary road and the gate drive crosses it about 40 m outside the
booth** (rails are in the Street View foreground and read as a dark line at
z19). There is only ~40 m of stacking between the rail crossing and the guard
booth. A two- or three-truck queue at the booth sits on or across live track
and out into the road. Everything behind the booth is enormous - ~200 m of
open yard from the gate to the first dock face - so the site's entire
constraint is compressed into one manned booth in front of a rail crossing.

**Docks: ~40 doors, band 25-50.** Two banks on different building faces:
- North-west-facing bank: ~13 trailers backed in along ~62 m of wall, so
  roughly 16 doors at typical 12 ft centers.
- South-facing bank: ~9-10 trailers along ~47 m, roughly 12 doors.
- Additional canopied dock positions at the south end of the building.

Counting doors behind backed-in trailers from overhead is approximate;
`dockDoors` is listed in `uncertainFields`.

---

## Yard zones and counts

| Zone | Measured |
|---|---|
| Perimeter | **40.7 acres** traced from the developed/fenced footprint (11 vertices, follows the west road, the US-75 tree line and the south employee-lot edge) |
| Truck gate | 0.31 acres, the drive throat from the road past the booth |
| Drop yard - north | **5.2 acres**, 4 packed nose-in rows |
| Drop yard - mid | 3.1 acres |
| Drop yard - south | 2.2 acres, two long facing rows |
| Dock apron - west bank | 0.56 acres |
| Dock apron - south bank | 0.40 acres |
| Staging | 1.3 acres of open pavement between gate and docks |

| Metric | Value | Basis |
|---|---|---|
| dockDoorCount | 40 | wall-length + backed-in trailer count, two banks |
| trailersVisible | ~290 | row counts x lot density, +/-20% |
| trailerParkingCapacity | ~360 | measured lot areas at ~4 m pitch in ~25 m row bands |
| truckGateCount | 1 | single controlled entrance |
| buildingCount | 4 | one large connected plant plus outbuildings/canopies |
| siteAreaAcres | 40.7 | shoelace over the perimeter ring |
| railServed | false | rail runs along the boundary; no spur inside the fence |

**This is the headline number for the sales conversation: roughly 300 trailers
on the ground and ~360 slots of parking, all funneling through one manned
booth.** For a 40-acre site that trailer-to-acre density is extreme, and the
gate has no bypass.

Street View coverage is good along the west road (2026-04) and the US-75
frontage (2026-03); every traced zone got a real pano.

---

## Fast-lane read

`fastLaneOpportunity: true`. The gate apron is very wide and the yard
immediately inside is open pavement. There is physical room to add a bypass /
express lane past the booth without touching the fence line - which matters
more than usual here because of the rail crossing 40 m out.

---

## Web findings

None. The session WebSearch budget was exhausted before this facility was
audited, per the run instructions. Verification therefore rests on first-party
ground evidence (site signage, Tyson-liveried tractors and trailers in 2026
Street View) plus the Google Places record. No divestiture / closure check was
run against news sources; treat "Tyson still operates this site" as
imagery-confirmed as of April 2026 satellite and Street View, not
press-confirmed.

## Final confidence

**HIGH.** The facility is unambiguous, gate and guard shack are confirmed from
ground level, and the yard geometry is clean in 2026 imagery. Uncertain
fields: `entryLanes`, `exitLanes`, `scale`, `multiStep`, `dockDoors`,
`connectivityIssue`, `shipRcvSeparate`.
