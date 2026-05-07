'use client';

import { Badge } from '@/components/ui/badge';
import { readSourceBackedContractFromMetadata, type SourceBackedContractV1 } from '@/lib/source-backed/attribution';

type SourceAttributionPanelProps = {
  title?: string;
  attribution?: SourceBackedContractV1 | null;
  versionMetadata?: unknown;
  className?: string;
};

export function SourceAttributionPanel({
  title = 'Source-backed rationale',
  attribution,
  versionMetadata,
  className,
}: SourceAttributionPanelProps) {
  const parsed = attribution
    ? { contract: attribution, legacyFallback: false }
    : readSourceBackedContractFromMetadata(versionMetadata);

  if (!parsed.contract) {
    return (
      <div className={`rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 ${className ?? ''}`}>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {parsed.legacyFallback
            ? 'No sources attached. This draft was generated before source-backed attribution shipped — safe to send, just no evidence trail.'
            : 'Generate this with intel to attach the wedge, angle, and source citations behind every claim.'}
        </p>
      </div>
    );
  }

  const evidenceById = new Map(parsed.contract.evidence_refs.map((entry) => [entry.id, entry]));
  const citationsMet = parsed.contract.citation_count >= parsed.contract.citation_threshold;

  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="outline">{parsed.contract.contract}</Badge>
        <Badge
          variant={citationsMet ? 'secondary' : 'outline'}
          title={`Drafts must cite at least ${parsed.contract.citation_threshold} sources to be source-backed. This one cites ${parsed.contract.citation_count}.`}
        >
          {parsed.contract.citation_count}/{parsed.contract.citation_threshold} sources cited
        </Badge>
      </div>

      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Account wedge: {parsed.contract.account_wedge}
      </p>
      {parsed.contract.person_wedge ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Person wedge: {parsed.contract.person_wedge}
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {parsed.contract.angles.slice(0, 3).map((angle) => (
          <div key={angle.id} className="rounded border border-[var(--border)] p-2">
            <p className="text-xs font-medium">{angle.label}</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{angle.rationale}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {angle.evidence_ref_ids.map((refId) => (
                <Badge key={`${angle.id}-${refId}`} variant="outline">
                  {evidenceById.get(refId)?.label ?? refId}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
