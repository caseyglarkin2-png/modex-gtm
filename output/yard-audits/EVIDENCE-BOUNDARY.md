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

**The exposure is much narrower than the corpus number suggests, for two
separate reasons.**

First, 99 of the 218 blockless source records belong to four accounts whose
verification **was completed and lives in the pack instead of the source**. The
2026-06-19 scrub ran pack-direct: it read `public/demo-packs/<pack-slug>.json`,
stamped verdicts onto the pack's site objects, and never wrote back up the
pipeline. Their evidence is archived under the MICROSITE slug, which is why
those directories read as orphans — see `README.md`:

| Audit slug (source) | Evidence archive (pack slug) | Pack today |
|---|---|---|
| campbells (21, 0 verified in source) | campbell-s | 20 sites, **20/20 verified** |
| kenco-logistics (30, 0 in source) | kenco-logistics-services | 24 sites, **24/24 verified** |
| mondelez (22, 0 in source) | mondelez-international | 17 sites, **17/17 verified** |
| universal-logistics (26, 0 in source) | universal-logistics-holdings | 18 sites, **18/18 verified** |

These four are **correctly evidence-gated**. The source records are the stale
side. Counting them as unverified research is true of the file and false of the
account.

Second, only 115 records are both blockless AND published, across four packs —
and those four split into two genuinely different problems:

| Pack | Unverified | Evidence state | Note |
|---|---|---|---|
| crowley | 25 of 25 | research existed, **destroyed** by an fovGate overwrite; recoverable at `19e7c6aa` (40 lines) | live prospect, paid POC |
| kroger | 47 of 62 | research existed, **destroyed**; recoverable at `313132cd` (21 lines) — predates dropping 3 closed sites in `a4ae6ef9` | live prospect |
| dannon | 13 of 13 | **no evidence file has ever existed** — never verified | live prospect |
| unfi | 30 of 30 | **no evidence file has ever existed** — never verified | live prospect |

So crowley and kroger need *recovery*; dannon and unfi need *original work*.
That is 43 facilities that have never been verified at all, not 115.

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

Four jobs, in descending value:

1. **Recover crowley and kroger** (72 sites). The research was written and then
   destroyed by an fovGate overwrite. Restore from `19e7c6aa` and `313132cd`,
   check kroger's against the current site list first (it predates `a4ae6ef9`
   dropping 3 closed sites), then stamp the verdicts onto the source records.
   Crowley is the paid POC, so it goes first.
2. **Verify dannon and unfi** (43 sites). No evidence has ever existed for these.
   This is original work, not recovery, and it is the only genuinely unverified
   published data we ship.
3. **Backfill the four pack-direct accounts** (99 records). The verdicts already
   exist in `public/demo-packs/*.json`; copy them back onto the source records so
   the source stops lying about its own evidence state.
4. **Salvage the 51 files in `modex-gtm-demo-aplus`** before that worktree is
   ever committed — it holds 2,438 lines of the same overwrite damage.

Each backfilled record needs a verdict, at least one dated identity citation, and
a completed divestiture check — the same bar every other account already meets.

When a pack is backfilled, lower its number in `KNOWN_UNVERIFIED_EXPOSURE` in
that test. When it reaches zero, delete the entry. When the map is empty, change
the `fovGate` default from `warn` to `enforce` and delete this document.

Read `output/yard-audits/tyson-foods/verification-evidence.md` for a worked
example of what a completed evidence pass looks like, including what the gate
cannot see: it tests that a citation has a URL and a date, not that the URL is
independent or durable, so a self-citation or a key-gated API endpoint satisfies
it.
