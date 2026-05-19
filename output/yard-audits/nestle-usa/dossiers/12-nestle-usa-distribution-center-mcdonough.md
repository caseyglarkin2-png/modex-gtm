# Deep-Audit Dossier — idx 12

## Nestlé USA Distribution Center — McDonough, GA
**Type:** Distribution center (southeast regional DC, frozen/ambient brands)
**Resolved address:** 1 Nestle Ct, McDonough, GA 30253
**Locked center:** 33.4084, -84.1543

## Location resolution
The roster coordinates (33.40872, -84.15465; geocode flagged movedMeters 2327) and independently
search-derived coordinates (33.40806, -84.15425) both land on the same large NW-SE-oriented warehouse
served by Nestle Ct, a private road in a freeway-side logistics park beside I-75. Waze, Yelp, the Henry
County business directory, and TruckMap all confirm this as the Nestlé Distribution Center, 1 Nestle Ct.
Locked center set to 33.4084, -84.1543.

## Key views
- **Wide z16/z17:** Large rectangular DC warehouse in a multi-building logistics park. Dock doors with
  trailers backed in along the long SW face (toward I-75) and the SE face. A very large trailer drop
  yard wraps the SE end.
- **SW dock face z19:** Extended continuous bank of dock doors with a long row of trailers (orange,
  green, white) backed in; I-75 immediately to the SW.
- **SE drop yard z19/z20:** 4-5 rows of ~25-30 trailers each — well over 100 dropped trailers — plus
  the SE dock apron with trailers.
- **NE side z19/z20:** A rail spur runs directly alongside the NE face of the building; marked trailer
  parking stalls and parked trailers along that side; a small blue-roofed ancillary structure near the
  rail line.

## Gate / guard-shack determination
- **Truck gate: TRUE.** The compound is fully fenced (chain-link fencing visible in Street View of the
  access-road corridor). Web research describing the site's gate-guard duties is explicit that the guard
  "opens the gate to release the driver" — a controlled gated entry.
- **Guard shack: TRUE.** Web research describing the McDonough gate-guard role confirms a staffed booth/
  window: the guard "answers calls at the call box to check drivers in," has "drivers bring their license
  and bills to the window," and "gives drivers a yard pass with door numbers." A staffed guard window is
  present. (The booth could not be cleanly isolated from satellite among the small NE-side structures,
  but the operational description is unambiguous.)
- **Remote GS: FALSE** — the gate is staffed by a guard, not kiosk-only.
- **Multi-step: TRUE** — the described check-in is multi-stage: gate guard verifies appointment and
  paperwork, checks trailer fuel/seals, then issues a yard pass with door directions before releasing
  the driver into the yard.
- Single combined entry/exit at one gate, with a large paved interior yard giving room for an express
  bypass lane (`fastLaneOpportunity: true`) and a deep 3+ truck approach (`drivewayLong: true`).

## Yard zones and counts
- **Perimeter:** ~42 acres for the fenced property (bounding box S 33.4058 / W -84.1568 / N 33.4103 /
  E -84.1518; box overincludes margin given the diagonal footprint).
- **Truck gate zone:** NE access-road entry into the secured yard.
- **Drop yards:** Two — the large SE trailer yard and the marked NE-side trailer parking.
- **Dock aprons:** Two — the long SW face and the SE face.
- **dockDoorCount ~110** (banded 50+; rough overhead estimate — SW face ~50-60, SE face ~30-40, plus
  NE-side docks).
- **dropArea 50+** — over 100 dropped trailers in the SE yard alone.
- **trailersVisible ~175** across dock faces and drop yard; approximate.
- **buildingCount 2** — main DC plus one small ancillary structure.
- **railServed: TRUE** — a rail spur runs into the property alongside the NE building face.

## Web findings
The McDonough facility is a fully operational Nestlé USA southeast regional distribution center serving
frozen/ambient brands. It offers customer truck parking with overnight parking. Driver gate procedures
(per directory/role descriptions): appointment verification, call-box check-in, license/BOL presentation
at the guard window, fuel/seal checks, and yard-pass issuance. Sources: waze.com, yelp.com,
business.henrycounty.com, nestleusa.com, truckmap.com.

## Final confidence
**High.** Facility unambiguously identified; gate, staffed guard window, and multi-step check-in
confirmed by explicit web research; layout, dock structure, drop yard, and rail spur clear from
satellite. Dock-door and trailer counts are honest overhead estimates flagged in `uncertainFields`;
a truck scale could not be confirmed and is also flagged.
