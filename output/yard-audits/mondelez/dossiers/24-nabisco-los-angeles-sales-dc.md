# Deep-Audit Dossier — idx 24

## Nabisco Los Angeles Sales Distribution Center — Los Angeles, CA

**Status: COULD NOT RESOLVE — confidence LOW**

### Step 0 — Location attempt
The roster supplied only an APPROXIMATE city-level coordinate
(`34.0522, -118.2437`). That point is the **downtown Los Angeles civic core**
(Civic Center / skyscraper district), not an industrial property.

A genuine resolution effort was made:
- **Mondelez official office-locations page** — no Los Angeles
  sales-distribution address listed.
- **Job portals** (Indeed, ZipRecruiter) — only Nabisco merchandiser postings
  tagged to "Los Angeles, CA," no warehouse street address.
- **LA-area industrial real-estate sources** — general references to industrial
  submarkets (Vernon, Commerce, City of Industry) but no Nabisco/Mondelez
  tenant at a specific address.
- **News / SEC filings** — nothing identifying an LA distribution-center
  address.

### Step 1-5 — Audit
Not performed. No located building. The satellite probe at the supplied
coordinate (zoom 16) shows the downtown LA civic core — confirming the roster
point is a city centroid, not a facility pin.

### Assessment
Most plausibly a **small Nabisco merchandiser sales depot** serving Southern
California retail merchandising teams — likely a leased unit in one of the LA
industrial submarkets (Vernon / Commerce / City of Industry), but the specific
building could not be confirmed.

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
