# Kraft-Heinz Microsite — A+ Pass

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Upgrade the Kraft-Heinz microsite from "quality bar reference" to A+ — the most immersive, high-value version of the memo template. Drive Flavio Torres scan-stopping density, add the missing receipts (artifact section + dense marginalia), and override the cover hook + audio intro to land Torres-specific from the first glance.

**Why now:** Casey's read of the page surfaced three concrete issues — desktop feels skinny (because the marginalia gutter is empty by default extraction), the audio intro claims 7 minutes but the file is 5:24 (fixed in PR #79), and the pilot framing was prescribing DeKalb (fixed in PR #78 / merged). The page is *correct* but *under-built*. This phase adds the density, the receipts, and the Torres-specific hooks that turn a correct memo into a stopping one.

**Architecture:** Mostly content edits to `src/lib/microsites/accounts/kraft-heinz.ts`. Two schema/component additions to unlock per-account hand-tuned marginalia and a reusable pull-quote component. One systemic fix to `extractMarginaliaItems` so all 40 accounts benefit (not just KH).

**Reference inputs:**
- `docs/audits/2026-05-11-microsite-master-punch-list.md`
- `docs/editorial-style.md`
- `src/lib/microsites/accounts/kraft-heinz.ts` (current state, 252 lines)
- `src/lib/microsites/accounts/dannon.ts` (maximalist reference, 608 lines)

**Scope (12 tasks, 1 PR):**

| # | Task | Surface | Risk |
|---|---|---|---|
| 1 | Schema: `marginaliaItems?` per-account override | `src/lib/microsites/schema.ts` | low |
| 2 | Renderer: fix `extractMarginaliaItems` default (pull rows 0+2+4, not just row 0); honor per-account override | `src/components/microsites/memo-section.tsx` + `page.tsx` | low |
| 3 | Component: extract reusable `<MemoPullQuote>` from `MemoPreamble` | `src/components/microsites/memo-section.tsx` | low |
| 4 | KH: cover hook overhaul (`coverHeadline` + `titleEmphasis`) | `kraft-heinz.ts` | low |
| 5 | KH: `observation.hypothesis` paragraph rewrites (kill "interesting thing"; lead with the closed-case beat) | `kraft-heinz.ts` | low (prose) |
| 6 | KH: `observation.composition` row edits (replace row 1 with op-system framing; replace row 6 with Lighthouse-as-tile; add Agile@Scale accuracy row) | `kraft-heinz.ts` | low |
| 7 | KH: ADD `artifact` section between §02 and §03 (redacted Lighthouse-tile schematic) | `kraft-heinz.ts` + `public/artifacts/kraft-heinz-lighthouse-tile.png` | medium (asset authoring) |
| 8 | KH: `comparable` tightening + Lighthouse-shaped sentence | `kraft-heinz.ts` | low |
| 9 | KH: `methodology` unknown sharpening + 1 source add | `kraft-heinz.ts` | low |
| 10 | KH: `about.authorBio` + `signOff` Torres-specific close | `kraft-heinz.ts` | low |
| 11 | KH: `personVariants[0]` Torres rewrite — `framingNarrative` + `openingHook` + `stakeStatement` | `kraft-heinz.ts` | low |
| 12 | KH: hand-authored `marginaliaItems` (5–6 items) + per-account `audioBrief` override | `kraft-heinz.ts` | low |

---

## Task 1 — Schema: per-account marginalia override

Add an optional `marginaliaItems` field to `AccountMicrositeData`. When present, replaces the auto-extracted default.

```ts
/** Per-account hand-tuned marginalia items. When present, overrides the
 *  default auto-extraction (first composition row from each observation
 *  section). Use this on Tier-1 memos where the right gutter should be
 *  authored, not derived. */
marginaliaItems?: MemoMarginaliaItem[];
```

- [ ] Add `MemoMarginaliaItem` import to `schema.ts` if not present
- [ ] Field on `AccountMicrositeData`
- [ ] Wire through `page.tsx` so `marginaliaItems={data.marginaliaItems ?? extractMarginaliaItems(memoSections)}` is the new pattern

---

## Task 2 — Renderer fix: marginalia default density

`extractMarginaliaItems` currently only pulls the first composition row of each observation section. Change the default to pull rows 0, 2, 4 (every other row) so the gutter has visible density even for accounts without a per-account override.

- [ ] Update `extractMarginaliaItems` in `memo-section.tsx:33–48`
- [ ] Verify all 40 microsites render — no overlap with body content, no empty gutters
- [ ] Vitest pass

---

## Task 3 — Component: reusable `<MemoPullQuote>`

The blockquote treatment exists only inside `MemoPreamble` (`memo-section.tsx:650–662`). Extract as a reusable component so any section can drop one between paragraphs.

```tsx
export function MemoPullQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-10 border-l-[2px] border-[color:var(--memo-accent)] pl-6 italic"
      style={{ fontFamily: 'var(--font-memo-serif)', fontVariationSettings: "'opsz' 36" }}>
      {children}
    </blockquote>
  );
}
```

- [ ] Extract from `MemoPreamble`
- [ ] Export from `memo-section.tsx`
- [ ] Reference from KH `observation.hypothesis` rendering — embed between paragraphs (will need a render-time enhancement to split hypothesis into paragraphs + interleave pull-quote markers — or simpler: add an optional `pullQuote` field to ObservationSection and render it between paragraphs 2 and 3)
- [ ] Recommend simpler: add `observation.pullQuote?: string` to schema, render between paragraphs in memo-section

---

## Task 4 — KH: cover hook overhaul

Set:
```ts
coverHeadline: 'The yard layer above Lighthouse',
titleEmphasis: 'above Lighthouse',
```

The default H1 ("Yard execution as a network constraint for Kraft Heinz") is a category headline. Torres owns Lighthouse by name — the cover should say it back to him.

Backup options (record in plan, don't ship):
- B: `'What Agile@Scale needs the yard to do next'` · emphasis `'the yard to do next'`
- C: `'Site-level yard automation is closed at Kraft Heinz. The network layer is not.'` · emphasis `'The network layer is not.'`

---

## Task 5 — `observation.hypothesis` paragraph rewrites

Replace paragraph 1 with a harder opener that names the closed case before the open question:

```
Site-level yard automation has already paid back at Kraft Heinz — twice
over, twenty years running. Manual yard checks went away. Demurrage came
down. Overflow lots disappeared. The case is closed at the site. What it
has not become, after a dozen sites and six campuses, is a network
operating model. Each site optimizes its own gate, its own dock priority,
its own multi-temp arbitration. The network doesn't agree with itself on
what good looks like — and that is the part Lighthouse cannot fix from
above and Agile@Scale cannot fix from the plan.
```

Tighten paragraph 2 stockout beat to end on the math:

```
That gap got more expensive in the last three years for two reasons.
First, Agile@Scale cut inventory roughly 20%. A 90-minute trailer delay
that used to land inside safety stock now lands on the shelf. Second,
the $3B U.S. modernization will lift throughput at the plant;
throughput-out-the-door becomes trailer-into-the-yard, and modernizing
the building without modernizing the yard layer above the sites creates
a known flow-control wall at the gatehouse.
```

Keep paragraph 3 pilot-reframing (PR #78 work) but lead with the question:

```
The third thing is the pilot question itself. DeKalb opens in 2027 as
the highest-throughput node in the portfolio — the marquee deployment.
That makes it the scale-up target once the operating model is proven,
not the proving ground. The first pilot lands at one of the smaller
no-gate, urban-connectivity sites where the carrier yard is simplest to
instrument, the displacement risk is lowest, and the operating model
can be proven without putting the marquee deployment at risk.
```

---

## Task 6 — `observation.composition` row edits

**Replace row 1** (footprint, currently generic):
```
{ label: 'U.S. manufacturing footprint', value: '~30 U.S. plants across ambient / refrigerated / frozen, ~70 globally — the operating-system surface Agile@Scale and Lighthouse already touch, and the yard layer above the sites does not.' }
```

**Replace row 6** (Carrier model — currently weak generalist row) with Lighthouse-in-the-scan:
```
{ label: 'Lighthouse coverage seam', value: 'Microsoft-built control tower; reported impact ~12% production-efficiency gain, ~$30M sales-side. Whether site-level yard feeds ladder into Lighthouse at the network layer is unanswered.' }
```

**Add a new row** (Agile@Scale accuracy beat):
```
{ label: 'Forecast adoption', value: '48.2% autonomous forecast adoption · 10.4% weekly accuracy lift at SKU-location-customer. The plan has gotten sharper; the yard has not.' }
```

Keep: Greenfield (DeKalb), Active modernization ($3B), Existing yard-tech layer, Yard archetype mix, Working-capital posture.

Final row count: 8 (was 7).

---

## Task 7 — ADD `artifact` section between §02 and §03

This is the highest-impact design move. The schema supports it (`schema.ts` `ArtifactSection`); the renderer is wired (`memo-section.tsx:472–505`); KH has none.

```ts
{
  type: 'artifact',
  headline: 'Operating-tower coverage map · 1 tile unfilled',
  imageSrc: '/artifacts/kraft-heinz-lighthouse-tile.png',
  imageAlt: 'Redacted schematic showing 6 control-tower tiles: planning, forecast, demand, inventory, OTIF filled; "Yard network ops" tile empty with hairline outline',
  caption: 'Schematic. Account names redacted. Tile composition modeled from public Lighthouse + Agile@Scale disclosures.',
  sourceLine: 'Composition · public-record sources',
},
```

**Asset to author** (`public/artifacts/kraft-heinz-lighthouse-tile.png`):
- Clean six-tile grid (2×3 or 3×2)
- 5 tiles filled with hairline-outlined labels: "PLANNING", "FORECAST", "DEMAND", "INVENTORY", "OTIF"
- 1 tile (top-right) empty / hairline only — labeled "YARD NETWORK OPS"
- Cream `#f5f1e8` background
- Accent border on the empty tile using KH red `#C8102E`
- Source attribution at bottom (small mono): "Composition · public-record sources · account names redacted"
- Dimensions: 1600×900 (renders at ~640×360 in 36rem column)

**Asset alternate** (if schematic is hard to produce):
- Redacted shipment manifest screenshot — DeKalb IL destination intact; carrier, trailer numbers, dwell timestamps preserved; everything else redacted
- Caption: "Trailer dwell at greenfield ramp · timestamps intact, attribution removed."

- [ ] Confirm `ArtifactSection` schema fields match the proposed shape
- [ ] Author or commission the PNG asset
- [ ] Add the section between current `observation` and `comparable` in `kraft-heinz.ts:sections[]`
- [ ] Visually verify on Vercel preview before merge

---

## Task 8 — `comparable` section tightening

Trim `comparableProfile` (currently ~190 words; pulls weight twice on "harder freight"):
- Cut: *"and complicated by return logistics for refillable formats"*
- Cut: closing sentence redundancy ("the read-across to ambient and refrigerated CPG is the easier lift, not the harder one")

Add one Torres-shaped sentence at the end:
```
Primo runs the operating layer Lighthouse is shaped to host — same
coordinates, harder freight.
```

---

## Task 9 — `methodology` updates

**Sharpen unknown #1:**
```
'Whether yard feeds reach Lighthouse at the network layer in a way the control-tower operator can act on without screen-switching'
```
(The "without screen-switching" detail signals we've actually built control-tower interfaces — and invites Torres to push back.)

**Add a new unknown:**
```
'Whether the OMP + o9 planning stack and Lighthouse already arbitrate yard-induced supply variance — or whether yard variance is currently absorbed into forecast error'
```

**Cut one weak unknown:** the carrier-scorecard one (downstream symptom, not a Torres pushback).

**Add one source** (Torres tenure / appointment public record):
```ts
{
  id: 'torres-tenure',
  source: 'Flavio Torres — public tenure record',
  confidence: 'public',
  detail: '~25 years at AB InBev ending as VP Supply Global; named EVP & Global CSCO at Kraft Heinz; public executive sponsor of Agile@Scale, Lighthouse, and OMP/o9 partnerships.',
  url: 'https://www.linkedin.com/in/flavio-torres-19a07012/',
},
```

Final source count: 8 (was 7).

---

## Task 10 — `about.authorBio` + `signOff` Torres-specific close

**Replace closing sentence of authorBio:**
```
Kraft Heinz is distinctive in this round because the operating-system
thinking is already on the floor — Agile@Scale for planning, Lighthouse
for visibility, OMP and o9 for orchestration. The yard is the one layer
that has not yet caught the same operating discipline. This brief sizes
that gap, not the site-level wins under it.
```

**Replace signOff entirely:**
```
Flavio — the part most worth pushing back on is whether the
operating-system discipline you carried out of twenty-five years at
AB InBev has reached the yard layer yet, or whether it stopped at the
planning and visibility tiers. That answer reshapes the rest of this.
The next step that makes sense is whatever the analysis prompts.
```

---

## Task 11 — `personVariants[0]` (Torres) rewrite

**framingNarrative:**
```
Flavio, the operating-system discipline you carried out of twenty-five
years at AB InBev — uniform standards across every brewery, every site,
every shift — is the same discipline you brought to planning at Kraft
Heinz through Agile@Scale and to visibility through Lighthouse. The
yard is the tile that has not been laid into that operating system yet.
Site-level automation closed the site-level case two decades ago. The
network operating layer above the sites is what Agile@Scale's leaner
inventory now needs and what Lighthouse is shaped to host.
```

**openingHook:**
```
Speed and scale was your phrase. At Kraft Heinz it has reached planning
and visibility — Agile@Scale, Lighthouse, OMP, o9. It has not yet
reached the yard.
```

**stakeStatement:**
```
The $3B modernization is moving throughput-out-the-door across ~30
plants. Agile@Scale removed the inventory buffer that used to absorb
yard variance. The gap between those two is the network yard layer —
and it is the only operating-system tile at Kraft Heinz that is not yet
running to a single standard.
```

**heroOverride** — keep current ("The Lighthouse tile no one has filled yet..." subheadline). It's already the strongest line on the page; the cover hook (Task 4) will surface it earlier.

---

## Task 12 — Hand-authored `marginaliaItems` + per-account `audioBrief`

**Marginalia (6 items, one per scroll segment):**

```ts
marginaliaItems: [
  { mark: 'Industry baseline',  body: '75% of yards still run on radios and clipboards.' },
  { mark: 'Greenfield',          body: 'DeKalb · $400M · opens 2027 · highest-throughput single node.' },
  { mark: 'Modernization',       body: '$3B U.S. plant investment · ~30 sites · May 2025.' },
  { mark: 'Working capital',     body: 'Agile@Scale cut inventory ~20%. Yard variance is now a working-capital line.' },
  { mark: 'Torres in his own words', body: 'Speed and scale reached planning and visibility. It has not yet reached the yard.' },
  { mark: 'Network rollout',     body: 'Primo · 24 facilities live · >200 contracted.' },
],
```

**audioBrief override:**

```ts
audioBrief: {
  intro: (
    <>
      This brief is for Flavio Torres. The operating-system discipline you
      carried out of twenty-five years at AB InBev now runs Kraft Heinz
      planning and visibility &mdash; Agile@Scale and Lighthouse. The five
      minutes that follow are about the one tile it has not yet reached.
    </>
  ),
  chapters: [
    { id: 'thesis',                label: 'I. The site-level case is closed',         start: 0 },
    { id: 'what-agile-made',       label: 'II. What Agile@Scale made expensive',     start: 65 },
    { id: 'unfilled-tile',         label: 'III. The unfilled Lighthouse tile',       start: 130 },
    { id: 'not-dekalb',            label: 'IV. Why the first pilot is not DeKalb',   start: 195 },
    { id: 'simple-site-proof',     label: 'V. What proof at the simple site earns',  start: 260 },
  ],
},
```

(Confirm `AccountAudioBrief` schema supports `intro` as ReactNode; if string-only, plain-text version available in copy audit deliverable.)

---

## Verification

```
cd C:\Users\casey\modex-gtm
npx vitest run tests/unit/microsites/ tests/unit/microsite-memo-shell.test.tsx
npx tsc --noEmit
```

Leak scans against `src/lib/microsites/accounts/kraft-heinz.ts`:
- `BlueTriton|Niagara Bottling|Pure Life|Poland Spring|Stanwood|Cabazon|Breinigsville` → 0 hits
- `book a call|schedule.*audit|annual savings|we eliminate|our solution` → 0 hits
- `MODEX|ProMat|CSCMP EDGE|RILA LINK` → 0 hits

Visual verification on Vercel preview:
- [ ] Cover H1 reads "The yard layer **above Lighthouse**" with "above Lighthouse" italic + accent
- [ ] Right marginalia gutter shows 5–6 hand-tuned items across the scroll, not 1
- [ ] Artifact section renders between observation and comparable with the redacted Lighthouse-tile image
- [ ] Audio register intro is Torres-specific, chapters are 5 KH-specific titles
- [ ] No sales-tell, no event-leak, no anchor-name leak

---

## Branch + PR

- Branch: `feat/microsite-kraft-heinz-a-plus`
- Per-task commits (12) for clean reviewability
- One PR against `main`
- Verify on Vercel preview before merging
- Goal: ship within one work session

---

## Out of scope (future)

- Apply the same A+ treatment to other Tier-1 Band A accounts (ab-inbev, coca-cola, kimberly-clark) — Phase 6
- Per-account audio recordings (currently every microsite plays the canonical brief) — Phase 6 or Phase 7
- Backfill artifact sections across the remaining 39 accounts — Phase 6
