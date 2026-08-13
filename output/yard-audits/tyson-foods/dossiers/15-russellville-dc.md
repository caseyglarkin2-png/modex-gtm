# Tyson Foods Russellville Distribution Center - Russellville, AR

**Roster idx 15** · Distribution Center · CRM seed `35.260519, -93.066286`
**Resolved center: `35.260484, -93.066226`** (4820 E Main St, Russellville, AR 72802)
[Satellite](https://www.google.com/maps/@35.260484,-93.066226,400m/data=!3m1!1e3)

---

## Step -1 / Step 0 — locating and verifying the facility

The CRM seed was already good. Geocoding the CRM string
`Tyson Foods Distribution Center, Russellville, AR` returns a single ROOFTOP
result: **4820 E Main St, Russellville, AR 72802 → 35.2604842, -93.0662256**,
which is the seed to five decimal places and lands dead-centre between the two
main buildings of a large food-industry campus. (A second Russellville Tyson
listing exists at 702 E Main St, but that geocodes to 35.2775, -93.1237, six km
west in the town centre - a different, much smaller address, not this campus.)

Wide satellite at z15/z16 shows an unambiguous industrial complex on the south
side of I-40: two roughly 250 m long buildings with continuous dock faces, a
large fenced trailer drop yard, an on-site feed mill with grain bins and an
elevator tower, a rail spur running into the property, and a separate support
building to the south-east. This is a food-production plus distribution campus,
not an office and not a warehouse shell.

**Operator evidence.** The web-search budget for this run was exhausted, so no
Tier-1 self-attested source (Tyson locator page, careers requisition, 10-K
Item 2) could be pulled. Corroboration is therefore Tier-3 only:

- The rooftop geocode of the CRM address lands on this campus.
- A trailer inside the fenced yard in the 2019-09 Street View pano carries
  **Wright Brand** ("PIG OUT!") livery. Wright Brand is a Tyson Foods brand.
- 2025-09 and 2026-02 Street View plus 2026 satellite all show the yard heavily
  populated with trailers and tractors - current operation, nothing idled,
  vacant, demolished or re-signed.

No Tier-2 negative (sale, closure, WARN notice) surfaced, but the divestiture
gauntlet was not run. **Verdict: `probable`**, and site confidence is capped at
**medium** on that basis. The physical read below is independently strong.

---

## Step 1-2 — the truck entrance and the gate question

**Verdict: no truck gate, no guard shack.**

Two truck-usable openings were found and both were examined.

**Primary - E Main St (US-64) at `35.2598, -93.0620`.** z20 satellite shows the
site's beige concrete drive meeting the public road in a wide open apron with a
generous corner radius. There is no barrier arm, no sliding or swing gate, no
lane markings and no pinch point. Chain-link fencing runs along the E Main
frontage of the drop yard on both sides of the opening, but nothing closes the
opening itself.

Street View confirms it three ways:

- The 2019-09 pano `d1hsGrUxNY-TAjsCxz4u4Q` sits **on the apron itself**.
  Looking north-east (heading 20°) the frame is an open concrete drive with the
  fenced trailer yard on the left and no structure in the drive. Looking
  south-south-west (heading 200°) the frame runs down a wide internal road with
  an employee car park on the left and the feed mill silos on the right, all
  behind chain link. Google's car drove onto and through the property, which is
  not possible past a manned or barriered entrance.
- The 2025-09 pano on the frontage (`hnH_hQw3BunxwnPUfKjgUw`, heading 110°)
  shows the drop yard behind fence on the south side of E Main with no gate
  structure in view.
- Nothing resembling a booth appears in any frame.

**Secondary - north-west access at `35.2629, -93.0706`.** The 2026-02 pano here
shows a broad concrete drive leaving a public road east toward the plant. Open,
unfenced across the drive, no barrier, no booth.

**The one structure that could be mistaken for a guard shack** is at
`35.25947, -93.06422`, in the middle of the drop yard. At z20 it resolves as a
flat-roof building roughly 30 x 25 m with rooftop HVAC units, landscaping and a
staff car park - a driver/dispatch office, an order of magnitude larger than a
gate booth and not on any property line. Classified **not** a guard shack.

`remoteGs` is therefore false by rule (no gate). No kiosk or call box was seen.

## Step 3 — docks, drop yard, rail

**Dock doors - band `50+`, estimated ~85, flagged approximate.**
Building A (west) carries a continuous row of backed-in trailers down its entire
west face. A z19 crop at `35.2597, -93.0692` counts 23-24 trailers over a 141 m
stretch (about 6 m centres); the face runs roughly 245 m, giving ~40 positions.
Building B (centre) carries a further ~30-35 positions over ~190 m of its east
face (z18 at `35.2599, -93.0672`, z20 at `35.2593, -93.0664`). Add the covered
rail dock on the south end. Individual door leaves sit under canopies and cannot
be counted directly from overhead, hence the band rather than a hard number.

**Drop yard - band `50+`.** The fenced lot east of the buildings runs roughly
220 x 150 m. z19 at `35.2602, -93.0642` resolves individual trailers parked
shoulder to shoulder at roughly 3 m centres in long rows. Site-wide visible
trailer count is on the order of **230**; capacity around **300**. Both figures
are honest +/- 20% reads, not counts.

**Rail served - yes, directly evidenced.** z19 at `35.2589, -93.0662` shows a
spur off the mainline running into the property alongside a covered rail dock on
building B's south end, with hopper cars standing on it.

**Feed mill.** z19/z20 at `35.2588, -93.0648` shows grain bins, an elevator
tower (long shadow), bulk hopper/tanker trailers at a loadout, and an elongated
oval queue loop north of the mill. No scale deck or scale house resolved
anywhere on the truck path, so `scale` is set false and listed as uncertain - a
mill this size would normally weigh, so treat the negative as an imagery limit.

## Step 6 — geofence and metrics

The perimeter is an 11-vertex ring tracing the operational envelope: the north
access drive, the north-east frontage along E Main, the drop yard's road-side
edge, the south-east support building, the rail boundary on the south, and the
trailer rows and open apron west of building A. Measured area **66.1 acres**.

Sub-zones traced: the truck gate quad over the E Main apron (oriented to the
drive at ~55° bearing), one drop-yard ring, and two dock aprons (building A west
face, building B east face). No pre- or post-gate staging zone was traced -
there is no gate to stage against, and the entire interior is open paved yard.

Street View coverage exists for the perimeter, the truck gate and the drop yard;
the two dock aprons return `ZERO_RESULTS` (no pano within 250 m of either wall).

| metric | value |
|---|---|
| dockDoorCount | ~85 (est) |
| trailersVisible | ~230 (est) |
| trailerParkingCapacity | ~300 (est) |
| truckGateCount | 2 openings (neither controlled) |
| buildingCount | 8 |
| siteAreaAcres | 66.1 |
| railServed | true |

## Sales read

An open, ungated 66-acre campus moving several hundred trailers with no
checkpoint anywhere on the property. Everything that would normally be captured
at a gate - arrival time, carrier, trailer number, seal, load status - is
captured nowhere here, or on paper inside the mid-yard driver office. That is
the whole YardFlow thesis in one site: there is no gate to modernise, so the
check-in layer has to be created, and the drop yard is large enough
(~300 positions) that trailer location is almost certainly tribal knowledge.

**Final confidence: medium.** Imagery is excellent and recent; the cap is
entirely on Tier-1 operator verification not being runnable this session.
