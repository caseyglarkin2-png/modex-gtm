# Deep-Audit Dossier — Toyota Battery Manufacturing North Carolina (TBMNC), Liberty NC

**Account:** Toyota · **Roster idx:** 7
**Facility type:** Battery Manufacturing Plant
**Address:** Toyota Battery Boulevard, Liberty, NC 27298 (Greensboro-Randolph Megasite)
**Resolved center:** 35.8955, -79.6300
**Confidence:** Low

---

## Location resolution

The roster coordinates (35.896442, -79.642555) had a flagged 11.4 km geocode
move and pointed at the **town of Liberty**, not the plant. Web search confirmed
TBMNC sits on the **Greensboro-Randolph Megasite** off US-421 southeast of
Liberty. A wide satellite scan (z13) located the unmistakable mega-industrial
complex and the operational plant building cluster was locked at ~35.8955,
-79.6300.

## What the imagery showed

- **z13 / z14 overview:** An enormous industrial megasite — large white-roof
  operational buildings on the western/southwestern portion, surrounded by vast
  graded construction land. Roundabout-based internal road network.
- **Main building:** A very large battery-plant building (7-million-sq-ft
  facility per public reporting). Dock doors with trailers backed in along the
  north face. Construction trailers and a logistics lay-down yard adjacent.
- **Support structures:** Several support/utility buildings and an electrical
  substation; additional production buildings under construction.
- **East side:** Mostly graded land — future expansion phases.

**Important caveat:** the latest available Maxar imagery is from an
**active-construction period**. The plant is operationally producing HEV
batteries (since 2025 per news reporting), but the satellite imagery predates
full build-out — the mature truck-yard configuration is not yet visible.

## Gate / guard-shack determination

- **truckGate: true (inferred, low confidence)** — The megasite is a controlled
  industrial campus with a gated, roundabout-based internal road network. Truck
  access is controlled. The gate structure itself is **not viewable** — there is
  no Street View coverage at this remote greenfield site, and the satellite
  imagery is construction-era.
- **guardShack: false / remoteGs: true (low confidence)** — A guard booth could
  not be confirmed from overhead construction-era imagery. A megasite of this
  scale and security profile will have controlled truck check-in, but the
  structure type cannot be verified.
- **multiStep: false** — Not confirmed.

All gate-related fields, dock/yard counts, and ship/rcv separation are flagged
in `uncertainFields` because the site is still maturing.

## Yard zones and counts (best-effort estimates)

- **Perimeter:** ~1,116 acres active/operational footprint estimated; the full
  Greensboro-Randolph Megasite parcel is ~1,850 acres.
- **Drop yard:** Trailer parking and a construction/logistics lay-down yard
  adjacent to the main building; mature operational extent unclear.
- **Dock aprons:** One principal apron cluster on the north building face.
- **Buildings:** ~5 distinct structures and growing — multipleFacilities true.
- **Rail:** No rail spur into the operational footprint observed.

## Web findings

- TBMNC is the **single largest investment in Toyota's history — $13.9 billion**
  (originally $1.29B in 2021, expanded multiple times). 7-million-sq-ft plant,
  5,000+ jobs at maturity (3,000+ employed as of early 2026). Producing HEV
  batteries since 2025; BEV and PHEV battery lines ramping through 2027. It is a
  greenfield operation that needs complete yard-management design from day one
  — explicitly called out in the account dossier as the #1 YardFlow entry angle
  for Chris Nielsen.

## YardFlow relevance

This is the strategic crown-jewel target. A brand-new $13.9B greenfield
megasite where yard-management design decisions are being made right now —
hazmat battery-material inbound, finished-module outbound to assembly plants. The
dossier's top-ranked outreach angle: "You're building the future of Toyota
manufacturing. Let's make sure the yard matches the factory floor."

## Final confidence: Low

Facility was positively relocated and identified, but all yard classification
detail is constrained by construction-era imagery and zero Street View coverage.
The site is still maturing, so gate, dock, and yard-zone calls are best-effort
estimates and the site is flagged for human review / re-audit once newer imagery
is available.
