# DWTB.dev Brand Kit

## Purpose

This document is the canonical brand kit for DWTB.dev. It consolidates the live visual system, the operating rules for new assets, and the practical constraints that keep site pages, OpenGraph cards, proof assets, and campaign visuals coherent.

Use this file when you need to:

- design a new page or section
- build a social or OpenGraph asset
- create a proof card or screenshot treatment
- write copy that needs to sound like DWTB
- verify whether a new visual move belongs in the system

This document is intentionally broader than the brand-lab baseline and intentionally more practical than the implementation program. It should be the first file opened before new brand work starts.

## Owner And Update Path

- Brand owner: Casey
- Implementation owner: Clawd workflow owner
- Update path: update this doc alongside `brand/tokens.json`, `lib/brand-tokens.ts`, and any audited generator or site visual change that introduces a new approved baseline token or pattern.

## Source Of Truth

- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/about/page.tsx`
- `app/api/og/route.tsx`
- `app/components/ProofCard.tsx`
- `app/components/RiskReversal.tsx`
- `brand/tokens.json`
- `docs/brand-guidelines-program-plan.md`
- `docs/brand-component-audit.md`
- `docs/brand-qa-checklist.md`
- `docs/proof-review-checklist.md`
- `docs/proof-source-taxonomy.md`
- `docs/clawd-brand-operations.md`

## Brand Thesis

DWTB.dev should feel like a sharp, operator-led freight studio that understands market pressure, commercial stakes, and the difference between attractive work and work that changes how buyers respond.

The brand does not aim for broad SaaS polish or agency softness. It should feel like disciplined commercial infrastructure: dark, exacting, proof-forward, and selective with intensity.

## One-Page Summary

If there is only time to remember a few things, remember these:

1. Dark surfaces do most of the work.
2. `#00FFC2` is a signal color, not a wallpaper color.
3. Proof, named context, and commercial clarity come before decoration.
4. Headlines should feel compressed, decisive, and expensive.
5. Every asset should answer one job clearly: proof, positioning, system, invitation, or authority.
6. The brand can be opinionated in copy, but it should remain composed in visuals.

## Positioning Translation

- DWTB should feel operator-led, not agency-soft.
- FreightTech, logistics, and asset-based teams are the audience.
- Proof, system logic, and operational clarity should dominate aesthetics.
- The site should read like an operational interface with disciplined atmosphere, not a generic startup marketing site.
- The work should feel like it came from someone who knows the category from reps, not just research.

## Name System

### Primary Naming

- Brand name: DWTB?! Studios
- Primary domain expression: DWTB.dev
- Spoken expansion: Dude, What's The Bid?!

### Usage Rules

- Use `DWTB?!` when the punch and recognition matter most.
- Use DWTB.dev when the context is URL-forward, product-like, or operational.
- Use DWTB?! Studios when the full company identity needs to read clearly in metadata, legal pages, or external references.
- Do not create alternate spellings, punctuation variants, or substitute marks.

### Lockup Guidance

- The strongest lockup remains the text-led wordmark: DWTB + cyan `?!` + subdued Studios suffix.
- The `?!` is the brand spark. It should not be detached and used as a standalone decorative stamp unless the surrounding context already clearly identifies DWTB.
- The Studios suffix should remain quieter than the DWTB mark.

### Identity Assets

Current approved identity assets already present in the repo:

- `public/dwtb-linkedin-logo-mark-only.png`
- `public/dwtb-linkedin-logo-with-studios.png`
- `app/icon.tsx` for the favicon mark
- `app/apple-icon.tsx` for the app icon mark
- `public/brand/dwtb-wordmark-studios-light.svg`
- `public/brand/dwtb-wordmark-studios-dark.svg`
- `public/brand/dwtb-wordmark-core-light.svg`
- `public/brand/dwtb-mark-light.svg`
- `public/brand/dwtb-mark-dark.svg`
- `public/brand/dwtb-lockup-rail-light.svg`
- `public/brand/dwtb-wordmark-studios-light-outlined.svg`
- `public/brand/dwtb-wordmark-studios-dark-outlined.svg`
- `public/brand/dwtb-wordmark-core-light-outlined.svg`
- `public/brand/dwtb-wordmark-core-dark-outlined.svg`
- `public/brand/dwtb-mark-light-outlined.svg`
- `public/brand/dwtb-mark-dark-outlined.svg`
- `public/brand/dwtb-lockup-rail-light-outlined.svg`
- `public/brand/dwtb-lockup-rail-dark-outlined.svg`
- `public/brand/*.pdf` handoff masters generated from the outlined SVG set

Identity guidance:

1. The default brand expression is wordmark-first, not icon-first.
2. The favicon and compact icon treatment may reduce to the `D` plus cyan `?!` expression when space is constrained.
3. When using a logo image, prefer the version with the Studios suffix in formal or company-identifying contexts.
4. Use the mark-only variant when the surrounding context already makes the brand obvious.
5. Use the light SVG set on dark surfaces and the dark SVG set on light surfaces.
6. The rail lockup is for headers, one-pagers, and controlled presentation surfaces, not for every use case.

### Identity Selection Matrix

| Asset | Use When | Avoid When |
|---|---|---|
| Studios wordmark | formal pages, proposals, decks, partner placements | tiny placements under `180px` wide |
| Core DWTB wordmark | headers, merch concepts, controlled promo surfaces | legal or vendor-facing company identification |
| Compact mark | favicon-scale, avatar, social profile, chip-like contexts | first-touch company identification |
| Rail lockup | one-pagers, keynote headers, controlled campaign covers | cramped layouts or responsive nav use |

### Identity Do And Do Not

Do:

- keep the `?!` clearly separated from the `B`
- use the subdued Studios suffix as supporting information rather than a co-equal mark
- place logos on calm surfaces with enough margin to read at a glance
- choose the asset variant based on context, not personal preference

Do not:

- let the `?!` collide with the DWTB letterforms
- recolor the Studios suffix with the accent color
- use the rail lockup as a default substitute for the main wordmark
- introduce outlines, bevels, shadows, or decorative effects on the mark itself

### Clear Space And Size Rules

1. Keep clear space around the logo equal to at least the width of the `?!` cluster.
2. Do not place the wordmark over noisy imagery without a controlled dark plate.
3. Do not compress, stretch, outline, or add outer glow to the logo itself.
4. Minimum practical width for the full Studios lockup: `180px` digital.
5. Minimum practical width for the core DWTB lockup: `120px` digital.
6. Minimum practical width for the compact mark: `32px` digital.

### Vector Pack Notes

The SVG pack now includes two classes of files:

- live text-based SVGs for fast internal iteration and repo-native edits
- outlined master SVGs for print-critical use, external vendor handoff, and any environment where font substitution could shift the `?!` spacing

Rules for release:

1. Use the standard SVGs for day-to-day digital use when editability matters.
2. Use the `*-outlined.svg` masters for printers, merch vendors, slide tools, or external design systems.
3. Use the matching outlined PDF when the recipient wants a print-ready handoff file and should not need to manage SVG placement.
4. Do not treat the outlined masters as a stylistic outline effect. They are geometry-locked vector conversions of the approved mark.
5. If the live text SVGs are revised, regenerate the outlined masters and PDFs before the next external handoff.

## Audience And Emotional Target

### Audience

- FreightTech founders and operators
- logistics and transportation teams
- asset-based companies with real operating depth
- buyers who are tired of generic logistics marketing language

### Intended Feeling

- technically literate
- commercially serious
- visually controlled
- evidence-driven
- sharper than competitors without becoming theatrical

## Voice To Visual Translation

When the copy says one of these things, the visuals should reinforce the same idea:

- wired end to end: routing, continuity, sequence, linkage, and flow
- operator-led: instrumentation, disciplined panels, judgment, control points
- proof: names, screenshots, metrics, receipts, artifacts, and context framing
- sharper story: compressed headlines, clear hierarchy, stronger contrast, less noise
- freight-native: industrial tension, systems atmosphere, and category fluency without truck-stock cliches

## Brand Personality

The system should balance these traits:

- precise, not cold
- aggressive, not chaotic
- premium, not ornamental
- modern, not trendy
- opinionated, not messy

## Core Visual Principles

### 1. Dark Operational Environment

The default environment is near-black with controlled depth shifts. Surfaces should feel atmospheric and expensive, but never cloudy or muddy.

### 2. Electric Signal Accent

The cyan-green accent is a signal event. It should direct attention, mark action, or imply live state. It should not coat entire layouts.

### 3. Proof Before Ornament

Named proof, system artifacts, screenshots, metrics, and directional cues should carry more weight than decorative layers.

### 4. Hard Structure

Layouts should feel modular, card-led, bordered, and intentional. Freeform collage is off-brand.

### 5. Controlled Atmosphere

Glow, blur, grain, and gradients are allowed only when they reinforce depth, tension, or focus. Atmosphere should never overpower the message.

## Baseline Tokens

### Colors

| Token | Value | Usage |
|---|---|---|
| Background primary | `#050505` | body, major sections |
| Theme zinc base | `#050510` | root Tailwind theme background token |
| Background secondary | `#020202` | alternate section depth |
| Accent | `#00FFC2` | emphasis, labels, CTAs, active state |
| Accent highlight | `#8fffe2` | OG accent bar midpoint |
| Text primary | `#ffffff` | headings and key metrics |
| Text secondary | `#a1a1aa` | paragraph body |
| Text tertiary | `#71717a` | metadata and subdued labels |
| Text muted OG | `#888` | OG studio suffix |
| Text soft accent | `#9fffe8` | OG pill label |
| Text chip neutral | `#d4d4d8` | OG chips |
| Border dark | `#27272a` | frames and separators |
| Grid line | `#111` | OG background grid |
| Accent field min | `rgba(0,255,194,0.05)` | soft fills |
| Accent field low | `rgba(0,255,194,0.06)` | badge fill |
| Accent field mid | `rgba(0,255,194,0.12)` | radial glow |
| Accent field raised | `rgba(0,255,194,0.16)` | hero atmosphere |
| Accent field high | `rgba(0,255,194,0.18)` | stronger glow |
| Accent field max | `rgba(0,255,194,0.22)` | bordered pill treatment |
| Accent field zero | `rgba(0,255,194,0)` | OG glow falloff |
| Accent field proof | `rgba(0,255,194,0.25)` | soft proof shadow |
| Accent field bright | `rgba(0,255,194,0.45)` | stronger proof glow |
| Accent field brightest | `rgba(0,255,194,0.55)` | industry signal glow |
| Accent signal shadow | `rgba(0,255,194,0.9)` | compact signal shadow |
| Accent ultra-subtle | `rgba(0,255,194,0.04)` | faintest accent fills |
| Accent subtle glow | `rgba(0,255,194,0.07)` | subtle radial glow |
| Accent light fill | `rgba(0,255,194,0.08)` | light accent fill |
| Accent glow mid | `rgba(0,255,194,0.15)` | mid-level glow |
| Accent glow raised | `rgba(0,255,194,0.2)` | raised glow depth |
| Accent glow strong | `rgba(0,255,194,0.3)` | strong glow |
| Accent glow bright | `rgba(0,255,194,0.4)` | bright accent glow |
| Accent hover glow | `rgba(0,255,194,0.5)` | hover state glow |
| Accent field min (sp) | `rgba(0, 255, 194, 0.05)` | spaced variant |
| Accent field mid (sp) | `rgba(0, 255, 194, 0.12)` | spaced variant |
| Accent glow mid (sp) | `rgba(0, 255, 194, 0.15)` | spaced variant |
| Accent glow raised (sp) | `rgba(0, 255, 194, 0.2)` | spaced variant |
| Accent field proof (sp) | `rgba(0, 255, 194, 0.25)` | spaced variant |
| Accent glow strong (sp) | `rgba(0, 255, 194, 0.3)` | spaced variant |
| Accent glow bright (sp) | `rgba(0, 255, 194, 0.4)` | spaced variant |
| Error accent | `rgba(239,68,68,0.15)` | error state glow |
| Surface overlay dark | `rgba(10,10,10,0.72)` | OG pill and chip surface |
| Card depth shadow | `rgba(0,0,0,0.28)` | card elevation shadow |
| Shadow tint | `rgba(0, 0, 0, 0.03)` | subtle shadow tint |
| Dark overlay | `rgba(0, 0, 0, 0.5)` | dark overlay |
| Border light overlay | `rgba(255,255,255,0.08)` | OG chip border |
| White ghost | `rgba(255,255,255,0.01)` | ghost white overlay |
| White faint | `rgba(255,255,255,0.02)` | faint white overlay |
| White subtle | `rgba(255,255,255,0.03)` | subtle white overlay |
| White soft | `rgba(255,255,255,0.05)` | soft white overlay |
| White card surface | `rgba(255,255,255,0.06)` | card surface overlay |
| White card surface (sp) | `rgba(255, 255, 255, 0.06)` | spaced variant |
| White border (sp) | `rgba(255, 255, 255, 0.08)` | spaced variant |

### Color Rules

1. `#00FFC2` is a signal color only. Use it for labels, active states, stat emphasis, key hover states, and instrumentation accents.
2. Neutral surfaces should do at least 80 percent of the visual work in any composition.
3. Cyan should generally do no more than 20 percent of the visual work.
4. Do not introduce secondary bright accent colors without a documented brand update.
5. When in doubt, remove cyan before adding more of it.

### Typography

- Sans family: `var(--font-geist-sans)`
- Mono family: `var(--font-geist-mono)`
- Display copy should feel compressed and decisive.
- Mono should be reserved for labels, chips, proof markers, and instrumentation language.
- No exported social text should fall below `14px` equivalent at full size.

### Font Source And Fallbacks

The live site loads these fonts through `next/font/google`:

- Geist Sans via `--font-geist-sans`
- Geist Mono via `--font-geist-mono`

Current fallback stacks:

- Sans: `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
- Mono: `var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`

### Font Role Matrix

| Role | Family | Weight | Tracking | Notes |
|---|---|---|---|---|
| Display XL | Geist Sans | `800` to `900` | `-0.03em` or tighter | hero lines, OG title system |
| Heading | Geist Sans | `700` to `800` | `-0.01em` to `-0.02em` | section headers and card titles |
| Body | Geist Sans | `400` to `500` | normal | paragraph and support copy |
| Mono label | Geist Mono | `600` | `0.22em` to `0.25em` uppercase | eyebrows, chips, proof labels, system states |

### Typography Scale

| Role | Desktop | Mobile | Typical Use |
|---|---|---|---|
| Display XL | `90px` | `48px` | hero lines, OG titles, flagship quote cards |
| Display LG | `72px` | `40px` | major section leads, social cover titles |
| Heading LG | `48px` | `32px` | major section headings |
| Heading MD | `32px` | `24px` | card titles, subheads |
| Body LG | `24px` | `18px` | lead support copy |
| Body MD | `18px` | `16px` | standard body copy |
| Label Mono | `14px` | `12px` | proof labels, chips, metadata |

### Typography Rules

1. Headlines should feel decisive, not literary.
2. Limit line count before shrinking impact. Rewrite before endlessly scaling down.
3. Mono should behave like instrumentation, not like paragraph text.
4. Use tracking to signal system state or metadata, not to make decorative headlines.
5. Never substitute a decorative or editorial serif into the primary system without a documented brand update.

## Messaging Guardrails

### Approved Language Patterns

- operator-led
- proof-first
- buyer-visible gaps
- sharper story
- demand signals
- positioning critique
- category-native

### Avoid In Customer-Facing Copy

- market-facing
- market-facing layer
- agency-sounding abstraction with no commercial consequence
- vague transformation language that does not name the business effect

### Copy Rules

1. Prefer direct commercial language over consultant phrasing.
2. Name the problem, cost, or gap before naming the service.
3. When describing outcomes, use buyer behavior, demand quality, proof, clarity, conversion, or trust.
4. If a phrase sounds like generic B2B brand strategy language, rewrite it.

### Spacing

Approved scale:

- `0`
- `4`
- `8`
- `12`
- `16`
- `24`
- `32`
- `48`
- `64`
- `96`

Spacing rules:

1. Component internals should stay on the approved scale.
2. Section padding should come from `24`, `32`, `48`, `64`, or `96`.
3. Social-card safe padding should never drop below `40px` at full export size.

### Radii And Edges

- cards: restrained radii only
- pills and chips: rounded-full treatment only for signal labels or status objects
- buttons: compact and hard-edged, not bubbly

Rules:

1. Rounded-full is for chips, badges, and system labels.
2. Main content cards should read rectangular first.
3. Hard edge plus thin border is preferred over large soft radius.

### Borders, Shadows, And Effects

Approved effect utilities:

- `blur-3xl`
- `backdrop-blur`
- `backdrop-blur-md`
- `shadow-[0_0_20px_-18px_rgba(0,255,194,0.9)]`
- `shadow-[0_0_30px_-5px_#00FFC2]`
- `shadow-[0_0_40px_-10px_#00FFC2]`
- `shadow-[0_0_20px_-5px_#00FFC2]`
- `shadow-[0_0_20px_-5px_rgba(0,255,194,0.4)]`
- `shadow-[0_0_20px_-5px_rgba(239,68,68,0.15)]`
- `shadow-[0_0_20px_-8px_rgba(0,255,194,0.2)]`
- `shadow-[0_0_30px_-5px_rgba(0,255,194,0.5)]`
- `shadow-[0_0_40px_-5px_rgba(0,255,194,0.5)]`
- `shadow-[0_0_40px_-30px_rgba(0,255,194,0.55)]`
- `shadow-[0_0_50px_-25px_rgba(0,255,194,0.25)]`
- `shadow-[0_0_50px_-30px_rgba(0,255,194,0.45)]`
- `shadow-[#00FFC2]`
- `shadow-[0_18px_50px_rgba(0,0,0,0.28)]`

Effect rules:

1. Borders should define structure first.
2. Glows should emphasize state or focus second.
3. Large text blocks should not rely on shadows for presence.
4. Blur is an atmosphere layer, not a readability crutch.

### Gradient Baseline

Approved baseline gradients:

- `radial-gradient(circle at top left, rgba(0,255,194,0.12), transparent 35%)`
- `radial-gradient(circle, rgba(0,255,194,0.18), rgba(0,255,194,0))`
- `linear-gradient(to right, #111 1px, transparent 1px), linear-gradient(to bottom, #111 1px, transparent 1px)`
- `linear-gradient(90deg, #00FFC2 0%, #8fffe2 45%, #00FFC2 100%)`

Gradient rules:

1. Gradients should feel infrastructural, not painterly.
2. Use cyan gradients as controlled glow fields or signal rails.
3. Never use a gradient where a flat surface would communicate more clearly.

## Texture And Motion

### Approved Atmospheric Elements

- film grain overlay
- subtle scanline texture
- restrained cyan glow pockets
- soft radial fields
- faint structural grids

### Motion Rules

1. Motion should support emphasis, not entertain for its own sake.
2. Favor subtle drift, hover lift, and directional sweep over springy micro-interactions.
3. The calm state of the interface should still feel premium without animation.

## Composition Rules

### Layout

- full-bleed dark sections
- modular cards with thin borders
- dense display copy with supporting body copy
- proof blocks adjacent to argument blocks
- clear progression from framing to evidence to action

### Layout Rules

1. Prefer modular systems over freeform editorial collage.
2. Every section should open with a label, then a hard headline, then support copy.
3. Decorative treatment should occupy less perceptual weight than the proof or message.
4. Primary message or proof should occupy roughly 40 to 60 percent of the composition.
5. Decorative atmosphere should occupy less than 10 percent of perceptual emphasis.

### Grid And Rhythm

- strong horizontal rhythm
- deliberate asymmetry when it improves force or focus
- left alignment by default
- centered composition only when making a single symbolic point

## Component Language

### Core Components

- proof cards
- risk reversal cards
- glass cards for secondary support
- operator labels and mono chips
- hard CTA buttons with bright contrast
- framed screenshot shells

### Buttons

| Variant | Background | Text | Border | Role |
|---|---|---|---|---|
| Primary | white or `#00FFC2` | black | none | strongest action |
| Secondary | dark surface | zinc-200 | zinc-800 | support action |
| Tertiary | transparent | zinc-500 | none | utility action |
| Disabled | muted dark fill | zinc-500 | zinc-800 | inactive state |

Rules:

1. Primary buttons carry real visual weight.
2. Focus and active states should use cyan as the signal.
3. Secondary actions should never visually compete with the primary move.

### Chips And Labels

- use mono uppercase
- keep brief and directional
- treat them like console readouts, not cute tags

Approved label style cues:

- selected public proof
- live infrastructure
- service 01
- internal brand lab
- what changes for you

## Iconography

The current system relies on Lucide-style iconography and sparse symbolic use.

Rules:

1. Foreground icons can use cyan only when indicating emphasis or active state.
2. Secondary icons should stay white or muted zinc.
3. Decorative oversized icons should stay between 5 and 10 percent opacity.
4. Keep stroke weight visually consistent within a single composition.

## Image And Illustration Rules

### What Belongs

- evidence-driven visuals
- framed screenshots
- industrial or infrastructural abstraction
- artifact-led composition
- proof objects with a clear focal zone

### What Does Not Belong

- generic SaaS illustration
- playful mascots
- stock freight hero shots used literally
- rainbow dashboards
- busy data-viz that obscures the argument
- decorative truck imagery with no proof value

## Proof System

### Proof Tiers

- Tier A: named founder quote, public article mention, public appearance, timestamped public proof
- Tier B: public social interaction, named artifact, screenshot-backed proof with public context
- Tier C: anonymized client result, pre-launch work with permission, internal screenshot with publication approval
- Tier D: unverified claim, unattributed metric, private exchange without permission

Publishing rule summary:

- Tier A and Tier B can power public-facing proof assets.
- Tier C requires ambiguity mode, disclosure framing, and permission attestation.
- Tier D is not publishable.

### Screenshot And Proof Treatment

- Screenshots must be cropped around the proof.
- Sensitive information must be masked before export.
- Proof should sit inside a dark shell with thin borders and restrained accenting.
- Raw screenshots should not ship without context framing.
- The framing should explain why the proof matters, not just show that it exists.

### Ambiguity Mode

Required behavior for ambiguity mode:

1. Apply a visible disclosure label.
2. Mask names, handles, email addresses, and private UI details called out in the config.
3. Emit alt text that describes the asset without leaking the masked details.
4. Fail export if the asset is marked ambiguous but no disclosure label is provided.

Approved disclosure labels:

- `ANONYMIZED CLIENT PROOF`
- `PRE-LAUNCH PROOF`
- `PRIVATE OPERATOR PROOF`

## Safe Zones And Export Sizes

All key content must remain inside these safe zones:

| Asset | Canvas | Safe Zone |
|---|---|---|
| OpenGraph | `1200x630` | `1100x550` |
| LinkedIn square | `1200x1200` | `1100x1100` |
| LinkedIn landscape | `1200x627` | `1100x547` |
| X landscape | `1200x675` | `1100x595` |
| Story / reel cover | `1080x1920` | `980x1720` |

Export rules:

1. Text must remain readable at 50 percent scale.
2. Attribution must remain inside the safe zone.
3. Headline line height should remain between 1.0 and 1.4.
4. Every asset should still read in thumbnail crop.

## Accessibility Rules

1. Preserve strong color contrast on dark surfaces.
2. Do not rely on glow alone for meaning.
3. Alt text should describe the proof or object, not just its style.
4. If a screenshot contains the key evidence, the framing and alt text should explain what is being proven.
5. Decorative layers must never reduce headline or proof readability.

## Asset Classes

### Website Sections

- hero
- proof strip
- service sections
- founder authority blocks
- CTA blocks

### Social Assets

- quote cards
- proof cards
- artifact cards
- carousel covers
- show promos

### Metadata Assets

- OpenGraph cards
- Twitter large summary cards
- page-level social variants when a route needs a more specific angle

### Identity Assets

- wordmark lockups
- favicon and app icon
- LinkedIn logo exports
- banner-safe brand expressions for profile surfaces

## Working Rules For New Assets

Before creating a new asset, answer these in order:

1. What is the single job of this asset?
2. What proof or authority object makes that believable?
3. What does cyan need to emphasize?
4. What can be removed to sharpen the message?
5. Does the asset still look like DWTB if the motion is removed?

If any answer is unclear, the asset is not ready to build.

## Site Review Checklist

Use this for live page reviews before publishing or when auditing existing routes:

1. Does the page use approved naming: `DWTB?!`, `DWTB.dev`, or `DWTB?! Studios` in the right context?
2. Does the primary CTA sound like DWTB and match the approved action language?
3. Are proof, screenshots, or named context carrying enough weight relative to decorative treatment?
4. Is cyan being used as a signal rather than a background habit?
5. Are headlines compressed, specific, and commercially legible?
6. Does the page avoid banned jargon and generic strategy filler?
7. Would the page still read as DWTB if the glow effects were removed?

## Quick Production Workflow

1. Start from the nearest existing config in `brand/examples/`.
2. Confirm proof tier and publication state before design choices.
3. Use `brand/tokens.json` and `lib/brand-tokens.ts` before introducing literal values.
4. Review against the safe-zone and proof checklists.
5. Run brand validation before publishing.

## Do And Do Not

### Do

- lead with proof, systems, and named context
- use dark surfaces with measured cyan emphasis
- keep compositions modular and hard-edged
- make headlines decisive and compressible
- use screenshots and real artifacts as primary visual material
- treat social proof as design content, not just copy content

### Do Not

- drift into generic agency minimalism
- replace operational proof with abstract beauty shots
- overuse cyan glows or neon effects
- use multiple bright accent colors
- soften the system with playful illustration
- use stock logistics imagery unless it is transformed into a secondary support texture

## Canonical Companion Files

- `docs/brand-guidelines-program-plan.md` for implementation roadmap and sprint structure
- `docs/brand-component-audit.md` for what to reuse, extend, or replace
- `docs/brand-qa-checklist.md` for asset review gates
- `docs/proof-review-checklist.md` for proof publication QA
- `docs/proof-source-taxonomy.md` for proof tier decisions
- `docs/clawd-brand-operations.md` for generation workflow
- `brand/tokens.json` for machine-readable design tokens

## Verification Scope

The baseline verification pass only scans the audited baseline files for:

- literal hex color tokens
- literal `rgba(...)` tokens
- approved effect utility classes

Any token in those categories used by the audited files must appear in this document.