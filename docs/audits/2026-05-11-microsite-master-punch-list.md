# Microsite master punch list — 2026-05-11

**Inputs:**
- `docs/audits/2026-05-11-design-critique-punch-list.md` (382 rows, 10 P0 systemic)
- `docs/audits/2026-05-11-ux-copy-punch-list.md` (366 rows, 22 P0 systemic)

**Total findings after dedupe:** ~720 unique rows across both lenses
**Leak-scan status:** CLEAN (one in-line patch applied during ux-copy run: `hormel-foods.ts:418` Primo Brands attribution — committed as `5b3c2a3`)

---

## The headline

Two structural surprises dominate everything else:

1. **A live-ticking detention-cost dollar badge renders on every microsite cover.** Values are implausible at scale (DHL: $427.78, Frito-Lay: $81.99). It's antithetical to the anti-sales memo register and undermines the editorial authority of every page. Highest priority to remove.

2. **16 accounts render with `sections: []` — meaning the prose body is literally empty.** This includes Tier 1 Band A (AB InBev, Coca-Cola) and 12 of 14 Tier 2. The pages render a cover spread, an audio brief player, and then a blank scroll. The "Draft · v0" badge on the cover is the symptom; the empty body is the disease.

Beyond those: the desktop marginalia gutter is empty (the original immersion gap you flagged), there are zero redacted-artifact treatments anywhere (evidence-density hard fail), and the cover H1 has no mechanism for an italic+accent phrase (the typographic anchor of the design system is missing).

---

## Section 1 — P0 systemic (16 findings after dedupe)

Each row is one PR. Sequenced by severity-of-user-visible-impact and dependency order.

### Ship-stopper / immediate (1–4)

| # | Surface | Finding | Fix | Source |
|---|---|---|---|---|
| **P0-1** | cover widget | Live-accumulating "detention accrued while reading" dollar badge renders on every account. Implausible values for large networks (DHL $427.78). Outside accent budget, anti-sales-register-violating. | Remove the widget from all `/for/[account]` routes. If kept for internal review, gate behind `?debug=1`. | Design row P0-cover-color-budget |
| **P0-2** | mobile | Running header (`MemoRunningHeader`) renders at y=0 on load overlapping cover classification bar; on 390px the title overflows viewport to x=416. | `memo-shell-chrome.tsx`: add `pointer-events-none` + `overflow-hidden` to mobile collapsed state; subtitle `hidden sm:block`; title `max-w-[calc(100vw-5rem)] truncate`. | Design rows P0-gestalt-mobile + P0-mobile-collapse |
| **P0-3** | motion | Cover continue-nudge `↓` animation loops indefinitely (2.5s × infinite). Reads as desperate after ~10s. | One-line CSS: `.memo-cover-nudge { animation: memo-nudge 2.5s ease-in-out 3; }` (cap at 3 iterations). | Design row P0-motion |
| **P0-4** | a11y | Soft-action CTA + colophon Casey-Larkin link lack `focus-visible` outline. Audio brief play button has it; soft-action doesn't. Inconsistent + a11y fail. | Add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--memo-accent)]` to: `memo-soft-action.tsx:52`, `memo-shell.tsx:218` (colophon `<a>`), `memo-audio-brief.tsx:345` (chapter seek). | Design row P0-interaction-polish |

### Schema / structural (5–8)

| # | Surface | Finding | Fix | Source |
|---|---|---|---|---|
| **P0-5** | schema | H1 `title` prop is `string` — the editorial-style "italicized phrase in H1 receives accent" cannot be expressed. All 40 covers miss the typographic accent entry point. | Add `titleEmphasis?: string` to `AccountMicrositeData`. In `memo-shell.tsx:131`, split title on emphasis substring and wrap in `<em style={{color:'var(--memo-accent)', fontStyle:'italic'}}>`. Add `coverHeadline?: string` for full title override (also serves long-account-name fix). | Design rows P0-typo-hierarchy + per-account H1 wrap findings (cost-plus-world-market, daimler-truck, universal-logistics, mondelez, performance-food-group, constellation-brands) |
| **P0-6** | schema | Zero artifact treatments across all 40 microsites. Spec mandates ≥1 redacted-artifact per memo (Module Inspector screenshot, redacted manifest, attribution-free quote image). Hard fail on evidence density. | Add `artifact` section type to `MemoMicrositeSection` in `schema.ts`. Render in `memo-section.tsx` as bordered figure with redacted image + mono caption + source hairline. Backfill artifacts per account starting with Tier 1. | Design row P0-evidence-density |
| **P0-7** | gutter | Right-column `<aside aria-hidden="true">` at `memo-shell.tsx:232` is empty. Article column floats in cream desert; memo metaphor reads as webpage, not bound document. (Your original immersion-gap hypothesis confirmed.) | New file `src/components/microsites/memo-marginalia.tsx` with interface `{ items: { mark: string; body: string }[] }`. Wire into the `lg:grid-cols-[11rem_minmax(0,36rem)_14rem]` right slot. Source items from `section.composition` or `proofBlocks`. | Design rows P0-gestalt + P0-marginalia |
| **P0-8** | cover | 20 of 40 accounts render "Draft · v0" badge — including Tier 1 Band A (ab-inbev, coca-cola) and most of Tier 2. Damaging signal at priority-91 prospects. | Two-pronged: (a) Move the badge from cover classification chrome to colophon-only (`memo-shell.tsx:113` — render in colophon section). (b) Add `needsHandTuning: false` per-account once sections are authored (depends on P0-9). | Design row P0-gestalt-draft-badge |

### Empty-body root cause (9)

| # | Surface | Finding | Fix | Source |
|---|---|---|---|---|
| **P0-9** | prose | 16 accounts have `sections: []`: ab-inbev, coca-cola, plus 12 of 14 T2 (caterpillar, ford, georgia-pacific, h-e-b, hormel-foods, jm-smucker, keurig-dr-pepper, mondelez-international, performance-food-group, the-home-depot, toyota, constellation-brands). campbell-s and diageo are the only T2 accounts with sections. All ux-copy P0 rows on hook/specificity/pitch-shape/scan/microcopy/mobile-readability for these accounts roll up to this one root cause. | Migrate legacy commented-out content into structured section types (`yns-thesis`, `observation`, `comparable`, `methodology`, `about`). Legacy comments are substantive — schema migration, not rewrite. **This is the largest piece of work in the punch list — 16 accounts × ~4–5 sections each = ~70 new section objects to author.** Treat as a per-account batch (see P1 section). | UX-copy rows 1–9 (all P0 systemic ab-inbev+coca-cola rows), plus all 12 T2 empty-sections rows |

### T2 metadata + voice (10–14)

| # | Surface | Finding | Fix | Source |
|---|---|---|---|---|
| **P0-10** | head | All 14 T2 accounts share identical `pageTitle` suffix: "YardFlow for {Account} - Yard Network Standardization." Generic category descriptor, no thesis, no hook. Same subject line on every microsite. | Per-account rewrite. Examples: `caterpillar` → "Caterpillar · The gap between autonomous machines and manual yards"; `toyota` → "Toyota Motor North America · JIT assembly requires JIT yard execution — the protocol gap"; `ford` → "Ford BlueOval City · Yard-execution protocol for the EV transition network." Use bob-evans-farms thesis-carrier pattern as model. | UX-copy P0 row (Tier 1+2 hook strength) |
| **P0-11** | head | All 14 T2 share identical `metaDescription`: "How YardFlow eliminates the yard bottleneck across {Account}'s facility network." "Eliminates the yard bottleneck" is the disqualifying sales-tell register from `editorial-style.md`. Renders in browser tabs + search previews. | Per-account rewrite. Observational register, no benefit claims, no "we"/"our"/"eliminates." Example for caterpillar: "Caterpillar operates 60+ manufacturing and parts-distribution facilities. The autonomous machines in the field run on JIT principles. The yards between the factory and the dealer still operate on paper logs and radio dispatch." | UX-copy P0 row (Tier 1+2 sales-tell sniff) |
| **P0-12** | personVariants | All T2 `personVariants[].framingNarrative` contain identical sales-template boilerplate from the generator script ("Yard management is exactly the type of unsexy but high-impact operational lever that turnaround leaders love…"). Marketing register, feature-benefit selling. | Replace per-person with account-specific observational copy. Should describe the person's actual mandate context, not "why yard matters." | UX-copy P0 row (T1+T2 voice register continuity) |
| **P0-13** | T2 misc | No T2 account has `audioSrc` or `audioChapters` defined. Missing the memo-metaphor signal that distinguishes YardFlow microsites from standard marketing. | Once sections migrate (P0-9), add audio briefs following T1 chapter pattern. Lower priority than section migration itself. | UX-copy P0 row (microcopy density) |
| **P0-14** | T2 prose | Legacy CTA sections (commented out but present as template) carry `buttonLabel: 'Book a Network Audit'` and `closingLine: 'One conversation. Your yard network. A clear path to $10M-$15M in annual savings.'` This pattern will migrate into live sections unless patched at source. | Replace legacy CTA pattern in all T2 accounts before section migration. Soft-action follows T1 anti-sales register (no booking CTA, no savings promise). | UX-copy P0 row (soft-action sales-tell) |

### Template artifact leaks (15–16)

| # | Surface | Finding | Fix | Source |
|---|---|---|---|---|
| **P0-15** | prose | Multiple T2 accounts have internal classification notes, template prefixes, and emoji leaking into renderable fields: emoji in `ford` openingHook; "pain point 1:" prefix in `toyota` and `keurig-dr-pepper`; "4a." prefix in `constellation-brands`; "### The Killer Angle:" annotation in `toyota` heroOverride; "Useful strategic logo / Less direct logo hunt" classification notes in `fedex` and `kenco`; five identical "This page is framed as a short private brief" openingHooks in `the-home-depot`. | Per-file cleanup pass before section migration. These are ~8 surgical edits across ~5 files. | UX-copy Notes section |
| **P0-16** | jm-smucker | `proofBlocks` anonymized quote uses "When a beverage manufacturer integrated 45 plants…" — same incorrect Primo figure that was patched in hormel-foods (`5b3c2a3`). Correct: >200 contracted facilities. Anonymized framing is fine; the number must be right. | Edit `jm-smucker.ts` proofBlocks quote: "45 plants" → ">200 contracted facilities" with corresponding context. | UX-copy P1 per-account row |

---

## Section 2 — P1 per-account (264 ux-copy + ~150 design = ~414 rows)

Full per-account rows in source punch lists. Summary patterns:

### By tier

- **Tier 1 (20):** ~30 specific findings beyond P0 systemics. Most are H1-wrap (long names: daimler-truck, universal-logistics, cost-plus-world-market), contextDetail fragments ("13 footprint"), hypothesis paragraph length (kraft-heinz, kimberly-clark), per-account accent + framing.
- **Tier 2 (14):** Almost entirely roll up into P0-9 (sections empty) and P0-10/11/12 (head + voice). The non-systemic specifics: campbell-s + diageo (only T2 with sections) need artifact + footnote density verification.
- **Tier 3 (6) — DEFERRED to P2 per plan:** Barnes & Noble, FedEx, Honda, Hyundai, John Deere, Kenco. Most have the same `sections: []` root cause but are reach accounts.

### Recurring per-account patterns

| Pattern | Affected | Surface |
|---|---|---|
| `accentColor: '#DC2626'` (red) duplicated | hormel-foods, honda, toyota, ford | cover |
| `accentColor: '#7C3AED'` (violet) duplicated | jm-smucker, keurig-dr-pepper, constellation-brands | cover |
| `accentColor: '#2563EB'` (blue) duplicated | campbell-s, diageo, mondelez-international | cover |
| WCAG AA contrast failure on cream | the-home-depot (#F97316), nestle-usa (#009FDF), cj-logistics-america (#E8401C), georgia-pacific (#4B5563) | cover/footnote markers |
| Long account name H1 wrap to 4–5 lines | daimler-truck-north-america, universal-logistics-holdings, cost-plus-world-market, mondelez-international, performance-food-group, constellation-brands, hyundai-motor-america, kenco-logistics-services | cover |
| Long contextDetail wrapping cover DL | dhl-supply-chain (181px), kimberly-clark (114px), kraft-heinz (45px 2-line), ~12 others | cover |
| Pitch-shape mismatch for vertical | FedEx (CPG frame on a carrier), Hyundai (network thesis on 5-facility footprint) | prose |

### Per-account action template

For each of the 16 empty-sections accounts (P0-9):

1. Author 4–5 sections from the legacy comments
2. Replace `pageTitle` per P0-10
3. Replace `metaDescription` per P0-11
4. Rewrite `framingNarrative` for each personVariant per P0-12
5. Add `audioSrc` / `audioChapters` per P0-13
6. Replace any legacy CTA pattern per P0-14
7. Strip template artifacts per P0-15 (only ~5 files affected)
8. Apply accent differentiation if duplicated
9. Add `needsHandTuning: false`
10. Re-check pitch-shape coherence end-to-end

---

## Section 3 — P2 polish (86 rows, Tier 3 deferred + minor cleanup)

| # | Surface | Finding | Fix |
|---|---|---|---|
| P2-1 | Tier 3 polish (all 6) | Same `sections: []` root cause; same metadata patterns. | Apply Tier-2 per-account template after T1+T2 ships. |
| P2-2 | section end-marks | Triple-∎ section separator (`memo-section.tsx:136`) reads slightly large at `text-[#8a847b]`. Competes with colophon's `§ ∎`. | Reduce to `text-[9.5px] tracking-[0.55em]`. |
| P2-3 | ::selection color | `color-mix(in srgb, var(--memo-accent) 18%, transparent)` may be invisible for dark accents. | Bump to 28%. Add `@supports not (color-mix)` fallback. |
| P2-4 | colophon | Various minor microcopy reinforcement opportunities across all 40. | Batch in cleanup PR. |

---

## Fix sequencing recommendation

```
PR batch 1 — Ship-stoppers (1 day, low-risk):
  P0-1 (remove detention counter)
  P0-2 (mobile running header)
  P0-3 (cap nudge animation)
  P0-4 (focus rings)

PR batch 2 — Schema + structure (2–3 days):
  P0-5 (titleEmphasis + coverHeadline schema)
  P0-6 (artifact section type schema)
  P0-7 (MemoMarginalia component + grid wiring)
  P0-8 (Draft badge → colophon)
  Per-account: WCAG accent fixes (4 accounts)

PR batch 3 — T2 voice (1–2 days):
  P0-10 (T2 pageTitle rewrites — 14 accounts)
  P0-11 (T2 metaDescription rewrites — 14 accounts)
  P0-14 (replace legacy CTA pattern in all T2)
  P0-15 (strip template artifacts — 5 files)
  P0-16 (jm-smucker Primo fix)

PR batch 4 — Empty-body migration (largest piece, ~3–5 days):
  P0-9 (sections migration for 16 accounts)
  P0-12 (rewrite framingNarrative per person)
  P0-13 (add audioSrc per account)
  Per-account: accent differentiation, contextDetail truncation,
                coverHeadline overrides for long names

PR batch 5 — Tier 1 per-account polish (1–2 days):
  P1 specifics for Tier 1 — hypothesis paragraph breaks (kraft-heinz,
  kimberly-clark), DL truncation, etc.

PR batch 6 — Polish cleanup (1 day):
  P2-2, P2-3, P2-4
  Tier 3 P2 application

PR batch 7 — Tier 3 (defer until 1–6 land):
  Apply Tier-2 template + cleanup
```

**Total estimated work:** ~2–3 weeks of focused effort if you do it serially. Parallel-friendly: batches 1 and 2 can run together (different files); batch 3 can start once batch 2's schema lands; batch 4 is the long pole.

---

## Casey triage questions

Before kicking off fix-phase, three decisions:

1. **Detention counter (P0-1):** Is this widget here on purpose? If yes, what's its intent and what should the audit have noted as expected behavior? If no (best guess), the fix is straightforward removal. The widget being present at all suggests there's a story about why — surface that so we don't accidentally remove a feature you wanted.

2. **Empty-body scope (P0-9):** 16 accounts is real content authoring work, not a typing exercise. Two paths:
   - **Path A:** Author all 16 to T1-quality (multi-day per account, ~6 weeks total)
   - **Path B:** Author Tier 2 to a tighter "T2 floor" (single-section observation + single comparable + single soft-action, ~2 days per account, ~4 weeks total)
   - I'd recommend B — but the call is yours.

3. **Marginalia content (P0-7):** New `MemoMarginalia` component needs content. Two sources:
   - Pull from `section.composition` (key metrics auto-extracted)
   - Hand-authored marginalia per section (more work, sharper)
   - Recommend a hybrid: auto-extract for now (P0 ships), hand-author later (P1).

Once decided, I'll generate the Phase-1 fix plan and dispatch the first PR batch via subagent-driven-development.
