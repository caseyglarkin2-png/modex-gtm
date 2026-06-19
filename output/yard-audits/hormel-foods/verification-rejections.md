# Hormel Foods — Facility Verification Rejections

FOV scrub run 2026-06-18. 27 sites checked: 25 confirmed, 2 rejected.
Every confirmed site carries a `verification` block with >=1 real Tier-1/Tier-2 citation
(mostly Hormel's own `hormelfoods.com` "Our Locations" pages plus dated PR / active careers
reqs / SEC 10-K subsidiary listings). Divestiture/closure gauntlet run for all.
Hormel never went through a major bankruptcy restructuring, so `checkedBankruptcyEra: false`
on every site (not applicable).

## Rejected sites

- **Columbus Craft Meats (Hayward, CA — 30977 San Antonio St, coord 37.6133,-122.0526)** —
  REJECTED: This is the Hayward Columbus Craft Meats plant Hormel **announced for closure
  (March 2026)** under Transform & Modernize; a state WARN notice covers ~125 affected.
  The audit JSON labeled the site "30977 San Clemente St" and asserted it was the *surviving*
  Hayward plant, but that label was a bad OSM geocode: every authoritative source
  (Hanford Sentinel, the WARN coverage, D&B, BBB, Yelp, Manta, Yellow Pages) places Columbus
  Manufacturing at **30977 San Antonio St** — the closing plant. A directory listing for
  30977 San Antonio St already reads "COLUMBUS DISTRIBUTING - CLOSED." The genuinely surviving
  second Hayward plant is a *different, unidentified* address, not this coordinate.
  [Tier 2: https://hanfordsentinel.com/business/agriculture/bay-area-salami-plant-closing-after-more-than-100-years-john-lindt/article_ef1d5ee4-d84f-11ef-8d3c-9ba24ac37ee5.html , 2025-01]
  [Tier 2: https://www.yelp.com/biz/columbus-distributing-hayward , 2025-06]

- **Jennie-O Turkey Store (Melrose, MN — coord 45.6763,-94.7942, audit flagged LOW-CONFIDENCE)** —
  REJECTED: Hormel **divested its Melrose whole-bird turkey facility** (plus the Swanville feed
  mill) to Life-Science Innovations — definitive agreement Feb 17, 2026; **sale completed
  April 24, 2026**. The Melrose plant now operates as "Legacy Turkey" under LSI and is no longer
  a Hormel facility. This also resolves the audit's own misidentification flag (the large nearby
  plant at ~45.6705,-94.800 was positively identified by Street View signage as a Land O'Lakes
  plant, not Jennie-O). There is no Hormel/Jennie-O-operated turkey plant in Melrose today.
  Note: only the Melrose whole-bird plant + Swanville feed mill were sold; Hormel retained the
  Jennie-O brand and all value-added facilities, so Willmar (#24) and Barron (#26) remain valid.
  [Tier 1: https://www.hormelfoods.com/newsroom/press-releases/hormel-foods-announces-definitive-agreement-to-sell-its-whole-bird-turkey-business-to-life-science-innovations/ , 2026-02]
  [Tier 2: https://www.provisioneronline.com/articles/120524-hormel-foods-completes-sale-of-whole-bird-turkey-business-to-life-science-innovations , 2026-04]

## Notes on confirmed sites that surfaced events (kept, not rejected)

- **Atlanta Plant (Tucker, GA)** — Aug 2025 layoff of 135 was a single bacon-line discontinuation;
  Hormel's own statement says "the facility will continue operating" (400 employees, still making
  chili and Dinty Moore stew). Confirmed.
- **Skippy Foods (Little Rock, AR)** — Sept 2025 fire was temporary; Dec 2025 press confirms the
  plant is operational again at full capacity. Confirmed.
- **Jennie-O Barron (WI)** — Hormel ended live turkey harvest at Barron in 2024 but converted the
  plant to value-added processing (no layoffs); active 2025-2026 Hormel/Jennie-O job postings. Confirmed.
- **Suffolk Plant (VA)** — recovered from a temporary 2024 food-safety production halt; active
  Oct 2025 careers reqs at 245 Culloden St. Confirmed.
- **Southaven DC (MS)** — Hormel's largest DC, opened Oct 2025, operated by DHL Supply Chain;
  tagged `operator: "3PL"`, `tenancy: "leased"`. Confirmed.
