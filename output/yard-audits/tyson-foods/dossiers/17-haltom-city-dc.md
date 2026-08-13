# Tyson Foods Haltom City Distribution Center - Haltom City, TX

**Roster idx 17** · Distribution Center · CRM seed `32.822754, -97.287037`
**Resolved center: `32.822754, -97.287037`** (4000 Meacham Blvd, Haltom City, TX 76117)
[Satellite](https://www.google.com/maps/@32.822754,-97.287037,400m/data=!3m1!1e3)

---

## Step -1 / Step 0 — is this a real facility or a Maps artifact?

The roster name came from a POI-style CRM record ("Haltom City Distribution
Center truck entrance"), so the first job was deciding whether it names a real
distinct facility or is a pin on someone else's site.

**It is real.** Geocoding `Tyson Foods Distribution Center, Haltom City, TX`
returns ROOFTOP **4000 Meacham Blvd, Haltom City, TX 76117 →
32.8227543, -97.2870366** - the CRM seed to seven decimals, landing on the roof
of a large white distribution warehouse. Geocoding `Tyson Foods, Haltom City, TX`
returns the adjoining **3900 Meacham Blvd**, an older Tyson plant immediately to
the west. The two buildings are joined by an enclosed overhead bridge, so this
is one Tyson campus with two addresses, and the CRM record is the DC half of it.

**Operator evidence is the strongest of the three DC sites in this batch:**

- The **2025-07 Street View** frame at the Meacham Blvd entrance shows a **blue
  Tyson monument sign with the Tyson logo** on the lawn beside the drive. Current,
  on-site, company-branded signage at the gate.
- The **2021-09 elevated pano** over the dock apron shows **Hillshire Farm**
  liveried trailers backed into the dock face. Hillshire Brands is a Tyson Foods
  company.
- Both addresses geocode onto this campus, and the 2026 satellite shows an
  active yard with roughly 60 trailers on the ground.

No Tier-2 negative surfaced. No Tier-1 company self-attested source could be
pulled (the session web-search budget was exhausted; a `site:tyson.com` careers
query returned nothing). **Verdict: `probable`**, three independent Tier-3
sources in agreement, site confidence capped at **medium** on that basis alone.

**Audit scope:** the 4000 Meacham DC and its yard - the building, its north-west
dock face, the drop line along Meacham Blvd, and the guarded Meacham entrance.
The 3900 Meacham plant is noted, not measured.

---

## Step 1-2 — the truck entrance, the gate, and the guard shack

**Verdict: truck gate YES, guard shack YES, remote gate service NO.**
This is the only guarded site of the three DCs in this batch.

The truck entrance is off **Meacham Blvd** on the campus's east side. About
**50 m in from the road**, the drive splits around a raised island. Zooming the
2025-07 pano `5cRrvSJoBH79FesJ78hmIA` to heading 211 / fov 38 shows, in one
frame:

- a **guard house** on the island - a small white building with a red-trimmed
  canopy carried out over the drive lanes,
- **red-and-white striped barrier arms** across the lanes either side of it,
- yellow bollards protecting the island nose,
- **chain-link fence with a gate** continuing off to the east,
- and behind it the DC's red-and-white dock face with trailers backed in.

Overhead corroborates precisely. At **z21** the island resolves as a
**~10 x 6 m building** on a raised gravel/concrete median with a tractor-trailer
stopped directly alongside it in the inbound lane, and linear barrier objects
across both lanes. Ten by six metres is textbook guard-house scale - a one-to-
three-vehicle footprint - and it is nowhere near the main building, which is
150 m further south-west.

So: `truckGate: true`, `guardShack: true`, `remoteGs: false`.

**Staging and backup.** There is roughly **50 m of wide concrete apron between
the Meacham Blvd curb and the guard house**, and the drive fans out to about
30 m of width at the island. Two tractor-trailers can wait clear of the public
road, so `preGateStaging: true` and `backupSensitive: false`. Past the guard
house the drive opens into a large paved yard before the docks
(`postGateStaging: true`, `drivewayLong: true`). The unused paved width beside
the barrier arms is real, so `fastLaneOpportunity: true` - an express lane could
be striped here without new paving.

**Second access, uncontrolled.** The 3900 Meacham plant has its own drive off
the west arterial into its dock apron. The 2025-07 Street View there shows open
concrete with a fire-lane curb and chain-link fence alongside but **no barrier
arm and no booth**. If the conversation covers the whole campus, that is the
open door.

## Step 3 — docks, drop yard, rail

**Dock doors - band `25-50`, estimated 35.** The DC's north-west face carries a
continuous canopied dock bank about **131 m** long with roughly **17 trailers
backed in** at z18. 131 m at typical 4 m door centres gives ~32 positions;
called 35 to allow for the north-east end under the office canopy. Doors sit
under a continuous canopy, so the count is an estimate. All docks are on this
one face, so `shipRcvSeparate: false` at DC level (at campus level the plant's
separate west dock bank does split it).

**Drop yard - band `25-50`.** A single long drop line runs east-west along the
Meacham Blvd frontage holding about **30 dropped trailers** at z18, plus
scattered trailers in the middle of the yard. Site-wide visible count ~57;
yard capacity ~70.

**Rail served - no.** A multi-track rail corridor and a rail yard sit beyond the
south-east property line, but no spur, switch or rail dock enters this parcel.

## Step 6 — geofence and metrics

Perimeter traced as a 7-vertex ring: the Meacham Blvd frontage including the
drop line, east to the entrance drive, south down the east boundary, along the
rail corridor on the south-east, and back up the line where the DC yard meets
the 3900 Meacham plant. **10.9 acres** - the full campus with 3900 Meacham
roughly doubles that.

Sub-zones: a truck-gate quad oriented to the drive (axis bearing ~285°, so the
quad is rotated to sit along the lanes rather than square to north), the
Meacham-frontage drop-yard rectangle, and one dock apron traced as a rotated
quad parallel to the DC's north-west wall (the wall runs at roughly 290°, so the
apron follows that angle). All four zones have Street View coverage - the truck
gate from the 2025-07 road pano, the rest from the 2021-09 elevated yard pano.

| metric | value |
|---|---|
| dockDoorCount | ~35 (est) |
| trailersVisible | ~57 |
| trailerParkingCapacity | ~70 |
| truckGateCount | 1 (guarded) |
| buildingCount | 2 |
| siteAreaAcres | 10.9 |
| railServed | false |

## Sales read

This is the classic guarded-gate archetype: a staffed booth with barrier arms,
50 m of apron in front of it, and a wide yard behind. Nothing here is broken -
which is the point. The conversation at Haltom City is not "you have no gate",
it is "you are paying a person to key in what a driver already knows, and the
30-trailer drop line on Meacham has no system of record". The unused paved width
beside the booth makes an express lane physically trivial, and the uncontrolled
west drive into the 3900 plant means the campus perimeter is only as strong as
its weakest opening.

**Final confidence: medium** - the physical classification is high-confidence
(2026 satellite at z21, two Street View vintages including a zoomed gate frame);
the cap is on Tier-1 operator verification, which could not be run this session.
