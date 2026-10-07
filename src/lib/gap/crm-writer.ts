/**
 * THE HUBSPOT WRITER FOR APPROVED CRM CHANGES (GAP OS execution recovery, R54, 2026-10-06). Server only. Called ONLY
 * by lib/gap/crm-sync.ts after an explicit approval and with GAP_HUBSPOT_MIRROR_ENABLED on (off in production). It sits
 * beside the automatic mirror, never inside it: the mirror stays deal-free (its structural contract), the deals
 * surface stays write-free (its own), and this writer never touches a deal's stage, pipeline or lifecycle (the only
 * field it is ever asked to change is the allowlisted next step; pinned by tests/unit/gap/crm-sync.test.tsx). Every
 * method throws on failure (the caller records it). Reads first: a note or task is searched for by its external id
 * before one is created (a write whose answer was lost is found, never duplicated); a deal field is read with its
 * history before it is changed (a newer human value is never overwritten).
 */
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/objects/notes/models/Filter';
import { getHubSpotClient } from '@/lib/hubspot/client';

/** HubSpot's standard association types: note -> deal, task -> deal. */
export const NOTE_TO_DEAL = 214;
export const TASK_TO_DEAL = 216;

export interface CrmWriter {
  /** The id of a note or task whose body carries the marker, or null. */
  findByMarker(objectType: 'notes' | 'tasks', marker: string): Promise<string | null>;
  createNote(dealId: string, body: string): Promise<string>;
  createTask(dealId: string, t: { subject: string; body: string; dueAt: string | null }): Promise<string>;
  /** The field's current value, when it last changed and by what source. */
  readDealProperty(dealId: string, property: string): Promise<{ value: string | null; modifiedAt: string | null; source: string | null }>;
  updateDealProperty(dealId: string, property: string, value: string): Promise<void>;
}

const assoc = (dealId: string, typeId: number) => [{ to: { id: dealId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: typeId }] }] as never;
const html = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

export const hubspotCrmWriter: CrmWriter = {
  async findByMarker(objectType, marker) {
    const client = getHubSpotClient();
    const property = objectType === 'notes' ? 'hs_note_body' : 'hs_task_body';
    const api = objectType === 'notes' ? client.crm.objects.notes.searchApi : client.crm.objects.tasks.searchApi;
    const res = await api.doSearch({ filterGroups: [{ filters: [{ propertyName: property, operator: FilterOperatorEnum.ContainsToken, value: marker }] }], properties: [property], limit: 5, after: '0', sorts: [] } as never);
    const hit = (res.results ?? []).find((r) => String(r.properties?.[property] ?? '').includes(marker));
    return hit ? String(hit.id) : null;
  },
  async createNote(dealId, body) {
    const client = getHubSpotClient();
    const r = await client.crm.objects.notes.basicApi.create({ properties: { hs_note_body: html(body).slice(0, 65535), hs_timestamp: new Date().toISOString() }, associations: assoc(dealId, NOTE_TO_DEAL) });
    return String(r.id);
  },
  async createTask(dealId, t) {
    const client = getHubSpotClient();
    const r = await client.crm.objects.tasks.basicApi.create({ properties: { hs_task_subject: t.subject.slice(0, 250), hs_task_body: html(t.body).slice(0, 65535), hs_timestamp: t.dueAt ?? new Date().toISOString(), hs_task_status: 'NOT_STARTED', hs_task_type: 'TODO' }, associations: assoc(dealId, TASK_TO_DEAL) });
    return String(r.id);
  },
  async readDealProperty(dealId, property) {
    const client = getHubSpotClient();
    const r = (await client.crm.deals.basicApi.getById(dealId, [property], [property])) as { properties?: Record<string, string | null>; propertiesWithHistory?: Record<string, Array<{ value: string; timestamp: Date | string; sourceType: string }>> };
    const h = r.propertiesWithHistory?.[property]?.[0] ?? null;
    return { value: r.properties?.[property] ?? null, modifiedAt: h?.timestamp ? new Date(h.timestamp).toISOString() : null, source: h?.sourceType ?? null };
  },
  async updateDealProperty(dealId, property, value) {
    const client = getHubSpotClient();
    await client.crm.deals.basicApi.update(dealId, { properties: { [property]: value } });
  },
};
