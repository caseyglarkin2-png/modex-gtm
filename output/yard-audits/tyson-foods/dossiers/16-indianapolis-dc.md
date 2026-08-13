# Tyson Foods Indianapolis Distribution Center - Indianapolis, IN

**Roster idx 16** · Distribution Center · CRM seed `39.750023, -86.120758`
**Resolved center: `39.750135, -86.118750`** (1301 S Keystone Ave, Indianapolis, IN 46203)
[Satellite](https://www.google.com/maps/@39.750135,-86.118750,400m/data=!3m1!1e3)

---

## Step -1 / Step 0 — locating and verifying the facility

The CRM seed geocodes exactly: `Tyson Foods Distribution Center, Indianapolis, IN`
returns ROOFTOP **1301 S Keystone Ave, Indianapolis, IN 46203 →
39.7500232, -86.1207583**, which is the seed to six decimals. That point sits on
the S Keystone frontage; the building it belongs to is 200 m north-east, so the
resolved center was moved to the warehouse centroid.

Real-estate material for the address describes **1301 S Keystone Avenue as a
216,520 sq ft cooler/freezer facility fully leased to Tyson Foods**, serving as a
mixing and distribution hub for Tyson's Indiana protein production, with
**43 dock doors, 128 trailer spaces and 32-36 ft clear**. A business directory
separately lists **Tyson Sales and Distribution, Inc** at the address. Those
numbers line up with what the imagery shows, so they are used as the primary
source for dock and trailer counts.

**Caveat worth carrying into the sales conversation:** *Interstate Warehousing*,
a third-party cold-storage operator, is also listed at this address. Tyson is
plainly the tenant of record for the cooler/freezer, but the yard may be run by
a 3PL on Tyson's behalf. Verdict is `probable`, `tenancy: leased`,
`operator: self` with that flag noted; site confidence is capped at **medium**.
No Tier-1 company self-attested source could be pulled - the session web-search
budget was exhausted - and the divestiture gauntlet was not run.

Imagery shows nothing that would reject the site: 2026 satellite and 2024-09
Street View both show an active, fenced, near-full yard.

---

## Step 1-2 — the truck entrance, the gate, and the guard shack

**Verdict: truck gate YES, guard shack NO, remote gate service YES.**

There is exactly one truck entrance, off **S Keystone Ave at about
`39.7497, -86.1205`**. The north-east yard dead-ends into the rail corridor and
the Pleasant Run ravine; there is no second opening anywhere on the parcel
(checked at z18 across the whole north-east boundary).

The wide-angle Street View frames were ambiguous, so the gate was resolved by
re-shooting the same 2024-09 pano (`8L1bwZINbKElhmCvUF4aIg`) at heading 123 with
a 32° field of view. That frame is decisive: a **two-leaf chain-link swing gate
standing across the driveway**, cross-braced gate frames, **barbed-wire-topped
chain-link fence** running off both sides, and warning/notice signage bolted to
the fabric. Behind the gate: the car park and the white metal warehouse wall.

Overhead confirms it. At z20 centred on `39.74975, -86.12065` the two gate
leaves appear as a pair of roughly 10 m ladder-like linear objects swung open
against the curb islands on either side of the drive.

**No guard shack.** Nothing booth-sized exists at or inside the gate in z19 or
z20 satellite, and no booth appears in any Street View frame. The nearest
structure is the flat-roof office at the warehouse's south-west corner, about
100 m past the gate with a staff car park around it. That makes this a
**gate-without-a-booth** site: `remoteGs: true`. The gate is standing open in
both the 2024 Street View and the 2026 satellite, which is what an unstaffed
gate looks like in service.

**Backup sensitivity is the headline physical finding.** The gate sits roughly
**30 m off S Keystone Ave**, a busy multi-lane urban arterial. Thirty metres is
one tractor-trailer. A second truck waiting for the gate stands on Keystone.
`preGateStaging` is therefore false (there is an apron, but it holds one
vehicle and it is shared with car traffic), `backupSensitive` is true, and
`fastLaneOpportunity` is false - there is simply nowhere to put a bypass lane.
The remedy this site argues for is moving check-in off the gate entirely.

## Step 3 — docks, drop yard, rail

**Dock doors - band `25-50`, count 43.** One continuous dock face on the
warehouse's north-west wall, roughly 194 m long, with about 22 trailers backed
in at z18. 43 doors over 194 m implies ~4.5 m centres, which matches the
spacing seen in the imagery. No docks on the south-east wall (it faces the
neighbouring building and the rail), so `shipRcvSeparate` is false.

**Drop yard - band `50+`, capacity 128.** The fenced yard north-east of the
warehouse runs roughly 240 x 140 m in a parallelogram between the ravine
treeline and the rail buffer. Counting rows at z18 gives on the order of
**110-120 trailers on the ground**, i.e. the yard is running close to its stated
128 spaces. Trailers are parked in angled rows off two internal aisles.

**Rail served - no.** A rail line runs along the south-east property line but
there is no switch, siding, spur or rail dock on the parcel; the track simply
passes through the corridor.

## Step 6 — geofence and metrics

Perimeter traced as a 10-vertex ring: the S Keystone apron and gate, the
north-west edge of the dock apron along the ravine treeline, the north-east
trailer yard out to the rail, back along the warehouse's south-east wall and
across the office car park. **12.6 acres.** The ring deliberately excludes the
neighbouring dark-roof warehouse to the south-west and the grey warehouse to the
south-east; those are separate tenants with their own drives off S Keystone.

Sub-zones: one truck-gate quad oriented to the drive (bearing ~65°), one
drop-yard ring, one dock apron traced as a rotated quad parallel to the
north-west wall (the wall runs at bearing ~221°, so the apron is a 35 m strip
rotated to match, not a north-aligned box). Street View coverage exists for all
four zones - the truck gate from the 2024-09 Keystone pano, the others from
2015-08 in-yard panos.

| metric | value |
|---|---|
| dockDoorCount | 43 (listed, imagery-consistent) |
| trailersVisible | ~120 (est) |
| trailerParkingCapacity | 128 (listed) |
| truckGateCount | 1 |
| buildingCount | 2 |
| siteAreaAcres | 12.6 |
| railServed | false |

## Sales read

The archetype here is a gate with nobody in it, 30 m off an arterial, feeding a
128-space cold-storage yard that is running near full. Every inbound truck stops
at a gate that cannot tell it anything, and the queue that forms behind it sits
on a public road. That is the cleanest possible case for app or kiosk check-in
plus a yard map - there is no booth to displace and no room to build one.

Confirm before outbound whether Tyson staff or Interstate Warehousing run this
yard day to day.

**Final confidence: medium** - physical read is strong and specific; the cap is
on operator verification, not on the imagery.
