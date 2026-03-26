import Link from 'next/link';
import { getActivities, slugify } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Activity, ArrowRight } from 'lucide-react';

export default function ActivitiesPage() {
  const activities = getActivities();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activities ({activities.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          All outreach and engagement activities logged by owner.
        </p>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-10 w-10" />}
          title="No Activities Yet"
          description="Activities will appear here as outreach begins."
          action={
            <Link href="/capture">
              <Button size="sm" className="gap-1">Log a capture <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {activities.map((a, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-[var(--accent)] p-1.5">
                      <Activity className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    </div>
                    <Link href={`/accounts/${slugify(a.account)}`} className="font-medium text-sm text-[var(--primary)] hover:underline">
                      {a.account}
                    </Link>
                    <Badge variant="secondary" className="text-xs">{a.activity_type}</Badge>
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)]">{a.activity_date}</span>
                </div>
                {a.persona && <p className="mt-1.5 text-sm">Contact: {a.persona}</p>}
                {a.notes && <p className="mt-1 text-sm text-[var(--muted-foreground)] break-words line-clamp-3" title={a.notes}>{a.notes}</p>}
                <div className="mt-2 flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                  <span>Owner: {a.owner}</span>
                  {a.outcome && <span>Outcome: {a.outcome}</span>}
                  {a.next_step && <span>Next: {a.next_step} {a.next_step_due && `(due ${a.next_step_due})`}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
