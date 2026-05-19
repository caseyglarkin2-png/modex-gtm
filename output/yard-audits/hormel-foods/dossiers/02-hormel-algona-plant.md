# Deep-Audit Dossier — Hormel Algona Plant (Algona, IA)

**Roster idx:** 2
**Type:** Meat Processing Plant
**Resolved center:** 43.07930, -94.22330
**Confidence:** Medium

## Location resolution
Roster coordinates (43.079868, -94.222893, "ROOFTOP") landed on the plant.
Step-0 satellite probing at z16-z18 confirmed a single ~150,000 sq ft
industrial building on the SW edge of Algona, IA, with employee parking and a
small trailer yard — consistent with the facility. Web research confirms the
Hormel Algona Plant: opened 1970, ~250 employees, 150,000 sq ft, produces
pepperoni and value-added sausage products (pork cured, sliced, packaged), with
a recent ~8,800 sq ft expansion separating raw-food and ready-to-eat areas.

## Key views
- **z16/z17 overview** — single plant building on farmland at the edge of
  town; long private access road from the public road to the north.
- **NE satellite (z18/z19)** — employee parking and ~6-8 parked trailers in an
  unpaved/partly paved yard area.
- **Access-road interface (z20)** — the access road forks into the site; a
  small structure sits beside the road (~43.0807,-94.2241), ambiguous.
- **Street View (2025-08)** — the public-road entrance is an open driveway
  with Hormel directional signs. No gate, barrier, or guard booth at the road;
  no continuous perimeter fence around the property. Street View does not
  extend down the private access road.

## Gate / guard-shack / dock determinations
- **truckGate = false** — No barrier arm, sliding/swing gate, or checkpoint
  pinch-point at the public-road junction; the entrance is an open driveway.
  No property-wide perimeter fence. A small roadside structure on the access
  road could be a check-in point but no controlled barrier is visible.
  Classified false and flagged uncertain.
- **guardShack = false** — No clearly staffed booth at a controlled entrance.
- **remoteGs = false** — No gate, so remote check-in does not apply.
- **drivewayLong = true** — The private access road is ~250 m and can hold a
  3+ truck queue.
- **dockDoors = 10-25** — Modest single plant; dock doors with a few trailers
  backed in on the east/center face. Overhead estimate.
- **dropArea = 0-10** — ~6-8 parked trailers in the NE yard; no large
  dedicated drop lot.

## Yard zones and counts
- **Perimeter:** ~30 acres of developed/operational footprint (the plant owns
  surrounding farmland; the working estimate covers the building, yard, parking
  and access road).
- **Drop yard:** small NE trailer-parking area.
- **Dock apron:** east/center building face.
- **Staging:** none clearly defined.
- **yardMetrics:** ~14 dock doors, ~8 trailers visible, ~20 trailer capacity,
  1 truck access, 2 buildings, not rail-served.

## Web findings
- Hormel Algona Plant: opened 1970, ~250 employees, ~150,000 sq ft, one of
  Algona's largest employers.
- Produces pepperoni and value-added sausage; recent expansion separating
  raw and RTE production.

## Final confidence
**Medium.** Facility positively identified and corroborated by web research.
Gate/guard-shack are negative based on imagery (open driveway, no perimeter
fence) but the ambiguous roadside structure and the lack of Street View access
down the private road keep `truckGate`/`guardShack` flagged uncertain. Dock and
trailer counts are honest overhead estimates.
