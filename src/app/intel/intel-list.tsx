'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateIntelStatus } from '@/lib/actions';

export interface IntelItem {
  id: number;
  account: string;
  slug: string;
  intel_type: string;
  why_it_matters: string;
  how_to_find_it: string;
  owner: string;
  status: string;
  field_to_update: string;
}

export function IntelList({ items, hideHeader = false }: { items: IntelItem[]; hideHeader?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const openCount = items.filter((i) => i.status !== 'Closed').length;

  function toggleStatus(item: IntelItem) {
    const newStatus = item.status === 'Closed' ? 'Open' : 'Closed';
    startTransition(async () => {
      const result = await updateIntelStatus(item.id, newStatus);
      if (result.success) {
        toast.success(newStatus === 'Closed' ? `Closed: ${item.account}` : `Reopened: ${item.account}`);
      } else {
        toast.error('Failed to update status');
      }
    });
  }

  return (
    <>
      {!hideHeader && (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actionable Intel ({items.length})</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Research tasks and intelligence items. {openCount} open item{openCount !== 1 ? 's' : ''} require action.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const isClosed = item.status === 'Closed';
          return (
            <Card key={item.id} className={isClosed ? 'opacity-60' : undefined}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-[var(--accent)] p-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    </div>
                    <Link href={`/accounts/${item.slug}`} className="font-semibold text-sm text-[var(--primary)] hover:underline">
                      {item.account}
                    </Link>
                    <Badge variant="outline" className="text-xs">{item.intel_type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <Button
                      variant={isClosed ? 'outline' : 'ghost'}
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      disabled={isPending}
                      onClick={() => toggleStatus(item)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isClosed ? 'Reopen' : 'Close'}
                    </Button>
                  </div>
                </div>
                <p className="text-sm">{item.why_it_matters}</p>
                <div className="rounded-lg bg-[var(--muted)] p-3">
                  <p className="text-xs font-semibold text-[var(--muted-foreground)]">How to Find It</p>
                  <p className="mt-1 text-sm">{item.how_to_find_it}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                  <span>Owner: {item.owner}</span>
                  <span>Updates: {item.field_to_update}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
