# GM CCA - Philadelphia Parts Distribution Center, Langhorne PA (idx 37)

**Facility:** General Motors Customer Care & Aftersales (legacy SPO / Service Parts
Operations) — Philadelphia Parts Distribution Center
**Address:** 200 Cabot Blvd E, Langhorne, PA 19047 (Middletown Twp, Bucks County)
**Resolved center:** 40.193557, -74.835017
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high (gate hardware and guard-shack inferred; see below)

## Location confirmation
The roster address was city-level only ("Langhorne, PA 19047"). Web search resolved
the GM parts DC to **200 Cabot Blvd E** (GM SPO Philadelphia; ~193 employees;
267-580-2301), corroborated by business directories, UAW local listings ("SPO
Philadelphi, 200 Cabot Blvd. East"), and a 2024 UAW strike news item at the
Langhorne GM facility. A Google rooftop geocode of that address
(40.193957, -74.834983) lands squarely on a single large single-story
distribution warehouse. Satellite confirmed identity: an isolated DC set back from
US-1, fronted by an employee parking lot, with a long dock face and truck court on
its SE side backing onto the Norfolk Southern / Conrail **Morrisville Yard**. This
is unambiguously the right building.

## What the imagery showed
- **Wide (z16-17):** one rectangular warehouse, long axis WNW-ESE (rotated ~25-30°
  off E-W). US-1 freeway and its cloverleaf interchange to the N/E, buffered by
  trees. Employee parking on the W/NW. A private access drive curls SW off Cabot
  Blvd E down to the site. The Morrisville rail yard (rows of containers/railcars)
  lies just S across a tree buffer.
- **Dock face (z19):** the SE building face is a single long dock line with trailers
  backed in across a wide concrete apron — estimated ~34 dock positions (band 25-50).
- **Truck court / drop yard (z18-19):** a second row of free-standing, nose-out drop
  trailers sits in the court ahead of the docked row → dedicated drop yard,
  ~25-50 dropped trailers. A water tower marks the SE corner of the developed area.
- **NE/E corner (z20):** a **rail spur** clearly enters the property and runs along
  the building (tracks visible curving in from the SE), tied to the adjacent NS
  Morrisville Yard. The chain-link perimeter fence follows the east tree line.
- **NW corner (z19):** employee parking lot with a turnaround cul-de-sac; tree buffer
  to US-1.

## Gate / guard-shack / dock determinations
- **truckGate = true (remoteGs = true, guardShack = false):** access is a single,
  long, fenced, tree-buffered private drive off Cabot Blvd E — a controlled-access
  layout. Public Street View does **not** penetrate the private drive (the only
  nearby pano, `Ism-wluyMRVTM4dKDFjb_A` on Cabot Blvd E, shows guardrail + heavy
  tree screen, no view of the gate). Physical gate hardware and the absence of a
  staffed booth are therefore inferred from the layout, not directly imaged — both
  flagged uncertain. Modeled as kiosk/app check-in (remoteGs) since no booth is
  visible.
- **drivewayLong = true / postGateStaging = true:** the approach plus the internal
  perimeter road and the large SE truck court give deep stacking (3+ trucks) and
  in-fence holding.
- **entryExitTogether = true:** one access point serves both directions.
- **dockDoors = 25-50; shipRcvSeparate = false:** single dock bank on one face.
- **dropArea = 25-50; dropYard = true:** standing drop-trailer row in the court.
- **scale = false:** no weigh pad seen. **multipleFacilities = false:** one building.

## Yard zones measured
- **perimeter:** oriented 4-corner ring around the fenced parcel (parking + building
  + SE truck court), ~27.5 acres.
- **dockApron:** thin rotated quad hugging the SE dock wall at the building angle.
- **dropYard:** rotated quad over the standing-trailer row in the truck court.
- **truckGate:** quad over the NE drive entry where the private road reaches the lot.
- **streetViewMeta:** best available driver frame is Cabot Blvd E pano
  `Ism-wluyMRVTM4dKDFjb_A` (2025-10), heading ~235° toward the GM drive.

## Web findings
- GM SPO / CCA Philadelphia PDC, 200 Cabot Blvd E — directories confirm GM occupancy
  and headcount; UAW local lists it as "SPO Philadelphia."
- Adjacent rail = NS / Conrail Morrisville Yard (Wikipedia: legacy PRR/Penn Central
  classification yard); the GM building backs onto it with a spur into the property.

## Final confidence
**high** on identity, layout, docks, drop yard, and rail-spur presence. Uncertain:
guard-shack vs. remote check-in and exact lane counts (no Street View into the
private drive), exact dock count (overhead estimate), and current rail-spur activity.

### 3-line summary
- Gate: YES — single controlled private drive off Cabot Blvd E (long, fenced).
- Guard shack: NO booth visible — modeled as remote/kiosk check-in (uncertain).
- Confidence: high (gate hardware / guard-shack inferred from layout, not imaged).
