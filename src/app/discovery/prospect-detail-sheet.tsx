'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Check } from 'lucide-react';
import { BandBadge } from '@/components/band-badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { formatDiscoveredVia } from '@/lib/discovery/filters';
import type { ProspectRow } from '@/lib/discovery/types';
import { pushProspectToHubSpot, type PushResult } from './actions';

const DIMENSIONS: { key: keyof Pick<ProspectRow, 'verticalMatch' | 'enterpriseScale' | 'networkComplexity' | 'primoProximity' | 'corridorDensity' | 'placeTypeBonus'>; label: string; max: number }[] = [
  { key: 'enterpriseScale', label: 'Enterprise Scale', max: 25 },
  { key: 'networkComplexity', label: 'Network Complexity', max: 25 },
  { key: 'verticalMatch', label: 'Vertical Match', max: 25 },
  { key: 'primoProximity', label: 'Primo Proximity', max: 10 },
  { key: 'corridorDensity', label: 'Corridor Density', max: 5 },
  { key: 'placeTypeBonus', label: 'Place Type Bonus', max: 10 },
];

interface Props {
  prospect: ProspectRow | null;
  onClose: () => void;
}

export function ProspectDetailSheet({ prospect, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PushResult | null>(null);

  // Reset push state whenever a different prospect is opened.
  useEffect(() => {
    setResult(null);
  }, [prospect?.placeId]);

  function handlePush() {
    if (!prospect) return;
    startTransition(async () => {
      const res = await pushProspectToHubSpot({
        name: prospect.name,
        cityState: prospect.cityState,
        corridor: prospect.corridor,
        icpScore: prospect.icpScore,
        tier: prospect.tier,
        isExistingAccount: prospect.isExistingAccount,
      });
      setResult(res);
    });
  }

  const pushed = result?.ok === true;

  return (
    <Sheet open={!!prospect} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        {prospect && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {prospect.name}
                <BandBadge band={prospect.tier} />
              </SheetTitle>
              <SheetDescription>{prospect.address}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">ICP Score</span>
                <span className="text-2xl font-bold font-mono">{prospect.icpScore}</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Score Breakdown
                </p>
                {DIMENSIONS.map((dim) => {
                  const value = prospect[dim.key] as number;
                  const pct = Math.round((value / dim.max) * 100);
                  return (
                    <div key={dim.key}>
                      <div className="flex items-center justify-between text-xs">
                        <span>{dim.label}</span>
                        <span className="font-mono text-[var(--muted-foreground)]">{value}/{dim.max}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--accent)]">
                        <div
                          className="h-full rounded-full bg-[var(--primary)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Corridor</span>
                  <span>{prospect.corridor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Nearest Primo</span>
                  <span>{prospect.nearestPrimoName} ({prospect.nearestPrimoDistance.toFixed(1)} mi)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Location</span>
                  <span>{prospect.cityState}</span>
                </div>
                {prospect.discoveredVia.length > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Discovered via</span>
                    <span className="text-right text-xs">{formatDiscoveredVia(prospect.discoveredVia)}</span>
                  </div>
                )}
              </div>

              {prospect.isExistingAccount ? (
                <Link href={`/accounts/${prospect.existingAccountSlug}`}>
                  <Button variant="outline" className="w-full">Open in Accounts</Button>
                </Link>
              ) : (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={handlePush}
                    disabled={isPending || pushed}
                  >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {pushed && <Check className="mr-2 h-4 w-4" />}
                    {pushed
                      ? result?.action === 'updated' ? 'Updated in HubSpot' : 'Pushed to HubSpot'
                      : isPending ? 'Pushing…' : 'Push to HubSpot'}
                  </Button>

                  {pushed && result?.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      <ExternalLink className="h-3 w-3" /> Open company in HubSpot
                    </a>
                  )}
                  {result && !result.ok && (
                    <p className="text-center text-xs text-red-600">
                      {result.reason ?? result.error ?? 'Push failed.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
