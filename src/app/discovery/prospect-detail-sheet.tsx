'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Check, Star, Copy, FileText, MonitorPlay, ClipboardCheck } from 'lucide-react';
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
import { generateAngle } from '@/lib/discovery/angle';
import type { RankedRow } from '@/lib/discovery/scoring';
import { pushProspectToHubSpot, type PushResult } from './actions';

const DIMENSIONS: { key: keyof Pick<RankedRow, 'verticalMatch' | 'enterpriseScale' | 'networkComplexity' | 'primoProximity' | 'corridorDensity' | 'placeTypeBonus'>; label: string; max: number }[] = [
  { key: 'enterpriseScale', label: 'Enterprise Scale', max: 25 },
  { key: 'networkComplexity', label: 'Network Complexity', max: 25 },
  { key: 'verticalMatch', label: 'Vertical Match', max: 25 },
  { key: 'primoProximity', label: 'Primo Proximity', max: 10 },
  { key: 'corridorDensity', label: 'Corridor Density', max: 5 },
  { key: 'placeTypeBonus', label: 'Place Type Bonus', max: 10 },
];

interface Props {
  prospect: RankedRow | null;
  onClose: () => void;
  pinned: Set<string>;
  onTogglePin: (placeId: string) => void;
  touches: Record<string, string>;
  onLogTouch: (placeId: string) => void;
}

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function ProspectDetailSheet({ prospect, onClose, pinned, onTogglePin, touches, onLogTouch }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PushResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset transient state whenever a different prospect is opened.
  useEffect(() => {
    setResult(null);
    setCopied(false);
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

  async function handleCopy() {
    if (!prospect) return;
    try {
      await navigator.clipboard.writeText(generateAngle(prospect));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  const pushed = result?.ok === true;
  const isPinned = prospect ? pinned.has(prospect.placeId) : false;
  const lastTouched = prospect ? touches[prospect.placeId] : undefined;

  return (
    <Sheet open={!!prospect} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        {prospect && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {prospect.name}
                <BandBadge band={prospect.tier} />
                <button
                  type="button"
                  aria-label={isPinned ? 'Unpin' : 'Pin to worklist top'}
                  aria-pressed={isPinned}
                  onClick={() => onTogglePin(prospect.placeId)}
                  className="text-[var(--muted-foreground)] hover:text-amber-500"
                >
                  <Star className={`h-4 w-4 ${isPinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>
              </SheetTitle>
              <SheetDescription>{prospect.address}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              {/* Score + angle */}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">Worklist score</span>
                <span className="font-mono text-2xl font-bold">{prospect.worklistScore.toFixed(1)}</span>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-sm">
                {generateAngle(prospect)}
              </div>

              {/* Action layer */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {prospect.micrositeSlug ? (
                    <>
                      <a href={`/for/${prospect.micrositeSlug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full justify-start gap-2 text-xs">
                          <FileText className="h-3.5 w-3.5" /> Open /for memo
                        </Button>
                      </a>
                      <a href={`/demo/${prospect.micrositeSlug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full justify-start gap-2 text-xs">
                          <MonitorPlay className="h-3.5 w-3.5" /> Open /demo
                        </Button>
                      </a>
                    </>
                  ) : (
                    <p className="col-span-2 text-xs text-[var(--muted-foreground)]">
                      No YardFlow microsite yet for this prospect.
                    </p>
                  )}
                  <Button variant="outline" className="w-full justify-start gap-2 text-xs" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy opener'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => onLogTouch(prospect.placeId)}
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" /> Log a touch
                  </Button>
                </div>
                {lastTouched && (
                  <p className="text-xs text-[var(--muted-foreground)]">Last touched {relativeTime(lastTouched)}</p>
                )}
              </div>

              {/* Score breakdown */}
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

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Segment</span>
                  <span className="capitalize">{prospect.segment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Confidence</span>
                  <span className="capitalize">{prospect.confidence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Corridor</span>
                  <span>{prospect.corridor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Nearest reference</span>
                  <span>{prospect.nearestPrimoName} ({prospect.nearestPrimoDistance.toFixed(1)} mi)</span>
                </div>
                {prospect.discoveredVia.length > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--muted-foreground)]">Discovered via</span>
                    <span className="text-right text-xs">{formatDiscoveredVia(prospect.discoveredVia)}</span>
                  </div>
                )}
              </div>

              {/* CRM */}
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
