# Kenco Logistics Services — FOV verification rejections

Account is a contract-logistics 3PL (HQ Chattanooga TN; kencogroup.com). Verified per
`scripts/yard-audit/verify-facility-prompt.md`, pack-direct against
`public/demo-packs/kenco-logistics-services.json` → `network.sites[]`.

Run: 2026-06-19, agent FOV scrub.
Result: 30 sites verified — **22 confirmed, 2 probable (capped), 6 rejected.**

## Rejected sites (do NOT image / geofence / classify; remove + recompute totals)

- **02-kenco-mcs-mississippi** — Kenco MCS Mississippi (Olive Branch MS, 11244 S Distribution Cove) — REJECTED: the exact audited address ("Olive Branch Distribution Center II", 181,349 SF — not the ~800,000 SF the pack claims) is currently marketed **for lease / immediate availability with no tenant named and no Kenco tie**. Kenco's actual Olive Branch listing is at a different address (10425 Ridgewood Dr). Wrong building / vacant. [Tier 2: https://www.colliers.com/en/properties/olive-branch-distribution-center-ii/usa-11244-s-distribution-cove-olive-branch-ms-38654-usa/usa1116123, 2026-06]

- **08-kenco-mcs-georgia-i** — Kenco MCS Georgia I (Austell GA 30168) — REJECTED: facility never positively located. Roster supplied only city/zip (geocode landed on apartments). Kenco self-lists an address-less "MCS - Georgia I" page and hires in Lithia Springs GA, so a Kenco-operated Atlanta building very likely exists, but no public source pins the EXACT building; the probed candidate 7875 White Rd SW is a DIFFERENT operator (Atlanta Bonded Warehouse). No positive found after genuine search. [Tier 1: https://kencogroup.com/kenco_locations/mcs-georgia/, 2024-02 — exists but no street address]

- **09-kenco-mcs-georgia-ii** — Kenco MCS Georgia II (Austell GA 30168) — REJECTED: second building of the same unlocated Austell campus as Georgia I; Kenco's site references a distinct "mcs-georgia-ii" page but with no street address; exact building unresolved. No positive found. [Tier 1: https://kencogroup.com/kenco_locations/mcs-georgia/, 2024-02]

- **21-kenco-mead-johnson-dc-mount-vernon-in** — Kenco Mead Johnson DC (3101 Highway 62 East, Mount Vernon IN) — REJECTED: DESTROYED. An EF-3 tornado (140 mph) struck the Kenco/Mead Johnson DC on **9 Jul 2024**, collapsing the building; Reckitt/Mead Johnson's own release states it is non-operational with deliveries diverted, and 2025-26 imagery shows it razed to a bare slab. Non-operational. [Tier 2: https://www.reckitt.com/media-landing/press-releases/2024/mead-johnson-nutrition-tornado-damage-to-mount-vernon-indiana-warehouse/, 2024-07; NWS/news: https://www.wevv.com/news/indiana/ef-3-tornado-damage-confirmed-at-kenco-facility-in-mt-vernon/article_3db878f8-3efa-11ef-bf7c-f7b311af7a39.html, 2024-07]

- **25-kenco-the-shippers-group-wilmer-tx** — Kenco / The Shippers Group (500 S Millers Ferry Road, Wilmer TX) — REJECTED: wrong building. The pack conflated two separate Wilmer warehouses. TSG/Kenco's real Wilmer facility is **201 Sunridge Blvd** (822,000 SF — the very figure the pack cites); the audited **500 S Millers Ferry Rd is a separately-listed Whirlpool Distribution Center** with no source confirming TSG/Kenco operates that exact building. Exact-address operation unproven. SALVAGEABLE by re-pointing this site to 201 Sunridge Blvd and re-auditing. [Tier 1: https://www.theshippersgroup.com/links/2211-wilmer-texas-best-warehouse-3pl-4pl/resources/4648-wilmer-texas-best-warehouse-3pl-4pl, 2026-06]

- **30-kenco-memphis-dc** — Kenco Memphis DC (3346 Democrat Drive, Memphis TN) — REJECTED: identity mismatch / name collision. The address is the HQ of **KenCo Distributors Inc**, an unrelated Nashville-based building-materials wholesaler (drywall/insulation/steel/flooring), NOT Kenco Logistics Services / Kenco Group the 3PL. Kenco Group's own warehousing map lists no Memphis facility. Address resolves to a different company. [Tier 1: https://kencodistributors.com/, 2026-06; https://kencogroup.com/warehousing-map/, 2026-06]

## Probable (capped, low-confidence — kept, flag for human review)

- **16-kenco-mcs-chattanooga-ch29** — internal Kenco building code with no public address-to-code mapping; specific building can't be pinned, but Kenco demonstrably still operates the Enterprise Park Dr cluster (the 2022 $67.1M portfolio sale was a Kenco-affiliate JDK→Northstar **sale-leaseback**, not an exit; 100+ active Chattanooga reqs). Probable on building identity.

- **18-kenco-mcs-chattanooga-bp2** — 6301 Enterprise Park Dr (210,000 SF / 12+ acres, "KENCO BP II") exactly matches BP2 and was the same sale-leaseback, not a Kenco exit; capped because a Tier-3 Yelp "CLOSED" tag (Oct 2025) at 6301 is a genuine (if non-overruling) aggregator ambiguity. No Tier-2 press of a Kenco vacate.

## Notes
- No bankruptcy-era exposure anywhere (Kenco had no major restructuring). `checkedBankruptcyEra: false` on all sites.
- The 2022 Chattanooga $67.1M, 7-warehouse portfolio sale was a real-estate **sale-leaseback** by Kenco-affiliate JDK Real Estate (Kennedy family, owners of Kenco) to passive investor Northstar — Kenco stayed the operator under lease, so it is NOT a rejection of the Chattanooga sites (17 confirmed at 6170; 16/18 probable on building identity).
- Site 28 (Grand Prairie) confirmed but carries a 3845-vs-3953 Grand Lakes Way suite ambiguity to verify for the geofence.
- All non-rejected sites carry >=1 real citation. No fabricated URLs.
