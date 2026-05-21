# Pactiv Evergreen — Cedar Rapids IA (idx 10)

**Type:** Manufacturing Plant (Filling Equipment / carton filling machinery)
**Resolved center:** 41.9546, -91.6789
**Address:** 2400 6th Street SW, Cedar Rapids, IA 52404
**Confidence:** medium

## Location resolution

The roster geocode (41.95494, -91.678837, `ROOFTOP`, movedMeters 111) was
accurate — it lands on a large industrial building at the southwest corner of
6th Street SW and Wilson Avenue SW, Cedar Rapids. Confirmed at satellite
z16-z19 and Street View. This is the Pactiv Evergreen / Evergreen Packaging
Equipment facility — it manufactures gable-top carton **filling equipment**
and provides 24/7 parts and service for dairy/juice carton filling machines.

The building appears to be a **shared / multi-tenant** industrial block: a
Street View sign in the south parking lot reads "ALTORFER" (a Caterpillar
equipment dealer), indicating the structure houses more than the Pactiv
operation.

## Key views

- **Satellite z16-z17 (overview):** one large industrial building at a
  signalized 4-way intersection, surrounded by employee/customer parking lots;
  residential neighborhoods on three sides and a city park to the northeast.
- **Satellite z18-z19 (south/SE face):** a modest dock/loading area on the
  south-southeast face with a short apron; no trailer drop yard.
- **Street View 2022-05 / 2024-09 (6th St SW):** a 2-story brick
  office/manufacturing building fronting directly on the public street with
  open employee parking — no perimeter fence, no gate.
- **Street View 2022-05 (south lot):** parking, a few dock doors, the
  "ALTORFER" tenant sign.

## Gate / guard-shack determination

- **truckGate = false.** This is an open site. There is no perimeter fence
  enclosing a controlled truck entrance — the building fronts directly on
  public streets with open parking lots and driveways. No barrier arm, gate,
  or checkpoint pinch-point anywhere along the property line.
- **guardShack = false.** No staffed booth anywhere on the site.
- **remoteGs = false** — there is no gate, so remote check-in does not apply.

## Yard zones and counts

- **Perimeter:** ~17 acres estimated for the parcel; the Pactiv operation may
  occupy only part of a shared multi-tenant block, so usable yard area is
  smaller (flagged uncertain).
- **Dock doors:** a modest dock/loading area on the south/southeast face,
  roughly 6-10 doors — `dockDoors` banded **0-10**, low-confidence count.
- **dropArea = NONE / dropYard = false** — no dedicated trailer-parking stalls
  and effectively no trailers in the imagery. This is an equipment plant, not
  a high-throughput freight facility.
- **drivewayShort = true** — the dock approach is a short paved apron off the
  parking lots, holding only 1-2 trucks.
- **railServed = false** — no rail spur enters the property.
- **urbanRural = Urban** — inside the Cedar Rapids urban fabric at a signalized
  intersection with residential neighborhoods on three sides.

## Web findings

Confirmed as Pactiv Evergreen / Evergreen Packaging Equipment, Cedar Rapids
(Cedar Rapids Metro Economic Alliance manufacturer directory; ProFood World;
Dairy Foods buyer's guide). The site is a fully integrated supplier of
fiber-based gable-top cartons and filling equipment, with 24/7 technician and
parts support. Its freight profile is light — outbound machinery and parts,
not bulk product — consistent with the no-gate, no-drop-yard, few-dock layout
observed.

## Final confidence: medium

Location and facility identity are clear. Medium rather than high because the
building appears multi-tenant (Altorfer signage) so the precise Pactiv
footprint within the block, the exact dock-door count, and the parcel acreage
are estimates. The gate / guard-shack call (open site, no control) is high
confidence on its own.
