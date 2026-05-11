# Microsite Fix — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 7 highest-leverage P0 systemic fixes from the 2026-05-11 master punch list (3 ship-stoppers + 4 schema/structural pieces), plus 4 accessibility-failing accent color corrections, so the design system is ready to absorb Phase-2 (T2 voice rewrites) and Phase-3 (16-account section migration).

**Architecture:** Surgical edits to existing component files (no new dependencies), two schema field additions (`titleEmphasis`, `coverHeadline`, `artifact` section type), one new component (`MemoMarginalia`) that fills the empty desktop gutter by auto-extracting from `section.composition`. All changes are incremental against the existing memo metaphor — no redesigns.

**Tech Stack:** Next.js 16 App Router, Tailwind, Fraunces/Mona Sans/JetBrains Mono via CSS vars, TypeScript strict. Vitest for schema unit tests (where applicable).

**Master punch list:** `docs/audits/2026-05-11-microsite-master-punch-list.md` (commit `3e1db42`)
**Source audits:** design-critique-punch-list (commit `b184b42`), ux-copy-punch-list (commit `b184b42`)

---

## File structure

**Modified by this plan:**

| File | Tasks | Purpose |
|---|---|---|
| `src/components/microsites/memo-shell-chrome.tsx` | T1 | Mobile running header overflow fix |
| `src/components/microsites/memo-shell.tsx` | T2, T4, T6, T7 | Nudge animation cap; Draft badge relocation; title emphasis support; marginalia grid wiring |
| `src/components/microsites/memo-soft-action.tsx` | T3 | Focus ring on CTA `<a>` |
| `src/components/microsites/memo-audio-brief.tsx` | T3 | Focus ring on chapter seek buttons |
| `src/lib/microsites/schema.ts` | T6, T7 | Add `titleEmphasis`, `coverHeadline`, `artifact` section type |
| `src/components/microsites/memo-section.tsx` | T7, T8 | Artifact section renderer; marginalia extraction |
| `src/lib/microsites/accounts/the-home-depot.ts` | T5 | Accent `#F97316` → `#C2410C` |
| `src/lib/microsites/accounts/nestle-usa.ts` | T5 | Accent `#009FDF` → contrast-passing alternate |
| `src/lib/microsites/accounts/cj-logistics-america.ts` | T5 | Accent `#E8401C` → contrast-passing alternate |
| `src/lib/microsites/accounts/georgia-pacific.ts` | T5 | Accent `#4B5563` → contrast-passing alternate |

**Created by this plan:**

| File | Task | Purpose |
|---|---|---|
| `src/components/microsites/memo-marginalia.tsx` | T8 | Right-gutter "second voice" component, auto-extracts from `section.composition` |
| `tests/unit/microsites/schema-extensions.test.ts` | T6, T7 | Vitest tests for `titleEmphasis` / `coverHeadline` / artifact section type schema validation |

---

## Task 1: Mobile running header overflow (P0-2)

The sticky `MemoRunningHeader` renders at y=0 on initial load (overlapping the cover's classification bar) and on mobile (390px) the title text overflows the viewport at x=416.

**Files:**
- Modify: `src/components/microsites/memo-shell-chrome.tsx`

- [ ] **Step 1: Read the current `MemoRunningHeader` component**

Run: `Read /mnt/c/Users/casey/modex-gtm/src/components/microsites/memo-shell-chrome.tsx`

You'll see a flex container with title + subtitle. Note the `truncate` class on the title and the layout shape.

- [ ] **Step 2: Apply three changes to the running header**

Find the wrapper that contains the title + subtitle (around lines 37–55 per the audit). Make these changes:

a. Add `pointer-events-none` to the wrapper element of the collapsed (pre-scroll) state so it can't intercept clicks on the cover behind it.

b. Add `overflow-hidden` to the same wrapper so the title can't visually extend past its container.

c. Change the subtitle wrapper to `hidden sm:block` so the subtitle is hidden on mobile (avoids overcrowding at 390px).

d. Change the title's `truncate` to `max-w-[calc(100vw-5rem)] truncate` so the title is hard-capped at viewport-width minus 5rem of right-side gutter for the open/close affordance.

- [ ] **Step 3: Verify with Playwright at 390px**

Build is not strictly needed; the change is a Tailwind class addition. To verify visually, use Playwright MCP:

```
mcp__plugin_playwright_playwright__browser_resize 390x844
mcp__plugin_playwright_playwright__browser_navigate https://yardflow.ai/for/dannon
(wait 2s for cover stagger)
mcp__plugin_playwright_playwright__browser_take_screenshot fullPage:true
```

Expected: cover classification bar visible at y=0–17 with NO header text overlapping at y=0. No content overflows past x=390.

(This verification is against PROD; the fix won't be on prod until merged. For local verification: `npm run dev` from modex-gtm, navigate to http://localhost:3000/for/dannon.)

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/components/microsites/memo-shell-chrome.tsx
git commit -m "$(cat <<'EOF'
fix(microsite): mobile running header — no overflow, no cover overlap

P0-2 from master punch list. MemoRunningHeader rendered at y=0 on load
overlapping cover classification; on 390px title overflowed to x=416.

- pointer-events-none on collapsed-state wrapper
- overflow-hidden on wrapper
- subtitle hidden sm:block (mobile-hide)
- title max-w-[calc(100vw-5rem)] truncate

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Cap cover nudge animation (P0-3)

The `↓ Continue` arrow on the cover loops infinitely (2.5s × forever). After ~10 seconds it reads as desperate rather than as an earned nudge.

**Files:**
- Modify: `src/components/microsites/memo-shell.tsx` (CSS in `MEMO_CHROME_CSS` constant, around line 275)

- [ ] **Step 1: Locate the `memo-cover-nudge` CSS rule**

Run: `grep -n 'memo-cover-nudge' /mnt/c/Users/casey/modex-gtm/src/components/microsites/memo-shell.tsx`

Expected: a `.memo-cover-nudge { animation: memo-nudge 2.5s ease-in-out infinite; }` line around line 275.

- [ ] **Step 2: Change `infinite` to `3`**

Edit the CSS line:

```css
.memo-cover-nudge { animation: memo-nudge 2.5s ease-in-out 3; }
```

The arrow will nudge 3 times (~7.5s total) then settle.

- [ ] **Step 3: Verify the `prefers-reduced-motion` guard still covers nudge**

Run: `grep -A 5 'prefers-reduced-motion' /mnt/c/Users/casey/modex-gtm/src/components/microsites/memo-shell.tsx`

Expected: the reduced-motion block includes `.memo-cover-nudge { animation: none; }` (already present). If not, add it.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/components/microsites/memo-shell.tsx
git commit -m "$(cat <<'EOF'
fix(microsite): cap cover-nudge animation at 3 iterations

P0-3 from master punch list. The "↓ Continue" arrow looped indefinitely;
reads as desperate after the first ~10s. One-line CSS change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Focus rings on interactive elements (P0-4)

The soft-action CTA `<a>`, the colophon Casey-Larkin link, and the audio brief chapter-seek `<button>`s lack `focus-visible` outlines (audio play button has one — inconsistent).

**Files:**
- Modify: `src/components/microsites/memo-soft-action.tsx`
- Modify: `src/components/microsites/memo-shell.tsx`
- Modify: `src/components/microsites/memo-audio-brief.tsx`

- [ ] **Step 1: Add focus ring to soft-action CTA**

Read `src/components/microsites/memo-soft-action.tsx`. Find the `<a>` element (around line 52 per the audit). Append to its `className`:

```
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--memo-accent)]
```

- [ ] **Step 2: Add focus ring to colophon Casey-Larkin link**

Read `src/components/microsites/memo-shell.tsx`. Find the `<a href="mailto:casey@freightroll.com">` element (around line 218). Append the same focus-ring class string.

- [ ] **Step 3: Add focus ring to audio chapter-seek buttons**

Read `src/components/microsites/memo-audio-brief.tsx`. Find the chapter-seek `<button>` elements (around line 345 per the audit). If they already inherit a focus ring via grouped hover, leave them; otherwise append the same focus-ring class string.

Run: `grep -n 'focus-visible' /mnt/c/Users/casey/modex-gtm/src/components/microsites/memo-audio-brief.tsx`

Expected: at least one match (the play button). Confirm chapter-seek buttons either have it or get it added.

- [ ] **Step 4: Verify with keyboard nav**

Spin up dev locally (`npm run dev` in modex-gtm). Open `http://localhost:3000/for/dannon`. Tab through the page. Each interactive element should show a visible accent-colored ring. (No automated test — manual verification.)

- [ ] **Step 5: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/components/microsites/memo-soft-action.tsx src/components/microsites/memo-shell.tsx src/components/microsites/memo-audio-brief.tsx
git commit -m "$(cat <<'EOF'
fix(microsite): focus-visible rings on interactive elements

P0-4 from master punch list. Soft-action CTA, colophon link, and audio
chapter-seek buttons lacked focus rings; audio play button had one —
inconsistent + a11y fail.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Move "Draft v0" badge to colophon (P0-8)

The "Draft · v0" badge currently renders on the cover classification bar AND in the running header subtitle. 20 of 40 accounts (including Tier 1 Band A — AB InBev, Coca-Cola) carry it. A draft badge on a priority-91 account undermines the memo's editorial authority. Move it to the colophon — visible to insiders but not in the cover preview.

**Files:**
- Modify: `src/components/microsites/memo-shell.tsx`

- [ ] **Step 1: Read the current Draft badge rendering**

Run: `grep -n 'Draft.*v0\|needsHandTuning' /mnt/c/Users/casey/modex-gtm/src/components/microsites/memo-shell.tsx`

You'll see two render sites:
- Cover classification bar (around line 112–116 — the `{needsHandTuning ? <span...>Draft · v0</span> : null}` block)
- Running header subtitle (passed via `${needsHandTuning ? ' · Draft v0' : ''}` template literal around line 85)

- [ ] **Step 2: Remove Draft badge from cover classification bar**

Delete the `{needsHandTuning ? <span ...>Draft · v0</span> : null}` block from the cover classification chrome. Approximate location: lines 112–116. Verify the surrounding `<span>` middle-dot separator still makes sense without it; if needed, also strip the preceding `<span className="text-[#a89e8b]">·</span>` separator.

- [ ] **Step 3: Remove Draft badge from running header subtitle**

In the `subtitle` prop passed to `MemoRunningHeader` (around line 85), strip the `${needsHandTuning ? ' · Draft v0' : ''}` template literal — the subtitle should just be `${accountName} · ${compactDate}`.

- [ ] **Step 4: Add Draft badge to colophon**

Find the colophon section (around line 204–225, the bottom-of-page `<div className="mx-auto mt-24 max-w-[36rem]...">`). Just before the `${accountName} · ${docId} · Issued ${formattedDate}` line, add a conditional:

```tsx
{needsHandTuning ? (
  <div className={`mb-3 ${FONT_MONO} text-[10px] uppercase tracking-[0.18em] text-[#a89e8b]`}>
    Working analysis · v0
  </div>
) : null}
```

The phrase "Working analysis" replaces "Draft" — same signal, more dignified register.

- [ ] **Step 5: Verify locally**

Spin up dev. Navigate to `/for/ab-inbev` (currently shows Draft on cover). Confirm:
- Cover classification chrome no longer shows "Draft · v0"
- Running header (after scroll) no longer shows "Draft v0"
- Colophon at bottom shows "Working analysis · v0"

- [ ] **Step 6: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/components/microsites/memo-shell.tsx
git commit -m "$(cat <<'EOF'
fix(microsite): move draft badge from cover to colophon

P0-8 from master punch list. 20/40 accounts (incl. Tier 1 Band A) were
showing "Draft · v0" on the cover classification chrome — a damaging
signal at priority-91 prospects. Now renders as "Working analysis · v0"
in the colophon: visible to insiders scrolling to the end, invisible
in the cover preview.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: WCAG accent color fixes (4 accounts)

Four accounts have accent colors that fail WCAG AA 4.5:1 contrast on the cream background:
- `the-home-depot.ts`: `#F97316` (contrast ~2.5:1)
- `nestle-usa.ts`: `#009FDF` (contrast below threshold at small sizes)
- `cj-logistics-america.ts`: `#E8401C` (contrast below threshold)
- `georgia-pacific.ts`: `#4B5563` (muted gray nearly invisible)

**Files:**
- Modify: `src/lib/microsites/accounts/the-home-depot.ts`
- Modify: `src/lib/microsites/accounts/nestle-usa.ts`
- Modify: `src/lib/microsites/accounts/cj-logistics-america.ts`
- Modify: `src/lib/microsites/accounts/georgia-pacific.ts`

- [ ] **Step 1: the-home-depot accent**

Run: `grep -n "accentColor" /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/the-home-depot.ts`

Replace `accentColor: '#F97316'` with `accentColor: '#C2410C'` (orange-700, contrast ~5.1:1, still recognizably Home Depot orange).

- [ ] **Step 2: nestle-usa accent**

Run: `grep -n "accentColor" /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/nestle-usa.ts`

Replace the existing accent with `accentColor: '#1E3A8A'` (Nestlé-adjacent navy, blue-900, contrast >7:1).

- [ ] **Step 3: cj-logistics-america accent**

Replace `accentColor: '#E8401C'` with `accentColor: '#B91C1C'` (red-700, contrast ~5:1).

- [ ] **Step 4: georgia-pacific accent**

Replace `accentColor: '#4B5563'` with `accentColor: '#B45309'` (amber-700, contrast ~5:1, distinctive against cream).

- [ ] **Step 5: Verify with curl + a contrast checker**

For each file, confirm the new value with:

```bash
grep accentColor /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/the-home-depot.ts
grep accentColor /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/nestle-usa.ts
grep accentColor /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/cj-logistics-america.ts
grep accentColor /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/georgia-pacific.ts
```

Expected: each new hex value present.

- [ ] **Step 6: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/accounts/the-home-depot.ts src/lib/microsites/accounts/nestle-usa.ts src/lib/microsites/accounts/cj-logistics-america.ts src/lib/microsites/accounts/georgia-pacific.ts
git commit -m "$(cat <<'EOF'
fix(microsite): WCAG AA accent fixes — 4 accounts

P0-systemic (per-account WCAG) from master punch list. Four accent colors
failed contrast against cream background at small text sizes (footnote
markers, eyebrow numerals, cover pip).

- the-home-depot: #F97316 → #C2410C  (orange-700, 5.1:1)
- nestle-usa:     existing → #1E3A8A  (navy-900, >7:1)
- cj-logistics:   #E8401C → #B91C1C  (red-700, 5:1)
- georgia-pacific:#4B5563 → #B45309  (amber-700, 5:1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Schema — `titleEmphasis` + `coverHeadline` (P0-5)

The cover H1 currently uses a fixed template (`"Yard execution as a network constraint for ${accountName}"`) with no mechanism for an italic+accent phrase. Add two schema fields: `titleEmphasis` (substring to wrap in `<em>` with accent color) and `coverHeadline` (full override for long account names that wrap badly).

**Files:**
- Modify: `src/lib/microsites/schema.ts`
- Modify: `src/components/microsites/memo-shell.tsx`
- Create: `tests/unit/microsites/schema-extensions.test.ts`

- [ ] **Step 1: Read the current `AccountMicrositeData` interface**

Run: `Read /mnt/c/Users/casey/modex-gtm/src/lib/microsites/schema.ts`

Find the `AccountMicrositeData` interface or type. Note where other optional cover-shaping fields live (e.g., `theme`, `accentColor`).

- [ ] **Step 2: Write failing schema unit test**

Create `tests/unit/microsites/schema-extensions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { AccountMicrositeData } from '../../../src/lib/microsites/schema';

describe('AccountMicrositeData schema — Phase-1 extensions', () => {
  it('allows titleEmphasis as optional string', () => {
    const data: Partial<AccountMicrositeData> = {
      slug: 'test',
      titleEmphasis: 'network constraint',
    };
    expect(data.titleEmphasis).toBe('network constraint');
  });

  it('allows coverHeadline as optional string override', () => {
    const data: Partial<AccountMicrositeData> = {
      slug: 'test',
      coverHeadline: 'A custom cover line for this account',
    };
    expect(data.coverHeadline).toBe('A custom cover line for this account');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx vitest run tests/unit/microsites/schema-extensions.test.ts`
Expected: FAIL — property `titleEmphasis` does not exist on type `AccountMicrositeData`.

- [ ] **Step 4: Add fields to schema**

In `src/lib/microsites/schema.ts`, add to `AccountMicrositeData`:

```ts
/** Substring of the cover H1 to render as italic + accent. If the substring
    isn't found in the rendered title, the H1 falls back to plain rendering. */
titleEmphasis?: string;

/** Full override for the cover H1 (replaces the default
    "Yard execution as a network constraint for {accountName}" template).
    Use when the default produces a wrapping H1 for long account names. */
coverHeadline?: string;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx vitest run tests/unit/microsites/schema-extensions.test.ts`
Expected: PASS.

- [ ] **Step 6: Thread `titleEmphasis` + `coverHeadline` through `page.tsx` and `MemoShell`**

In `src/app/for/[account]/page.tsx`, find the `title` prop passed to `<MemoShell>`. Change from the fixed template to use `data.coverHeadline` when present:

```tsx
title={data.coverHeadline ?? `Yard execution as a network constraint for ${data.accountName}`}
```

Add a `titleEmphasis` prop to `<MemoShell>`:

```tsx
<MemoShell
  ...
  title={...}
  titleEmphasis={data.titleEmphasis}
  ...
>
```

- [ ] **Step 7: Render emphasis in `MemoShell`**

In `src/components/microsites/memo-shell.tsx`:

a. Add `titleEmphasis?: string` to `MemoShellProps`.

b. In the H1 render (around line 131), replace the bare `{title}` with a helper that splits on the emphasis substring and wraps it:

```tsx
function renderTitle(title: string, emphasis?: string): React.ReactNode {
  if (!emphasis) return title;
  const idx = title.indexOf(emphasis);
  if (idx < 0) return title;
  return (
    <>
      {title.slice(0, idx)}
      <em
        style={{
          color: 'var(--memo-accent)',
          fontStyle: 'italic',
          fontVariationSettings: "'opsz' 130, 'SOFT' 100, 'WONK' 1",
        }}
      >
        {emphasis}
      </em>
      {title.slice(idx + emphasis.length)}
    </>
  );
}
```

Then the H1 body becomes: `{renderTitle(title, titleEmphasis)}`.

- [ ] **Step 8: Smoke test by adding `titleEmphasis` to dannon**

In `src/lib/microsites/accounts/dannon.ts`, add `titleEmphasis: 'network constraint'` near the top of the export object.

Run `npm run dev`. Visit `http://localhost:3000/for/dannon`. The phrase "network constraint" in the H1 should render italic, in Dannon's accent color.

Once verified, remove the test value from `dannon.ts` (it'll be added back as needed during T1 polish in Phase 5).

- [ ] **Step 9: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/schema.ts src/components/microsites/memo-shell.tsx src/app/for/[account]/page.tsx tests/unit/microsites/schema-extensions.test.ts
git commit -m "$(cat <<'EOF'
feat(microsite/schema): titleEmphasis + coverHeadline cover-H1 fields

P0-5 from master punch list. The cover H1 had no mechanism for the
italic + accent phrase the editorial-style guide promised. Adds:
- titleEmphasis?: string — substring to wrap in <em> + accent
- coverHeadline?: string — full H1 override for long account names

Vitest schema unit tests added. Per-account application in Phase 5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Artifact section type (P0-6)

The spec mandates ≥1 redacted-artifact treatment per memo (Module Inspector screenshot, redacted manifest, attribution-free quote image). None of the 40 microsites has one. Add an `artifact` section type so accounts can declare one.

**Files:**
- Modify: `src/lib/microsites/schema.ts`
- Modify: `src/components/microsites/memo-section.tsx`
- Modify: `tests/unit/microsites/schema-extensions.test.ts`

- [ ] **Step 1: Read current section types**

Run: `grep -n "type:.*'" /mnt/c/Users/casey/modex-gtm/src/lib/microsites/schema.ts | head -20`

You'll see existing section types: `yns-thesis`, `observation`, `comparable`, `methodology`, `about` (etc.). Each is a discriminated union member.

- [ ] **Step 2: Write failing schema test**

Append to `tests/unit/microsites/schema-extensions.test.ts`:

```ts
import type { MemoMicrositeSection } from '../../../src/lib/microsites/schema';

describe('Artifact section type', () => {
  it('allows artifact section with image + caption + source', () => {
    const section: MemoMicrositeSection = {
      type: 'artifact',
      id: 'dannon-yard-redacted',
      num: '04',
      label: 'Redacted yard layout',
      artifact: {
        imageSrc: '/artifacts/dannon-yard-redacted.png',
        imageAlt: 'Yard layout with carrier names and plant codes redacted',
        caption: 'Western depot reorganization — Q4 2024',
        source: 'YardFlow Module Inspector, redacted',
      },
    };
    expect(section.type).toBe('artifact');
  });
});
```

- [ ] **Step 3: Run test to verify failure**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx vitest run tests/unit/microsites/schema-extensions.test.ts`
Expected: FAIL — `'artifact'` not assignable.

- [ ] **Step 4: Add `MemoArtifactSection` to schema discriminated union**

In `src/lib/microsites/schema.ts`, add a new section variant:

```ts
export interface MemoArtifactSection {
  type: 'artifact';
  id: string;
  num: string;       // e.g., "04"
  label: string;     // e.g., "Redacted yard layout"
  artifact: {
    imageSrc: string;
    imageAlt: string;
    caption: string;       // Mono caption under the image
    source: string;        // Source hairline below caption
  };
}
```

Add `MemoArtifactSection` to the `MemoMicrositeSection` union type.

- [ ] **Step 5: Run test to verify pass**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx vitest run tests/unit/microsites/schema-extensions.test.ts`
Expected: all three tests PASS.

- [ ] **Step 6: Render the artifact section in `memo-section.tsx`**

Find the `MemoSectionList` or section-dispatch switch in `src/components/microsites/memo-section.tsx`. Add a case for `'artifact'`:

```tsx
case 'artifact': {
  const a = section.artifact;
  return (
    <section id={section.id} className="memo-section-artifact mb-12">
      <div className="mb-3 flex items-baseline gap-3">
        <span className={`${FONT_MONO} text-[11px] tracking-[0.18em] uppercase`} style={{ color: 'var(--memo-accent)' }}>
          {section.num}
        </span>
        <h2 className={`${FONT_SERIF} text-[20px]`} style={{ fontVariationSettings: "'opsz' 30, 'SOFT' 50" }}>
          {section.label}
        </h2>
      </div>
      <figure className="border border-[#d8d2c2] bg-[#fffdf7] p-4">
        <img
          src={a.imageSrc}
          alt={a.imageAlt}
          className="block w-full"
        />
        <figcaption className={`mt-3 ${FONT_MONO} text-[11px] tracking-[0.1em] uppercase text-[#4a4641]`}>
          {a.caption}
        </figcaption>
        <div className={`mt-2 ${FONT_SANS} text-[10.5px] tracking-[0.18em] uppercase text-[#8a847b]`}>
          {a.source}
        </div>
      </figure>
    </section>
  );
}
```

(Note: import the FONT_* constants from `memo-shell.tsx` or co-locate them. Confirm pattern matches existing section rendering.)

- [ ] **Step 7: Verify TypeScript build passes**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/schema.ts src/components/microsites/memo-section.tsx tests/unit/microsites/schema-extensions.test.ts
git commit -m "$(cat <<'EOF'
feat(microsite/schema): artifact section type

P0-6 from master punch list. Spec mandates >=1 redacted-artifact per
memo (Module Inspector screenshot, redacted manifest, quote image).
Adds the schema + renderer; per-account application in Phase 5.

Renderer: bordered figure with mono caption + source hairline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: MemoMarginalia component + grid wiring (P0-7)

The desktop grid's right column (14rem) is empty on every account (`memo-shell.tsx:232` `<aside aria-hidden="true">`). Build a `MemoMarginalia` component that pulls auto-extracted items from each section's `composition` field and renders them in the gutter as the "second voice."

**Files:**
- Create: `src/components/microsites/memo-marginalia.tsx`
- Modify: `src/components/microsites/memo-section.tsx` (export the extraction helper)
- Modify: `src/components/microsites/memo-shell.tsx` (wire into the grid right slot)

- [ ] **Step 1: Read the `section.composition` field shape**

Run: `grep -B 2 -A 10 'composition' /mnt/c/Users/casey/modex-gtm/src/lib/microsites/schema.ts | head -40`

Note: composition is a per-section data structure (likely a key/value or labeled list of metrics). Confirm exact shape — the marginalia component will surface these.

- [ ] **Step 2: Create the `MemoMarginalia` component**

Write `src/components/microsites/memo-marginalia.tsx`:

```tsx
import type { ReactNode } from 'react';

const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';
const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';

export interface MemoMarginaliaItem {
  /** Short uppercase label, e.g. "Facility count" */
  mark: string;
  /** The value or phrase to surface, e.g. "237 plants" */
  body: string;
  /** Optional anchor id of the section this item is keyed to. When set,
      the item visually aligns with that section as the reader scrolls. */
  sectionId?: string;
}

interface MemoMarginaliaProps {
  items: MemoMarginaliaItem[];
}

/**
 * Right-gutter "second voice." Renders one item per section's key data
 * point in the 14rem desktop right column. Auto-extracted from
 * section.composition by the page-level loader.
 *
 * Hidden on mobile (the gutter doesn't exist below lg).
 */
export function MemoMarginalia({ items }: MemoMarginaliaProps) {
  if (items.length === 0) return null;
  return (
    <aside
      aria-label="Margin notes"
      className="hidden lg:flex lg:flex-col lg:gap-16 lg:pt-2"
    >
      {items.map((item, i) => (
        <div key={`${item.sectionId ?? 'item'}-${i}`} className="text-[#4a4641]">
          <div
            className={`${FONT_MONO} mb-2 text-[10px] uppercase tracking-[0.18em] text-[#8a847b]`}
          >
            {item.mark}
          </div>
          <div
            className={`${FONT_SERIF} text-[15px] leading-snug`}
            style={{ fontVariationSettings: "'opsz' 14, 'SOFT' 50" }}
          >
            {item.body}
          </div>
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 3: Write auto-extract helper in `memo-section.tsx`**

In `src/components/microsites/memo-section.tsx`, add an exported helper:

```ts
import type { MemoMarginaliaItem } from './memo-marginalia';
import type { MemoMicrositeSection } from '@/lib/microsites/schema';

/** Extracts one marginalia item per section that has a composition with
 *  metric-shaped data. Returns an empty array if no extractable items found.
 *
 *  Strategy: for each section.composition, find the first numeric or
 *  count-like field and surface it as `{ mark: label, body: value, sectionId: section.id }`.
 *  If a section has no extractable composition, it contributes no item
 *  (the gutter doesn't try to fill empty space). */
export function extractMarginaliaItems(sections: MemoMicrositeSection[]): MemoMarginaliaItem[] {
  const items: MemoMarginaliaItem[] = [];
  for (const section of sections) {
    if (!('composition' in section) || !section.composition) continue;
    // composition is expected to be an array of { label, value } pairs;
    // surface the first one as the section's marginalia item.
    const comp = section.composition as Array<{ label: string; value: string }>;
    const first = comp[0];
    if (!first) continue;
    items.push({
      mark: first.label,
      body: first.value,
      sectionId: section.id,
    });
  }
  return items;
}
```

(Confirm the actual `composition` shape from the schema in Step 1 — adjust the destructuring accordingly.)

- [ ] **Step 4: Wire `MemoMarginalia` into the right-column slot in `MemoShell`**

In `src/components/microsites/memo-shell.tsx`:

a. Add an `marginaliaItems?: MemoMarginaliaItem[]` prop to `MemoShellProps`.

b. Replace the empty `<aside aria-hidden="true" className="hidden lg:block" />` (line 232) with:

```tsx
<MemoMarginalia items={marginaliaItems ?? []} />
```

c. Import `MemoMarginalia` + the type.

- [ ] **Step 5: Pass marginalia items from `page.tsx`**

In `src/app/for/[account]/page.tsx`:

```tsx
import { extractMarginaliaItems } from '@/components/microsites/memo-section';
// ... inside the component:
const marginaliaItems = extractMarginaliaItems(memoSections);
// ...
<MemoShell
  ...
  marginaliaItems={marginaliaItems}
  ...
>
```

- [ ] **Step 6: Build check**

Run: `cd /mnt/c/Users/casey/modex-gtm && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Verify visually**

`npm run dev`. Visit `http://localhost:3000/for/dannon`. At desktop width (≥1024px), the right gutter should now show ~3–5 marginalia items aligned roughly with the sections that have `composition`. Mobile should be unchanged (gutter hidden below `lg`).

- [ ] **Step 8: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/components/microsites/memo-marginalia.tsx src/components/microsites/memo-section.tsx src/components/microsites/memo-shell.tsx src/app/for/[account]/page.tsx
git commit -m "$(cat <<'EOF'
feat(microsite): memo-marginalia component for right-gutter "second voice"

P0-7 from master punch list. The desktop right column at memo-shell.tsx:232
was empty on every account — the memo metaphor read as a webpage in a
cream desert. New MemoMarginalia component auto-extracts one item per
section from composition data and renders them in the 14rem gutter.

Hidden on mobile (matches existing gutter visibility).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review

Reviewed against the master punch list (commit `3e1db42`):

**Spec coverage:**
- ✅ P0-2 (mobile running header) — Task 1
- ✅ P0-3 (nudge animation cap) — Task 2
- ✅ P0-4 (focus rings) — Task 3
- ✅ P0-5 (titleEmphasis + coverHeadline schema) — Task 6
- ✅ P0-6 (artifact section type) — Task 7
- ✅ P0-7 (MemoMarginalia + grid wiring) — Task 8
- ✅ P0-8 (Draft badge → colophon) — Task 4
- ✅ WCAG accent fixes (4 accounts) — Task 5

**Out of scope for this plan (deferred to later phases per master sequencing):**
- ❌ P0-9 (section migration for 16 accounts) — Phase 3
- ❌ P0-10/11 (T2 pageTitle + metaDescription rewrites) — Phase 2
- ❌ P0-12 (T2 framingNarrative rewrites) — Phase 2
- ❌ P0-13 (audio briefs for T2) — Phase 2 or 3
- ❌ P0-14 (T2 legacy CTA pattern) — Phase 2
- ❌ P0-15 (template artifacts cleanup) — Phase 2
- ❌ P0-16 (jm-smucker Primo fix) — Phase 2
- ❌ Per-account accent duplications (red/violet/blue clusters) — Phase 5 (T1 polish)
- ❌ Long account name H1 wrap fixes (uses Task 6's `coverHeadline`) — Phase 5
- ❌ P2-1 detention clock spec-compliance check — Phase 6
- ❌ P2 polish items — Phase 6

**No placeholders detected.** Every step has full code or exact commands.

**Path consistency:** All paths are absolute or rooted in `/mnt/c/Users/casey/modex-gtm`. Component imports use `@/` aliases consistent with existing patterns.

**Type consistency:** `MemoMarginaliaItem` defined in Task 8 Step 2, used consistently in Step 3 (helper), Step 4 (props), Step 5 (page wiring). `titleEmphasis` and `coverHeadline` defined in Task 6 Step 4, used in Task 6 Steps 6–7 (page + shell render). `MemoArtifactSection` defined in Task 7 Step 4, used in Task 7 Step 6 (renderer).
