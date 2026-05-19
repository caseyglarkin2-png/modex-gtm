# Deep-Audit Dossier — Angry Orchard Innovation Cidery, Walden NY

**Account:** The Boston Beer Company · **Roster idx:** 5
**Address:** 2241 Albany Post Road, Walden, NY 12586
**Locked center:** 41.5901, -74.2240 (cider house building)
**Confidence:** High

## Location confirmation
The roster's geocode (41.590198, -74.223894, GEOMETRIC_CENTER) is the parcel
center; the cider house building itself is ~120 m WSW at 41.5901, -74.2240.
Satellite probing (z16-z20) confirmed a distinctive timber-frame building with
an octagonal/round-roofed tasting-room section, outdoor seating areas with
picnic tables and umbrellas, and parking lots — set in the middle of a large
apple orchard (regular rows of trees). Street View surfaced interior imagery of
the cider house showing fermentation tanks and barrel-aging in a timber-frame
hall. Web research (I Love NY, NY Gov, Cider Culture) confirms 2241 Albany Post
Road as Angry Orchard's Innovation Cider House — a 15,000 sq ft small-batch
cidery, tasting room, and hard-cider R&D center on a company-owned 60-acre
orchard, opened 2018 with a $9.1M investment and ~7 full-time employees.

## Key views
- **Wide (z16-z17):** Large apple orchard with the cider house building cluster
  in the center-left; a long winding private driveway connects to Albany Post
  Road. Surrounded by farmland and woods.
- **Cider house (z20):** Distinctive building with round/octagonal tasting-room
  roof, outdoor picnic/event areas, landscaping, and visitor parking.
- **Street View (2025):** The orchard along Albany Post Road is ringed by
  agricultural deer fencing; the cider house is visible across the orchard. The
  private driveway is open with no gate. Interior SV shows the cidery's
  fermentation tanks and barrel room.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** The cider house is reached by a long winding private
  driveway off Albany Post Road; the driveway is open with no barrier arm,
  sliding gate, or checkpoint. The orchard's deer fencing is agricultural, not a
  security perimeter.
- **Guard shack: FALSE.** No guard booth — the only structures are the cider
  house and a couple of small farm buildings.
- **remoteGs: FALSE** — no gate.
- **Docks:** at most ~1 service/loading door for ingredient and supply
  deliveries; no dock apron or dock bank. dockDoors band 0-10.
- **dropArea: NONE / dropYard FALSE** — no trailer parking on site.
- **backupSensitive: FALSE** — wide-open rural site with ample maneuvering room.
- **connectivityIssue: TRUE (medium-confidence, flagged)** — rural orchard set
  back from the road, surrounded by farmland and woods; cellular coverage may be
  moderate.

## Yard zones & counts
- **Perimeter:** ~75.6 acres as boxed — approximates the deer-fenced orchard /
  cidery parcel (the planted orchard is described as ~60 acres).
- **Drop yards / dock aprons / staging:** none — left empty/null.
- **Trailers visible:** 0; capacity 0. Most Angry Orchard production volume runs
  at the Cincinnati brewery; Walden is small-batch / R&D / specialty cider plus
  a visitor destination, so it runs no freight trailer yard.
- **Buildings:** ~2 (main cider house plus small ancillary farm structures);
  multipleFacilities FALSE.
- **Rail-served:** FALSE.
- **Scale:** none.

## Web findings
NY State and trade-press coverage confirm the Innovation Cider House: 15,000 sq
ft, opened 2018, $9.1M investment, ~7 full-time staff, a small-batch cidery and
hard-cider R&D center with a tasting room, orchard tours, an in-house kitchen,
and event programming. It is explicitly a destination/R&D facility rather than a
distribution hub — consistent with the observed absence of docks and trailer
yard.

## Final confidence
**High.** Building positively identified; the site is unambiguously a small
rural specialty/R&D cidery and visitor destination with no truck gate, no guard
shack, no docks, and no trailer yard. connectivityIssue is an inferred,
medium-confidence call flagged in uncertainFields.
