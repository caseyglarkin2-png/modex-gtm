import Link from 'next/link';
import { getMeetingBriefs, slugify } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';

export const metadata = { title: 'Meeting Briefs' };

export default function BriefsPage() {
  const briefs = getMeetingBriefs();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Meeting Briefs' }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meeting Briefs ({briefs.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Pre-meeting preparation documents for each target account.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {briefs.map((b) => (
          <Link key={b.account} href={`/briefs/${slugify(b.account)}`}>
            <Card className="h-full transition-colors hover:border-[var(--primary)] hover:bg-[var(--accent)]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="rounded-md bg-[var(--accent)] p-2">
                    <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </div>
                  <Badge variant="outline" className="text-xs">{b.vertical}</Badge>
                </div>
                <h3 className="mt-3 font-semibold">{b.account}</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{b.why_this_account}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--primary)] font-medium">
                  View brief <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
