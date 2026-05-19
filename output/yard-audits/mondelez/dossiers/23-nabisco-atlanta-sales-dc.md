# Deep-Audit Dossier — idx 23

## Nabisco Atlanta Sales Distribution Center — Atlanta, GA

**Status: COULD NOT RESOLVE — confidence LOW**

### Step 0 — Location attempt
The roster supplied only an APPROXIMATE city-level coordinate
(`33.7490, -84.3880`). That point is the **downtown Atlanta civic core**
(Centennial Olympic Park area), not an industrial property.

A genuine resolution effort was made:
- **Mondelez official office-locations page** — no Atlanta sales-distribution
  address listed.
- **Job portals** (Indeed, ZipRecruiter) — only Nabisco merchandiser / sales
  postings tagged to metro Atlanta, no warehouse street address.
- **News / archives** — the historic SW Atlanta Nabisco bakery
  (**1400 Murphy Ave SW**) was **shuttered in 2021 and sold to Prologis** for
  industrial redevelopment. It is not this facility and not an active Mondelez
  site.
- The **Nabisco Norcross Distribution Center** (roster idx 9, ~6300 Brook
  Hollow Pkwy, Norcross GA) is a separate, already-audited site in the same
  metro.

### Step 1-5 — Audit
Not performed. No located building. The satellite probe at the supplied
coordinate (zoom 16) shows the downtown Atlanta civic core — confirming the
roster point is a city centroid, not a facility pin.

### Assessment
Most plausibly a **small Nabisco merchandiser sales depot** serving
metro-Atlanta retail merchandising teams. **Duplicate risk:** this entry may
overlap with roster idx 9 (Norcross DC) — if they are the same physical
facility, idx 23 should be dropped as a duplicate. Human review needed to
confirm whether a distinct Atlanta-proper sales depot exists separate from
Norcross.

### Output
The `.json` is written under the "cannot locate" clause: `confidence: "low"`,
all 22 classification fields in `uncertainFields`, geofences `null`,
`yardMetrics` zeroed. Classification values are unverified placeholders.

### Recommendation
**FLAG FOR HUMAN REVIEW** — and check against idx 9 for duplication. A
human-supplied street address is required before a real yard audit can be done.

- **Gate verdict:** unknown — facility not located.
- **Guard-shack verdict:** unknown — facility not located.
- **Confidence:** low.
