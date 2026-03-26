import Link from 'next/link';
import { getAuditRoutes, slugify } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/status-badge';
import { CopyButton } from '@/components/copy-button';
import { ExternalLink } from 'lucide-react';

export default function AuditRoutesPage() {
  const routes = getAuditRoutes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Routes ({routes.length})</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          UTM-tracked landing page URLs for yardflow.ai/audit. Copy URLs and messages with one click.
        </p>
      </div>

      <div className="space-y-3">
        {routes.map((r) => (
          <Card key={r.account}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">#{r.rank}</Badge>
                  <Link href={`/accounts/${slugify(r.account)}`} className="font-semibold text-sm text-[var(--primary)] hover:underline">
                    {r.account}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">{r.owner}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a href={r.audit_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--primary)] hover:underline break-all flex-1 inline-flex items-center gap-1">
                  {r.audit_url} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <CopyButton text={r.audit_url} />
              </div>

              <div className="flex items-start gap-2">
                <p className="text-sm flex-1">{r.suggested_message}</p>
                <CopyButton text={r.suggested_message} />
              </div>

              <div className="rounded-lg bg-[var(--muted)] p-3 text-xs">
                <span className="font-medium">Fast Ask:</span> {r.fast_ask}
              </div>

              <div className="text-xs text-[var(--muted-foreground)]">
                Proof: {r.proof_asset} &middot; Warm Route: {r.warm_route}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
