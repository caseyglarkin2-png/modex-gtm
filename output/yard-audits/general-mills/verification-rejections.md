# General Mills - Facility Verification Rejections

FOV scrub run 2026-06-18 (agent). Each site below failed the verification protocol
(`scripts/yard-audit/verify-facility-prompt.md`): General Mills no longer operates
the exact facility (sold / closed / divested), so it must NOT be imaged, geofenced,
classified, or shipped as a current General Mills truck-yard account.

Total sites in roster: 26. Rejected: 11. Confirmed: 13. Probable (low confidence): 2.

## Rejected sites

- **General Mills - Murfreesboro TN** (site 05, ~2400 Joe B Jackson Pkwy area) — REJECTED:
  yogurt plant transferred to Lactalis in GM's US yogurt-business divestiture; sale
  completed June 2025. Now a Lactalis facility, not GM-operated.
  [Tier 2: https://investors.generalmills.com/press-releases/press-release-details/2025/General-Mills-Completes-Sale-of-U-S--Yogurt-Business-to-Lactalis/default.aspx, 2025-06]

- **General Mills - Vineland NJ** (site 10, 500 W Elmer Rd) — REJECTED: GM closed the
  Progresso soup plant summer 2017 and sold the building to F&S Produce Co. ($4.5M).
  Now F&S Fresh Foods, not GM.
  [Tier 2: https://www.refrigeratedfrozenfood.com/articles/93731-fs-produce-buys-vacant-former-progresso-soup-plant, 2017-10-23]

- **General Mills - New Albany IN** (site 13, 707 Pillsbury Lane) — REJECTED: GM closed
  the Pillsbury plant in 2016; sold to The Sazerac Company June 2018 (now Northwest
  Ordinance Distilling), not GM.
  [Tier 2: https://www.foodbusinessnews.net/articles/12000-former-pillsbury-plant-to-become-distillery, 2018-06-15]

- **General Mills - Reed City MI** (site 14, 128 E Slosson Ave) — REJECTED: Yoplait
  yogurt plant explicitly named in the Lactalis yogurt divestiture; sale completed
  June 30, 2025. Now Lactalis (Midwest Yogurt), not GM.
  [Tier 2: https://www.businesswire.com/news/home/20250630432301/en/General-Mills-Completes-Sale-of-U.S.-Yogurt-Business-to-Lactalis, 2025-06-30]

- **General Mills - Martel OH** (site 15, 4136 Martel Rd) — REJECTED: GM sold the
  bakery-mix plant to The Mennel Milling Company in late 2016 (~$18M). Gate signage
  reads "Mennel", not GM.
  [Tier 2: https://www.bakingbusiness.com/articles/30624-mennel-in-pact-to-acquire-general-mills-bakery-mix-plant, 2016-07-22]

- **General Mills - Carson CA** (site 16, 1375 Beachey Pl) — REJECTED: GM's Yoplait
  yogurt plant, closed by FY2021; equipment auctioned, real estate sold to Reich
  Brothers. Also within the 2025 NA yogurt divestiture. Not GM-operated.
  [Tier 2: https://www.dairyreporter.com/Article/2019/02/20/General-Mills-to-shutter-yogurt-plant-in-California/, 2019-02-20]

- **General Mills - Lodi CA** (site 17, ~2000-2200 W Turner Rd) — REJECTED: GM closed
  the Lodi Cheerios plant (production ended Nov 2015) and sold it Feb 2016 (RRM /
  Bond Manufacturing). Now a multi-tenant industrial property.
  [Tier 2: https://www.lodinews.com/news/article_9f735bb6-01d3-11e6-86f9-7bed71aa97f2.html, 2016-04-13]

- **General Mills - Hazleton PA** (site 19, 2 Chestnut Hill Drive, Humboldt Industrial
  Park) — REJECTED: GM exited Hazleton in 2009 (frozen bread-dough business sold to
  Pennant Foods); GM FY2025 10-K lists no PA facility. Fresh Start Bakeries now at the
  address.
  [Tier 2: https://www.bakingbusiness.com/articles/38748-pennant-foods-to-acquire-pillsbury-frozen-dough-line, 2010-01-08]

- **General Mills - Allentown PA** (site 20, 2132 Downyflake Lane) — REJECTED: GM closed
  its Allentown frozen-waffle plant (2008-09 restructuring); the building is now the
  American Atelier Inc. (AAi) furniture factory.
  [Tier 2: https://www.sec.gov/Archives/edgar/data/0000040704/000089710107001826/genmills073516_8k.htm, 2007-08]

- **General Mills - Federalsburg MD** (site 21, 300 Reliance Ave) — REJECTED: GM divested
  the plant to Kraft Foods in 2010; site now operates as Eastern Shore Forest Products
  (ag/wood processing). Not GM.
  [Tier 2: https://www.foodonline.com/doc/general-mills-divests-0001, 2010-04-29]

- **General Mills - Vinita OK** (site 22, 1157 Doughboy Drive) — REJECTED: GM divested
  the Vinita frozen-dough plant to Pennant Foods in the 2009 Bakeries & Foodservice
  frozen-dough sale (four plants incl. Vinita); building now marketed for sale. Not GM.
  [Tier 2: https://www.reliableplant.com/Read/16450/pennant-foods-to-buy-general-mills-dough-business, 2009-03]

## Probable / low-confidence (ship caveated and capped)

- **General Mills - Chattanooga TN Distribution Center** (site 25, 650 Wauhatchie Pike) —
  PROBABLE, low confidence: no Tier-1 (no GM locator/careers req for this DC) and no
  Tier-2 negative; only Tier-3 directory presence (current Feb 2026). Operator unproven.

- **General Mills - Fontana CA Distribution Center** (site 26, 11618 Mulberry Ave) —
  PROBABLE, low confidence: no Tier-1, no Tier-2 negative; current directory presence
  (May 2026) plus a known food-grade 3PL footprint in Fontana suggest a likely
  3PL-operated GM DC. Operator/tenancy inferred, not proven.

## Confirmed sites (13)

Cedar Rapids IA (Wenig Rd = geocode dup of Edgewood Rd cereal plant), Cedar Rapids IA
(Edgewood Rd), Buffalo NY, Wellston OH (Totino's), Covington GA, Hannibal MO, Belvidere
IL DC, Richmond IN (Blue Buffalo), Cincinnati/Sharonville OH, Milwaukee WI (Chex
Mix/Bugles/Gardetto's), Albuquerque NM, Great Falls MT (flour mill), Fridley MN
(oat/flour mill). All carry >=1 Tier-1 citation in their site JSON `verification` block.

### Notes for the roster
- **Cedar Rapids duplicate:** roster idx1 ("1000 Wenig Rd NE") is a geocode error onto
  the Cedar Rapids wastewater plant; the real (and only) GM Cedar Rapids site is the
  Edgewood Rd SW cereal plant (idx2). idx1 and idx2 are the same facility - do not
  double-count.
- **Hannibal MO cleared the late-2025 MO restructuring flag:** GM's three closed
  Missouri-region plants were St. Charles (pizza crust) and two Joplin pet-food sites,
  NOT Hannibal, which was expanded Nov 2024 (new Old El Paso taco line).
