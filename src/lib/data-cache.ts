import { cache } from 'react';
import { getCampaignSummaries } from '@/lib/campaigns';
import { dbGetAccounts, dbGetActivities } from '@/lib/db';

export const getCachedAccounts = cache(dbGetAccounts);
export const getCachedActivities = cache(dbGetActivities);
export const getCachedCampaignSummaries = cache(getCampaignSummaries);
