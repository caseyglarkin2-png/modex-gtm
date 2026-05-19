# Deep-Audit Dossier — idx 21

## Nabisco Dallas/Garland Sales Distribution Center — Garland, TX

**Status: COULD NOT RESOLVE — confidence LOW**

### Step 0 — Location attempt
The roster supplied only an APPROXIMATE city-level coordinate
(`32.9126, -96.6389`). That point is the **downtown Garland civic/retail core**
(City Hall / DART rail station area), not an industrial property.

A genuine resolution effort was made:
- **Mondelez official office-locations page** — lists only its bakeries and
  the Toledo flour mill; no Texas sales-distribution address.
- **Job portals** (Indeed, ZipRecruiter, Monster, Mondelez Workday / hourly-jobs
  portal) — return only **part-time Nabisco *merchandiser*** postings tagged to
  "Garland, TX." These are retail shelf-stocking roles; the listing explicitly
  only requires the applicant to live "within 25 miles range from the primary
  location Garland, TX." No warehouse street address is given.
- **Dallas-metro industrial real-estate listings** (Forest Lane corridor, etc.)
  — no Mondelez/Nabisco tenant identified.
- **News / business directories** — the only Texas Mondelez/Nabisco facility
  with a published address is **1001 Assembly Cir, Schertz, TX** (San Antonio
  metro, not Dallas/Garland), which is a separate site.

### Step 1-5 — Audit
Not performed. With no located building, no satellite/Street-View audit of
docks, gates, or yard could be carried out. The satellite probe at the supplied
coordinate (zoom 16) shows a downtown core — confirming the roster point is a
city centroid, not a facility pin.

### Assessment
This "sales distribution center" is most plausibly a **small Nabisco merchandiser
sales depot** — a hub from which part-time merchandisers collect product before
servicing retail accounts — rather than a large freight DC with a dock bank and
drop yard. Such depots are typically leased units in multi-tenant industrial
parks and are not publicly advertised by street address.

### Output
The `.json` is written under the deep-audit-prompt "cannot locate" clause:
`confidence: "low"`, all 22 classification fields listed in `uncertainFields`,
geofences `null`, `yardMetrics` zeroed. The classification values are
unverified placeholders, not observations.

### Recommendation
**FLAG FOR HUMAN REVIEW.** A human-supplied street address (from Mondelez sales
ops, a freight/EDI record, or a vendor contact) is required before a real yard
audit can be done.

- **Gate verdict:** unknown — facility not located.
- **Guard-shack verdict:** unknown — facility not located.
- **Confidence:** low.
