# Toyota — Facility Verification Rejections

FOV scrub run 2026-06-18 (agent). Verified all 17 sites in `sites/*.json` against the
Step -1 protocol (divestiture/closure/under-construction gauntlet + Tier-1 positive
current-operation source + freight-yard sanity). Toyota did NOT go through a major
bankruptcy restructuring, so the GM/Chrysler-2009-style bankruptcy-era query is N/A
(`checkedBankruptcyEra: false` on every site).

## Rejections

**None.** Zero sites rejected. No divestitures, closures, idlings, WARN shutdowns,
re-signings, or different-operator hits surfaced for any of the 17 facilities.

## Critical watch item — CLEARED (not rejected)

- **Toyota Battery Manufacturing North Carolina (TBMNC) — Liberty NC** (`07-liberty-nc-battery.json`).
  Watch-note flagged a risk it was mapped while UNDER CONSTRUCTION. Verified the opposite:
  Toyota's own newsroom confirms the plant POWERED ON and began shipping HEV batteries in
  **June 2025**, with four hybrid (HEV) production lines operational and first products
  (Corolla Cross / Camry / RAV4 hybrid batteries) shipping to Toyota plants in AL and KY.
  It is producing/shipping product at scale, so verdict = **confirmed** for HEV operations.
  Caveat: BEV/PHEV phases are still ramping and parts of the megasite remain under
  construction (site fieldNotes already capture this; classification values are flagged
  uncertain). The existing yard model is construction-era and should be re-audited as the
  site matures.
  - [Tier 1: https://pressroom.toyota.com/facility/toyota-battery-manufacturing-north-carolina/, 2025-06]
  - [Tier 1: https://global.toyota/en/newsroom/corporate/42193203.html, 2025-06]

## Low-confidence flag (probable, shipped caveated)

- **Toyota Parts Distribution Center — Mansfield MA** (`17-mansfield-pdc.json`), the
  Boston PDC at 440 Forbes Blvd. No clean Tier-1 self-attested Toyota locator was found.
  Multiple current corroborating sources agree the facility operates (Tri-Town Chamber of
  Commerce member listing 2025; current locator listings) and NO closure/relocation signal
  exists. Verdict = **probable**, `tenancy: unknown`. Ships caveated / lower confidence;
  upgrade to confirmed if a Toyota-domain Tier-1 source is later found.
  - [Tier 3 corroboration: https://tri-townchamber.org/list/member/toyota-motor-sales-boston-pdc-1379, 2025]

## Note on a partial-layoff false-positive (NOT a rejection)

- **TABC Inc — Long Beach CA** (`11-long-beach-ca.json`) surfaced a 2015 layoff in the
  gauntlet. Investigated: it was a deliberate shift from vehicle assembly to parts
  production (stamping/welding/catalytic converters), NOT a closure. The plant received a
  fresh $27M investment in 2022 and operates with ~350 staff. Verdict = **confirmed**.
