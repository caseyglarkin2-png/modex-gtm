# Microsite Fix Phase 4 — Tier 1 Polish + Cosmetic Dedupe

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining P1 cosmetic backlog on the master punch list once the empty-body work has shipped. With Phase 3 complete, every microsite renders a full memo body — but 12 accounts still share duplicate accent colors with another account, 8 long account names wrap the cover H1 into a 4–5 line block, and a few Tier 1 hypothesis paragraphs scan as walls of prose. This phase is the cosmetic finishing pass.

**Architecture:** Surgical content edits to `src/lib/microsites/accounts/*.ts`. No schema changes (the `coverHeadline` + `titleEmphasis` schema already landed in `19ff4c0`). No component-layer edits. Each rewrite is drafted inline so the implementer subagent can apply it mechanically.

**Master punch list:** `docs/audits/2026-05-11-microsite-master-punch-list.md`
**Scope:** P1 recurring patterns from punch-list Section 2 (PR batch 5 in the master sequencing recommendation)
**Out of scope:**
- P0-13 (T2 audio briefs) — deferred to Phase 5
- P0-6 artifact backfill (schema landed; per-account redacted artifacts deferred to Phase 5 or Phase 6)
- P2-3, P2-4 micro-polish — deferred to a final cleanup PR

---

## Tasks

| # | Task | Files touched | Risk |
|---|---|---|---|
| 1 | Accent dedupe — 12 accounts on duplicated hex values | 12 `.ts` files | low |
| 2 | `coverHeadline` override for long-name H1 wrap | 8 `.ts` files | low |
| 3 | Tier 1 hypothesis paragraph trim/break | 2–4 `.ts` files | low (prose edit) |
| 4 | `contextDetail` truncation on long-wrap rows | ~12 `.ts` files | trivial |

All tasks dispatch in parallel — each touches different fields within different files, no cross-task conflicts. Single PR (`feat/microsite-phase-4-polish-and-dedupe`) against `main`.

---

## Task 1 — Accent dedupe (12 accounts)

**Current duplicate clusters** (from grep of `accentColor:` across `src/lib/microsites/accounts/*.ts`, 2026-05-12):

| Hex | Accounts sharing it |
|---|---|
| `#DC2626` red | `honda`, `hormel-foods`, `toyota` |
| `#7C3AED` violet | `constellation-brands`, `jm-smucker` |
| `#2563EB` blue | `campbell-s`, `diageo`, `performance-food-group` |
| `#0891B2` cyan | `fedex`, `kenco-logistics-services` |
| `#059669` green | `barnes-noble`, `dannon` |

**Resolution rule:** Each duplicated account moves to a unique brand-faithful color that passes WCAG AA against `#f5f1e8` cream (contrast ratio ≥ 4.5:1 for text use). Where the brand has a published color, prefer it; otherwise pick a saturated variant of the same hue family.

**Proposed reassignments:**

| Account | From | To | Rationale |
|---|---|---|---|
| `honda` | `#DC2626` | `#CC0000` | Honda's published brand red |
| `hormel-foods` | `#DC2626` | `#A6192E` | Deeper Hormel-aligned crimson; differentiated from auto reds |
| `toyota` | `#DC2626` | `#EB0A1E` | Toyota's published brand red |
| `jm-smucker` | `#7C3AED` | `#5B2C82` | Smucker's deeper brand purple (more saturated, less Stripe-violet) |
| `constellation-brands` | `#7C3AED` | `#7A1F45` | Wine-cellar maroon — fits beverage portfolio vs. tech-violet |
| `campbell-s` | `#2563EB` | `#C8102E` (would clash with kraft-heinz) → use `#E31837` | Campbell's published wave red |
| `diageo` | `#2563EB` | `#1F3A93` | Diageo navy (brand-faithful) |
| `performance-food-group` | `#2563EB` | `#003E7E` | PFG navy (brand-faithful) |
| `fedex` | `#0891B2` | `#4D148C` | FedEx purple — the iconic brand color, finally claimed |
| `kenco-logistics-services` | `#0891B2` | `#1C4E80` | Kenco navy — distinct from FedEx purple |
| `barnes-noble` | `#059669` | `#005C2F` | B&N's deeper brand green |
| `dannon` | `#059669` | `#003DA5` (would clash with general-mills) → use `#0046AD` | Danone blue — brand-faithful, distinct from general-mills' `#003DA5` |

**Implementer notes for Task 1:**

- [ ] For each of the 12 accounts, edit the single `accentColor:` line in the `theme:` block.
- [ ] Verify the proposed hex passes WCAG AA against `#f5f1e8` cream — quick check via any online contrast checker; ratio ≥ 4.5:1.
- [ ] Run `Grep` after edits to confirm no remaining duplicate clusters:
  ```
  grep -h "accentColor:" src/lib/microsites/accounts/*.ts | sort | uniq -c | sort -rn | head -10
  ```
  Should show all values with count = 1.
- [ ] Skip Task 1 changes for any account where the proposed color objectively fails contrast — fall back to a darker variant and note the deviation in the commit message.

---

## Task 2 — `coverHeadline` override for long-name H1 wrap (8 accounts)

The cover H1 is auto-composed from `accountName` plus a memo-template thesis line. Accounts with long names wrap the H1 into a 4–5 line block on a 16-col grid, breaking the typographic anchor the M8 redesign relied on.

The fix is per-account: set `coverHeadline:` to a manually-shaped string that breaks at meaningful boundaries. The schema field exists (`19ff4c0`) but is currently unused on every account.

**Accounts requiring `coverHeadline`:**

| Account | Current auto-composed H1 (long) | Proposed `coverHeadline` (shaped) |
|---|---|---|
| `daimler-truck-north-america` | Yard execution as a network constraint for Daimler Truck North America | Yard execution as a constraint for *Daimler Truck* |
| `universal-logistics-holdings` | Yard execution as a network constraint for Universal Logistics Holdings | Yard execution as the unit economic for *Universal Logistics* |
| `cost-plus-world-market` | Yard execution as a network constraint for Cost Plus World Market | Yard execution at *Cost Plus World Market* — direct-import to DC to store |
| `mondelez-international` | Yard execution as a network constraint for Mondelez International | Yard execution as a network constraint for *Mondelēz* |
| `performance-food-group` | Yard execution as a network constraint for Performance Food Group | Yard execution across *PFG's* 150 distribution centers |
| `constellation-brands` | Yard execution as a network constraint for Constellation Brands | Yard execution as a margin constraint for *Constellation Brands* |
| `hyundai-motor-america` | Yard execution as a network constraint for Hyundai Motor America | Yard execution across *HMA's* 5-facility US footprint |
| `kenco-logistics-services` | Yard execution as a network constraint for Kenco Logistics Services | Yard execution as productizable competence at *Kenco* |

Each proposal:
- Stays ≤ 60 characters (renders on 2 lines on the 36rem column at the M8 type scale).
- Wraps one phrase in `*asterisks*` to mark the `titleEmphasis` accent target (the memo-shell splits on this token to render in `var(--memo-accent)` italic).
- Reads as the same memo subject the auto-composed version would have produced — just hand-shaped.

**Implementer notes for Task 2:**

- [ ] For each of the 8 accounts, add `coverHeadline: '...'` and `titleEmphasis: '...'` (the phrase between asterisks, minus the asterisks) to the account object.
- [ ] If the auto-composed H1 used a different phrasing pattern, prefer the proposed override here over preserving the legacy template.
- [ ] Visual check: render each in dev (`/for/{slug}`); H1 should be 2 lines max, the italicized phrase should land in accent color.

---

## Task 3 — Tier 1 hypothesis paragraph trim (kraft-heinz, kimberly-clark + audit-find)

The punch list flagged `kraft-heinz` and `kimberly-clark` as Tier 1 accounts whose `observation.hypothesis` paragraph reads as a wall — single paragraph well past 600 words.

**Implementer notes for Task 3:**

- [ ] Read `src/lib/microsites/accounts/kraft-heinz.ts` and `src/lib/microsites/accounts/kimberly-clark.ts`. For each, locate the `observation` section's `hypothesis` field.
- [ ] If the hypothesis is a single string > 500 words, break it into 2–3 paragraphs at natural argument boundaries (network-shape → bottleneck mechanism → caveat seam). Use literal `\n\n` between paragraphs — the renderer paragraph-splits on double newlines.
- [ ] Light prose edits OK if a sentence wanders; do not change the analytical claims or substitute the legacy commented intel.
- [ ] Sweep the 12 newly-migrated T2 accounts from Phases 3 cohort B/C/D and the 2 T1 cohort A files (`ab-inbev`, `coca-cola`) — if any of those also exceed the 600-word single-paragraph threshold, apply the same break treatment in the same PR. Do not gate on it.

---

## Task 4 — `contextDetail` truncation (~12 accounts)

`contextDetail` appears on the cover description-list as the "Subject" row dd: it joins as `{accountName} · {contextDetail}`. When `contextDetail` is long, the row wraps to 2 lines and the cover spread loses its alignment.

Per the punch list, the worst offenders are:
- `dhl-supply-chain` (181px wrap)
- `kimberly-clark` (114px wrap)
- `kraft-heinz` (45px 2-line)
- ~12 others not specifically named

**Implementer notes for Task 4:**

- [ ] Grep `src/lib/microsites/accounts/*.ts` for `contextDetail:` and inspect every string > 30 characters.
- [ ] For each long offender, rewrite to ≤ 30 characters while preserving the specific fact (e.g. "47-facility footprint" beats "operates 47 facilities across the United States").
- [ ] Trim filler — drop articles, drop "operates," drop "across the [region]." Specific numbers + nouns only.
- [ ] If a long `contextDetail` carries an essential qualifier that can't be cut (e.g. a vertical-disambiguator), keep it and accept the 2-line wrap. Note in the commit message.

---

## Verification

After all 4 tasks:

```
cd C:\Users\casey\modex-gtm
npx vitest run tests/unit/microsites/ tests/unit/microsite-memo-shell.test.tsx
```

Must show all tests passing.

Accent dedupe check:
```
grep -h "accentColor:" src/lib/microsites/accounts/*.ts | sort | uniq -d
```
Must return zero output (no duplicate hex values).

Coverage check:
- 12 accounts edited for accent
- 8 accounts gained `coverHeadline`
- 2+ accounts gained paragraph breaks in `observation.hypothesis`
- ~12 accounts edited for `contextDetail`

---

## Branch + PR

- Branch: `feat/microsite-phase-4-polish-and-dedupe`
- All commits on this branch
- One PR against `main`
- Per-task commits (or per-account commits if the diff is cleaner that way)
- Verify on Vercel preview before merging — 40 microsite URLs should be visually checked at minimum on the 12 accent-changed accounts + 8 H1-changed accounts

---

## Commit message convention

For Task 1 (per-account or batched):

```
fix(microsite/{slug}): accent dedupe — {old-hex} → {new-hex} ({brand-rationale})

Closes part of Phase 4 P1 cosmetic dedupe.
```

For Task 2:

```
fix(microsite/{slug}): coverHeadline override for long-name H1 wrap

Adds coverHeadline + titleEmphasis so the cover H1 lands in 2 lines max
with the accent phrase italicized in --memo-accent.

Closes part of Phase 4 P1 long-name wrap.
```

For Task 3:

```
fix(microsite/{slug}): break observation.hypothesis into multiple paragraphs

Single-paragraph hypothesis >600 words reads as a wall. Split at natural
argument boundaries (network-shape → bottleneck → caveat).

Closes part of Phase 4 T1 hypothesis paragraph trim.
```

For Task 4 (batched):

```
fix(microsite): contextDetail truncation across N accounts

Trims long contextDetail strings to ≤ 30 chars so the cover Subject row
renders on one line. Preserves the specific fact in every case.

Closes part of Phase 4 P1 contextDetail wrap.
```

---

## Self-review checklist

After writing this plan, the author confirms:

- [x] Every duplicate accent cluster on `accentColor:` grep is addressed in Task 1
- [x] Every long-name account flagged in the punch list (8 names) is addressed in Task 2 with a specific proposed `coverHeadline`
- [x] Task 3 explicitly opens the door for the Phase 3 newly-migrated accounts to receive the same treatment if their hypotheses ran long
- [x] Task 4 has a clear cut-line (30 chars) and an escape hatch for essential qualifiers
- [x] Verification steps include a single-line grep that proves the dedupe is complete
- [x] Out-of-scope items (audio briefs, artifact backfill, micro-polish) explicitly named so the implementer doesn't expand scope
- [x] No placeholder content
