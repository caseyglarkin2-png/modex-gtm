# Deep-Audit Dossier — idx 22

## Nabisco Houston Sales Distribution Center — Houston, TX

**Status: COULD NOT RESOLVE — confidence LOW**

### Step 0 — Location attempt
The roster supplied only an APPROXIMATE city-level coordinate
(`29.7604, -95.3698`). That point is the **downtown Houston skyscraper core**,
not an industrial property.

A genuine resolution effort was made:
- **Mondelez official office-locations page** — no Houston sales-distribution
  address listed.
- **Job portals** (Indeed, ZipRecruiter, Mondelez careers) — only Nabisco
  *merchandiser* / sales-rep postings tagged to "Houston, TX," no warehouse
  street address.
- **Dun & Bradstreet** — a "Mondelez Global LLC" Houston profile exists but the
  directory page exposed no street address.
- **News / archives** — the historic Houston Nabisco bakery
  (**2450 Holcombe Blvd**, the "National Biscuit Company Building") was
  **shuttered in 1999 and converted to residential lofts** — it is not this
  facility and not an active Mondelez site.
- The only current Mondelez/Nabisco Texas facility with a published address is
  **1001 Assembly Cir, Schertz, TX** (San Antonio metro), a separate site.

### Step 1-5 — Audit
Not performed. No located building. The satellite probe at the supplied
coordinate (zoom 16) shows the downtown Houston skyscraper core — confirming
the roster point is a city centroid, not a facility pin.

### Assessment
Most plausibly a **small Nabisco merchandiser sales depot** serving Gulf Coast
retail merchandising teams — typically a leased unit in a multi-tenant
industrial park, not publicly advertised by address — rather than a large
freight DC.

### Output
The `.json` is written under the "cannot locate" clause: `confidence: "low"`,
all 22 classification fields in `uncertainFields`, geofences `null`,
`yardMetrics` zeroed. Classification values are unverified placeholders.

### Recommendation
**FLAG FOR HUMAN REVIEW.** A human-supplied street address is required before a
real yard audit can be done.

- **Gate verdict:** unknown — facility not located.
- **Guard-shack verdict:** unknown — facility not located.
- **Confidence:** low.
