# Deep-Audit Dossier — idx 28

## Liberty Coca-Cola Beverages — Maspeth Production Plant, NY

**Roster address:** 5612 56th Rd, Maspeth, NY 11378 (imprecise)
**Resolved address:** 58-40 Borden Ave, Maspeth, NY 11378 (Liberty Coca-Cola
Sales/Distribution Center)
**Best-estimate center:** 40.7212, -73.9145 (NOT precisely confirmed)
**Confidence:** low — roster entry is obsolete/misclassified

### Status — production plant no longer exists

The roster lists this as a "Bottling / Manufacturing Plant," but research shows
the Coca-Cola Maspeth **production/bottling plant no longer exists**:

- The original Maspeth bottling plant was at **59-02 Borden Ave** — a 202,000
  sq ft warehouse on a **7.3-acre site**, the largest Coke facility in the NY
  area and the regional Dasani producer.
- In **2017 the site was sold to Home Depot for $63M**. Coca-Cola's
  triple-net lease ended **March 2020**, and the site became a **Home Depot
  store** (Home Depot Maspeth is at 59-15 Maurice Ave).
- Liberty Coca-Cola Beverages' current Maspeth presence is a **Sales /
  Distribution Center at 58-40 Borden Ave** (Block 2657, Lot 23 — a "fireproof
  warehouse"), which **Liberty Coca-Cola purchased in October 2017** for
  ~$10.4M from Coca-Cola Refreshments USA.
- Liberty Coca-Cola's actual production facilities are in **Philadelphia PA,
  Moorestown NJ, and Elmsford NY** — not Maspeth.

So the Maspeth facility is a distribution center, not a production plant.

### Step 0 — Location resolution

- Roster coords (40.726817, -73.923183) point to a **UPS facility** — the
  wrong building (UPS signage clearly visible in Street View).
- The correct Liberty Coca-Cola Maspeth address is **58-40 Borden Ave**,
  adjacent to the Home Depot at the former Coca-Cola bottling site, near the
  Borden Ave / Maurice Ave intersection in Maspeth, Queens.
- Satellite/Street View probing of the Borden Ave corridor located the large
  former Coca-Cola complex building (part now Home Depot, with rooftop solar on
  the east portion). The **Liberty Coca-Cola distribution portion (58-40
  Borden Ave) could not be cleanly separated** from the co-located Home Depot
  footprint in imagery, and no current Coca-Cola signage was resolvable.

### Key views

The roster coordinates land on a UPS building. The Borden Ave / Maurice Ave
area shows the large former Coca-Cola complex (now partly Home Depot) plus
multi-story brick warehouses along Borden Ave. No single building could be
confirmed as the Liberty Coca-Cola distribution warehouse with adequate
confidence.

### Gate / guard-shack / dock determinations

Not determinable. All physical-layout classification flags left `false`/`null`
and listed in `uncertainFields` because the specific Liberty Coca-Cola
distribution building footprint, its truck gate, docks, and yard could not be
unambiguously isolated from the co-located Home Depot.

### Yard zones and counts

Not measurable. `perimeter` is an estimate based on the ~7.3-acre former
Coca-Cola parcel; the Liberty Coca-Cola distribution portion is a subset.
`yardMetrics` set to 0 / defaults.

### Web findings

- QNS / The Real Deal / Sunnyside Post: Home Depot bought the 59-02 Borden Ave
  Coca-Cola bottling site (7.3 acres, $63M, 2017); lease ended March 2020.
- QueensBeans: "Liberty 58-40 Borden Avenue LLC buys 5840 Borden Avenue from
  Coca-Cola Refreshments USA for $10,380,669" (Oct 2017).
- Liberty Coca-Cola locations: production in Philadelphia, Moorestown NJ,
  Elmsford NY; Maspeth listed as a sales/distribution center.

### Final confidence: low

The roster entry is obsolete: the Maspeth production plant closed and became a
Home Depot. Liberty Coca-Cola's current Maspeth facility is a sales/distribution
center at 58-40 Borden Ave, whose precise building footprint could not be
isolated from the adjacent Home Depot in imagery. **Recommend reclassifying the
roster entry and re-auditing 58-40 Borden Ave once its exact footprint is
confirmed.**
