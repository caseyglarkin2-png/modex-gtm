'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getActionableIntel, slugify } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const allItems = getActionableIntel();

export default function IntelPage() {
  const [closedIds, setClosedIds] = useState<Set<number>>(new Set());

  const items = allItems.map((item, i) => ({
    ...item,
    _idx: i,
    status: closedIds.has(i) ? 'Closed' : item.status,
  }));

  const openCount = items.filter((i) => i.status !== 'Closed').length;

  function toggleStatus(idx: number, account: string) {
    setClosedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        toast(`Reopened: ${account}`);
      } else {
        next.add(idx);
        toast.success(`Closed: ${account}`);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Actionable Intel ({items.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Research tasks and intelligence items. {openCount} open item{openCount !== 1 ? 's' : ''} require action.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isClosed = closedIds.has(item._idx);
          return (
            <Card key={item._idx} className={isClosed ? 'opacity-60' : undefined}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-[var(--accent)] p-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    </div>
                    <Link href={`/accounts/${slugify(item.account)}`} className="font-semibold text-sm text-[var(--primary)] hover:underline">
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
                      onClick={() => toggleStatus(item._idx, item.account)}
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
    </div>
  );
}

