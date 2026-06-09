# The BLUF rubric — how every account memo opens

Source: Mark Shaughnessy feedback call on `/for/dannon`, June 2026. Dannon is
the reference implementation (`src/lib/microsites/accounts/dannon.ts`). This
file is the rubric for rolling the same opening across the other ~42 accounts.

## The problem Mark named

A senior operator (COO, SVP supply chain, procurement director) opens the link
cold. They will not watch a 10-minute video or read a dense memo to decide if
they're interested — they spend that time only *after* they're hooked. The old
memo led with depth and an internal metaphor ("the yard tile"). The value did
not "hit them in the face." So:

> **Bottom line up front.** Tell them what you're going to tell them, then tell
> them. Four punchlines to a CEO: *you have a problem · we have a unique
> solution · the prize is huge · getting started is easy.* It's a no-brainer.

The depth still belongs on the page — it signals we take the account seriously
and aren't sending a recycled PowerPoint. It just moves *below* the brief. USA
Today on top; New York Times underneath.

## The structure: the `executive-brief` section

A new memo section type (`ExecutiveBriefSection` in `schema.ts`, rendered by
`MemoExecutiveBrief` in `memo-section.tsx`). It is **always section 1**, above
`yns-thesis`. Five beats, fixed order:

| Beat | Field | What it does |
|---|---|---|
| 1. Problem | `headline` + `problem[]` | The yard is the one operating system they haven't standardized. Plain language. No jargon. Problem-first — always. |
| 2. Why now | `marketRisk` | Tightening freight market → a slow yard makes you expensive to serve (detention, tender rejections, spot-market). A fast yard makes you the **shipper of choice** and mitigates carrier-capacity risk without capex. |
| 3. What we are | `identity` | The category claim + who we are, **overtly**. Plus `proofLinks` to the live product. |
| 4. The prize | `prize` | The business case, **pre-computed for them**. Stat grid + sized $ range + soft IRR framing. Never make them open a calculator to feel the value. |
| 5. Why it's easy | `ease` | Start at one site, prove in 30–60 days, no rip-and-replace. The no-brainer close. |

## Positioning (locked June 2026)

**Replace-forward, problem-first.** We are *not* "a layer above your YMS / not a
YMS." That coexistence-wedge framing is retired.

- **We are the Yard Network System (YNS).** A complete, modern YMS that
  **replaces** legacy site-level systems, *plus* the standardized driver
  experience (flowDRIVER), gate/carrier accountability (flowGATE), the passive
  digital twin (flowTWIN), network simulation (flowSIM), and a live network
  command view — priced to run **every** site, not just the flagship.
- **YMS is a single-site tool; YNS is the network category above it.** That is
  the Play Bigger line — it inoculates against "oh, you must be a YMS/TMS/WMS."
- **The glue.** YNS is the execution layer between TMS, WMS, and planning and
  the physical trailer.
- **Land motion stays low-friction.** "Replaces legacy YMS" is the *capability
  and the outcome*, not the opening demand. Lead the `ease` beat with a
  single-site start (greenfield where one exists) and zero displacement risk.

## Show, don't tell

The live product is the receipt for beat 3. Always include `proofLinks`:

- `https://www.yardflow.ai/YNS/ui_kits/operator-app/` — network console (map,
  flowSIM, flowTWIN, flowGATE)
- `https://www.yardflow.ai/YNS/ui_kits/flowdriver/` — driver experience
- `/demo/<slug>` — the account's own network modeled, when a demo pack exists
  under `public/demo-packs/<slug>.json`

**Keep the heavy interactive map where it belongs — at `/demo/<slug>` — and
*link* to it from the BLUF. Do NOT embed it in the cream memo.** The dark
Leaflet `demo-embed` both clashes with the editorial aesthetic and, more
importantly, renders a dark loading/error stub when the client fetch is slow or
tiles are unavailable on deploy — recreating exactly the "didn't populate"
failure Mark flagged. The reliable §04 visual is the **static, server-rendered
coverage-map artifact** (`/artifacts/<slug>-coverage-map.svg`): it ships, it
matches the aesthetic, and it reinforces the problem-first thesis (N operating
systems standardized, the yard not).

### The coverage-map SVG bug (root cause of "looked like a prompt")

The shared coverage-map SVG template carries **raw ampersands** in its
`aria-label` (`S&OP`, `Quality & Food Safety`). A raw `&` makes the SVG invalid
XML, so the browser refuses to render it inside an `<img>` and shows the
broken-image glyph + the long alt text — which reads exactly like an
un-rendered prompt. **Before using any account's coverage map, escape the
ampersands (`&` → `&amp;`) in the `aria-label`, and give the `<svg>` explicit
`width`/`height` so it has intrinsic dimensions.** Verify in a browser that
`img.naturalWidth > 0`. This affects every `public/artifacts/*-coverage-map.svg`.

While you're in the SVG, de-jargon the copy: "TILES" → "SYSTEMS", "covered" →
"standardized", "unfilled" → "not standardized", and name the unfilled box
"THE YARD".

## Sizing the prize (beat 4)

Pre-compute, don't defer. Pull from the account's `roiModel` + public margins.

- **Per-site anchor:** `$1M+ profit impact` and `48 → 24 min` turn time are
  *measured* at Primo Brands (the nameable public comparable). State them as
  measured.
- **Network range:** per-site value × site count at a conservative 50%
  turn-time improvement → an 8-figure annual range (Dannon: $15M–$25M across 13
  plants). Always give a range, always say "modeled."
- **Payback:** `< 6 months`.
- **IRR:** give the *range*, not a hard price. "Against a SaaS cost, deployments
  like this model in roughly a 20–40% IRR — the range that wins the competition
  with robotics, TMS, and automation projects. We'll build your exact number with
  your team." This satisfies Mark's "every project competes for IRR" point
  without publishing an implied SaaS price on a shareable page.

## Page order — text first, audio/video second

The audio/video brief must render **below §01 (the BLUF)**, never above it. A
busy exec decides from the written punchlines; the listen/watch option is for
*after* they're hooked ("if you'd rather"). Mechanically: the page passes the
audio brief to `MemoSectionList` via the `afterFirst` prop (renders after the
first section), and `buildTocEntries(..., { audioAfterFirst: true })` slots the
TOC entry after §01. Reframe each account's `audioBrief.intro` to be
account-level (not addressed to one named person on the default link) and honest
about length — don't claim "short" for a 20-minute narration.

## Writing rules (from the call)

- **Problem first.** The yard is *their* problem before we are anyone's
  solution.
- **5th–8th grade reading level up top.** Short sentences. The value should be
  unmissable. Save the density for the sections below.
- **No internal metaphors in the lead.** "Tile," "coverage map," "operating-
  system surface" confused the reader. If a metaphor is account-internal
  vocabulary, verify it before using it; otherwise cut it.
- **Be overt about who we are and what we uniquely do.** The page can still read
  as a working analysis, not a brochure — but identity must be unambiguous.
- **Shipper-of-choice / freight-cost angle is standing copy**, not optional. It
  lands hardest with procurement/transportation buyers and is timely while rates
  rise.
- **Editorial guardrails still apply** (`docs/editorial-style.md`): never name
  the un-name-able 237-facility anchor; Primo Brands is the public comparable;
  event- and date-agnostic copy.

## Per-account rollout checklist

For each of the remaining accounts:

1. Add an `executive-brief` as `sections[0]`. Fill all five beats from the
   account's research, `network`, `freight`, `signals`, and `roiModel`.
2. Rewrite `coverHeadline` + `titleEmphasis` problem-first; drop any "tile" /
   "operating-system surface" jargon.
3. Refresh `pageTitle` + `metaDescription` to the YNS / shipper-of-choice frame.
4. Keep §04 as the static coverage-map `artifact`; fix its SVG (escape `&` in
   `aria-label`, add `width`/`height`, de-jargon copy) and confirm it renders.
   Link the interactive `/demo/<slug>` from the BLUF instead of embedding it.
5. Move the audio/video brief below §01 (`afterFirst` + `audioAfterFirst`) and
   reframe `audioBrief.intro` account-level + honest about length.
6. Sweep the deep sections (`observation`, `comparable`, `about`, `audioBrief`,
   and every `personVariant`) for the retired "layer above / not a YMS / not
   displacement" framing and the word "tile." Re-spine to replace-forward YNS.
7. Verify: `npx tsc --noEmit`, the microsite unit tests,
   `node scripts/validate-microsite-coverage.mjs`, and a Playwright render check
   that the coverage-map `<img>` has `naturalWidth > 0` and `/demo/<slug>` loads.

## Known follow-ups

- The Dannon non-Heiko `personVariant`s (Whitney, Jacqueline, Annette, Jay)
  still carry legacy "network operating model / visibility-layer" language in
  their framing. They don't render on the bare `/for/dannon` link and aren't
  contradictory enough to block, but they should get the same re-spine in the
  rollout pass.
- Confirm the `demo-embed` populates on the live deploy (tiles fall back to live
  Google Static Maps URLs; the pack JSON ships).
