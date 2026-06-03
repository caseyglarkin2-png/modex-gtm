# Yard Audit — Walmart Fulfillment Center, Joliet IL (#06)

**Facility:** Walmart next-generation E-commerce Fulfillment Center (1.1M sf)
**Address:** 3501 S Brandon Rd, Joliet, IL (CenterPoint Intermodal Center-Joliet)
**Resolved center:** 41.46055, -88.10000
**Method:** deep satellite (z15-z21) + Street View (Brandon Rd, 2021-07) + web research
**Confidence:** high

---

## Location confirmation

The supplied coordinates (41.459972, -88.09757) landed on the SE corner of the
target building. Wide satellite (z15-z16) showed two large warehouses in the
CenterPoint Intermodal Center: a white-roof building to the north and a large
tan cross-dock building in the center. Street View at the entrance drive
(pano `V1Y_D7duke03Z8LVhzipyQ`, 41.46224,-88.09508, captured 2021-07) shows the
CenterPoint water tank lettered "CenterPoint / 3401 South Brandon," confirming
the parcel. Web research (Walmart corporate + Shaw Local + The Real Deal)
confirms Walmart leased the 1.1M sf building at 3501 S Brandon Rd and opened it
as the first of four next-gen fulfillment centers in September 2022.

The **tan cross-dock building** (long axis WNW-ESE, ~10-12 degrees off east) is
the Walmart FC: office/associate entrance + car lot at its NE corner, dock banks
on both long faces, and a large trailer drop yard on the SW. The white-roof
building to the north is a separate CenterPoint tenant and is excluded.

---

## Key views

- **z16 overview (wm06-full / wm06-measure):** full FC footprint. Cross-dock
  building; dock doors on north and south long walls; associate parking and
  office at NE corner; large drop yard with parked trailers to the SW; perimeter
  truck road looping the building; single driveway to S Brandon Rd on the east.
- **z18-19 corners (c-NW / c-NE / c-SW / c-SE):** north wall with dock apron and
  scattered trailers; NE office corner with associate car lot; SW corner showing
  a dense drop yard (angled trailer rows, 50+ trailers) plus trailers backed into
  the south dock wall; SE corner where the perimeter road wraps around.
- **z20-21 entrance (wm06-checkpoint / wm06-internalgate / wm06-pinch):** the
  truck approach inside the gate is a wide, heavily painted, channelized roadway
  with diagonal lane-hatching — a marked multi-lane entry — but **no guard booth**.
- **z20 main drive (wm06-maindrive):** the drive meets S Brandon Rd with separate
  in/out turn lanes ("ONLY" markings on Brandon Rd). The structures flanking the
  drive are CenterPoint water tanks, not booths.
- **Street View (wm06-sv-W / wm06-sv-N / wm06-sv-drive):** 2021-07 construction-era
  panos from Brandon Rd. Show the FC office facade (blue glass), perimeter fencing
  around the truck yard, and the entrance drive. No gate arm installed yet at the
  time of capture (site still finishing construction).

---

## Gate / guard-shack / dock determinations

- **truckGate = true.** One controlled truck entrance off S Brandon Rd
  (~41.4622, -88.0958). The 2026 satellite shows a fenced parcel with a single
  channelized, lane-marked truck approach at the pinch point where the drive
  meets the internal yard. Evidence: z21 diagonal lane-hatching, perimeter fence
  in Street View, separate in/out turn lanes on Brandon Rd.
- **guardShack = false.** No staffed booth at the entrance. The only structures
  by the drive are water tanks. Channelized lanes with no booth.
- **remoteGs = true.** Gate present, no guard shack -> kiosk/app/automated
  check-in inferred, consistent with a next-gen automated FC. (Medium confidence;
  listed in uncertainFields.)
- **dockDoors = 50+ (cross-dock).** Continuous dock-door banks on both the north
  and south long walls; ~180 doors estimated total. Trailers backed in on both
  faces.
- **shipRcvSeparate = true.** Two physically separate dock clusters on opposite
  building faces.

---

## Yard zones and counts

- **Perimeter:** ~102 acres (oriented 8-vertex polygon following the developed
  parcel inside the fence/perimeter road).
- **Truck gate:** thin quad aligned to the entrance drive off Brandon Rd.
- **Dock aprons:** two thin strips, one along the north dock wall and one along
  the south dock wall, traced at the building's ~10-degree tilt.
- **Drop yards:** one large lot on the SW side, angled trailer rows, separate from
  active dock staging.
- **Staging:** none distinct beyond the wide post-gate channelized approach.
- **yardMetrics:** dockDoorCount ~180, trailersVisible ~120, trailerParking
  capacity ~220, truckGateCount 1, buildingCount 1, siteAreaAcres ~102,
  railServed false (rail mainline runs east of Brandon Rd but no spur enters this
  parcel; this FC is truck-only).

---

## Web findings

- Walmart's first of four next-gen fulfillment centers; 1.1M sf; opened Sept 2022;
  ~1,000+ jobs; fulfills Walmart Marketplace / WFS third-party orders.
- Patent-pending process combining people + robotics + machine learning,
  compressing a 12-step manual process to 5 steps — a highly automated facility,
  which supports the remote/kiosk gate inference.
- Developed by CenterPoint Properties within CenterPoint Intermodal Center-Joliet.

---

## Street View metadata

Only Brandon Rd has Street View coverage (2021-07). Both the perimeter and
truckGate zones use the entrance-drive pano `V1Y_D7duke03Z8LVhzipyQ`
(41.46224, -88.09508): truckGate heading 265 deg (toward the gate), perimeter
heading 248 deg (toward the property interior). No pano coverage inside the yard,
so dropYards/dockAprons have no Street View (and are not in streetViewMeta).

---

## Final confidence: high

Facility positively identified; layout, dock configuration, drop yard, and single
controlled entrance are clear in 2026 imagery. Lower-confidence calls
(guardShack/remoteGs, entry/exit lane counts, post-gate staging) are flagged in
uncertainFields — the physical gate hardware is inferred from the channelized,
fenced, booth-less approach rather than a visible arm, since the only Street View
predates final construction.
