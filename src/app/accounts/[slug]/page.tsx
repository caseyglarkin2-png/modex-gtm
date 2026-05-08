export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getWavesByAccount,
  getMeetingBriefByAccount,
  slugify,
  getAuditRoutes,
  getQrAssets,
} from '@/lib/data';
import {
  dbGetAccountByName,
  dbGetAccounts,
} from '@/lib/db';
import {
  accountCommandTabs,
  buildAccountEngagementSummary,
  buildAccountNextBestAction,
  buildAccountTimeline,
  type AccountCommandTabId,
} from '@/lib/account-command-center';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { BandBadge } from '@/components/band-badge';
import { StatusBadge } from '@/components/status-badge';
import { CopyButton } from '@/components/copy-button';
import { EmptyState } from '@/components/empty-state';
import { ExternalLink, Users, FileText, Calendar, Inbox, ListTodo, GitBranch, BriefcaseBusiness } from 'lucide-react';
import { LogActivityDialog } from '@/components/log-activity-dialog';
import { BookMeetingDialog } from '@/components/book-meeting-dialog';
import { GeneratorDialog } from '@/components/ai/generator-dialog';
import { EmailComposer } from '@/components/email/composer';
import { OnePagerDialog } from '@/components/ai/one-pager-preview';
import { Breadcrumb } from '@/components/breadcrumb';
import { AddPersonaDialog } from '@/components/add-persona-dialog';
import { EditableStatus } from '@/components/editable-status';
import { EditablePersonaStatus } from '@/components/editable-persona-status';
import { VoiceScriptButton } from '@/components/voice-script-button';
import type { RecentMicrositeSession } from '@/lib/microsites/analytics';
import { prisma } from '@/lib/prisma';
import { buildAccountTags } from '@/lib/research/account-tags';
import { evaluateContentQuality } from '@/lib/content-quality';
import { resolveContentQaChecklist } from '@/lib/revops/content-qa-checklist';
import { computeRecipientReadiness } from '@/lib/revops/recipient-readiness';
import { parseInfographicMetadata, type JourneyStageIntent } from '@/lib/revops/infographic-journey';
import { formatCanonicalConflictLabel } from '@/lib/revops/canonical-records';
import { InfographicJourneyControls } from '@/components/revops/infographic-journey-controls';
import { AccountGeneratedAssetActions } from '@/components/accounts/account-generated-asset-actions';
import { AccountContactCandidatesPanel } from '@/components/accounts/account-contact-candidates-panel';
import { AccountAssetVersionPanel } from '@/components/accounts/account-asset-version-panel';
import { AccountEngagementSummaryCard } from '@/components/accounts/account-engagement-summary-card';
import { AccountSecondaryActionsMenu } from '@/components/accounts/account-secondary-actions-menu';
import { AccountOutcomeLogger } from '@/components/accounts/account-outcome-logger';
import { OutboundCardRefreshButton } from '@/components/accounts/outbound-card-refresh-button';
import { EditableLongText } from '@/components/editable-long-text';
import { SOURCE_APPROVAL_GATE_ENABLED } from '@/lib/feature-flags';
import { getModexFloorEntry, isModexPast } from '@/lib/data/modex-floor-plan';
import { AgentIntelStrip } from '@/components/agent-actions/agent-intel-strip';
import { SendJobTracker } from '@/components/generated-content/send-job-tracker';
import {
  buildCommitteeCoverageBrief,
  buildCoverageGaps,
  buildRecommendedAngle,
  buildRecommendedAngleCitations,
  buildSignalRegistry,
  buildSuggestedRecipients,
  buildSuggestedRecipientSets,
} from '@/lib/agent-actions/account-command-center';
import { loadAccountCommandCenterData } from '@/lib/account-command-center-data';
import { summarizeFreshness } from '@/lib/agent-actions/freshness';
import { parseAssetProvenanceSummary, resolveAccountAssetSelection } from '@/lib/generated-content/asset-selection';
import { buildOutcomeFollowUpRecommendation } from '@/lib/revops/operator-outcomes';

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function normalizeEmail(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function pickCandidateTraceFromEmailMetadata(metadata: unknown) {
  const root = asRecord(metadata);
  const recipient = asRecord(root?.recipient);
  const direct = asRecord(recipient?.candidateTrace);
  if (direct) return direct;
  const workflow = asRecord(root?.workflow);
  const details = asRecord(workflow?.details);
  const workflowTrace = asRecord(details?.candidateTrace);
  return asRecord(workflowTrace?.recipient);
}

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ recipientSet?: string; tab?: string; replace_persona?: string; find_lane?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const initialTab = resolvedSearchParams.tab ?? 'overview';
  const replacePersonaId = resolvedSearchParams.replace_persona
    ? Number.parseInt(resolvedSearchParams.replace_persona, 10) || null
    : null;
  const findLane = resolvedSearchParams.find_lane?.trim() || null;
  const accounts = await dbGetAccounts();
  const matchedAccount = accounts.find((candidate) => slugify(candidate.name) === slug);
  const account = matchedAccount ? await dbGetAccountByName(matchedAccount.name) : null;
  if (!account) notFound();

  const {
    accountScope,
    personas,
    microsite,
    rawActivities,
    generatedAssetRows,
    emailLogs,
    meetings,
    captures,
    canonicalWorkspace,
    agentContentContext,
    contactCandidates,
    sendJobs,
    sendJobRecipientEvents,
    operatorOutcomes,
    evidenceSummary,
  } = await loadAccountCommandCenterData(account.name);
  const waves = getWavesByAccount(account.name);
  const brief = getMeetingBriefByAccount(account.name);
  const auditRoutes = getAuditRoutes();
  const auditRoute = auditRoutes.find((r) => r.account === account.name);
  const qrAsset = getQrAssets().find((asset) => asset.account === account.name);
  const [activeCampaigns, accountFieldEdits] = await Promise.all([
    prisma.campaign.findMany({
      where: { status: 'active' },
      orderBy: [{ start_date: 'desc' }, { created_at: 'desc' }],
      take: 6,
      select: { slug: true, name: true, messaging_angle: true, campaign_type: true },
    }),
    // S4-T3: Pull the latest field-edit Activity per editable account field so
    // each editable card can render a "Edited 2h ago by Casey" badge. Single
    // query — we group client-side by field below.
    prisma.activity.findMany({
      where: { account_name: account.name, activity_type: 'account_field_edit' },
      orderBy: { created_at: 'desc' },
      take: 30,
      select: { id: true, owner: true, outcome: true, created_at: true },
    }),
  ]);
  const latestFieldEditByField = new Map<string, { actor: string; at: Date }>();
  for (const edit of accountFieldEdits) {
    if (!edit.outcome || latestFieldEditByField.has(edit.outcome)) continue;
    latestFieldEditByField.set(edit.outcome, {
      actor: edit.owner ?? 'unknown',
      at: edit.created_at,
    });
  }
  const activities = rawActivities.map((activity) => ({
    ...activity,
    activityDateLabel: activity.activity_date ? formatActivityDate(activity.activity_date) : '',
    nextStepDueLabel: activity.next_step_due ? formatActivityDate(activity.next_step_due) : '',
  }));
  const micrositeOverviewPath = `/for/${slug}`;
  const generatedAssets = generatedAssetRows.map((asset) => {
    const checklist = resolveContentQaChecklist({
      campaignType: asset.campaign?.campaign_type,
      completedItemIds: asset.checklist_state?.completed_item_ids ?? [],
      content: asset.content,
      accountName: account.name,
    });
    return {
      ...asset,
      campaign_type: asset.campaign?.campaign_type,
      quality: evaluateContentQuality(asset.content, account.name),
      checklist,
      checklist_completed_item_ids: checklist.completedItemIds,
    };
  });
  const canonicalAccountSummary = canonicalWorkspace.accountSummaries.get(account.name) ?? null;
  const accountRecipients = personas
    .filter((persona) => Boolean(persona.email))
    .map((persona) => {
      const canonical = canonicalWorkspace.contactsByPersonaId.get(persona.id);
      return {
        id: persona.id,
        name: persona.name,
        email: persona.email!,
        title: persona.title ?? undefined,
        role_in_deal: persona.role_in_deal ?? undefined,
        readiness: computeRecipientReadiness({
          email_confidence: persona.email_confidence,
          quality_score: persona.quality_score,
          title: persona.title,
          role_in_deal: persona.role_in_deal,
          last_enriched_at: persona.last_enriched_at,
        }),
        canonicalStatus: canonical?.status,
        canonicalConflicts: canonical?.conflictCodes.map(formatCanonicalConflictLabel) ?? [],
        canonicalBlockedReason: canonical?.sendBlockReason,
      };
    });
  const suggestedRecipients = buildSuggestedRecipients(accountRecipients, agentContentContext);
  const suggestedRecipientSets = buildSuggestedRecipientSets(suggestedRecipients);
  const selectedRecipientSetKey = resolvedSearchParams.recipientSet;
  const activeRecipientSet = selectedRecipientSetKey === 'manual'
    ? null
    : suggestedRecipientSets.find((set) => set.key === selectedRecipientSetKey)
      ?? suggestedRecipientSets.find((set) => set.recommended)
      ?? null;
  const suggestedRecipientIds = activeRecipientSet?.recipientIds.length
    ? activeRecipientSet.recipientIds
    : suggestedRecipients.slice(0, 3).map((recipient) => recipient.id);
  const signalRegistry = buildSignalRegistry(agentContentContext);
  const coverageGaps = buildCoverageGaps(agentContentContext);
  const recommendedAngle = buildRecommendedAngle(agentContentContext, account.primo_angle ?? account.why_now ?? '');
  const recommendedAngleCitations = buildRecommendedAngleCitations(evidenceSummary);
  const committeeCoverageBrief = buildCommitteeCoverageBrief(agentContentContext, suggestedRecipients);
  const freshnessSummary = summarizeFreshness(agentContentContext?.freshness ?? null);
  const assetSelection = resolveAccountAssetSelection(generatedAssets);
  const recommendedAsset = assetSelection.recommendedAsset;
  const latestSendableAsset = assetSelection.latestSendableAsset;
  const recommendedAssetProvenance = recommendedAsset ? parseAssetProvenanceSummary(recommendedAsset.version_metadata) : null;
  const latestInfographic = generatedAssets[0] ? parseInfographicMetadata(generatedAssets[0].version_metadata) : null;
  const hasMeetingSignal = meetings.some((meeting) => /booked|held|completed|scheduled/i.test(meeting.meeting_status ?? ''));
  const engagementSummary = buildAccountEngagementSummary({
    emails: emailLogs,
    meetings,
    operatorOutcomes,
  });
  const latestOutcomeRecommendation = buildOutcomeFollowUpRecommendation({
    outcomeLabel: operatorOutcomes[0]?.outcome_label ?? null,
    stageIntent: latestInfographic?.stageIntent ?? 'cold',
    coverageGapCount: coverageGaps.length,
    hasMeetingSignal,
    notes: operatorOutcomes[0]?.notes ?? null,
  });
  const candidateTraceByEmail = new Map(
    contactCandidates
      .filter((candidate) => candidate.email)
      .map((candidate) => [
        normalizeEmail(candidate.email),
        {
          candidateId: candidate.id,
          accountName: candidate.accountName,
          candidateKey: candidate.candidateKey,
          fullName: candidate.fullName,
          email: candidate.email,
          state: candidate.state,
          source: candidate.source,
          promotedPersonaId: candidate.promotedPersonaId,
          replacedPersonaId: candidate.replacedPersonaId,
          deferredReason: candidate.deferredReason,
        },
      ]),
  );
  const accountOutcomeSources = [
    ...emailLogs.map((email) => ({
      key: `email-${email.id}`,
      label: email.reply_count > 0 ? `Reply signal · ${email.subject}` : `Email send · ${email.subject}`,
      detail: `${email.to_email} · ${formatActivityDate(email.sent_at)}`,
      sourceKind: 'email-log',
      sourceId: String(email.id),
      generatedContentId: email.generated_content_id ?? null,
      sourceMetadata: (() => {
        const candidateTrace = pickCandidateTraceFromEmailMetadata(email.metadata)
          ?? candidateTraceByEmail.get(normalizeEmail(email.to_email))
          ?? null;
        if (!candidateTrace) return null;
        return { candidateTrace };
      })(),
    })),
    ...sendJobRecipientEvents.map((recipient) => ({
      key: `send-recipient-${recipient.id}`,
      label: `Send ${recipient.status} · ${recipient.to_email}`,
      detail: `${recipient.error_message ?? `asset ${recipient.generated_content_id}`} · ${formatActivityDate(recipient.sent_at ?? recipient.updated_at ?? recipient.created_at)}`,
      sourceKind: 'send-job-recipient',
      sourceId: String(recipient.id),
      generatedContentId: recipient.generated_content_id ?? null,
      sourceMetadata: (() => {
        const candidateTrace = candidateTraceByEmail.get(normalizeEmail(recipient.to_email)) ?? null;
        if (!candidateTrace) return null;
        return { candidateTrace };
      })(),
    })),
  ].slice(0, 10);
  const openTaskCount = Number(Boolean(account.next_action)) + activities.filter((activity) => Boolean(activity.next_step)).length + captures.filter((capture) => Boolean(capture.next_step)).length;
  const assetCount = Number(Boolean(brief)) + Number(Boolean(auditRoute)) + Number(Boolean(qrAsset)) + generatedAssets.length + 1;
  const nextBestAction = buildAccountNextBestAction(account, {
    contactCount: personas.length,
    assetCount,
    openTaskCount,
    replyCount: engagementSummary.replied,
    coverageGapCount: coverageGaps.length,
    latestOutcomeLabel: engagementSummary.latestOutcomeLabel,
    latestOutcomeNotes: engagementSummary.latestOutcomeNote,
    hasMeetingSignal,
  });
  const timeline = buildAccountTimeline({
    activities: rawActivities,
    emails: emailLogs,
    meetings,
    micrositeSessions: microsite.recentSessions,
    captures,
    sendRecipients: sendJobRecipientEvents,
    operatorOutcomes,
  });
  const journeyActivities = rawActivities
    .filter((activity) => activity.activity_type === 'Infographic Journey')
    .slice(0, 6);
  const initialJourneyStage = (latestInfographic?.stageIntent ?? 'cold') as JourneyStageIntent;

  const scoreDims = [
    { label: 'ICP Fit', value: account.icp_fit, weight: 30 },
    { label: 'MODEX Signal', value: account.modex_signal, weight: 20 },
    { label: 'Primo Story', value: account.primo_story_fit, weight: 20 },
    { label: 'Warm Intro', value: account.warm_intro, weight: 15 },
    { label: 'Strategic Value', value: account.strategic_value, weight: 10 },
    { label: 'Meeting Ease', value: account.meeting_ease, weight: 5 },
  ];

  const accountTags = buildAccountTags(account);
  const replaceablePersonas = personas
    .map((persona) => {
      const canonical = canonicalWorkspace.contactsByPersonaId.get(persona.id);
      const blockerBadges = buildPersonaBlockerBadges({
        email: persona.email,
        email_valid: persona.email_valid,
        do_not_contact: persona.do_not_contact,
        canonicalBlockedReason: canonical?.sendBlockReason ?? null,
        canonicalConflicts: canonical?.conflictCodes.map(formatCanonicalConflictLabel) ?? [],
      });
      return {
        id: persona.id,
        name: persona.name,
        title: persona.title ?? undefined,
        email: persona.email,
        blockerBadges,
      };
    })
    .filter((persona) => persona.blockerBadges.length > 0);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Accounts', href: '/accounts' }, { label: account.name }]} />

      {/* Hero Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
                <BandBadge band={account.priority_band} />
                {(() => {
                  const floor = getModexFloorEntry(account.name);
                  if (!floor) return null;
                  const past = isModexPast();
                  const label = past
                    ? `Was on MODEX floor · ${floor.tier === 'tier_1' ? 'Tier 1' : 'Tier 2'}`
                    : `MODEX ${floor.tier === 'tier_1' ? 'Tier 1' : 'Tier 2'}`;
                  const tooltip = past
                    ? `${floor.context ?? 'On the MODEX 2026 floor plan'} — event concluded; use for follow-up context.`
                    : floor.context ?? 'On the MODEX floor plan';
                  return (
                    <Badge
                      variant={past ? 'outline' : floor.tier === 'tier_1' ? 'default' : 'secondary'}
                      title={tooltip}
                      data-testid="modex-floor-badge"
                    >
                      {label}
                    </Badge>
                  );
                })()}
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {account.parent_brand} &middot; {account.vertical} &middot; {account.signal_type}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">Account Command Center</p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">{account.tier}</Badge>
                <Badge variant="outline" className="font-mono">Score: {account.priority_score}</Badge>
                <Badge variant="secondary">{account.owner}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Primary Path</span>
                {latestSendableAsset ? (
                  <AccountGeneratedAssetActions
                    accountName={account.name}
                    asset={latestSendableAsset}
                    recipients={accountRecipients}
                    initialSelectedRecipientIds={suggestedRecipientIds}
                    previewLabel={recommendedAsset?.id === latestSendableAsset.id ? 'Use Recommended Asset' : 'Preview'}
                    showPreview={false}
                    sendLabel={recommendedAsset?.id === latestSendableAsset.id ? 'Use Recommended Asset' : 'Send Latest Asset'}
                  />
                ) : null}
              <OnePagerDialog
                accountName={account.name}
                recipients={accountRecipients}
                initialSelectedRecipientIds={suggestedRecipientIds}
                trigger={
                  <Button size="sm" className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
                    <FileText className="h-3.5 w-3.5" />
                      Generate With Intel
                    </Button>
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Secondary Actions</span>
                <AccountSecondaryActionsMenu
                  accountName={account.name}
                  personas={personas.map((p) => ({ name: p.name, title: p.title ?? undefined, priority: p.priority }))}
                  recipients={accountRecipients}
                  generatedAssets={generatedAssets}
                  recipientSets={suggestedRecipientSets}
                  initialSelectedRecipientIds={suggestedRecipientIds}
                  defaultRecipientSetKey={activeRecipientSet?.key ?? null}
                  recommendedAngle={recommendedAngle}
                  whyNow={account.why_now ?? undefined}
                  approvalGateEnabled={SOURCE_APPROVAL_GATE_ENABLED}
                  campaignSlug={activeCampaigns[0]?.slug}
                  outcomeSources={accountOutcomeSources}
                  calendlyLink={process.env.NEXT_PUBLIC_CALENDLY_LINK}
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Status Row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Research:</span>
              <EditableStatus accountName={account.name} field="research_status" currentValue={account.research_status} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Outreach:</span>
              <EditableStatus accountName={account.name} field="outreach_status" currentValue={account.outreach_status} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Meeting:</span>
              <EditableStatus accountName={account.name} field="meeting_status" currentValue={account.meeting_status} />
            </div>
            {account.hubspot_company_id && (
              <a
                href={`https://app.hubspot.com/contacts/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''}/company/${account.hubspot_company_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View in HubSpot
              </a>
            )}
          </div>

          {/* Score Dimensions */}
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {scoreDims.map((dim) => (
              <div key={dim.label} className="rounded-lg border border-[var(--border)] p-2.5 text-center">
                <p className="text-[10px] text-[var(--muted-foreground)]">{dim.label} ({dim.weight}%)</p>
                <p className="mt-0.5 text-lg font-bold">{dim.value}<span className="text-xs font-normal text-[var(--muted-foreground)]">/5</span></p>
              </div>
            ))}
          </div>

          {/* Research-backed tags (facility fact, vertical, signal, etc.) */}
          <div className="mt-4 flex flex-wrap gap-2">
            {accountTags.map((tag) => (
              <Badge
                key={`${tag.label}-${tag.value}`}
                variant="outline"
                className="flex items-center gap-1"
                title={`Source: ${tag.source}`}
                aria-label={`${tag.label} ${tag.value} — Source: ${tag.source}`}
              >
                <span className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{tag.label}</span>
                <span className="font-medium">{tag.value}</span>
                {tag.hint ? <span className="text-[10px] text-[var(--muted-foreground)]">({tag.hint})</span> : null}
              </Badge>
            ))}
          </div>
          <div className="mt-4">
            <AgentIntelStrip
              accountName={account.name}
              accountNames={accountScope.accountNames}
              initialResult={agentContentContext}
              recipients={accountRecipients}
            />
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Outbound Command Center</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Recommendation</p>
                    <p className="mt-1 font-medium">{agentContentContext?.nextActions[0] ?? 'Refresh intel and pick the strongest first touch.'}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Why now</p>
                    <div className="mt-1">
                      <EditableLongText
                        accountSlug={slug}
                        field="why_now"
                        currentValue={account.why_now}
                        emptyFallback="Use current live intel to sharpen the hypothesis."
                        placeholder="Why is this account a priority right now?"
                      />
                    </div>
                    {latestFieldEditByField.get('why_now') ? (
                      <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
                        Edited {formatActivityDate(latestFieldEditByField.get('why_now')!.at)} by {latestFieldEditByField.get('why_now')!.actor}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Best angle</p>
                    <p className="mt-1 text-sm">{recommendedAngle || 'Lead with gate-to-dock variance and throughput pressure.'}</p>
                    {recommendedAngleCitations.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {recommendedAngleCitations.map((citation) => (
                          <a
                            key={citation.url}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center"
                            title={citation.label}
                          >
                            <Badge variant="outline" className="text-[10px] font-normal hover:bg-[var(--accent)]">
                              {citation.label} ↗
                            </Badge>
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 border-t border-[var(--border)] pt-2">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Curated Primo angle (fallback)</p>
                      <div className="mt-1">
                        <EditableLongText
                          accountSlug={slug}
                          field="primo_angle"
                          currentValue={account.primo_angle}
                          emptyFallback="No hand-curated angle yet — agent recommendation is shown above."
                          placeholder="Your hand-curated framing for this account."
                        />
                      </div>
                      {latestFieldEditByField.get('primo_angle') ? (
                        <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
                          Edited {formatActivityDate(latestFieldEditByField.get('primo_angle')!.at)} by {latestFieldEditByField.get('primo_angle')!.actor}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Recommended Asset</p>
                      <OutboundCardRefreshButton accountName={account.name} accountNames={accountScope.accountNames} surfaceLabel="Recommended asset" />
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {recommendedAsset
                        ? `${recommendedAsset.content_type.replaceAll('_', ' ')} · v${recommendedAsset.version}`
                        : 'Generate with live intel to create the first asset.'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {recommendedAsset
                        ? `This is the default asset for the primary path on this account.${recommendedAssetProvenance?.usedLiveIntel ? ' Generated with live intel.' : ''}`
                        : 'No recommended asset yet.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Intel Freshness</p>
                      <OutboundCardRefreshButton accountName={account.name} accountNames={accountScope.accountNames} surfaceLabel="Intel freshness" />
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {agentContentContext
                        ? `${freshnessSummary.label} · ${agentContentContext.freshness.source}`
                        : freshnessSummary.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {freshnessSummary.guidance}
                    </p>
                    {agentContentContext ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.values(agentContentContext.freshness.dimensions).map((dimension) => (
                          <Badge key={dimension.key} variant={dimension.stale ? 'secondary' : 'outline'}>
                            {dimension.label}: {dimension.status.replaceAll('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Active Recipient Set</p>
                      <OutboundCardRefreshButton accountName={account.name} accountNames={accountScope.accountNames} surfaceLabel="Recipient set" />
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {activeRecipientSet ? `${activeRecipientSet.label} · ${activeRecipientSet.count} contacts` : 'Manual selection'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {activeRecipientSet
                        ? 'This set pre-fills send flows. You can still edit recipients in the send dialog.'
                        : 'Agent set ignored. The send dialog will fall back to its normal recommended recipients.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Source Evidence</p>
                      <OutboundCardRefreshButton accountName={account.name} accountNames={accountScope.accountNames} surfaceLabel="Source evidence" />
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {evidenceSummary
                        ? `${evidenceSummary.freshness.fresh} fresh · ${evidenceSummary.freshness.aging} aging · ${evidenceSummary.freshness.stale} stale`
                        : 'No sources captured yet for this account.'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {evidenceSummary
                        ? `Latest research run: ${evidenceSummary.run.latestStatus ?? 'unknown'}${evidenceSummary.run.latestAt ? ` (${new Date(evidenceSummary.run.latestAt).toLocaleString()})` : ''}. Sources here back every claim in source-backed drafts.`
                        : 'Click Refresh Intel to capture claims + sources. Anything fresh here gets cited automatically when you generate outreach.'}
                    </p>
                    {evidenceSummary && evidenceSummary.latestClaims.length > 0 ? (
                      <details className="mt-2 group" data-testid="evidence-claims-disclosure">
                        <summary className="cursor-pointer text-xs font-medium text-[var(--primary)] hover:underline">
                          View latest {Math.min(3, evidenceSummary.latestClaims.length)} claim{evidenceSummary.latestClaims.length === 1 ? '' : 's'}
                        </summary>
                        <ul className="mt-2 space-y-1.5">
                          {evidenceSummary.latestClaims.slice(0, 3).map((claim) => (
                            <li key={claim.id} className="text-xs">
                              <a
                                href={claim.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--primary)] hover:underline"
                              >
                                ↗
                              </a>
                              <span className="ml-1.5 text-[var(--muted-foreground)]">{claim.claim}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Top signals</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {signalRegistry.length > 0 ? signalRegistry.slice(0, 4).map((signal) => (
                        <li key={signal.key}>
                          <span className="font-medium">{signal.title}:</span> {signal.summary}
                          <span className="text-[var(--muted-foreground)]"> · {signal.source} · {signal.freshness.replaceAll('_', ' ')}</span>
                        </li>
                      )) : <li>No strong live signals yet. Refresh intel and keep discovering coverage.</li>}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Coverage gaps</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {coverageGaps.map((gap) => (
                        <li key={gap}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Committee Brief</p>
                    <div className="flex flex-wrap gap-2">
                      {committeeCoverageBrief.coveredLanes.map((lane) => (
                        <Badge key={`covered-${lane}`} variant="outline">{lane}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm">{committeeCoverageBrief.summary}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Missing lanes</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {committeeCoverageBrief.missingLanes.length > 0 ? committeeCoverageBrief.missingLanes.map((lane) => (
                          <li key={`missing-${lane}`} className="flex items-center gap-2">
                            <span>{lane}</span>
                            <Link
                              href={`/accounts/${slug}?tab=contacts&find_lane=${encodeURIComponent(lane)}#contact-discovery`}
                              className="text-xs font-medium text-[var(--primary)] hover:underline"
                              data-testid={`find-lane-cta-${lane}`}
                            >
                              Find {lane} contacts
                            </Link>
                          </li>
                        )) : <li>Committee coverage is usable across core lanes.</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Recommended next people</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {committeeCoverageBrief.recommendedNextPeople.length > 0 ? committeeCoverageBrief.recommendedNextPeople.map((person) => (
                          <li key={person}>{person}</li>
                        )) : <li>Build committee or find more contacts to expand the buyer map.</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Suggested Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Suggested Recipient Sets</p>
                  <div className="grid gap-2">
                    {suggestedRecipientSets.map((set) => {
                      const isActive = activeRecipientSet?.key === set.key;
                      return (
                        <Link
                          key={set.key}
                          href={`/accounts/${slug}?recipientSet=${set.key}`}
                          className={`rounded-lg border p-3 transition-colors hover:border-[var(--primary)] ${
                            isActive ? 'border-[var(--primary)] bg-[var(--accent)]/30' : 'border-[var(--border)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{set.label}</p>
                              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{set.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {set.recommended ? <Badge>Recommended</Badge> : null}
                              {isActive ? <Badge variant="outline">Active</Badge> : null}
                              <Badge variant="secondary">{set.count}</Badge>
                            </div>
                          </div>
                          {set.topNames.length > 0 ? (
                            <p className="mt-2 text-xs text-[var(--muted-foreground)]">{set.topNames.join(' • ')}</p>
                          ) : (
                            <p className="mt-2 text-xs text-[var(--muted-foreground)]">No strong contacts in this lane yet.</p>
                          )}
                        </Link>
                      );
                    })}
                    <Link
                      href={`/accounts/${slug}?recipientSet=manual`}
                      className={`rounded-lg border p-3 transition-colors hover:border-[var(--primary)] ${
                        !activeRecipientSet ? 'border-[var(--primary)] bg-[var(--accent)]/30' : 'border-[var(--border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">Manual Selection</p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Ignore the agent set and edit recipients yourself in the send dialog.</p>
                        </div>
                        {!activeRecipientSet ? <Badge variant="outline">Active</Badge> : null}
                      </div>
                    </Link>
                  </div>
                </div>
                {suggestedRecipients.slice(0, 4).map((recipient) => (
                  <div key={recipient.id} className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{recipient.title ?? recipient.email}</p>
                      </div>
                      <Badge variant="outline">{recipient.lane}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">{recipient.reason}</p>
                  </div>
                ))}
                {suggestedRecipients.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">No sendable recipients yet. Find more contacts or enrich the mapped personas.</p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          {accountCommandTabs.map((tab) => {
            const Icon = accountTabIcon(tab.id);
            const count = tab.id === 'contacts'
              ? personas.length
              : tab.id === 'assets'
                ? assetCount
                : tab.id === 'engagement'
                  ? timeline.length
                  : tab.id === 'tasks'
                    ? openTaskCount
                    : tab.id === 'meetings'
                      ? meetings.length
                      : tab.id === 'pipeline'
                        ? waves.length
                        : null;

            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1">
                <Icon className="h-3.5 w-3.5" />
                {tab.label}{count !== null ? ` (${count})` : ''}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Next Best Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={nextBestAction.tone === 'ready' ? 'success' : nextBestAction.tone === 'blocked' ? 'destructive' : 'warning'}>
                      {nextBestAction.tone}
                    </Badge>
                    <p className="font-medium">{nextBestAction.label}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{nextBestAction.detail}</p>
                </div>
                <Link href={nextBestAction.route}>
                  <Button size="sm" variant="outline">Open work</Button>
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5" data-testid="nba-quick-actions">
                {/* Quick-action chips derived from the NBA route. Mirrors the
                    affordances on the account hero so the operator can act
                    without scrolling back up. */}
                {(nextBestAction.route === '#contacts' || /contact|committee|coverage/i.test(nextBestAction.label)) ? (
                  <Link
                    href={`/accounts/${slug}?tab=contacts#contact-discovery`}
                    className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs hover:bg-[var(--accent)]"
                    data-testid="nba-chip-find-contacts"
                  >
                    Find contacts
                  </Link>
                ) : null}
                {(nextBestAction.route === '#engagement' || /outreach|reply|outbound/i.test(nextBestAction.label)) ? (
                  <Link
                    href={`/accounts/${slug}?tab=engagement`}
                    className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs hover:bg-[var(--accent)]"
                    data-testid="nba-chip-engagement"
                  >
                    Open engagement
                  </Link>
                ) : null}
                {(nextBestAction.route === '#assets' || /asset|generate/i.test(nextBestAction.label)) ? (
                  <Link
                    href={`/generated-content?account=${encodeURIComponent(account.name)}`}
                    className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs hover:bg-[var(--accent)]"
                    data-testid="nba-chip-generate"
                  >
                    Generate asset
                  </Link>
                ) : null}
                <OutboundCardRefreshButton accountName={account.name} accountNames={accountScope.accountNames} surfaceLabel="Intel" />
              </div>
            </CardContent>
          </Card>
          {latestOutcomeRecommendation ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Learning Loop Recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {latestOutcomeRecommendation.latestOutcomeLabel.replaceAll('-', ' ')}
                  </Badge>
                  <p className="text-sm text-[var(--muted-foreground)]">{latestOutcomeRecommendation.summary}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Next action</p>
                    <p className="mt-1 font-medium">{latestOutcomeRecommendation.nextAction.label}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{latestOutcomeRecommendation.nextAction.detail}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Next asset</p>
                    <p className="mt-1 font-medium">{latestOutcomeRecommendation.nextAsset.label}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{latestOutcomeRecommendation.nextAsset.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
          <AccountEngagementSummaryCard summary={engagementSummary} accountSlug={slug} />
          {canonicalAccountSummary ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Canonical Record Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Company Source</p>
                    <p className="mt-1 font-medium">{canonicalAccountSummary.canonicalCompanySource.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Linked Contacts</p>
                    <p className="mt-1 font-medium">{canonicalAccountSummary.linkedContacts}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Contacts With Email</p>
                    <p className="mt-1 font-medium">{canonicalAccountSummary.sendableContacts}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3">
                    <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Unresolved Conflicts</p>
                    <p className={`mt-1 font-medium ${canonicalAccountSummary.unresolvedConflicts > 0 ? 'text-amber-700' : ''}`}>
                      {canonicalAccountSummary.unresolvedConflicts}
                    </p>
                  </div>
                </div>
                {canonicalAccountSummary.duplicateCompanyAccounts.length > 0 ? (
                  <p className="text-xs text-amber-700">
                    Canonical company collision with: {canonicalAccountSummary.duplicateCompanyAccounts.join(', ')}.
                  </p>
                ) : (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Canonical company id: {canonicalAccountSummary.canonicalCompanyId ?? 'not resolved'}.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Microsite Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {microsite.totalSessions === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-4">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No tracked microsite sessions for {account.name} yet. The public overview page is instrumented and ready.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={micrositeOverviewPath} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
                      Open overview microsite <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Sessions</p>
                      <p className="mt-1 text-xl font-bold">{microsite.totalSessions}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{microsite.highIntentSessions} high-intent</p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">CTA Sessions</p>
                      <p className="mt-1 text-xl font-bold">{microsite.ctaSessions}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Buyer action windows</p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Average Scroll</p>
                      <p className="mt-1 text-xl font-bold">{microsite.avgScrollDepthPct}%</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Depth across tracked sessions</p>
                    </div>
                    <div className="rounded-lg border border-[var(--border)] p-3">
                      <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Average Read</p>
                      <p className="mt-1 text-xl font-bold">{formatMicrositeDuration(microsite.avgDurationSeconds)}</p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Time spent on page</p>
                    </div>
                  </div>

                  {microsite.accountSummary && (
                    <div className="rounded-lg border border-[var(--border)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{microsite.accountSummary.primarySignal}</p>
                            <MicrositeAccountHeatBadge score={microsite.accountSummary.engagementScore} />
                          </div>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)] leading-relaxed">
                            {microsite.accountSummary.recommendedAction}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={microsite.accountSummary.lastPath} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
                            Open latest microsite <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                        Last seen {formatMicrositeTimestamp(microsite.accountSummary.lastViewedAt)}
                        {microsite.accountSummary.lastPersonName ? ` · Latest viewer: ${microsite.accountSummary.lastPersonName}` : ''}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Recent Sessions</p>
                      <Link href={micrositeOverviewPath} className="text-xs font-medium text-[var(--primary)] hover:underline">
                        Open overview microsite
                      </Link>
                    </div>
                    {microsite.recentSessions.slice(0, 4).map((session) => (
                      <MicrositeSessionRow key={`${session.path}-${session.viewedAt.toISOString()}`} session={session} />
                    ))}
                  </div>

                  {microsite.variants.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Variant Performance</p>
                      <div className="space-y-2">
                        {microsite.variants.map((variant) => (
                          <div key={variant.path} className="rounded-lg border border-[var(--border)] p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link href={variant.path} className="text-sm font-medium text-[var(--primary)] hover:underline">
                                    {variant.label}
                                  </Link>
                                  {variant.ctaSessions > 0 ? (
                                    <Badge className="bg-emerald-600 text-white">CTA active</Badge>
                                  ) : variant.highIntentSessions > 0 ? (
                                    <Badge className="bg-amber-500 text-white">High intent</Badge>
                                  ) : (
                                    <Badge variant="outline">Watch</Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                  {variant.sessionCount} sessions · {variant.highIntentSessions} high-intent · {variant.ctaSessions} CTA sessions
                                </p>
                              </div>
                              <div className="text-right text-xs text-[var(--muted-foreground)]">
                                <p>{variant.avgScrollDepthPct}% scroll</p>
                                <p>{formatMicrositeDuration(variant.avgDurationSeconds)} average read</p>
                                <p>{formatMicrositeTimestamp(variant.lastViewedAt)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Best Intro Path</CardTitle></CardHeader>
              <CardContent>
                <EditableLongText
                  accountSlug={slug}
                  field="best_intro_path"
                  currentValue={account.best_intro_path}
                  emptyFallback="No intro path captured yet."
                  placeholder="How should we get into this account?"
                />
                {latestFieldEditByField.get('best_intro_path') ? (
                  <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
                    Edited {formatActivityDate(latestFieldEditByField.get('best_intro_path')!.at)} by {latestFieldEditByField.get('best_intro_path')!.actor}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Current Motion</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{account.current_motion}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Next Action</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{account.next_action}</p></CardContent>
            </Card>
          </div>
          {account.notes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{account.notes}</p></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-3">
          <div className="flex justify-end">
            <AddPersonaDialog accountName={account.name} />
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contact Discovery Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountContactCandidatesPanel
                slug={slug}
                accountName={account.name}
                initialCandidates={contactCandidates}
                replaceablePersonas={replaceablePersonas}
                replacePersonaId={replacePersonaId}
                findLane={findLane}
              />
            </CardContent>
          </Card>
          {personas.length === 0 ? (
            <EmptyState title="No contacts mapped" description="Contacts will appear here once added." />
          ) : (
            personas.map((p) => {
              const personaReadiness = computeRecipientReadiness({
                email_confidence: p.email_confidence,
                quality_score: p.quality_score,
                title: p.title,
                role_in_deal: p.role_in_deal,
                last_enriched_at: p.last_enriched_at,
              });
              const blockerBadges = buildPersonaBlockerBadges({
                email: p.email,
                email_valid: p.email_valid,
                do_not_contact: p.do_not_contact,
                canonicalBlockedReason: canonicalWorkspace.contactsByPersonaId.get(p.id)?.sendBlockReason ?? null,
                canonicalConflicts: canonicalWorkspace.contactsByPersonaId.get(p.id)?.conflictCodes.map(formatCanonicalConflictLabel) ?? [],
              });

              return (
              <Card key={p.persona_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {p.linkedin_url ? (
                            <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline inline-flex items-center gap-1">
                          {p.name} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : p.name}
                        </span>
                        <Badge variant={p.priority === 'P1' ? 'default' : 'secondary'} className="text-xs">{p.priority}</Badge>
                        <EditablePersonaStatus personaId={p.persona_id} currentValue={p.persona_status ?? 'Not started'} />
                        {blockerBadges.map((badge) => (
                          <Badge key={`${p.persona_id}-${badge}`} variant="outline" className="text-xs">{badge}</Badge>
                        ))}
                        {blockerBadges.length > 0 ? (
                          <Link
                            href={`/accounts/${slug}?tab=contacts&replace_persona=${p.persona_id}#contact-discovery`}
                            className="inline-flex items-center text-xs font-medium text-[var(--primary)] hover:underline"
                            data-testid={`replace-cta-${p.persona_id}`}
                          >
                            Replace
                          </Link>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{p.title}</p>
                      {p.email && (
                        <p className="mt-0.5 text-xs">
                          <CopyButton text={p.email} className="text-[var(--primary)] hover:underline" />
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Lane: {p.persona_lane} &middot; {p.role_in_deal} &middot; {p.seniority}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant={p.email_valid === false || p.do_not_contact ? 'secondary' : 'outline'} className="text-xs">
                          Readiness {personaReadiness.score}
                        </Badge>
                        {personaReadiness.reasons.map((reason) => (
                          <Badge key={`${p.persona_id}-${reason}`} variant="outline" className="text-xs">{reason}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <GeneratorDialog accountName={account.name} personaName={p.name} personaEmail={p.email ?? undefined} defaultType="email" />
                      <EmailComposer accountName={account.name} personaName={p.name} personaEmail={p.email ?? undefined} />
                      <VoiceScriptButton accountName={account.name} personaName={p.name} />
                      <span className="font-mono text-xs text-[var(--muted-foreground)]">{p.persona_id}</span>
                    </div>
                  </div>
                  {p.next_step && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">Next: {p.next_step}</p>
                  )}
                </CardContent>
              </Card>
              );
            })
          )}
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <GeneratorDialog accountName={account.name} defaultType="meeting_prep" />
            <GeneratorDialog accountName={account.name} defaultType="call_script" />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/generated-content?account=${encodeURIComponent(account.name)}`}>
                Open Content Studio
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Meeting Brief</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!brief ? (
                  <EmptyState title="No brief available" description="Meeting brief not yet created for this account." />
                ) : (
                  <>
                    {[
                      { label: 'Why This Account', value: brief.why_this_account },
                      { label: 'Likely Pain Points', value: brief.likely_pain_points },
                      { label: 'Prep Assets Needed', value: brief.prep_assets_needed },
                    ].map((section) => (
                      <div key={section.label}>
                        <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{section.label}</p>
                        <p className="mt-1 text-sm leading-relaxed">{section.value}</p>
                      </div>
                    ))}
                    <Link href={`/briefs/${slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline">
                      Open legacy brief <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Audit Route</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!auditRoute ? (
                  <EmptyState title="No audit route" description="No audit route has been created for this account." />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <a href={auditRoute.audit_url} target="_blank" rel="noopener noreferrer" className="flex-1 break-all text-sm text-[var(--primary)] hover:underline">
                        {auditRoute.audit_url}
                      </a>
                      <CopyButton text={auditRoute.audit_url} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)]">Fast Ask</p>
                      <p className="mt-0.5 text-sm">{auditRoute.fast_ask}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)]">Proof Asset</p>
                      <p className="mt-0.5 text-sm">{auditRoute.proof_asset}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">QR Asset</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!qrAsset ? (
                  <EmptyState title="No QR asset" description="No QR asset is mapped for this account yet." />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <a href={qrAsset.audit_url} target="_blank" rel="noopener noreferrer" className="flex-1 break-all text-sm text-[var(--primary)] hover:underline">
                        {qrAsset.audit_url}
                      </a>
                      <CopyButton text={qrAsset.audit_url} />
                    </div>
                    <p className="text-sm">{qrAsset.suggested_use}</p>
                    {qrAsset.proof_asset && <p className="text-xs text-[var(--muted-foreground)]">Proof: {qrAsset.proof_asset}</p>}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Generated Content</CardTitle></CardHeader>
              <CardContent>
                {generatedAssets.length === 0 ? (
                  <EmptyState title="No generated assets" description="Generated one-pagers, emails, and call scripts will appear here." />
                ) : (
                  <div className="space-y-4">
                    <AccountAssetVersionPanel
                      accountName={account.name}
                      assets={generatedAssets}
                      recipients={accountRecipients}
                      initialSelectedRecipientIds={suggestedRecipientIds}
                    />
                    <div className="space-y-2">
                    {generatedAssets.map((asset) => (
                      <div key={asset.id} className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                        <div>
                          <p className="text-sm font-medium">{asset.content_type} v{asset.version}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {asset.persona_name ?? 'Account level'} · {formatActivityDate(asset.created_at)}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            Provider: {asset.provider_used ?? 'unknown'} · Quality {asset.quality.score} · QA {asset.checklist.requiredComplete}/{asset.checklist.requiredTotal}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            {buildAssetProvenanceLine(asset.version_metadata)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={asset.is_published ? 'success' : 'outline'}>
                            {asset.is_published ? 'published' : 'draft'}
                          </Badge>
                          <AccountGeneratedAssetActions
                            accountName={account.name}
                            asset={asset}
                            recipients={accountRecipients}
                          />
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <InfographicJourneyControls
            accountName={account.name}
            campaignId={generatedAssets[0]?.campaign_id ?? null}
            initialStage={initialJourneyStage}
          />
          <AccountEngagementSummaryCard summary={engagementSummary} accountSlug={slug} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Outcome Logging</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Mark what happened without leaving the account page.</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Replies, wrong-person feedback, timing issues, and positive outcomes all feed the next recommendation.
                </p>
              </div>
              <AccountOutcomeLogger accountName={account.name} sources={accountOutcomeSources} />
            </CardContent>
          </Card>
          {sendJobs.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Send Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sendJobs.map((job) => (
                  <div key={job.id} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>Job #{job.id}</span>
                      <span>{job.status} · {job.sent_count} sent · {job.failed_count} failed · {job.skipped_count} skipped</span>
                    </div>
                    <SendJobTracker jobId={job.id} pollMs={5000} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {journeyActivities.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Journey Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {journeyActivities.map((activity) => (
                  <div key={activity.id} className="rounded-md border p-2 text-xs">
                    <p className="font-medium">{activity.outcome ?? 'Journey transition'}</p>
                    <p className="text-muted-foreground">{activity.notes}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {timeline.length === 0 ? (
            <EmptyState title="No engagement yet" description="Emails, sessions, captures, meetings, and activities will appear here." />
          ) : (
            <div className="relative ml-3 space-y-0 border-l-2 border-[var(--border)]">
              {timeline.map((item) => (
                <div key={item.id} className="relative pb-5 pl-6">
                  <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-xs">{item.kind}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">{formatActivityDate(item.occurredAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{item.detail}</p>
                  {item.href && (
                    <Link href={item.href} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">
                      Open signal <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">{openTaskCount} account task{openTaskCount === 1 ? '' : 's'}</p>
            <LogActivityDialog accountName={account.name} personas={personas.map((p) => ({ name: p.name }))} />
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">Recommended</p>
              <p className="mt-1 text-sm font-medium">{nextBestAction.label}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{nextBestAction.detail}</p>
            </CardContent>
          </Card>
          {activities.filter((activity) => activity.next_step).map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{activity.next_step}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{activity.activity_type} · {activity.owner ?? 'Unassigned'}</p>
                  </div>
                  {activity.nextStepDueLabel && <Badge variant="warning">{activity.nextStepDueLabel}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--muted-foreground)]">{meetings.length} meeting record{meetings.length === 1 ? '' : 's'}</p>
            <BookMeetingDialog accountName={account.name} personas={personas.map((p) => ({ name: p.name, priority: p.priority }))} calendlyLink={process.env.NEXT_PUBLIC_CALENDLY_LINK} />
          </div>
          {meetings.length === 0 ? (
            <EmptyState title="No meetings booked" description="Book a meeting or log activity when this account moves." />
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={meeting.meeting_status} />
                          <p className="text-sm font-medium">{meeting.persona ?? 'Account meeting'}</p>
                        </div>
                        {meeting.objective && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{meeting.objective}</p>}
                        {meeting.post_next_step && <p className="mt-1 text-xs text-[var(--muted-foreground)]">Next: {meeting.post_next_step}</p>}
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {meeting.meeting_date ? formatActivityDate(meeting.meeting_date) : 'No date'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Pipeline Stage</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{account.pipeline_stage}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Outreach Status</CardTitle></CardHeader>
              <CardContent><StatusBadge status={account.outreach_status} /></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-[var(--muted-foreground)]">Meeting Status</CardTitle></CardHeader>
              <CardContent><StatusBadge status={account.meeting_status} /></CardContent>
            </Card>
          </div>
          {waves.length === 0 ? (
            <EmptyState title="No campaign phases" description="This account has not been assigned to a campaign wave yet." />
          ) : (
            <div className="space-y-3">
              {waves.map((wave, index) => (
                <Card key={`${wave.wave}-${index}`}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{wave.wave}</span>
                      <StatusBadge status={wave.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <span>Channel: {wave.channel_mix}</span>
                      <span>Owner: {wave.owner}</span>
                      <span>Start: {wave.start_date}</span>
                      <span>Follow-up 1: {wave.follow_up_1}</span>
                    </div>
                    <p className="text-sm">{wave.primary_objective}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function buildPersonaBlockerBadges(input: {
  email?: string | null;
  email_valid?: boolean | null;
  do_not_contact?: boolean;
  canonicalBlockedReason?: string | null;
  canonicalConflicts?: string[];
}) {
  const badges: string[] = [];
  if (input.email && input.email_valid === false) badges.push('Malformed email');
  if (!input.email) badges.push('Missing email');
  if (input.do_not_contact) badges.push('Suppressed');
  if (input.canonicalBlockedReason) badges.push('Canonical block');
  if ((input.canonicalConflicts ?? []).length > 0) badges.push('Canonical conflict');
  return badges;
}

function buildAssetProvenanceLine(versionMetadata: unknown) {
  const provenance = parseAssetProvenanceSummary(versionMetadata);
  const parts = [
    provenance.usedLiveIntel ? 'live intel' : 'static context',
    `${provenance.signalCount} signals`,
    `${provenance.recommendedContactCount} contacts`,
    provenance.freshnessLabel,
  ];
  return parts.join(' · ');
}

function MicrositeAccountHeatBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="bg-red-500 text-white">Hot {score}</Badge>;
  if (score >= 45) return <Badge className="bg-amber-500 text-white">Warm {score}</Badge>;
  return <Badge variant="outline">Watch {score}</Badge>;
}

function accountTabIcon(tabId: AccountCommandTabId) {
  switch (tabId) {
    case 'contacts':
      return Users;
    case 'assets':
      return BriefcaseBusiness;
    case 'engagement':
      return Inbox;
    case 'tasks':
      return ListTodo;
    case 'meetings':
      return Calendar;
    case 'pipeline':
      return GitBranch;
    case 'overview':
    default:
      return FileText;
  }
}

function MicrositeSessionRow({ session }: { session: RecentMicrositeSession }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link href={session.path} className="text-sm font-medium text-[var(--primary)] hover:underline">
              {session.personName ?? 'Overview microsite'}
            </Link>
            {session.isHighIntent ? (
              <Badge className="bg-emerald-600 text-white">High intent</Badge>
            ) : (
              <Badge variant="outline">Light read</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {session.sectionsViewedCount} sections · {session.ctaCount} CTAs · {Math.max(session.variantCount - 1, 0)} switches
          </p>
        </div>
        <div className="text-right text-xs text-[var(--muted-foreground)]">
          <p>{session.scrollDepthPct}% scroll</p>
          <p>{formatMicrositeDuration(session.durationSeconds)} read</p>
          <p>{formatMicrositeTimestamp(session.viewedAt)}</p>
        </div>
      </div>
    </div>
  );
}

function formatMicrositeDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatMicrositeTimestamp(value: Date) {
  return value.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatActivityDate(value: Date) {
  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
