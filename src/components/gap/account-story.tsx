/**
 * ACCOUNT STORY (account-first UX, UX-05, 2026-10-06): the derived story beside NEXT. Each row is a label and one to
 * three tagged sentences with their basis; STORIES THAT MATTER opens on request; the vault note is marked never to
 * quote. Server-renderable: nothing here fetches or writes. Seller words only; no em dashes.
 */
import type { AccountStory, StoryRow, StorySentence } from '@/lib/gap/story/story';
import { Tag } from './seller-tag';

function Sentence({ s }: { s: StorySentence }) {
  return (
    <li className="space-y-0.5" data-testid="story-sentence" data-tag={s.tag}>
      <div className="flex items-start gap-2">
        <Tag tag={s.tag} />
        <p className="min-w-0 break-words text-sm">{s.text}</p>
      </div>
      <p className="ml-1 text-xs text-[var(--muted-foreground)]">
        {s.basis}
        {s.cite ? `, ${s.cite}` : ''}
      </p>
    </li>
  );
}

function Row({ r }: { r: StoryRow }) {
  if (r.collapsed) {
    return (
      <details className="rounded-md border border-[var(--border)] px-3 py-2" data-testid="story-row" data-key={r.key} data-tag={r.tag}>
        <summary className="min-h-11 cursor-pointer py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]" data-testid="story-row-summary">
          <h3 className="inline">{r.label} ({r.sentences.length})</h3>
          <span className="ml-2 font-normal normal-case underline">Show</span>
        </summary>
        <ul className="mt-1 space-y-2">
          {r.sentences.map((s, i) => (
            <Sentence key={`${r.key}-${i}`} s={s} />
          ))}
        </ul>
      </details>
    );
  }
  return (
    <div className="space-y-1" data-testid="story-row" data-key={r.key} data-tag={r.tag}>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{r.label}</h3>
      <ul className="space-y-2">
        {r.sentences.map((s, i) => (
          <Sentence key={`${r.key}-${i}`} s={s} />
        ))}
      </ul>
      {r.wrongIf ? (
        <p className="ml-1 text-xs text-[var(--muted-foreground)]" data-testid="story-wrong-if">
          Wrong if: {r.wrongIf}
        </p>
      ) : null}
    </div>
  );
}

export function AccountStoryView({ story }: { story: AccountStory }) {
  if (!story.rows.length) return null;
  return (
    <section className="space-y-3" data-testid="account-story" aria-labelledby="account-story-heading">
      <h2 id="account-story-heading" className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]">
        Account story
      </h2>
      {story.rows.map((r) => (
        <Row key={r.key} r={r} />
      ))}
    </section>
  );
}
