import type { QueueGeneratedAccountCard } from '@/components/queue/generated-content-grid';

export type GeneratedContentWorkspaceFilters = {
  account: string;
  campaign: string;
  provider: string;
  infographicType: string;
  stageIntent: string;
  status: string;
  sent: string;
  checklist: string;
  query: string;
};

export function filterGeneratedContentCards(
  cards: QueueGeneratedAccountCard[],
  filters: GeneratedContentWorkspaceFilters,
): QueueGeneratedAccountCard[] {
  const loweredQuery = filters.query.trim().toLowerCase();

  return cards.filter((card) => {
    const latest = card.versions[0];
    if (!latest) return false;

    const accountMatch = filters.account === 'all' || card.account_name === filters.account;
    const campaignMatch = filters.campaign === 'all' || card.campaign_names.includes(filters.campaign);
    const providerMatch = filters.provider === 'all' || (latest.provider_used ?? 'unknown') === filters.provider;
    const infographicTypeMatch = filters.infographicType === 'all' || (latest.infographic_type ?? 'cold_hook') === filters.infographicType;
    const stageIntentMatch = filters.stageIntent === 'all' || (latest.stage_intent ?? 'cold') === filters.stageIntent;
    const statusMatch = filters.status === 'all'
      || (filters.status === 'published' && latest.is_published)
      || (filters.status === 'draft' && !latest.is_published);
    const sentMatch = filters.sent === 'all'
      || (filters.sent === 'sent' && latest.external_send_count > 0)
      || (filters.sent === 'unsent' && latest.external_send_count === 0);
    const checklistMatch = filters.checklist === 'all'
      || (filters.checklist === 'complete' && Boolean(latest.checklist?.complete))
      || (filters.checklist === 'incomplete' && !latest.checklist?.complete);
    const textMatch = !loweredQuery
      || card.account_name.toLowerCase().includes(loweredQuery)
      || card.campaign_names.some((name) => name.toLowerCase().includes(loweredQuery));

    return accountMatch
      && campaignMatch
      && providerMatch
      && infographicTypeMatch
      && stageIntentMatch
      && statusMatch
      && sentMatch
      && checklistMatch
      && textMatch;
  });
}
