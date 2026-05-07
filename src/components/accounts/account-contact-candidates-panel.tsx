'use client';

import { useMemo, useState } from 'react';
import { Loader2, UserCheck, UserRoundX, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { readApiResponse } from '@/lib/api-response';
import type { AccountContactCandidateView } from '@/lib/account-contact-candidates';

type ReplaceablePersona = {
  id: number;
  name: string;
  title?: string;
  email?: string | null;
  blockerBadges: string[];
};

type AccountContactCandidatesPanelProps = {
  slug: string;
  accountName: string;
  initialCandidates: AccountContactCandidateView[];
  replaceablePersonas: ReplaceablePersona[];
};

function toneForTier(tier: string) {
  if (tier === 'high') return 'default';
  if (tier === 'medium') return 'secondary';
  return 'outline';
}

function labelForState(state: string) {
  return state.replaceAll('_', ' ');
}

export function AccountContactCandidatesPanel({
  slug,
  accountName,
  initialCandidates,
  replaceablePersonas,
}: AccountContactCandidatesPanelProps) {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [discovering, setDiscovering] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [replaceSelections, setReplaceSelections] = useState<Record<number, string>>({});
  const [pendingGlobalSync, setPendingGlobalSync] = useState(false);

  const replaceOptions = useMemo(
    () => replaceablePersonas.filter((persona) => persona.blockerBadges.length > 0),
    [replaceablePersonas],
  );

  async function discover() {
    setDiscovering(true);
    try {
      const response = await fetch(`/api/accounts/${slug}/contact-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: true }),
      });
      const payload = await readApiResponse<{ candidates: AccountContactCandidateView[] }>(response);
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || 'Unable to discover candidates.');
      }
      setCandidates(payload.candidates);
      setPendingGlobalSync(true);
      toast.success(`Found ${payload.candidates.length} staged contacts for ${accountName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to discover candidates.');
    } finally {
      setDiscovering(false);
    }
  }

  async function mutateCandidate(candidateId: number, body: Record<string, unknown>, successMessage: string) {
    setPendingId(candidateId);
    try {
      const response = await fetch(`/api/accounts/${slug}/contact-candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await readApiResponse<{ candidates: AccountContactCandidateView[] }>(response);
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || 'Unable to update candidate.');
      }
      setCandidates(payload.candidates);
      setPendingGlobalSync(true);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update candidate.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Staged Contact Candidates</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Find contacts, review readiness, promote strong matches, and replace broken contacts without leaving this page.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => void discover()} disabled={discovering}>
          {discovering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
          Find More Contacts
        </Button>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
          No staged contact candidates yet. Run contact discovery to pull in reviewable candidates for this account.
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => {
            const replacementSelection = Number(replaceSelections[candidate.id] || 0);
            const busy = pendingId === candidate.id;
            return (
              <div key={candidate.id} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{candidate.fullName}</p>
                      {candidate.recommended ? <Badge>Recommended</Badge> : null}
                      <Badge variant={toneForTier(candidate.readiness.tier)}>{candidate.readiness.tier} readiness</Badge>
                      <Badge variant="outline">{labelForState(candidate.state)}</Badge>
                      {candidate.emailValid === false ? <Badge variant="secondary">Malformed email</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {candidate.title || 'Title unavailable'}
                      {candidate.email ? ` · ${candidate.email}` : ' · No email yet'}
                      {candidate.source ? ` · ${candidate.source}` : ''}
                    </p>
                    <p className="mt-2 text-sm">{candidate.recommendationReason || 'Candidate surfaced from live account discovery.'}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>Readiness {candidate.readiness.score}</span>
                      <span>Quality {candidate.qualityScore}</span>
                      <span>Confidence {candidate.confidenceScore}</span>
                      {candidate.companyDomain ? <span>{candidate.companyDomain}</span> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {candidate.readiness.reasons.length > 0 ? candidate.readiness.reasons.map((reason) => (
                        <Badge key={`${candidate.id}-${reason}`} variant="outline">{reason}</Badge>
                      )) : (
                        <Badge variant="outline">Ready to promote</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex min-w-[250px] flex-col gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={busy || candidate.state === 'promoted' || candidate.state === 'replaced'}
                      onClick={() => void mutateCandidate(candidate.id, { action: 'promote' }, `${candidate.fullName} promoted into contacts`)}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                      Promote
                    </Button>
                    <div className="flex gap-2">
                      <select
                        value={replaceSelections[candidate.id] ?? ''}
                        onChange={(event) => setReplaceSelections((current) => ({ ...current, [candidate.id]: event.target.value }))}
                        className="h-9 min-w-0 flex-1 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
                      >
                        <option value="">Replace blocked contact...</option>
                        {replaceOptions.map((persona) => (
                          <option key={persona.id} value={persona.id}>
                            {persona.name} {persona.title ? `· ${persona.title}` : ''}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={busy || !replacementSelection}
                        onClick={() => void mutateCandidate(
                          candidate.id,
                          { action: 'replace', replacedPersonaId: replacementSelection },
                          `${candidate.fullName} promoted and replacement recorded`,
                        )}
                      >
                        <UserRoundX className="h-3.5 w-3.5" />
                        Replace
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || candidate.state === 'deferred'}
                      onClick={() => void mutateCandidate(candidate.id, { action: 'defer', reason: 'Deferred from account page review' }, `${candidate.fullName} deferred`)}
                    >
                      Defer
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-3 text-xs text-[var(--muted-foreground)]">
        Promote creates or updates the persona record. Replace also marks the selected weak contact for follow-up review so the send flow can move to the stronger candidate.
        {pendingGlobalSync ? ' Account-wide cards update the next time intel is refreshed.' : ''}
      </div>
    </div>
  );
}
