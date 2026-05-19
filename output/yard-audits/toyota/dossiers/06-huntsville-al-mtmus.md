# Deep-Audit Dossier — Mazda Toyota Manufacturing USA (MTMUS), Huntsville AL

**Account:** Toyota · **Roster idx:** 6
**Facility type:** Vehicle Assembly Plant (Mazda-Toyota joint venture)
**Address:** 8800 Greenbrier Pkwy, Huntsville, AL 35808
**Resolved center:** 34.6835, -86.848
**Confidence:** Medium

---

## Location resolution

Roster coordinates (34.677446, -86.8589, ROOFTOP, moved only 8 m) were highly
precise. Satellite probing at z14–z20 positively identified the facility: an
enormous greenfield vehicle-assembly campus on the Greenbrier megasite southwest
of Huntsville, AL. Street View (April 2026) of the entrance road confirmed the
"MAZDA TOYOTA" building signage. The campus center is over the main assembly /
body / paint building cluster at 34.6835, -86.848 — the roster point sat at the
SW corner of the very large property.

## What the imagery showed

- **z14 overview:** A massive industrial campus — 8+ distinct large building
  masses (assembly, body, paint, stamping, logistics) plus a large finished-
  vehicle storage lot on the east side and extensive employee parking.
- **Drop yards:** A large north-central trailer drop yard with rows of 50+
  trailers, and a second south-side staging/trailer yard. Both are distinct from
  the active dock aprons.
- **Dock aprons:** Trailers backed into multiple building faces — inbound parts
  / cross-dock receiving on one side, finished-vehicle and other outbound on
  separate faces. Estimated 80+ dock doors campus-wide (50+ band).
- **Main entrance:** Greenbrier Parkway feeds a roundabout and an entrance road
  east to the main building. Street View (2026-04) shows the visitor/employee
  side as an **open parking lot** fronting the MAZDA TOYOTA building — no guard
  booth on that side.
- **Perimeter:** Chain-link perimeter fencing visible in Street View; the
  truck/dock operations sit inside the secured perimeter.

## Gate / guard-shack determination

- **truckGate: true** — The whole campus is perimeter-fenced and truck/dock
  operations are inside a controlled perimeter. A new large auto-assembly plant
  of this scale routes carriers through controlled truck gates. The gate
  structures themselves are not directly visible — Street View covers only the
  public approach roads — so the gate-type call is an inference.
- **guardShack: false / remoteGs: true** — No guard booth could be positively
  confirmed at the truck gates from overhead imagery, and the
  visitor/employee entrance is an open parking lot. Set guardShack false /
  remoteGs true at **medium confidence**; both flagged uncertain.
- **multiStep: false** — No second checkpoint confirmed.

## Yard zones and counts

- **Perimeter:** ~504 acres fenced campus footprint.
- **Drop yards:** Two — a north-central trailer yard (50+ band, large capacity)
  and a south staging yard.
- **Dock aprons:** Two principal apron clusters on different building faces.
- **Buildings:** ~8 distinct structures — campus / multipleFacilities true.
- **Truck gates:** ~2 estimated (uncertain).
- **Rail:** No rail spur into the property — railServed false.

## Web findings

- The dossier confirms MTMUS is the Mazda-Toyota JV producing Corolla Cross and
  Mazda CX-50; Chris Nielsen sits on the JV board. The plant opened in 2021 on
  the Greenbrier site and represents a unique two-OEM shared-yard operation —
  Mazda and Toyota inbound logistics, different supplier networks, converging on
  shared yard infrastructure. This is directly called out in the dossier as a
  YardFlow pain point ("two OEMs, one yard, zero downtime tolerance").

## YardFlow relevance

MTMUS is the single most strategically relevant Toyota site for YardFlow: a
brand-new, very large two-OEM JV campus with multiple drop yards, 80+ dock
doors, and shared yard infrastructure that must reconcile two distinct supplier
networks. Nielsen personally owns this problem as a board member.

## Final confidence: Medium

Facility positively identified (signage-confirmed) and yard layout well
characterized. Truck-gate structure and guard-shack calls are inferred because
Street View does not enter the secured property — hence medium, not high.
