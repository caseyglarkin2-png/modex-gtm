import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMeetingBriefs, slugify } from '@/lib/data';

export function generateStaticParams() {
  return getMeetingBriefs().map((b) => ({ account: slugify(b.account) }));
}

export default async function BriefDetailPage({ params }: { params: Promise<{ account: string }> }) {
  const { account: slug } = await params;
  const briefs = getMeetingBriefs();
  const brief = briefs.find((b) => slugify(b.account) === slug);
  if (!brief) notFound();

  const sections = [
    { label: 'Vertical', value: brief.vertical },
    { label: 'Public MODEX Signal', value: brief.public_modex_signal },
    { label: 'Why This Account', value: brief.why_this_account },
    { label: 'Why Now', value: brief.why_now },
    { label: 'Likely Pain Points', value: brief.likely_pain_points },
    { label: 'Primo Relevance', value: brief.primo_relevance },
    { label: 'Best First Meeting Outcome', value: brief.best_first_meeting_outcome },
    { label: 'Suggested Attendees', value: brief.suggested_attendees },
    { label: 'Prep Assets Needed', value: brief.prep_assets_needed },
    { label: 'Open Questions', value: brief.open_questions },
  ];

  return (
    <>
      <Link href="/briefs" className="text-sm text-[var(--primary)] hover:underline">&larr; All Briefs</Link>
      <h1 className="mt-4 text-2xl font-bold">{brief.account} — Meeting Brief</h1>

      <div className="mt-6 space-y-5">
        {sections.map((s) => (
          <div key={s.label} className="rounded-lg border border-[var(--border)] p-5">
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{s.label}</p>
            <p className="mt-2 text-sm leading-relaxed">{s.value}</p>
          </div>
        ))}
      </div>

      {(brief.source_url_1 || brief.source_url_2) && (
        <div className="mt-6 rounded-lg border border-[var(--border)] p-5">
          <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Sources</p>
          <div className="mt-2 space-y-1">
            {brief.source_url_1 && (
              <a href={brief.source_url_1} target="_blank" rel="noopener noreferrer" className="block text-sm text-[var(--primary)] hover:underline break-all">
                {brief.source_url_1}
              </a>
            )}
            {brief.source_url_2 && (
              <a href={brief.source_url_2} target="_blank" rel="noopener noreferrer" className="block text-sm text-[var(--primary)] hover:underline break-all">
                {brief.source_url_2}
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
