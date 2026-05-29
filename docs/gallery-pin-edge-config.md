# Gallery Campaign-Pin Override (via Vercel Edge Config)

Pin one or more industry tiles to the top of `yardflow.ai/demo` without a code change or a deploy. Flip in 30 seconds, propagates globally in ~60 seconds.

## When to use it

- Tier-1 prospect campaign of the week (e.g., "every Walmart sales rep is showing the deck today — pin the Walmart-anchored tile to position 0")
- Conference / trade show — pin the industry the attendee crowd cares about
- Sales call prep — rep pins the prospect's industry before opening the page on their phone

## One-time setup (you do this once)

The modex-gtm Vercel project needs to be connected to the same Edge Config store Flow-State- already uses, OR a new dedicated store.

Recommended: connect to the existing `yardflow-feature-flags` store so all YardFlow runtime flags live in one place.

1. Vercel Dashboard → `modex-gtm` project → **Storage** tab
2. **Connect Database** → **Edge Config**
3. Select **`yardflow-feature-flags`** (the existing store from the cutover, ID `ecfg_4fsnq0fy4raxkqtyqacoje81jvhl`)
4. Environment variable name: leave as `EDGE_CONFIG` (default)
5. Environments: check **Production**, **Preview**, **Development**
6. **Connect**

Vercel auto-injects `EDGE_CONFIG` connection string into all three environments. Trigger one redeploy after connecting so the build picks up the new env var.

## Per-campaign flip (do this whenever)

1. Vercel Dashboard → **Storage** → **`yardflow-feature-flags`** → **Items**
2. **+ Add Item** (or edit if it already exists)
3. **Key**: `gallery_pinned_slugs`
4. **Value**: a JSON array of anchor slugs in priority order. Examples:

   Pin Walmart anchor to position 0:
   ```json
   ["walmart"]
   ```

   Pin two anchors (Walmart first, then Coca-Cola):
   ```json
   ["walmart", "coca-cola"]
   ```

   Clear all pins (revert to insertion order):
   ```json
   []
   ```

5. **Save**

Propagation is ~60s globally. Refresh `yardflow.ai/demo` in an incognito window to verify.

## Valid slugs (current 11 anchors)

These are the only values the override understands. Anything else is silently ignored.

| Slug | Industry |
|---|---|
| `coca-cola` | Beverage |
| `mondelez-international` | CPG · Food |
| `frito-lay` | CPG · Snacks |
| `kimberly-clark` | CPG · Personal Care & Paper |
| `gxo` | 3PL · Warehousing |
| `ford` | OEM · Automotive |
| `caterpillar` | Manufacturing · Heavy Equipment |
| `georgia-pacific` | Building Materials & Paper |
| `the-home-depot` | Retail · Big-Box DC |
| `performance-food-group` | Grocer · Distributor |
| `fedex` | Logistics · Parcel & LTL |

When new anchors are added to `src/lib/demo/industry-tags.ts`, their slugs become pin-eligible automatically. No code change needed in the override.

## Failure modes (all safe)

| State | Behavior |
|---|---|
| Edge Config not yet connected | Falls back to insertion order from `industry-tags.ts`. No error. |
| `gallery_pinned_slugs` key missing | Falls back to insertion order. No error. |
| Key value is not a JSON array | Logged, falls back to insertion order. |
| Key value is `[]` | Falls back to insertion order. |
| Pinned slug doesn't match any anchor | Silently dropped. Other pins still apply. |
| Edge Config transient outage | Falls back to insertion order. No error. |

Net: this override can never break the gallery. Worst case, it just doesn't do anything.

## What this does NOT do

- Does NOT affect the `?archetype=` filter (you can still filter, the pin order applies within the filtered set).
- Does NOT affect `?demo=1` / `&pack=` / `&source=` URL state.
- Does NOT add or remove tiles. Use this for ordering, not visibility.
- Does NOT trigger a Vercel rebuild — Edge Config reads are runtime. Saves a deploy on every flip.

## See also

- `src/lib/demo/gallery-pin.ts` — the read + apply logic
- `src/lib/demo/industry-tags.ts` — the canonical anchor list (still the source of truth for which slugs are valid)
- `src/app/demo/page.tsx` — where the pin is applied each render
