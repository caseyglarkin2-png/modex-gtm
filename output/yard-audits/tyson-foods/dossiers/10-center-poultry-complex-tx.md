# Tyson Foods - Center, TX (idx 10)

**Resolved location:** 31.7940, -94.1666 (complex center)
**Address:** 1019 Shelbyville St, Center TX 75935
**Type:** Poultry Processing Plant - a full live-bird complex
**Confidence: MEDIUM** (driven by the gate call, see below)

---

## How the location was resolved

The roster coordinate (31.795296, -94.18026) was flagged APPROXIMATE and sat
about 1.3 km west of the plant, in the town of Center itself.

Google Places API (New) `places:searchText` for "Tyson Foods Center Texas
poultry plant" returned **Tyson Foods Inc., 1019 Shelbyville St, Center TX
75935 at 31.7943885, -94.1682278**. A z16 crop on that point framed an
unmistakable poultry complex: a dark fan-and-canopy live-haul holding shed
ringed by dozens of coop trailers, a processing plant dense with external
piping to the south, wastewater lagoons to the north-east, and a rail corridor
along the west boundary. Refined the center to 31.7940, -94.1666.

**Identity is ground-truth.** The 2023-09 Street View at the entrance
(31.79266, -94.16792) shows the **Tyson monument sign inside the front fence
reading "Center Processing Plant, 1019 Shelbyville St"**, a **Hillshire Farm
(Tyson brand) trailer** on the property, **Tyson live-haul coop trucks** on the
drive, and the City of Center water tower directly behind the plant. Session
WebSearch budget was exhausted, so no press corroboration was pulled.

---

## What each key view showed

| View | What it showed |
|---|---|
| z17 wide (31.7943,-94.1668) | The whole complex: live-haul holding shed and coop-trailer yard north, processing plant south, rail corridor west, Shelbyville St across the south frontage |
| z18 south-west (31.79273,-94.16779) | Both curb cuts off Shelbyville St, the frontage fence line, the office/employee parking and the dock face |
| z19 dock (31.79298,-94.16741) | ~9-10 reefers backed into the south-facing dock wall under a blue canopy, and the deep open apron in front of it |
| z20 drive (31.79305,-94.16780) | The entrance throat: ~21 m of unmarked open pavement, no gate structure |
| z20 west entrance (31.79285,-94.16845) | Second curb cut, same story - wide open apron, fence terminating at the drive |
| z21 entrance corner (31.79275,-94.16766) | Resolution limit; the only structures are a utility cabinet and a landscaped island |
| Street View 2023-09 @ headings 8 / 20 / 68 | Live-haul truck queued on the drive; dock bank with ~8 reefers; Tyson monument sign; no barrier, no booth |
| z18 north yard (31.79470,-94.16690) | The live-haul shed with coop trailers staged in radial rows all around it; west storage lot packed with trailers |

---

## Gate, guard shack, docks

**Truck gate: NO** - and this is the consequential call on this site.

Both truck entrances off Shelbyville St are **open curb cuts**:
- Main dock entrance at **31.79284, -94.16774** - a ~21 m wide unmarked paved
  throat that runs straight into the dock apron.
- West / live-haul entrance ~55 m further west at **~31.79285, -94.16845** -
  another ~20 m apron.

No barrier arm, no sliding or swing gate, no booth, no lane markings at
either. The property **is** fenced - black ornamental picket along the
Shelbyville St frontage, chain-link on the west with the water tower behind -
so the fence simply terminates at open driveways. Both the 2023-09 ground
views (headings 8 and 68 from the curb cut) and the z20/z21 satellite show an
uninterrupted drive.

Confidence on this is **medium**, not high: a swing gate parked open against
the fence would not be separable at this imagery resolution, and it is unusual
for a live-bird complex to run biosecurity with no access control at the road.
Treat "no gate" as the imagery read, worth confirming in conversation.

**Guard shack: NO.** Nothing at either entrance with the booth signature. The
only small objects near the drives are a utility cabinet on the frontage and a
landscaped island with yellow pipe bollards.

**Remote GS: no** - by rule, `remoteGs` only applies when a gate exists without
a booth. There is no gate, so no kiosk inference.

**The backup story.** The main dock drive meets **Shelbyville St - the state
highway through Center - with an at-grade rail crossing about 45 m west of the
curb cut**, and the dock apron begins only ~90-100 m in. The 2023-09 pano
literally captures a live-haul truck queued on the drive with its trailer
still near the highway. A short backup at the dock face reaches the public
road, next to a rail crossing, in a town of 5,000.

**Docks: ~20 doors, band 10-25.** ~9-10 reefers backed in along ~43 m of the
south-facing dock wall under a blue canopy (the ground view at heading 68
shows about 8 trailers in one frame), plus additional doors on the plant's
inner faces that are not fully visible from overhead. Medium confidence.

**Ship/receive genuinely separate.** Live-bird receiving is a physically
distinct operation in the north yard - holding shed, coop trailers, its own
internal loop - from finished-goods shipping on the south dock face. Two
different trailer populations, two different flows, one shared internal road
network, and no control point on either.

---

## Yard zones and counts

| Zone | Measured |
|---|---|
| Perimeter | **29.3 acres** traced around the fenced operational complex (12 vertices). Wastewater lagoons to the north-east are probably also Tyson land but are excluded from the yard perimeter |
| Truck gate (uncontrolled throat) | 0.19 acres |
| Drop yard - north live-haul | **8.2 acres** ringing the holding shed |
| Drop yard - west storage | 2.5 acres, packed rows |
| Dock apron | 0.36 acres |
| Staging | 0.55 acres of apron inside the main entrance |

| Metric | Value | Basis |
|---|---|---|
| dockDoorCount | 20 | wall length + backed-in trailer count, plus unseen inner faces |
| trailersVisible | ~145 | row counts across z17/z18; coop trailers dominate |
| trailerParkingCapacity | ~200 | lot area at observed density |
| truckGateCount | 2 | two curb cuts, neither controlled |
| buildingCount | 10 | plant, live-haul shed, several sheds/warehouses, office |
| siteAreaAcres | 29.3 | shoelace over the perimeter ring |
| railServed | false | see caveat |

**Rail caveat (weakest metric here):** a multi-track rail corridor with active
sidings and rail cars runs immediately west of the plant boundary road, and
the plant's south drive crosses it. No spur was observed passing inside the
fence to a building, so `railServed` is false - but it is flagged uncertain.

**Street View caveat:** frontage coverage is 2023-09 and good. The north
live-haul yard has no modern pano; the nearest is a **2013-10** pano on a dirt
road ~250 m west. The two `dropYards` Street View entries are therefore
distant orientation shots, not usable driver's-eye frames.

---

## Fast-lane read

`fastLaneOpportunity: true`, and this is the easiest kind of site to
instrument. There is a large amount of unused paved width at both curb cuts
and a deep interior apron. Adding a controlled inbound lane plus a bypass
requires no fence work and no regrade - the pavement is already there.

---

## Web findings

None. Session WebSearch budget was exhausted per the run instructions.
Verification rests on the on-site Tyson monument sign, Tyson and Hillshire
Farm equipment on the property, and the Google Places record. No divestiture
or closure check was run against news sources; the 2026 satellite shows the
yard in active use with trailers and vehicles throughout.

## Final confidence

**MEDIUM.** The facility identification is certain and the yard geometry is
clean, but the two most valuable fields for the sales conversation -
`truckGate` and `guardShack` - are negative calls made from imagery, and a
poultry complex running no access control at the road is unusual enough to
verify verbally. Uncertain fields: `truckGate`, `guardShack`, `remoteGs`,
`entryLanes`, `exitLanes`, `scale`, `dockDoors`, `connectivityIssue`,
`multiStep`, `railServed`.
