/**
 * NOW (V2): the 10-to-30-second answer for one account. Seller words only; machine labels live in SOURCES.
 * Above the fold at 390px: the state line, NEXT with its control, WHO and why, one WHY NOW. Server-renderable;
 * the only client piece is Listen (the existing voice preview, reading NOW without the private line).
 */
import Link from 'next/link';
import type { NowLine, NowView } from '@/lib/gap/context/now';
import { VoicePreviewButton } from '@/components/voice-preview-button';

const TAG_TONE: Record<NowLine['tag'], string> = {
  'Buyer said': 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
  Checked: 'border-sky-600 text-sky-700 dark:text-sky-400',
  'Our read': 'border-[var(--border)] text-[var(--muted-foreground)]',
  Unknown: 'border-[var(--border)] text-[var(--muted-foreground)]',
  Contradicted: 'border-red-600 text-red-700 dark:text-red-400',
};
const GAP_TONE: Record<string, string> = { 'Buyer said': 'text-emerald-700 dark:text-emerald-400', 'Our read': 'text-[var(--muted-foreground)]', Unknown: 'text-amber-700 dark:text-amber-400' };

function Tag({ tag }: { tag: NowLine['tag'] }) {
  return <span className={`inline-block shrink-0 whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_TONE[tag]}`}>{tag}</span>;
}

function Line({ l, testId }: { l: NowLine; testId: string }) {
  return (
    <li className="space-y-0.5" data-testid={testId} data-tag={l.tag}>
      <div className="flex items-start gap-2">
        <Tag tag={l.tag} />
        <p className="min-w-0 break-words text-sm">{l.text}</p>
      </div>
      <p className="ml-1 text-xs text-[var(--muted-foreground)]">
        {l.basis}
        {l.cite ? ` · ${l.cite}` : ''}
      </p>
    </li>
  );
}

function Slot({ label, children, testId }: { label: string; children: React.ReactNode; testId: string }) {
  return (
    <section className="space-y-1" data-testid={testId}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</h2>
      {children}
    </section>
  );
}

export function AccountNowView({ v, nextHref, nextLabel, links }: { v: NowView; nextHref: string | null; nextLabel: string | null; links: Array<{ label: string; href: string; external?: boolean }> }) {
  return (
    <div className="space-y-4" data-testid="account-now">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 break-words text-sm text-[var(--muted-foreground)]" data-testid="now-state">{v.stateLine}</p>
          <VoicePreviewButton text={v.listen} label="Listen" className="shrink-0" />
        </div>
      </div>

      <div className="rounded-md border border-[var(--primary)] px-3 py-2" data-testid="now-next">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">Next</p>
        <p className="text-sm font-medium">{v.next.text}</p>
        {nextHref && nextLabel ? (
          <Link href={nextHref} className="mt-1 inline-block text-sm font-semibold underline" data-testid="now-next-control">
            {nextLabel}
          </Link>
        ) : null}
      </div>

      <Slot label="Who" testId="now-who">
        {v.who ? (
          <div className="text-sm">
            <p className="font-medium">
              {v.who.name}
              {v.who.title ? <span className="font-normal text-[var(--muted-foreground)]">, {v.who.title}</span> : null}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">{v.who.why}</p>
            {v.who.route ? <p className="text-xs text-[var(--muted-foreground)]">Route: {v.who.route}</p> : null}
            {v.whoUnknown ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-400" data-testid="now-owner-missing">{v.whoUnknown}</p> : null}
            {v.alternate ? (
              <p className="mt-1 text-xs" data-testid="now-alternate">
                Alternate: {v.alternate.name}
                {v.alternate.title ? `, ${v.alternate.title}` : ''}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-amber-700 dark:text-amber-400">{v.whoUnknown}</p>
        )}
      </Slot>

      {v.whyNow[0] ? (
        <Slot label="Why now" testId="now-why-now">
          <ul className="space-y-2">
            {v.whyNow.map((l) => (
              <Line key={l.id} l={l} testId="now-why-now-line" />
            ))}
          </ul>
        </Slot>
      ) : null}

      <Slot label="The gap" testId="now-gap">
        <p className="text-sm">{v.currentState}</p>
        <p className="text-xs">
          {v.gap.map((g, i) => (
            <span key={g.element}>
              {i ? ' · ' : ''}
              {g.element}: <span className={GAP_TONE[g.state]}>{g.state}</span>
            </span>
          ))}
        </p>
      </Slot>

      {v.know.length ? (
        <Slot label="Know" testId="now-know">
          <ul className="space-y-2">
            {v.know.map((l) => (
              <Line key={l.id} l={l} testId="now-know-line" />
            ))}
          </ul>
        </Slot>
      ) : null}

      {v.think ? (
        <Slot label="Think" testId="now-think">
          <div className="flex items-start gap-2">
            <Tag tag="Our read" />
            <p className="min-w-0 break-words text-sm">{v.think.text}</p>
          </div>
          {v.think.wrongIf ? <p className="ml-1 text-xs text-[var(--muted-foreground)]">Wrong if: {v.think.wrongIf}</p> : null}
        </Slot>
      ) : null}

      <Slot label="Impact" testId="now-impact">
        <p className="text-sm">{v.impact}</p>
      </Slot>

      {v.ask ? (
        <Slot label="Ask" testId="now-ask">
          <p className="text-sm">{v.ask}</p>
        </Slot>
      ) : null}

      {v.relationship ? (
        <Slot label="Relationship" testId="now-relationship">
          <p className="text-sm">{v.relationship}</p>
        </Slot>
      ) : null}

      {v.private ? (
        <p className="rounded-md border border-dashed border-amber-600 px-3 py-2 text-xs text-amber-800 dark:text-amber-300" data-testid="now-private">
          {v.private}
        </p>
      ) : null}

      {v.wedge ? (
        <Slot label="Wedge" testId="now-wedge">
          <p className="text-sm">{v.wedge}</p>
        </Slot>
      ) : null}

      {v.asset ? (
        <Slot label="Asset" testId="now-asset">
          {v.asset.href ? (
            <Link href={v.asset.href} className="text-sm underline">
              {v.asset.label}
            </Link>
          ) : (
            <p className="text-sm">{v.asset.label}</p>
          )}
        </Slot>
      ) : null}

      {links.length ? (
        <nav className="flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--border)] pt-2 text-xs" data-testid="now-links">
          {links.map((l) =>
            l.external ? (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="underline">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="underline">
                {l.label}
              </Link>
            ),
          )}
        </nav>
      ) : null}
    </div>
  );
}
