# Pactiv Evergreen — Covington GA Distribution Center (idx 23)

**Facility:** Pactiv Evergreen Regional Mixing Center, 15101 Lake Forest Ct NE, Covington, GA 30014
**Type:** Distribution Center / Regional Mixing Center
**Resolved coordinates:** 33.60620, -83.81260 (DC warehouse center)
**Confidence:** High

## Location confirmation

The roster coordinate (33.605447, -83.813271, ROOFTOP, 0 m flagged) landed at
the SW corner of a large dark-blue-roofed warehouse in the Lake Forest Court
industrial park. Web search confirms Pactiv Evergreen operates a **Regional
Mixing Center** at 15101 Lake Forest Ct NE, Covington GA 30014 (Chamber of
Commerce directory, Yelp; 24 hours / 7 days, ~20+ employees). Street View
(2020-01) shows a monument sign reading **"Pactiv — Regional Mixing Center"**
and a "Pactiv" branded red-brick office building — a positive ID. This site is
notable: per the account dossier, regional mixing centers (multi-destination
outbound trailers) are the highest-leverage yard type for YardFlow.

## What the imagery showed

- **Wide satellite (z16-17):** a large dark-roofed cross-dock distribution
  warehouse with dock doors and trailers backed in along **both** long faces
  (NE and SW). A red-brick office/support building sits at the SW end. One
  fenced property within a multi-building industrial park.
- **Entrance (Street View 2020-01, multiple headings):** the entry drive off
  Lake Forest Court has a **barrier-arm gate** across the truck lane — clearly
  visible raised, with a tractor-trailer queued behind it. Bollards and a
  "TRUCKS" directional sign mark the checkpoint. A small structure beside the
  barrier arm (visible in z19 satellite) is consistent with a guard booth.
- **Dock faces (z17-19):** both long sides of the DC warehouse are dock faces
  with trailers backed in; trailer parking wraps the building and extends off
  the NE end — a trailer-staging-heavy mixing-center layout.

## Gate / guard-shack determination

- **truckGate: TRUE.** A barrier-arm gate across the truck lane on the entry
  drive — unambiguous in 2020-01 Street View, with a truck queued at it.
- **guardShack: TRUE.** A small structure sits beside the barrier arm at the
  entry checkpoint (z19 satellite), consistent with a guard booth. A branded
  24/7 Pactiv Regional Mixing Center with a barrier-arm gate is normally
  booth-staffed.
- **remoteGs: FALSE.** A guard booth is present.

## Yard zones and counts

- **Perimeter:** the fenced DC property — warehouse, office building, and
  surrounding trailer aprons. ~30 acres.
- **Truck gate:** the barrier-arm checkpoint on the entry drive off Lake Forest
  Court.
- **Pre-gate staging:** paved approach outside the barrier arm (a truck was
  observed queued there).
- **Drop yards:** trailer-storage areas flanking the building and at the NE
  end — `dropYard:true`, "50+" band.
- **Dock doors:** "50+" band — a long cross-dock warehouse with doors on both
  long faces; ~70 estimated (approximate, flagged).
- **shipRcvSeparate:** inferred true from the two-faced cross-dock layout;
  flagged uncertain.
- **Buildings:** 2 (DC warehouse + red-brick office) — one facility, not a
  campus.
- **Rail served:** FALSE — no spur enters the property.

## Web findings

Pactiv Evergreen Covington Regional Mixing Center, 24/7 operation, ~20+
employees (Chamber of Commerce). Functions within Pactiv's hub-and-spoke
distribution network — a regional mixing center blends product from
manufacturing and distributes downstream. This is the facility type the Chuck
Whittington account dossier flags as the highest-leverage YardFlow target
(multi-destination outbound trailers, richest orchestration math).

## Final confidence: HIGH

Facility positively identified by the branded "Pactiv — Regional Mixing Center"
monument sign. The truck gate (barrier arm) is unambiguous in Street View, and
a guard booth is visible at the checkpoint. Dock-door count and ship/receive
separation are honest estimates flagged as uncertain.
