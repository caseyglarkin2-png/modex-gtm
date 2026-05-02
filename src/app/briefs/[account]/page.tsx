import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMeetingBriefs, slugify } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { BriefReadAloud } from './brief-read-aloud';

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
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Meeting Briefs', href: '/briefs' }, { label: brief.account }]} />
      <div className="flex items-center justify-between">
        <Link href="/briefs" className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Briefs
        </Link>
        <Link href={`/accounts/${slugify(brief.account)}`}>
          <Button variant="outline" size="sm">View Account</Button>
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{brief.account} — Meeting Brief</h1>

      <BriefReadAloud accountName={brief.account} sections={sections} />

      <div className="space-y-3">
        {sections.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{s.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(brief.source_url_1 || brief.source_url_2) && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Sources</p>
            <div className="mt-1.5 space-y-1">
              {brief.source_url_1 && (
                <a href={brief.source_url_1} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline break-all">
                  {brief.source_url_1} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              )}
              {brief.source_url_2 && (
                <a href={brief.source_url_2} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline break-all">
                  {brief.source_url_2} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
