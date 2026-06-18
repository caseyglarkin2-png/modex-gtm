# Georgia-Pacific — Facility Verification Rejections

FOV scrub run 2026-06-18 (agent). 30 sites verified: 29 confirmed, 1 rejected.
Each non-rejected site carries a `verification` block with >=1 real citation; the
divestiture/closure gauntlet was run on every site.

## Rejected (1)

- **GP Memphis Cellulose Mill** (Memphis, TN; 100 N B St) — REJECTED: Georgia-Pacific
  announced the **permanent closure** of the Memphis Cellulose mill and the adjacent
  Memphis Technology & Innovation Center on 2025-10-16; ~152 jobs cut, most positions
  eliminated by early December 2025. Not an operating facility in 2026 — do NOT audit.
  [Tier 1: https://news.gp.com/2025/10/georgia-pacific-to-close-memphis-cellulose-mill-and-the-memphis-technology-and-innovation-center-in-tennessee, 2025-10-16]
  [Tier 2 corroboration: https://wreg.com/news/local/150-affected-by-georgia-pacific-mill-closure-in-memphis/, 2025-10]
  - Address note: the roster's "100 N B St" does not match GP's actual mill location
    (near Scott Rd / Tillman St), but there is only one GP Memphis cellulose mill and
    it is the one being permanently shut. Re-pin moot — site is rejected.

## Watch-flags that were investigated and CLEARED (still confirmed)

These were the suspected divestitures from the brief; each cleared on the evidence:

- **GP Brunswick Cellulose Mill** (Brunswick, GA) — CLEARED. The 2004 "sale of GP's
  Brunswick cellulose operations" was a transfer to **Koch Cellulose LLC**; Koch then
  acquired all of Georgia-Pacific in 2005, so it was an intra-Koch transfer, not an
  exit from GP. Operates today as Brunswick Cellulose LLC under the GP / GP Cellulose
  brand; named WTC Savannah's 2024 International Business of the Year; in a $200M
  upgrade. CONFIRMED.
- **GP Crossett Mill** (Crossett, AR) — CLEARED with a scope caveat. GP permanently
  **idled the Crossett pulp / bleached-board lines in 2019** (~555 jobs), BUT the
  consumer tissue/towel operation remains GP-operated and got a Dec-2024 $90M / 50-job
  expansion (Angel Soft, ~400 staff). CONFIRMED as a **tissue-only** site — do not
  model it as a full pulp/paper/tissue complex.
- **GP "Anchor Packaging" plants** (Jonesboro AR #20, Paragould AR #21, Janesville WI #22)
  — CLEARED. Anchor Packaging was a separate independent company, but **Georgia-Pacific
  completed its acquisition of Anchor Packaging on 2025-10-22**, folding these plants
  into GP's Foodservice Solutions platform. The "GP Anchor Packaging" labels are now
  correct and the sites are genuinely GP-operated. (Had this scrub run before
  2025-10-22 these would have been rejects as a different operating company.) CONFIRMED.
- **Cellulose cluster** (Alabama River #9, Leaf River #11) — CLEARED. Both moved into
  Koch Cellulose in 2004 like Brunswick but remain GP/Koch-operated; Alabama River is
  in an $800M GP modernization (Sept 2025). CONFIRMED.

## Address-quality re-pin flags (facility CONFIRMED, street/coords need fixing)

These sites are GP-operated and ship, but the roster street/ZIP/coords are off — flag
for a re-pin before imaging/geofencing:

- **#01 Wauna (Clatskanie OR)** — roster coords (46.10414,-123.203936) land in
  downtown Clatskanie ~17 km SE of the mill; site JSON already relocated core to
  46.1552,-123.4078. Confirm pin.
- **#02 Halsey (OR)** — address may resolve to 30470 American Dr rather than the listed
  31831 Cartney Dr (same complex). Worth a field check.
- **#18 Dixie Tableware (Jackson TN)** — actual address is **65 Cardinal Drive**, not
  Mercer Rd. Re-pin.
- **#19 Dixie Cup (Lexington KY)** — documented address **451 Harbison Rd**, not
  1900 Spurr Rd (same NW Lexington industrial area). Reconcile.
- **#22 Anchor Packaging (Janesville WI)** — actual ZIP **53545**, not 53546.
- **#26 Brookneal OSB (VA)** — GP lists **11795 Brookneal Hwy, Gladys VA 24554**;
  roster's "1093 Cyclone Rd" uncorroborated. Reconcile.
- **#27 Gypsum (Savannah GA)** — operating site is on the Savannah River (Wahlstrom Rd);
  2861 Tremont Rd is the registered plant-city address of the same complex. Confirm pin.
