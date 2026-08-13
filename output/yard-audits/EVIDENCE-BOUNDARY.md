# Evidence boundary — raw corpus vs what a buyer sees

STATUS: ACTIVE
Last verified: 2026-08-13

## The pipeline

```
output/yard-audits/<slug>/sites/*.json     RAW RESEARCH CORPUS   1,178 records
  -> evidenceFailure() in scripts/yard-audit/evidence.ts   THE ONE RULE
  -> fovGate() in build-demo-pack.ts                        applies it, ENFORCE by default
  -> public/demo-packs/<slug>.json          PUBLIC ARTIFACT     58 packs, 962 sites
  -> /demo/<slug>                           WHAT A BUYER SEES
```

**A research record may exist without being ship-eligible.** That is the point of
a research corpus. What must never happen is an evidence-failing record becoming
a public factual claim.

## Current state, measured 2026-08-13

| | |
|---|---|
| Raw research corpus | 1,178 records |
| Ship-eligible | 987 |
| Rejected | 111 |
| Unresolved | 80 |
| **Public pack facilities** | **962** |
| **Public facilities failing the rule** | **0** |

**KNOWN_UNVERIFIED_EXPOSURE = {}.** There is no allowlist, no exception map, and
no "zero except these accounts". The invariant is absolute.

It reached zero by evidence work, not by moving the line:

| Account | Before | After |
|---|---|---|
| crowley | 25 shipped, 0 verified | 8 verified, 3 rejected as other operators' terminals, 15 unresolved |
| kroger | 62 shipped, 15 verified | 15 verified, 47 unresolved |
| dannon | 13 shipped, 0 verified | 12 verified, 1 rejected (plant closed 2026-08-02) |
| unfi | 30 shipped, 0 verified | 21 verified, 2 rejected as announced closures, 7 unresolved |

Two of those were live buyer-facing falsehoods, not just gaps:

- **Crowley shipped three terminals Crowley does not operate** — Penn Terminals
  (PSA), Gloucester (Holt Logistics), Wilmington (NC State Ports Authority).
  Crowley is a liner carrier calling those ports. They had been rejected with
  Tier-1 sourcing in June; an `fovGate` overwrite destroyed that evidence and
  nothing gated them afterwards. Crowley is the paid POC.
- **Dannon shipped a plant Danone closed on 2026-08-02**, eleven days before the
  verification pass. Bridgeton NJ, 114 jobs, volume moved to Mount Crawford,
  Dallas and Jacksonville.

## What the gate requires

`evidenceFailure()` in `scripts/yard-audit/evidence.ts` is the ONE definition.
`fovGate()`, the boundary test, and the build validator all import it; none
re-implements it. A record is ship-eligible only with:

- a verification block and a verdict, and the verdict is not `rejected`
- at least one citation carrying a URL **and** a date
- at least one citation that is **durable and independent** — not a
  yardflow.ai/freightroll.com URL, not a self-issued API endpoint, not a
  search-results page, and a resolvable public http(s) URL on a real host
- `checkedDivestiture === true`, plus `checkedBankruptcyEra` for restructured
  companies

## Three things enforce it

1. **`FOV_GATE` defaults to `enforce`** (2026-08-13). `FOV_GATE=warn` remains a
   deliberate escape hatch for a mid-backfill account; it is no longer the
   default. A pack build now drops failing sites unless you ask it not to.
2. **`scripts/validate-public-evidence.mjs` runs inside `validate:packs`**, which
   `vercel.json` executes before `next build`. A Preview or Production build
   FAILS on any rejected, unverified, weak or malformed facility in a committed
   pack, or on a pack claiming more facilities than it ships.
3. **`tests/unit/demo-pack-evidence-boundary.test.ts`** asserts zero failing
   facilities with no exceptions, and asserts it read enough to mean something
   (>50 packs, >900 facilities) so a green result cannot come from an empty read.

## The evidence can no longer be deleted by its own pipeline

`fovGate()` wrote its per-build report to `verification-rejections.md` — the
filename the audit agents use for hand-written cited research. One pack build
replaced that research with a five-line stub. It destroyed evidence on ball,
crowley and kroger, and it is why Crowley shipped three terminals it does not run.

Generated output now goes to `fov-report.md`, which is gitignored.
`tests/unit/yard-audit-fov-nondestructive.test.ts` plants a sentinel in a real
account's research file, runs the real builder in both gate modes, and requires
the file back byte-identical by sha256. Reintroducing the one-line bug turns all
four of its assertions red.

## Raw research count vs shipped count — do not quote INDEX.md externally

`INDEX.md` counts RAW SOURCE RECORDS. The pack ships the GATED subset. They
differ for most accounts, sometimes by a lot (kraft-heinz 27 vs 9, gxo 30 vs 20,
crowley 26 vs 8, unfi 30 vs 21). The gap is facilities that are rejected, closed,
divested, pre-production, or simply not yet verified.

**Every pack's `account.siteCount` equals the number of sites it ships** — checked
on every build by the validator above. No public surface quotes an inflated
number. The remaining exposure is a human reading the raw index and saying it out
loud. That is what this section exists to prevent.

## Downstream claim updates

This work changed no number that any yardflow.ai surface renders **except the
demo packs themselves**, which are the buyer-facing artifact and changed on
purpose:

| Pack | Was | Now | Why |
|---|---|---|---|
| crowley | 25 | 8 | 3 rejected (other operators), 15 unverified held back |
| kroger | 62 | 15 | 47 unverified held back |
| dannon | 13 | 12 | Bridgeton NJ closed 2026-08-02 |
| unfi | 30 | 21 | 2 announced closures, 7 not on UNFI's own property list |

`dossierIntro`, `surprisingFindings` and `coverageNote` were rewritten for each
so the prose matches the shipped facilities. Crowley's previously cited
"Gloucester City runs 90 dock doors" — one of the three rejected terminals.

## Remaining work, honestly

- **80 unresolved records** across the corpus are audited but not verified. They
  are held back, not shown. The largest blocks are kroger 47 and crowley 15.
- **UNFI's 21 are `probable`, not `confirmed`.** Their identity comes from UNFI's
  FY2025 10-K, which names a CITY, not a parcel. That gap is recorded on every
  record in `claimScope` rather than bridged by inference.
- The four pack-slug evidence archives (`campbell-s`, `kenco-logistics-services`,
  `mondelez-international`, `universal-logistics-holdings`) still hold their
  narratives; see `README.md` for what those directories are.
