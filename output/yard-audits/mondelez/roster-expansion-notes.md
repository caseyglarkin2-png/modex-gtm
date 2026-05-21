# Mondelez International — Roster Expansion Notes

**Date:** 2026-05-18
**Run:** YardFlow yard-audit roster rebuild for the Mondelez account
**Result:** 24 total facilities (10 existing idx 1-10, unchanged + 14 new idx 11-24)

---

## Summary

The original roster (`roster.json`, generatedAt 2026-05-17) carried 10 audited
sites. This rebuild kept those 10 exactly as-is and appended 14 newly-identified
U.S. facilities — both manufacturing plants and distribution / sales / R&D
sites — across Mondelez and its acquired brands.

**Total: 10 existing + 14 new = 24 facilities.**

---

## New-site count by brand / category (idx 11-24)

| Brand / category | New sites | idx |
|------------------|-----------|-----|
| Clif Bar (acquired 2022) | 1 | 11 |
| Tate's Bake Shop (acquired 2018) | 1 | 12 |
| Mondelez/Nabisco — manufacturing input (flour mill) | 1 | 13 |
| Mondelez/Nabisco — distribution & sales centers | 7 | 14, 15, 19, 20, 21, 22, 23, 24 (note: 8 rows — see below) |
| Mondelez — corporate HQ / regional office | 2 | 16, 18 |
| Mondelez — R&D / global innovation center | 1 | 17 |

Corrected category breakdown of the 14 new sites:

- **Manufacturing plants — 3:** Clif Bar Twin Falls ID (11), Tate's Bake Shop
  Shirley NY production+warehouse (12), Toledo OH flour mill (13).
- **Distribution / sales centers — 8:** Tatamy PA (14), Aurora IL DHL/Exel DC
  (15), Allentown PA (19), Memphis TN (20), Garland/Dallas TX (21), Houston TX
  (22), Atlanta GA (23), Los Angeles CA (24).
- **Corporate / R&D — 3:** East Hanover NJ North America HQ (16), Whippany NJ
  Global R&D Innovation Center (17), Chicago IL global HQ (18).

By acquired brand specifically: **Clif Bar +1, Tate's Bake Shop +1.** The
remaining 12 new sites are legacy Mondelez/Nabisco infrastructure (plants,
distribution, corporate, R&D).

---

## Confidence notes

**High confidence (verified street address):**
- idx 15 Aurora IL DC — 2380 Sullivan Rd (DHL/Exel-operated Mondelez/Kraft DC).
- idx 16 East Hanover NJ — 100 Deforest Ave (Mondelez NA HQ).
- idx 18 Chicago IL — 905 W Fulton Market (global HQ).

**Medium confidence (facility confirmed, city-level location, address not
officially published):**
- idx 11 Clif Bar Twin Falls ID — ~300,000 sq ft plant confirmed Mondelez-owned
  (acquired in the June 2022 $2.9B Clif Bar deal). Coordinate placed on the
  Pole Line Rd corridor near the Chobani plant; street number not officially
  published.
- idx 12 Tate's Bake Shop Shirley NY — newly built warehouse & distribution
  development that Mondelez moved Tate's into in Dec 2023; city-level only.
- idx 13 Toledo OH flour mill — listed on Mondelez's official US office-locations
  page; no street address published.
- idx 14 Tatamy PA — ~100,300 sq ft Becknell build-to-suit Nabisco DC; confirmed
  via Mondelez's own hourly-jobs portal; street address not published.
- idx 17 Whippany NJ R&D center — ~150,000 sq ft, opened May 2023 off Route 10
  in a former Cadbury R&D building; exact street number not published.
- idx 19-24 Allentown PA / Memphis TN / Garland TX / Houston TX / Atlanta GA /
  Los Angeles CA — Mondelez/Nabisco sales-distribution presence appears in the
  Mondelez office-location directory and recruiting listings. These are
  regional DSD sales-distribution hubs; city-level coordinates only.

---

## Facilities found but NOT pinnable to a usable address/coordinate (excluded)

The following were identified in research but left OFF the roster because either
they are closed, no longer Mondelez-owned, located outside the U.S., or could
not be confirmed as a discrete physical facility:

- **Nabisco Fair Lawn, NJ bakery — CLOSED.** 63-year-old biscuit plant; produced
  Teddy Grahams / Lorna Doones; production ended July 2021, site sold for
  warehouse redevelopment. Excluded (closed).
- **Nabisco Atlanta bakery (1400 Murphy Ave), GA — CLOSED.** ~80-year-old plant,
  Mondelez's oldest U.S. bakery; closed early 2021, ~400 jobs eliminated; 32-acre
  site bought by Prologis. Excluded (closed). (Note: a separate metro-Atlanta
  *sales-distribution* presence is captured as idx 23.)
- **Enjoy Life Foods plant, Jeffersonville, IN — CLOSED.** 200,000 sq ft
  dedicated allergy-friendly bakery, opened 2016; Mondelez closed it in 2023 and
  narrowed the Enjoy Life portfolio. Excluded (closed). Enjoy Life products are
  now made via co-manufacturers — no Mondelez-owned plant remains for the brand.
- **Salinas, Mexico biscuit plant — NON-U.S.** Four "Lines of the Future" making
  Oreo/Ritz/Grahams; absorbed production moved from the Chicago and Philadelphia
  plants. Outside U.S. scope — excluded.
- **Give & Go Prepared Foods plants — primarily NON-U.S. / unconfirmed.** Give &
  Go (majority-acquired by Mondelez 2020) runs ~11 North American facilities, but
  the confirmable plants are Canadian (Etobicoke, Brampton, Vaughan, ON). No
  Mondelez-owned Give & Go *manufacturing plant* in the U.S. could be pinned to a
  city/address with confidence. Excluded pending better sourcing.
- **Tribeca Oven, Carlstadt, NJ (447 Gotham Pkwy).** An artisan-bread bakery once
  associated with the Give & Go orbit; research indicates Tribeca Oven is now a
  C.H. Guenther brand, i.e. NOT a Mondelez facility. Excluded (not Mondelez).
- **Hu Kitchen chocolate (acquired 2021).** Hu's chocolate is made by an
  undisclosed co-manufacturer; no Mondelez-owned Hu plant exists. No site to add.
- **Gum & candy (Sour Patch Kids, Swedish Fish, Halls, etc.).** Mondelez divested
  the global gum business (Trident, Dentyne, Chiclets, Bubblicious) to Perfetti
  Van Melle in Oct 2023. Of the retained candy lines, Sour Patch Kids / Swedish
  Fish are made at Mondelez's Hamilton, ONTARIO plant (non-U.S.). No confirmable
  U.S.-owned Mondelez gum/candy manufacturing plant was found. Excluded.
- **Ricolino (acquired 2022 from Grupo Bimbo).** Ricolino's confectionery
  manufacturing is in Mexico — non-U.S. No U.S. plant to add.
- **Newburgh, NY former DC.** Mondelez previously ran a Newburgh-area warehouse;
  it was superseded by the Montgomery NY DC (idx 8). Excluded (consolidated /
  former).

---

## Method / sources

In-repo sources reviewed: `roster.json`, `roster.raw.json`,
`docs/research/claudio-parrotta-mondelez-dossier.md`,
`tmp/notebooklm-sources/mondelez-international.txt`,
`src/lib/microsites/accounts/mondelez-international.ts`,
`docs/research/facility-count-workbench.{csv,md}` (no Mondelez rows present),
`src/lib/data/accounts.json` and `facility-facts.json` (no Mondelez rows).

Web research: Mondelez official US and office-locations pages; Mondelez IR
press releases; Wikipedia (Nabisco, Mondelez, Tate's Bake Shop); BoiseDev /
Magic Valley / Twin Falls Chamber / Idaho State Journal (Clif Bar Twin Falls);
Long Island Business News (Tate's Shirley); Becknell Industrial + Mondelez
hourly-jobs portal (Tatamy PA DC); Real Estate NJ / NJBIZ / Morris County
(Whippany R&D); Kenco Group (Sandston VA DC); Food Dive / Food Business News
(Enjoy Life Jeffersonville closure); WSWS / Food Manufacturing (2021 BCTGM
strike facility coverage); Indeed / Monster / ZipRecruiter Mondelez location
directories (regional DSD sales-distribution hubs).
