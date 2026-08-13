# Evidence boundary — raw corpus vs what a buyer sees

STATUS: ACTIVE
Last verified: 2026-08-12

## The pipeline

```
output/yard-audits/<slug>/sites/*.json     RAW RESEARCH CORPUS   1,178 records
  -> fovGate() in scripts/yard-audit/build-demo-pack.ts    THE EVIDENCE GATE
  -> public/demo-packs/<slug>.json         PUBLIC ARTIFACT      58 packs, 1,036 sites
  -> /demo/<slug>                          WHAT A BUYER SEES
```

**A research record may exist without being ship-eligible.** That is the point of
a research corpus, and 305 of 1,178 records are correctly not ship-eligible.
What must not happen is an evidence-failing record quietly becoming a public
factual claim.

## What the gate actually requires

`fovGate()` passes a site only if it has a verification block, a verdict, at
least one citation carrying both a URL and a date, `checkedDivestiture === true`,
and — for accounts in `RESTRUCTURED_COMPANIES` — `checkedBankruptcyEra === true`.

Two properties matter more than the rule itself:

1. **It defaults to `warn`, which KEEPS flagged sites.** Only an explicit
   `FOV_GATE=enforce` build drops them. That default is deliberate: it exists so
   pack rebuilds don't empty out mid-backfill.
2. **Nothing at runtime filters on `verification`.** The only runtime consumer is
   `src/components/demo/site-detail-panel.tsx`, which reads
   `verification.imageryDate` for a display stamp. **The committed pack is the
   boundary.** There is no second line of defence behind it.

## Current state, measured 2026-08-12

| Corpus | Records |
|---|---|
| Raw research corpus | 1,178 |
| Ship-eligible (passes the gate) | 873 |
| Not ship-eligible | 305 — 218 no verification block, 85 `rejected`, 2 bad citations |

| Public packs | Sites |
|---|---|
| Total shipped | 1,036 across 58 packs |
| Pass the gate | 921 |
| **No verification block** | **115** |
| `rejected` sites shipped | **0** |
| Verdict present but evidence failing | **0** |

**The good news is the sharp part:** zero rejected sites reach a public pack, and
zero sites with a verdict-but-broken-evidence reach one. The gate has never
leaked a site we affirmatively determined was closed, divested or pre-production.

**The exposure is narrower than the corpus number suggests.** 218 records have no
verification block, but only 115 of them are published, in four packs:

| Pack | Unverified sites | Note |
|---|---|---|
| crowley | 25 of 25 | live prospect, paid POC |
| dannon | 13 of 13 | live prospect |
| kroger | 47 of 62 | live prospect |
| unfi | 30 of 30 | live prospect |

The other three zero-verification accounts — campbells, kenco-logistics,
mondelez, universal-logistics — have no pack, so they never reach a buyer.

## Why this was not "fixed" by flipping the gate

Setting `FOV_GATE=enforce` as the default and rebuilding would take crowley from
25 sites to 0, dannon 13 to 0, unfi 30 to 0, and kroger 62 to 15. Those are four
live prospects, one of them a paid POC. Emptying their demos to satisfy a linter
is a worse outcome than the exposure, and it is a GTM decision, not a repository
hygiene decision.

So the exposure is **pinned, not deleted**, by
`tests/unit/demo-pack-evidence-boundary.test.ts`:

- a `rejected` site in any public pack fails the build — no allowance, ever
- a site with a verdict but failing evidence fails the build — no allowance
- an unverified site in a pack not on the known list fails the build
- unverified exposure growing in a listed pack fails the build
- exposure shrinking fails the build too, asking for the baseline to be lowered

The number can only ratchet down. It cannot grow, and it cannot go quiet.

## Owner action — not this lane's to take

The real fix is to backfill verification blocks for the 115 published records,
starting with crowley (25) since it is the paid POC. Each needs a verdict, at
least one dated identity citation, and a completed divestiture check — the same
bar every other account already meets.

When a pack is backfilled, lower its number in `KNOWN_UNVERIFIED_EXPOSURE` in
that test. When it reaches zero, delete the entry. When the map is empty, change
the `fovGate` default from `warn` to `enforce` and delete this document.

Read `output/yard-audits/tyson-foods/verification-evidence.md` for a worked
example of what a completed evidence pass looks like, including what the gate
cannot see: it tests that a citation has a URL and a date, not that the URL is
independent or durable, so a self-citation or a key-gated API endpoint satisfies
it.
