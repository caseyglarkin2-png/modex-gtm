export type AssetDeliveryMode = 'direct-send' | 'preview-only' | 'copy-export-only';

const PREVIEW_ONLY_TYPES = new Set([
  'call_script',
  'meeting_prep',
]);

const COPY_EXPORT_ONLY_TYPES = new Set([
  'microsite',
  'playbook_block',
  'proposal',
  'studio_handoff_bundle',
]);

export function getAssetDeliveryMode(contentType?: string | null): AssetDeliveryMode {
  if (!contentType) return 'direct-send';
  if (PREVIEW_ONLY_TYPES.has(contentType)) return 'preview-only';
  if (COPY_EXPORT_ONLY_TYPES.has(contentType)) return 'copy-export-only';
  return 'direct-send';
}

export function canDirectSendAsset(contentType?: string | null): boolean {
  return getAssetDeliveryMode(contentType) === 'direct-send';
}
