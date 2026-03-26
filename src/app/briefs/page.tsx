import Link from 'next/link';
import { getMeetingBriefs, slugify } from '@/lib/data';

export default function BriefsPage() {
  const briefs = getMeetingBriefs();

  return (
    <>
      <h1 className="text-2xl font-bold">Meeting Briefs ({briefs.length})</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Pre-meeting preparation documents for each target account. Click an account to view the full brief.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {briefs.map((b) => (
          <Link
            key={b.account}
            href={`/briefs/${slugify(b.account)}`}
            className="rounded-lg border border-[var(--border)] p-5 hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
          >
            <h3 className="font-semibold">{b.account}</h3>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{b.vertical}</p>
            <p className="mt-2 text-sm line-clamp-2">{b.why_this_account}</p>
            <p className="mt-2 text-xs text-[var(--primary)]">View brief &rarr;</p>
          </Link>
        ))}
      </div>
    </>
  );
}
