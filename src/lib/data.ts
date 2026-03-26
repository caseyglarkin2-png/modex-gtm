import accountsData from './data/accounts.json';
import personasData from './data/personas.json';
import outreachWavesData from './data/outreach-waves.json';
import meetingBriefsData from './data/meeting-briefs.json';
import auditRoutesData from './data/audit-routes.json';
import qrAssetsData from './data/qr-assets.json';
import activitiesData from './data/activities.json';
import meetingsData from './data/meetings.json';
import mobileData from './data/mobile-captures.json';
import actionableIntelData from './data/actionable-intel.json';
import searchStringsData from './data/search-strings.json';
import listsConfigData from './data/lists-config.json';

export type Account = (typeof accountsData)[number];
export type Persona = (typeof personasData)[number];
export type OutreachWave = (typeof outreachWavesData)[number];
export type MeetingBrief = (typeof meetingBriefsData)[number];
export type AuditRoute = (typeof auditRoutesData)[number];
export type QrAsset = (typeof qrAssetsData)[number];
export type Activity = (typeof activitiesData)[number];
export type ActionableIntel = (typeof actionableIntelData)[number];
export type SearchString = (typeof searchStringsData)[number];
export type ListsConfig = typeof listsConfigData;

export interface Meeting {
  date: string;
  account: string;
  attendees: string;
  meeting_type: string;
  status: string;
  outcome: string;
  notes: string;
}

export interface MobileCapture {
  account: string;
  contact: string;
  notes: string;
  interest: number;
  urgency: number;
  influence: number;
  fit: number;
  heat_score: number;
  due_date: string;
  status: string;
  timestamp: string;
}

export function getAccounts(): Account[] {
  return accountsData;
}

export function getAccountBySlug(slug: string): Account | undefined {
  return accountsData.find(
    (a) => a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
  );
}

export function getAccountByName(name: string): Account | undefined {
  return accountsData.find((a) => a.name === name);
}

export function getPersonas(): Persona[] {
  return personasData;
}

export function getPersonasByAccount(account: string): Persona[] {
  return personasData.filter((p) => p.account === account);
}

export function getOutreachWaves(): OutreachWave[] {
  return outreachWavesData;
}

export function getWavesByAccount(account: string): OutreachWave[] {
  return outreachWavesData.filter((w) => w.account === account);
}

export function getMeetingBriefs(): MeetingBrief[] {
  return meetingBriefsData;
}

export function getMeetingBriefByAccount(account: string): MeetingBrief | undefined {
  return meetingBriefsData.find((b) => b.account === account);
}

export function getAuditRoutes(): AuditRoute[] {
  return auditRoutesData;
}

export function getQrAssets(): QrAsset[] {
  return qrAssetsData;
}

export function getActivities(): Activity[] {
  return activitiesData;
}

export function getMeetings(): Meeting[] {
  return meetingsData as Meeting[];
}

export function getMobileCaptures(): MobileCapture[] {
  return mobileData as MobileCapture[];
}

export function getActionableIntel(): ActionableIntel[] {
  return actionableIntelData;
}

export function getSearchStrings(): SearchString[] {
  return searchStringsData;
}

export function getSearchStringsByAccount(account: string): SearchString[] {
  return searchStringsData.filter((s) => s.account === account);
}

export function getListsConfig(): ListsConfig {
  return listsConfigData;
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
