/**
 * GAP cockpit (dogfood UX pass): the compact operator summary at the top of
 * /gap. Pure presentational; every count is computed by the server page from
 * existing queries (listHypotheses, listQueue, listReplies, the shadow flag)
 * -- no new analytics engine, no new table.
 */

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export interface GapCockpitData {
  hypothesesToReview: number;
  routingDecisionsPending: number;
  repliesNeedingReview: { count: number; atLeast: boolean };
  shadowEnabled: boolean;
}

function Tile({
  href,
  label,
  value,
  cta,
}: {
  href: string;
  label: string;
  value: React.ReactNode;
  cta?: string;
}) {
  return (
    <Link
      href={href}
      data-testid={`cockpit-tile-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className="flex flex-col justify-between rounded-md border border-[var(--border)] bg-[var(--background)] p-4 transition-colors hover:bg-[var(--muted)]"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {cta ? <p className="mt-1 text-xs font-medium text-[var(--primary)]">{cta}</p> : null}
    </Link>
  );
}

export function GapCockpit({ data }: { data: GapCockpitData }) {
  return (
    <section data-testid="gap-cockpit" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        href="/gap/hypotheses?status=draft"
        label="Hypotheses to review"
        value={data.hypothesesToReview}
        cta={data.hypothesesToReview > 0 ? 'Review hypotheses' : undefined}
      />
      <Tile href="/gap" label="Routing decisions" value={data.routingDecisionsPending} />
      <Tile
        href="/gap/replies"
        label="Replies needing review"
        value={`${data.repliesNeedingReview.count}${data.repliesNeedingReview.atLeast ? '+' : ''}`}
      />
      <Tile
        href="/gap"
        label="Shadow status"
        value={
          <Badge data-testid="cockpit-shadow-badge" variant={data.shadowEnabled ? 'warning' : 'outline'}>
            {data.shadowEnabled ? 'Shadow on' : 'Off'}
          </Badge>
        }
      />
    </section>
  );
}
