# Toyota Motor Manufacturing Tennessee (Bodine Aluminum) — Jackson, TN

**Roster idx:** 10
**Facility type:** Powertrain plant — aluminum castings (engine blocks, cylinder heads, transaxle casings)
**Address:** 301 James Lawrence Road, Jackson, TN 38301
**Resolved center:** 35.59800, -88.94100
**Confidence:** High

## Location confirmation

The roster geocode (35.597387, -88.940858) was flagged with a 14 km move,
so the location was verified carefully. Satellite at zoom 16 over the roster
coordinates shows a large industrial plant complex set in farmland/woods
northeast of Jackson, TN, with a long access drive running south to a public
road, large employee parking, and a multi-section manufacturing building. Web
research confirms the address (301 James Lawrence Road) and that the site is
Toyota Motor Manufacturing Tennessee — the former Bodine Aluminum Jackson
plant (renamed from Bodine Aluminum to TMMTN in 2020). Street View at the
entrance shows a **Toyota monument sign**, positively identifying the site.
The roster coordinates land correctly on the plant — the 14 km flag did not
indicate an error.

## Key views

- **Wide satellite (z16):** Large plant complex, employee parking to the
  south, access drive to the south public road, undeveloped buffer land
  around the property.
- **Plant (z18):** Multi-section building — a bright casting-plant block to
  the north and a darker connected block; row of dock canopy structures along
  the building's truck-side face.
- **Entrance (z20):** White security/gatehouse building set in the access
  drive with a horizontal barrier-arm gate spanning the truck lane; trucks and
  trailers staged just inside.
- **Street View (2026-02):** Toyota monument sign at the entrance; the access
  drive runs up to the plant and gatehouse.
- **NE corner (z19):** Materials/scrap yard and a support building at the back
  of the property.

## Gate / guard-shack determination

- **truckGate = true.** A single controlled entrance off the public road on
  the south side. A long access drive funnels traffic to a checkpoint.
- **guardShack = true.** Zoom-20 imagery clearly shows a white gatehouse
  building beside the drive with a barrier-arm gate (a horizontal bar) across
  the truck lane — a staffed guard checkpoint.
- **remoteGs = false** (a physical guard building is present).
- One combined entry/exit (entryExitTogether), ~1 inbound + 1 outbound lane.
  The long approach drive provides pre-gate staging and a deep queue
  (drivewayLong); the wide entrance apron leaves room for a fast lane.

## Yard zones and counts

- **Perimeter:** ~121 acres — a large tract; the controlled property includes
  the plant, parking, drives, and undeveloped buffer land typical of a Toyota
  industrial site.
- **Drop yard:** Modest for a casting plant — trailers parked along the
  building aprons plus a small NE yard. dropArea band 10-25.
- **Dock apron:** ~12 dock doors estimated along the building's truck-side
  face (band 10-25). Shipping and receiving are not on physically separate
  building faces.
- **Buildings:** One large interconnected casting-plant complex plus a few
  support structures — single operational facility, not a campus.
- **Rail:** No active rail spur into the plant — railServed = false.
- **Setting:** Large isolated industrial tract on the edge of Jackson, TN,
  surrounded by farmland and woods — Rural per rubric. Jackson is a sizeable
  town nearby, so connectivityIssue = false.

## Web findings

- TMMTN / Bodine Aluminum Jackson: aluminum casting plant producing engine
  blocks, cylinder heads, and transaxle casings for Toyota's North American
  engine operations. Established 2003 as Bodine Aluminum; renamed Toyota Motor
  Manufacturing Tennessee in 2020. Multiple expansion announcements (most
  recent in 2025) for additional casting capacity.
- Sources: Toyota USA Newsroom (TMMTN facility page), Wikipedia (Toyota Motor
  Manufacturing Tennessee), Greater Jackson Chamber, WNWS Radio corporate
  snapshot.

## Final confidence: High

Facility unambiguously identified; gate + barrier-arm + guard building
confirmed in zoom-20 imagery and corroborated by Street View. Dock-door and
trailer counts are honest overhead estimates, flagged in `uncertainFields`.
