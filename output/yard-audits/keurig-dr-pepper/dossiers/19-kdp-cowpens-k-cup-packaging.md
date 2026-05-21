# Deep-Audit Dossier — idx 19

## KDP Cowpens K-Cup Packaging — Cowpens, SC

**Roster address:** "Cowpens, SC 29330" (no street address — flagged for deep-audit)
**Resolved facility:** UNRESOLVED — no KDP facility found in Cowpens
**Supplied geocode:** 35.016998, -81.804141 (Cowpens town center)
**Type:** Manufacturing — Coffee/K-Cup Packaging
**Confidence:** Low — facility could not be located

---

## Step 0 — Attempt to locate the facility

The roster entry for idx 19 carries no street address and is explicitly
flagged: "Dossier-named (Cowpens SC K-Cup packaging). Specific street address
not located - flag for deep-audit."

**Satellite check:** The supplied geocode (35.016998,-81.804141) is the
center of downtown Cowpens — a small-town commercial main street with no
industrial / manufacturing / distribution building. Probes of the
surrounding industrial sites (the Mt Olive Rd corridor — Upstate Corporate
Park, Spartanburg East Logistics Park, Bericap closures plant, a Dollar Tree
distribution center) found large warehouses but none with KDP / Keurig
branding.

**Web research:** Extensive searching found NO documented KDP or Keurig
K-Cup / coffee facility in Cowpens, SC. Every KDP coffee-roasting and
K-Cup-packaging operation in South Carolina is consistently attributed to the
**Moore facility** in Spartanburg County (6135 Anderson Mill Rd, Tyger River
Industrial Park, Moore SC). Sources: SC Governor's office, SC Dept of
Commerce, Food Manufacturing, Food Business News, KDP careers site — all
place K-Cup roasting/packaging in Moore. That Moore facility is roster
**idx 1**, whose own source note calls it the "dossier-named major K-Cup hub."

## Assessment

This entry (idx 19) appears to be a **duplicate / misattribution of the Moore
K-Cup hub** (idx 1):
- No KDP presence in Cowpens is documented anywhere.
- Cowpens is a very small town — total manufacturing employment is roughly
  222 people across ALL employers (Data USA) — implausible for a significant
  standalone KDP K-Cup packaging plant.
- No KDP signage or branding visible on any Cowpens-area industrial building
  in satellite imagery.

It is possible KDP leases undocumented packaging space inside one of the
Cowpens-area logistics warehouses, but this could not be confirmed from
satellite imagery, Street View, or any public source.

## Output

Per the deep-audit protocol for an unlocatable facility:
- `.json` written with `confidence: "low"`.
- All 22 classification fields listed in `uncertainFields`.
- `yardMetrics` zeroed; `perimeter` is a nominal placeholder box around the
  Cowpens town-center geocode and does NOT represent an identified facility.

## Recommendation

Treat idx 19 as a roster error / unresolved. If a Cowpens KDP operation truly
exists it requires human verification (e.g. direct contact with KDP or
Spartanburg/Cherokee County economic development). Most likely it is the same
facility as roster idx 1 (Moore SC K-Cup hub).

## Final confidence: Low (facility unresolved)
